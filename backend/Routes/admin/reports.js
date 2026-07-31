import express from "express";
import mongoose from "mongoose";

import Report from "../../Schema/report.js";
import User from "../../Schema/user.js";

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
