import express from "express";
import mongoose from "mongoose";

import Report from "../../Schema/report.js";
import User from "../../Schema/user.js";
import Chat from "../../Schema/chat.js";
import Message from "../../Schema/message.js";
import MessageFlag from "../../Schema/messageFlag.js";

import { adminOnly, parsePaging, pagingMeta } from "../../Services/utils/adminAuth.js";
import { logAdminAction, requireReason } from "../../Services/utils/adminAudit.js";
import { sendAccountDeactivatedEmail } from "../../Services/email/email.js";

const router = express.Router();
router.use(adminOnly);

const DAY_MS = 24 * 60 * 60 * 1000;

// Reported users and flagged content: the moderation queue.
//
// The design rule, stated once because everything below follows from it: acting
// on a report never destroys it. Resolving appends the outcome to the same
// document, so the history of what was reported and what was done about it
// survives the account being deleted. A moderation system that forgets its own
// decisions cannot answer "has this person been reported before", which is the
// single most useful question when a second complaint arrives.

const PARTY_FIELDS = "name email type imageUrl status createdAt";

/* ═════════════════════════════════ QUEUE ══════════════════════════════════ */

// GET /admin/reports?status=&reason=&priority=&assigned=me|unassigned&page=&limit=
router.get("/", async (req, res) => {
  try {
    const paging = parsePaging(req.query);
    const query = {};

    const { status, reason, priority, assigned } = req.query;

    // Default view is the work: open and in-progress cases. Resolved ones stay
    // reachable via ?status=resolved but don't clutter the queue.
    if (status && ["open", "reviewing", "resolved"].includes(status)) {
      query.status = status;
    } else {
      query.status = { $ne: "resolved" };
    }

    if (reason) query.reason = reason;
    if (priority) query.priority = priority;

    if (assigned === "me") query.assignedTo = req.admin._id;
    if (assigned === "unassigned") query.assignedTo = null;

    const [reports, totalRecords] = await Promise.all([
      Report.find(query)
        .populate("reportedUserId", PARTY_FIELDS)
        .populate("reporterId", PARTY_FIELDS)
        .populate("assignedTo", "name email")
        .populate("resolution.resolvedBy", "name email")
        // Worst first, then oldest first within a priority — so a high-priority
        // case can't be buried by newer ones, and nothing sits forever.
        .sort({ priority: -1, createdAt: 1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .lean(),
      Report.countDocuments(query),
    ]);

    // Prior history for each reported account, in one query rather than per
    // row. This is the number that changes a decision: a first complaint and a
    // fourth complaint about the same person warrant different responses, and
    // an admin should not have to go looking to find out which this is.
    const reportedIds = reports.map((r) => r.reportedUserId?._id).filter(Boolean);
    const priors = reportedIds.length
      ? await Report.aggregate([
          { $match: { reportedUserId: { $in: reportedIds } } },
          {
            $group: {
              _id: "$reportedUserId",
              total: { $sum: 1 },
              resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
            },
          },
        ])
      : [];
    const priorMap = new Map(priors.map((p) => [String(p._id), p]));

    const data = reports.map((report) => {
      const prior = priorMap.get(String(report.reportedUserId?._id));
      return {
        ...report,
        priorReports: Math.max(0, (prior?.total || 1) - 1),
        priorResolved: prior?.resolved || 0,
        ageDays: Math.floor((Date.now() - new Date(report.createdAt).getTime()) / DAY_MS),
      };
    });

    return res.status(200).json({ data, pagination: pagingMeta(totalRecords, paging) });
  } catch (error) {
    console.error("admin/reports list failed:", error);
    return res.status(500).json({ message: "Could not load reports", error: error.message });
  }
});

// GET /admin/reports/stats
router.get("/stats", async (req, res) => {
  try {
    const [byStatus, byReason, oldestOpen] = await Promise.all([
      Report.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Report.aggregate([
        { $match: { status: { $ne: "resolved" } } },
        { $group: { _id: "$reason", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Report.findOne({ status: { $ne: "resolved" } }).sort({ createdAt: 1 }).select("createdAt").lean(),
    ]);

    const statusMap = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));

    return res.status(200).json({
      data: {
        open: statusMap.open || 0,
        reviewing: statusMap.reviewing || 0,
        resolved: statusMap.resolved || 0,
        byReason,
        oldestOpenDays: oldestOpen
          ? Math.floor((Date.now() - new Date(oldestOpen.createdAt).getTime()) / DAY_MS)
          : null,
      },
    });
  } catch (error) {
    console.error("admin/reports stats failed:", error);
    return res.status(500).json({ message: "Could not load report stats", error: error.message });
  }
});

/* ═════════════════════════════ ASSIGN / TRIAGE ════════════════════════════ */

// PUT /admin/reports/:id/assign   { assignToMe?: boolean, priority? }
router.put("/:id/assign", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid report id" });
    }

    const update = {};
    if (req.body?.assignToMe === true) {
      update.assignedTo = req.admin._id;
      // Picking a case up moves it out of the unclaimed pool, so two admins
      // don't unknowingly work the same complaint.
      update.status = "reviewing";
    }
    if (req.body?.assignToMe === false) update.assignedTo = null;
    if (["low", "normal", "high"].includes(req.body?.priority)) {
      update.priority = req.body.priority;
    }

    if (!Object.keys(update).length) {
      return res.status(400).json({ message: "Nothing to change." });
    }

    update.updatedAt = new Date();

    const report = await Report.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!report) return res.status(404).json({ message: "Report not found" });

    await logAdminAction({
      req, action: "report.assign", targetType: "report", targetId: report._id,
      targetUserId: report.reportedUserId,
      reason: "Report triaged", metadata: update,
    });

    return res.status(200).json({ message: "Report updated.", data: report });
  } catch (error) {
    console.error("admin/reports assign failed:", error);
    return res.status(500).json({ message: "Could not update the report", error: error.message });
  }
});

/* ═════════════════════════════════ RESOLVE ════════════════════════════════ */

// POST /admin/reports/:id/resolve   { action, note, suspendDays? }
//
// Closes a case AND applies the sanction in one step. The two are deliberately
// not separate buttons: resolving without acting, or acting without recording
// why, are both states this queue exists to prevent — and doing them as two
// requests means an interrupted admin leaves a case in one of them.
//
//   warned     — logged only. Nothing changes on the account.
//   suspended  — timed pause, `suspendDays` required.
//   blocked    — indefinite.
//   deleted    — soft-deletes the account (see admin/users delete).
//   dismissed  — no action; the report was not substantiated.
router.post("/:id/resolve", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid report id" });
    }

    const { action, suspendDays } = req.body || {};
    const valid = ["warned", "suspended", "blocked", "deleted", "dismissed"];
    if (!valid.includes(action)) {
      return res.status(400).json({ message: `Action must be one of: ${valid.join(", ")}` });
    }

    const note = requireReason(req.body?.note);
    if (!note) {
      return res.status(400).json({
        message: "A note of at least 10 characters is required so the decision is recorded.",
      });
    }

    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: "Report not found" });
    if (report.status === "resolved") {
      return res.status(400).json({ message: "This report is already resolved." });
    }

    const target = await User.findById(report.reportedUserId).select("_id name email status");
    if (!target) {
      return res.status(404).json({ message: "The reported account no longer exists." });
    }
    if (String(target._id) === String(req.admin._id)) {
      return res.status(400).json({ message: "You cannot action a report against your own account." });
    }

    let sanction = null;

    if (action === "suspended") {
      const days = Number(suspendDays);
      if (!Number.isFinite(days) || days < 1 || days > 365) {
        return res.status(400).json({ message: "Suspension length must be between 1 and 365 days." });
      }
      const until = new Date(Date.now() + days * DAY_MS);
      await User.updateOne(
        { _id: target._id },
        { $set: { status: "Suspended", suspendedUntil: until, suspendedAt: new Date(), moderationReason: note } }
      );
      sanction = { type: "suspended", until, days };
    }

    if (action === "blocked") {
      await User.updateOne(
        { _id: target._id },
        { $set: { status: "Block", suspendedAt: new Date(), suspendedUntil: null, moderationReason: note } }
      );
      sanction = { type: "blocked" };
      if (target.email) {
        // Generic copy — `note` is the moderator's own wording and can identify
        // the reporter.
        sendAccountDeactivatedEmail(
          target.email, target.name, "a violation of our community guidelines"
        ).catch((err) => console.error("Deactivation email failed:", err?.message || err));
      }
    }

    if (action === "deleted") {
      await User.updateOne(
        { _id: target._id },
        {
          $set: {
            status: "Deleted",
            deletedAt: new Date(),
            moderationReason: note,
            email: `deleted+${target._id}@famlink.invalid`,
            password: null, phoneNo: null, imageUrl: null, premium: false, online: false,
          },
          $unset: { location: "", otp: "", resetPasswordToken: "" },
        }
      );
      sanction = { type: "deleted" };
    }

    if (action === "warned") {
      // No account change. Recorded so a second complaint shows that this
      // person has already been spoken to — which is the whole point of a
      // warning existing as a distinct outcome.
      sanction = { type: "warned" };
    }

    report.status = "resolved";
    report.resolution = {
      action,
      note,
      resolvedBy: req.admin._id,
      resolvedAt: new Date(),
    };
    await report.save();

    await logAdminAction({
      req, action: "report.resolve", targetType: "report", targetId: report._id,
      targetUserId: target._id, reason: note,
      metadata: { outcome: action, sanction, reportReason: report.reason },
    });

    return res.status(200).json({
      message: `Report resolved (${action}).`,
      data: { reportId: report._id, outcome: action, sanction },
    });
  } catch (error) {
    console.error("admin/reports resolve failed:", error);
    return res.status(500).json({ message: "Could not resolve the report", error: error.message });
  }
});

/* ═════════════════════════════════ CONTEXT ════════════════════════════════ */

// GET /admin/reports/:id/context
//
// The last few messages between the two people, plus both parties in full and
// the reported account's history. Everything needed to decide the case, on one
// request, so an admin is not reconstructing it from three screens.
//
// ────────────────────────────────────────────────────────────────────────────
// WHY FIVE MESSAGES, AND WHY THIS IS NOT THE THREAD VIEW
//
// A report about a single message is almost never decidable from that message.
// "You're overreacting" is a shrug or the tail end of something ugly depending
// entirely on what came before it, and the snapshot on the report carries only
// the one line. Some surrounding conversation is the difference between an
// informed decision and a coin flip.
//
// But the whole thread is more than the decision needs, and this endpoint is
// reachable from the queue rather than from a screen that makes you type a
// reason. So it returns a fixed, small window — the last five exchanged — and
// nothing lets a caller widen it. An admin who genuinely needs the full history
// goes to Messages and states why, which is audited there.
//
// Reading these is logged all the same. Fewer messages is still private
// messages, and the trail is what keeps "I opened it because of report #482"
// checkable rather than merely claimed.
// ────────────────────────────────────────────────────────────────────────────

// Not a parameter. Whether five is the right number is a judgement about how
// much context a decision needs; whether the CALLER gets to choose is a
// question about how much of a private conversation one click should reveal,
// and the answer to that one is no.
const CONTEXT_MESSAGE_COUNT = 5;

router.get("/:id/context", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid report id" });
    }

    const report = await Report.findById(id)
      .populate("reportedUserId", "name email type imageUrl status createdAt suspendedUntil")
      .populate("reporterId", "name email type imageUrl status createdAt")
      .lean();
    if (!report) return res.status(404).json({ message: "Report not found" });

    const reportedId = report.reportedUserId?._id;
    const reporterId = report.reporterId?._id;

    // Prefer the chat recorded on the report. Fall back to finding the one
    // between the two parties — a whole-account report carries no chatId, and
    // "there is no conversation attached" should not mean "no context".
    let chat = null;
    if (report.chatId) {
      chat = await Chat.findById(report.chatId).select("_id participants").lean();
    }
    if (!chat && reportedId && reporterId) {
      chat = await Chat.findOne({ participants: { $all: [reportedId, reporterId] } })
        .select("_id participants")
        .lean();
    }

    let messages = [];
    let totalInChat = 0;

    if (chat) {
      // Newest five, then reversed — so the response reads in conversation
      // order while the query still takes the most recent rather than the
      // oldest five, which on a long thread would be the least relevant.
      const [recent, count] = await Promise.all([
        Message.find({ chatId: chat._id })
          .populate("sender", "name email imageUrl")
          .sort({ createdAt: -1 })
          .limit(CONTEXT_MESSAGE_COUNT)
          .lean(),
        Message.countDocuments({ chatId: chat._id }),
      ]);

      totalInChat = count;
      messages = recent.reverse().map((m) => ({
        _id: m._id,
        sender: m.sender,
        // Voice notes are base64 in this field. Returning that would push a
        // megabyte of audio into a queue screen that only wants to show who
        // said what — the console renders a placeholder from `type` instead.
        content: m.type === "Audio" ? "" : m.content,
        type: m.type || "Text",
        createdAt: m.createdAt,
        // Was this the specific message reported?
        isReported: String(m._id) === String(report.messageId || ""),
        // Did the content rules fire on it independently of anyone complaining?
        flagged: Boolean(m.moderation?.flagged),
        flagCategories: m.moderation?.categories || [],
        fromReportedUser: String(m.sender?._id) === String(reportedId),
      }));
    }

    // What else is known about the reported account: other complaints, and
    // anything the content rules caught. Two people independently reporting the
    // same person, or a report landing next to six blocked messages, is a
    // different case from an isolated complaint.
    const [priorReports, flagSummary] = await Promise.all([
      reportedId
        ? Report.find({ reportedUserId: reportedId, _id: { $ne: report._id } })
            .select("reason status priority createdAt resolution.action")
            .sort({ createdAt: -1 })
            .limit(10)
            .lean()
        : [],
      reportedId
        ? MessageFlag.aggregate([
            { $match: { senderId: new mongoose.Types.ObjectId(String(reportedId)) } },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                blocked: { $sum: { $cond: [{ $eq: ["$action", "blocked"] }, 1, 0] } },
                categories: { $addToSet: "$categories" },
              },
            },
          ])
        : [],
    ]);

    const flagStats = flagSummary[0] || { total: 0, blocked: 0, categories: [] };

    await logAdminAction({
      req,
      action: "report.context",
      targetType: "report",
      targetId: report._id,
      targetUserId: reportedId || null,
      reason: `Viewed the last ${messages.length} messages while working report ${report._id}`,
      metadata: {
        access: "read",
        chatId: chat?._id || null,
        messagesShown: messages.length,
        reportReason: report.reason,
      },
    });

    return res.status(200).json({
      data: {
        report: {
          _id: report._id,
          reason: report.reason,
          details: report.details,
          evidenceSnapshot: report.evidenceSnapshot,
          status: report.status,
          priority: report.priority,
          createdAt: report.createdAt,
          targetType: report.targetType,
        },
        // Both parties in full, including email — the console's own contact
        // route for a case, and what the queue row abbreviates.
        reporter: report.reporterId || null,
        reportedUser: report.reportedUserId || null,
        conversation: chat
          ? {
              chatId: chat._id,
              totalMessages: totalInChat,
              showing: messages.length,
              messages,
            }
          : null,
        priorReports,
        contentFlags: {
          total: flagStats.total,
          blocked: flagStats.blocked,
          // $addToSet over an array field nests it, so flatten and de-duplicate.
          categories: [...new Set((flagStats.categories || []).flat())],
        },
      },
      audited: true,
    });
  } catch (error) {
    console.error("admin/reports context failed:", error);
    return res.status(500).json({ message: "Could not load the report context", error: error.message });
  }
});

// GET /admin/reports/user/:userId — every case ever filed about one account.
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const reports = await Report.find({ reportedUserId: userId })
      .populate("reporterId", "name email")
      .populate("resolution.resolvedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ data: reports });
  } catch (error) {
    console.error("admin/reports by user failed:", error);
    return res.status(500).json({ message: "Could not load reports", error: error.message });
  }
});

export default router;
