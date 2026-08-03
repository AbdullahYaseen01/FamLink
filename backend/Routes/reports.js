import express from "express";
import mongoose from "mongoose";

import Report from "../Schema/report.js";
import User from "../Schema/user.js";
import Message from "../Schema/message.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";
import { rateLimit } from "../Services/utils/rateLimit.js";

const router = express.Router();

// Where members report each other. This is the front door to the moderation
// queue the admin console works through.
//
// Authenticated, because an anonymous report about a named person is a
// harassment vector in itself — but the REPORTER'S IDENTITY IS NEVER SHOWN TO
// THE PERSON REPORTED. Nothing in the admin flow surfaces it either: the
// deactivation email is deliberately generic copy, and the moderator's notes
// are in the admin-only field tier (Services/utils/userPrivacy.js).

const REASONS = [
  "harassment", "scam", "inappropriate_content",
  "fake_profile", "spam", "safety_concern", "other",
];

// Five reports per hour per person. Enough for someone dealing with a genuinely
// bad actor across several messages, low enough that the queue can't be flooded
// to bury a real complaint.
const reportLimit = rateLimit({
  name: "user-report",
  limit: 5,
  windowSec: 3600,
  message: "You have submitted several reports recently. Please give us time to review them.",
});

// POST /reports   { reportedUserId, reason, details?, messageId?, chatId? }
router.post("/", authMiddleware, reportLimit, async (req, res) => {
  try {
    const { reportedUserId, reason, details, messageId, chatId } = req.body || {};

    if (!mongoose.isValidObjectId(reportedUserId)) {
      return res.status(400).json({ message: "Please choose who you are reporting." });
    }
    if (String(reportedUserId) === String(req.userId)) {
      return res.status(400).json({ message: "You cannot report yourself." });
    }

    const reported = await User.findById(reportedUserId).select("_id status").lean();
    if (!reported) return res.status(404).json({ message: "That account no longer exists." });

    // Snapshot the message content now, at the moment of the report.
    //
    // This is the whole reason evidenceSnapshot exists on the schema: someone
    // who realises they have been reported can delete what they wrote, and the
    // complaint would then be one person's word against an empty chat.
    let evidenceSnapshot = "";
    let resolvedChatId = chatId && mongoose.isValidObjectId(chatId) ? chatId : null;

    if (messageId && mongoose.isValidObjectId(messageId)) {
      const message = await Message.findById(messageId).select("content sender chatId").lean();
      // Only accept the message as evidence if it was actually written by the
      // person being reported. Otherwise a report could attach someone else's
      // message — including the reporter's own — as evidence against them.
      if (message && String(message.sender) === String(reportedUserId)) {
        evidenceSnapshot = String(message.content || "").slice(0, 2000);
        resolvedChatId = message.chatId;
      }
    }

    const safetyConcern = reason === "safety_concern" || reason === "harassment";

    const report = await Report.create({
      reporterId: req.userId,
      reportedUserId,
      targetType: messageId ? "message" : "user",
      messageId: messageId && mongoose.isValidObjectId(messageId) ? messageId : null,
      chatId: resolvedChatId,
      reason: REASONS.includes(reason) ? reason : "other",
      details: String(details || "").slice(0, 2000),
      evidenceSnapshot,
      status: "open",
      // Safety and harassment arrive at the top of the queue unread. Everything
      // else is triaged by a human; these two are the ones where waiting for
      // triage is itself the harm.
      priority: safetyConcern ? "high" : "normal",
    });

    return res.status(201).json({
      message:
        "Thank you — this has been sent to our team. We review every report and will not tell the other person who raised it.",
      data: { reportId: report._id },
    });
  } catch (error) {
    console.error("report submission failed:", error);
    return res.status(500).json({ message: "Could not submit the report", error: error.message });
  }
});

// GET /reports/status?userId=...
//
// Has this member already reported that one? The chat header shows "Reported"
// instead of a report button once they have, and without this the button
// resets to its unreported state on every refresh — which reads as the report
// having been lost, and invites a duplicate to make sure it stuck.
//
// Answers only about the CALLER'S OWN report. Whether anyone else has reported
// that account is not a member's business, and an endpoint that leaked it would
// be a way to check a stranger's standing before meeting them.
router.get("/status", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.query;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const existing = await Report.findOne({
      reporterId: req.userId,
      reportedUserId: userId,
    })
      .select("createdAt status")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      data: {
        reported: Boolean(existing),
        reportedAt: existing?.createdAt || null,
      },
    });
  } catch (error) {
    console.error("reports/status failed:", error);
    return res.status(500).json({ message: "Could not check report status", error: error.message });
  }
});

// GET /reports/mine — what this user has reported, and where it got to.
//
// Status only, never the moderator's notes or what happened to the other
// account. "We acted on this" is what a reporter is entitled to know; "we
// suspended them for 14 days" is not, and telling them turns a report into a
// way of learning about someone else's account.
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const reports = await Report.find({ reporterId: req.userId })
      .select("reason status createdAt targetType")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      data: reports.map((r) => ({
        _id: r._id,
        reason: r.reason,
        submittedAt: r.createdAt,
        // Collapsed to two states. The internal distinction between "open" and
        // "reviewing" describes our workflow, not theirs.
        status: r.status === "resolved" ? "reviewed" : "under_review",
      })),
    });
  } catch (error) {
    console.error("reports/mine failed:", error);
    return res.status(500).json({ message: "Could not load your reports", error: error.message });
  }
});

export default router;
