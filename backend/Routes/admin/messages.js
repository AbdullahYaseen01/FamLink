import express from "express";
import mongoose from "mongoose";

import Chat from "../../Schema/chat.js";
import Message from "../../Schema/message.js";
import User from "../../Schema/user.js";
import Report from "../../Schema/report.js";
import MessageFlag from "../../Schema/messageFlag.js";
import { CATEGORY_TO_REPORT_REASON } from "../../Services/utils/messageModeration.js";

import { adminOnly, parsePaging, pagingMeta, escapeRegex } from "../../Services/utils/adminAuth.js";
import { logAdminAction } from "../../Services/utils/adminAudit.js";

const router = express.Router();
router.use(adminOnly);

// Message monitoring, for investigating reports of harassment, scams and
// inappropriate content.
//
// ────────────────────────────────────────────────────────────────────────────
// This is the most invasive capability in the console, and the design reflects
// that rather than treating private messages as one more table to page through.
// Users write to each other here about their children, their homes and their
// money, with a reasonable expectation that nobody else is reading. The
// requirement is legitimate — a harassment report that can't be investigated is
// useless — but "an admin can read anything at any time" is a much larger power
// than that requirement needs.
//
// So three constraints are built in, none of which prevent an investigation:
//
//   1. THE CONVERSATION LIST CARRIES NO MESSAGE BODIES. Only participants,
//      counts and timestamps. Finding the right conversation never requires
//      reading any others.
//   2. READING A THREAD IS AUDITED. Opening one writes a row naming the admin,
//      the conversation and the stated reason. Reading is not a passive act
//      here and the trail says so.
//   3. A REASON IS REQUIRED TO OPEN A THREAD. Not a meaningful barrier to
//      someone determined, and not meant to be — it is what makes "I was
//      investigating report #482" the normal case and idle browsing the
//      conspicuous one.
//
// There is deliberately NO full-text search across all messages. Searching
// every private conversation on the platform for a keyword is a different power
// from investigating a specific complaint, and nothing in the requirement asks
// for it.
// ────────────────────────────────────────────────────────────────────────────

const PARTICIPANT_FIELDS = "name email type imageUrl status";

/* ═══════════════════════════ CONVERSATION LIST ════════════════════════════ */

// GET /admin/messages/conversations?search=&userId=&flagged=&page=&limit=
//
// Metadata only. `lastMessage` is stored denormalised on the chat document and
// is NOT returned — it is message content, and the whole point of this endpoint
// is that locating a conversation doesn't expose any.
router.get("/conversations", async (req, res) => {
  try {
    const paging = parsePaging(req.query);
    const query = {};

    const { search, userId } = req.query;

    if (userId && mongoose.isValidObjectId(userId)) {
      query.participants = userId;
    } else if (search) {
      const term = new RegExp(escapeRegex(String(search).trim()), "i");
      const users = await User.find({ $or: [{ name: term }, { email: term }] })
        .select("_id")
        .limit(500)
        .lean();
      query.participants = { $in: users.map((u) => u._id) };
    }

    const [chats, totalRecords] = await Promise.all([
      Chat.find(query)
        .populate("participants", PARTICIPANT_FIELDS)
        .select("participants createdAt updatedAt type")
        .sort({ updatedAt: -1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .lean(),
      Chat.countDocuments(query),
    ]);

    const chatIds = chats.map((c) => c._id);

    // Counts and report flags for the whole page in two queries.
    const [counts, reported] = await Promise.all([
      Message.aggregate([
        { $match: { chatId: { $in: chatIds } } },
        {
          $group: {
            _id: "$chatId",
            messageCount: { $sum: 1 },
            lastAt: { $max: "$createdAt" },
          },
        },
      ]),
      Report.aggregate([
        { $match: { chatId: { $in: chatIds } } },
        { $group: { _id: "$chatId", reports: { $sum: 1 } } },
      ]),
    ]);

    const countMap = new Map(counts.map((c) => [String(c._id), c]));
    const reportMap = new Map(reported.map((r) => [String(r._id), r.reports]));

    const data = chats.map((chat) => {
      const stats = countMap.get(String(chat._id));
      return {
        _id: chat._id,
        participants: chat.participants,
        messageCount: stats?.messageCount || 0,
        lastMessageAt: stats?.lastAt || chat.updatedAt,
        createdAt: chat.createdAt,
        openReports: reportMap.get(String(chat._id)) || 0,
      };
    });

    return res.status(200).json({
      data,
      pagination: pagingMeta(totalRecords, paging),
      notice: "Message content is not included in this list. Open a conversation to read it — doing so is logged.",
    });
  } catch (error) {
    console.error("admin/messages conversations failed:", error);
    return res.status(500).json({ message: "Could not load conversations", error: error.message });
  }
});

/* ═══════════════════════════ READ A CONVERSATION ══════════════════════════ */

// GET /admin/messages/conversations/:chatId?reason=...
//
// The thread itself. Requires a stated reason and writes an audit row before
// returning anything.
router.get("/conversations/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!mongoose.isValidObjectId(chatId)) {
      return res.status(400).json({ message: "Invalid conversation id" });
    }

    const reason = String(req.query.reason || "").trim();
    if (reason.length < 10) {
      return res.status(400).json({
        message:
          "Reading a private conversation requires a reason of at least 10 characters " +
          "(for example, the report you are investigating). It is recorded in the audit log.",
      });
    }

    const chat = await Chat.findById(chatId)
      .populate("participants", PARTICIPANT_FIELDS)
      .lean();
    if (!chat) return res.status(404).json({ message: "Conversation not found" });

    const paging = parsePaging({ ...req.query, limit: req.query.limit || 100 });

    const [messages, totalRecords] = await Promise.all([
      Message.find({ chatId })
        .populate("sender", "name email type imageUrl")
        .sort({ createdAt: 1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .lean(),
      Message.countDocuments({ chatId }),
    ]);

    // Written BEFORE the response goes out, and awaited. If the trail can't
    // record the access, the access doesn't happen — otherwise the one case
    // where reading goes unrecorded is a database problem nobody notices.
    await logAdminAction({
      req,
      action: "conversation.flag",
      targetType: "chat",
      targetId: chat._id,
      targetUserId: chat.participants?.[0]?._id || null,
      reason: `Viewed conversation: ${reason}`,
      metadata: {
        access: "read",
        participants: chat.participants?.map((p) => String(p._id)),
        messageCount: totalRecords,
      },
    });

    return res.status(200).json({
      data: {
        chat: {
          _id: chat._id,
          participants: chat.participants,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
        },
        messages: messages.map((m) => ({
          _id: m._id,
          sender: m.sender,
          // Voice notes are stored as a URL/blob reference in the same field.
          // The body is passed through as-is for text; the console renders by
          // `type` rather than guessing from the content.
          content: m.content,
          type: m.type || "Text",
          seen: m.seen,
          createdAt: m.createdAt,
          // Whether the content rules fired on this one. Shown inline so a
          // moderator reading a thread sees which messages tripped a rule
          // without cross-referencing the flagged queue by timestamp.
          flagged: Boolean(m.moderation?.flagged),
          flagCategories: m.moderation?.categories || [],
        })),
      },
      pagination: pagingMeta(totalRecords, paging),
      audited: true,
    });
  } catch (error) {
    console.error("admin/messages read failed:", error);
    return res.status(500).json({ message: "Could not load the conversation", error: error.message });
  }
});

/* ════════════════════════════ FLAGGED QUEUE ═══════════════════════════════ */

// Messages the content rules caught, blocked or delivered-and-marked. This is
// the "Flagged" tab, and it is a different screen from the one above in a way
// worth stating: BROWSING IT IS NOT AUDITED AND NEEDS NO REASON.
//
// That is not an oversight. The constraint on the conversation list exists
// because those are private messages nobody has raised a concern about. These
// are messages that broke a stated rule — the sender was told so at the time
// for the blocked ones. Making a moderator write a justification to look at the
// abuse queue is friction with no privacy gained, and friction on the safety
// path is how a queue stops being read.
//
// The thread around a flagged message is still behind the reason prompt. Seeing
// what someone sent is not the same as reading the conversation they sent it in.

const FLAG_PARTY_FIELDS = "name email type imageUrl status";

// GET /admin/messages/flagged?category=&severity=&action=&reviewed=&userId=&page=&limit=
router.get("/flagged", async (req, res) => {
  try {
    const paging = parsePaging(req.query);
    const query = {};

    const { category, severity, action, reviewed, userId } = req.query;

    if (category) query.categories = category;
    if (["low", "medium", "high"].includes(severity)) query.severity = severity;
    if (["flagged", "blocked"].includes(action)) query.action = action;
    if (userId && mongoose.isValidObjectId(userId)) query.senderId = userId;

    // Default to the work: things nobody has looked at yet. Cleared flags stay
    // reachable with ?reviewed=true rather than disappearing — "what did we
    // decide about this last month" needs to be answerable.
    if (reviewed === "true") query.reviewed = true;
    else if (reviewed === "all") { /* no filter */ }
    else query.reviewed = false;

    const [flags, totalRecords] = await Promise.all([
      MessageFlag.find(query)
        .populate("senderId", FLAG_PARTY_FIELDS)
        .populate("recipientId", FLAG_PARTY_FIELDS)
        .populate("reviewedBy", "name email")
        .sort({ severity: -1, createdAt: -1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .lean(),
      MessageFlag.countDocuments(query),
    ]);

    // Prior offences per sender, in one aggregate rather than per row. Same
    // reasoning as the reports queue: a first hit and a ninth hit are different
    // situations, and an admin should not have to go looking to find out which.
    const senderIds = flags.map((f) => f.senderId?._id).filter(Boolean);
    const priors = senderIds.length
      ? await MessageFlag.aggregate([
          { $match: { senderId: { $in: senderIds } } },
          {
            $group: {
              _id: "$senderId",
              total: { $sum: 1 },
              blocked: { $sum: { $cond: [{ $eq: ["$action", "blocked"] }, 1, 0] } },
            },
          },
        ])
      : [];
    const priorMap = new Map(priors.map((p) => [String(p._id), p]));

    const data = flags.map((flag) => {
      const prior = priorMap.get(String(flag.senderId?._id));
      return {
        ...flag,
        senderTotalFlags: prior?.total || 1,
        senderBlockedCount: prior?.blocked || 0,
      };
    });

    return res.status(200).json({ data, pagination: pagingMeta(totalRecords, paging) });
  } catch (error) {
    console.error("admin/messages flagged list failed:", error);
    return res.status(500).json({ message: "Could not load flagged messages", error: error.message });
  }
});

// GET /admin/messages/flagged/stats
router.get("/flagged/stats", async (req, res) => {
  try {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [byAction, byCategory, unreviewed, last24h, topSenders] = await Promise.all([
      MessageFlag.aggregate([{ $group: { _id: "$action", count: { $sum: 1 } } }]),
      MessageFlag.aggregate([
        { $match: { reviewed: false } },
        { $unwind: "$categories" },
        { $group: { _id: "$categories", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      MessageFlag.countDocuments({ reviewed: false }),
      MessageFlag.countDocuments({ createdAt: { $gte: dayAgo } }),
      // Repeat offenders. The most actionable number on the screen: a queue of
      // 200 flags is usually four people, and this is what says so.
      MessageFlag.aggregate([
        { $match: { reviewed: false } },
        { $group: { _id: "$senderId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const senders = await User.find({ _id: { $in: topSenders.map((s) => s._id) } })
      .select("name email")
      .lean();
    const senderMap = new Map(senders.map((u) => [String(u._id), u]));

    const actionMap = Object.fromEntries(byAction.map((a) => [a._id, a.count]));

    return res.status(200).json({
      data: {
        blocked: actionMap.blocked || 0,
        flagged: actionMap.flagged || 0,
        unreviewed,
        last24h,
        byCategory,
        topSenders: topSenders.map((s) => ({
          userId: s._id,
          count: s.count,
          name: senderMap.get(String(s._id))?.name || "Deleted account",
          email: senderMap.get(String(s._id))?.email || null,
        })),
      },
    });
  } catch (error) {
    console.error("admin/messages flagged stats failed:", error);
    return res.status(500).json({ message: "Could not load flag stats", error: error.message });
  }
});

// PUT /admin/messages/flagged/:id/review   { note? }
//
// Clears one flag off the queue. No sanction, no email, nothing happens to the
// account — this is "I looked at it, it was nothing". Deliberately the cheapest
// action on the screen, because most flags are noise and a queue whose only
// exits are heavyweight is a queue that never empties.
router.put("/flagged/:id/review", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid flag id" });
    }

    const flag = await MessageFlag.findByIdAndUpdate(
      id,
      {
        $set: {
          reviewed: true,
          reviewedBy: req.admin._id,
          reviewedAt: new Date(),
          reviewNote: String(req.body?.note || "").slice(0, 1000),
        },
      },
      { new: true }
    ).lean();

    if (!flag) return res.status(404).json({ message: "Flag not found" });

    return res.status(200).json({ message: "Marked as reviewed.", data: flag });
  } catch (error) {
    console.error("admin/messages review flag failed:", error);
    return res.status(500).json({ message: "Could not update the flag", error: error.message });
  }
});

// POST /admin/messages/flagged/:id/escalate   { details? }
//
// Turns a flag into a tracked case in the reports queue, carrying the content
// snapshot across so the evidence travels with it. The flag is marked reviewed
// at the same time — it has left this queue for the other one, and leaving it
// in both means two people work the same incident.
router.post("/flagged/:id/escalate", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid flag id" });
    }

    const flag = await MessageFlag.findById(id);
    if (!flag) return res.status(404).json({ message: "Flag not found" });
    if (flag.reportId) {
      return res.status(400).json({ message: "This flag has already been escalated." });
    }

    const primary = flag.categories?.[0];
    const report = await Report.create({
      reporterId: null,
      reportedUserId: flag.senderId,
      targetType: "message",
      messageId: flag.messageId,
      chatId: flag.chatId,
      reason: CATEGORY_TO_REPORT_REASON[primary] || "inappropriate_content",
      details:
        String(req.body?.details || "").slice(0, 2000) ||
        `Escalated from the flagged queue. Categories: ${(flag.categories || []).join(", ")}. ` +
          `The message was ${flag.action}.`,
      evidenceSnapshot: String(flag.content || "").slice(0, 2000),
      status: "reviewing",
      priority: flag.severity === "high" ? "high" : "normal",
      assignedTo: req.admin._id,
    });

    flag.reportId = report._id;
    flag.reviewed = true;
    flag.reviewedBy = req.admin._id;
    flag.reviewedAt = new Date();
    await flag.save();

    await logAdminAction({
      req, action: "message.escalate", targetType: "message",
      targetId: flag.messageId || flag._id, targetUserId: flag.senderId,
      reason: `Escalated a ${flag.action} message to the reports queue`,
      metadata: { categories: flag.categories, severity: flag.severity, reportId: report._id },
    });

    return res.status(201).json({
      message: "Case opened in the reports queue.",
      data: { reportId: report._id },
    });
  } catch (error) {
    console.error("admin/messages escalate flag failed:", error);
    return res.status(500).json({ message: "Could not escalate the flag", error: error.message });
  }
});

/* ═════════════════════════════ MODERATION ═════════════════════════════════ */

// DELETE /admin/messages/:messageId   { reason }
//
// Removes a single message. Hard delete: unlike a user account, a message is
// not referenced by anything else, and leaving abusive content in place behind
// a "deleted" flag means it is still in the database and still one query away
// from being served by a route that forgets to filter.
//
// The content is snapshotted into the audit row first, so the evidence survives
// the removal — which is what makes deleting it safe to do promptly rather than
// after an investigation concludes.
router.delete("/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    if (!mongoose.isValidObjectId(messageId)) {
      return res.status(400).json({ message: "Invalid message id" });
    }

    const reason = String(req.body?.reason || "").trim();
    if (reason.length < 10) {
      return res.status(400).json({ message: "A reason of at least 10 characters is required." });
    }

    const message = await Message.findById(messageId).lean();
    if (!message) return res.status(404).json({ message: "Message not found" });

    await logAdminAction({
      req, action: "message.delete", targetType: "message", targetId: message._id,
      targetUserId: message.sender, reason,
      metadata: {
        chatId: message.chatId,
        sentAt: message.createdAt,
        messageType: message.type,
        // Truncated: enough to identify what was removed without turning the
        // audit collection into a second copy of the message table.
        contentSnapshot: String(message.content || "").slice(0, 500),
      },
    });

    await Message.deleteOne({ _id: messageId });

    // The chat's denormalised `lastMessage` may now quote text that no longer
    // exists — which would leave the deleted content visible in both users'
    // conversation lists. Repoint it at whatever is now last.
    const latest = await Message.findOne({ chatId: message.chatId })
      .sort({ createdAt: -1 })
      .select("content")
      .lean();
    await Chat.updateOne(
      { _id: message.chatId },
      { $set: { lastMessage: latest?.content || "" } }
    );

    return res.status(200).json({ message: "Message deleted." });
  } catch (error) {
    console.error("admin/messages delete failed:", error);
    return res.status(500).json({ message: "Could not delete the message", error: error.message });
  }
});

// DELETE /admin/messages/conversations/:chatId   { reason, confirm }
//
// Deletes an entire conversation. Requires `confirm: true` on top of the reason
// — this destroys both people's copy of a thread that may be the only record of
// an arrangement they made, and it is not undoable.
router.delete("/conversations/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!mongoose.isValidObjectId(chatId)) {
      return res.status(400).json({ message: "Invalid conversation id" });
    }

    const reason = String(req.body?.reason || "").trim();
    if (reason.length < 10) {
      return res.status(400).json({ message: "A reason of at least 10 characters is required." });
    }
    if (req.body?.confirm !== true) {
      return res.status(400).json({
        message:
          "Deleting a conversation removes it for both people and cannot be undone. " +
          "Re-send with confirm:true to proceed.",
      });
    }

    const chat = await Chat.findById(chatId).lean();
    if (!chat) return res.status(404).json({ message: "Conversation not found" });

    const count = await Message.countDocuments({ chatId });

    await logAdminAction({
      req, action: "conversation.delete", targetType: "chat", targetId: chat._id,
      targetUserId: chat.participants?.[0] || null, reason,
      metadata: {
        participants: chat.participants?.map(String),
        messageCount: count,
        createdAt: chat.createdAt,
      },
    });

    await Message.deleteMany({ chatId });
    await Chat.deleteOne({ _id: chatId });

    return res.status(200).json({
      message: `Conversation deleted (${count} messages removed).`,
    });
  } catch (error) {
    console.error("admin/messages delete conversation failed:", error);
    return res.status(500).json({ message: "Could not delete the conversation", error: error.message });
  }
});

// POST /admin/messages/:messageId/report   { reason, details? }
//
// Turns a message an admin found while investigating into a tracked case in the
// reports queue, snapshotting the content so it survives the sender deleting it.
router.post("/:messageId/report", async (req, res) => {
  try {
    const { messageId } = req.params;
    if (!mongoose.isValidObjectId(messageId)) {
      return res.status(400).json({ message: "Invalid message id" });
    }

    const message = await Message.findById(messageId).lean();
    if (!message) return res.status(404).json({ message: "Message not found" });

    const report = await Report.create({
      // No reporterId: an admin opening a case from their own review is not a
      // user complaint, and recording them as the reporter would misrepresent
      // where the concern came from.
      reporterId: null,
      reportedUserId: message.sender,
      targetType: "message",
      messageId: message._id,
      chatId: message.chatId,
      reason: req.body?.reason || "inappropriate_content",
      details: String(req.body?.details || "").slice(0, 2000),
      evidenceSnapshot: String(message.content || "").slice(0, 2000),
      status: "reviewing",
      priority: "high",
      assignedTo: req.admin._id,
    });

    return res.status(201).json({ message: "Case opened.", data: { reportId: report._id } });
  } catch (error) {
    console.error("admin/messages report failed:", error);
    return res.status(500).json({ message: "Could not open the case", error: error.message });
  }
});

export default router;
