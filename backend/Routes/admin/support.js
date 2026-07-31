import express from "express";
import mongoose from "mongoose";

import Feedback from "../../Schema/feedback.js";
import User from "../../Schema/user.js";

import { adminOnly, parsePaging, pagingMeta, escapeRegex } from "../../Services/utils/adminAuth.js";
import { logAdminAction } from "../../Services/utils/adminAudit.js";

const router = express.Router();
router.use(adminOnly);

const DAY_MS = 24 * 60 * 60 * 1000;

// Support & feedback queue, over the existing Feedback collection.
//
// The collection already held every in-app submission; what it lacked was any
// notion of the submission being WORKED. Status, assignee and internal notes
// were added to the schema rather than built as a separate ticket model, so
// every item ever submitted joins the queue automatically instead of the queue
// starting empty and the history living somewhere else.

/* ═════════════════════════════════ QUEUE ══════════════════════════════════ */

// GET /admin/support?status=&category=&assigned=me|unassigned&search=&page=&limit=
router.get("/", async (req, res) => {
  try {
    const paging = parsePaging(req.query);
    const query = {};

    const { status, category, assigned, search, priority } = req.query;

    // Default to open work. Resolved and closed items stay reachable by filter
    // but don't bury the things that still need doing.
    if (status && ["new", "in_progress", "resolved", "closed"].includes(status)) {
      query.status = status;
    } else if (status !== "all") {
      query.status = { $in: ["new", "in_progress"] };
    }

    if (category) query.category = category;
    if (priority) query.priority = priority;

    if (assigned === "me") query.assignedTo = req.admin._id;
    if (assigned === "unassigned") query.assignedTo = null;

    if (search) {
      const term = new RegExp(escapeRegex(String(search).trim()), "i");
      query.$or = [{ message: term }, { email: term }];
    }

    const [items, totalRecords] = await Promise.all([
      Feedback.find(query)
        .populate("assignedTo", "name email")
        .populate("notes.authorId", "name email")
        .populate("resolvedBy", "name email")
        .sort({ priority: -1, createdAt: -1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .lean(),
      Feedback.countDocuments(query),
    ]);

    // Link each submission to an account where the address matches one. The
    // form only captures an email, so this is what lets an admin see who they
    // are actually replying to — and whether the complaint is from a member
    // who has been reported three times.
    const emails = [...new Set(items.map((i) => String(i.email || "").toLowerCase()))].filter(Boolean);
    const users = emails.length
      ? await User.find({ email: { $in: emails } })
          .select("_id name email type status premium createdAt")
          .lean()
      : [];
    const byEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));

    return res.status(200).json({
      data: items.map((item) => ({
        ...item,
        // Older rows predate the status field entirely. Defaulted on read so
        // the queue shows them as new work rather than as blanks.
        status: item.status || "new",
        priority: item.priority || "normal",
        submitter: byEmail.get(String(item.email || "").toLowerCase()) || null,
        ageDays: Math.floor((Date.now() - new Date(item.createdAt).getTime()) / DAY_MS),
      })),
      pagination: pagingMeta(totalRecords, paging),
    });
  } catch (error) {
    console.error("admin/support list failed:", error);
    return res.status(500).json({ message: "Could not load the queue", error: error.message });
  }
});

// GET /admin/support/stats
router.get("/stats", async (req, res) => {
  try {
    const [byStatus, byCategory, oldestOpen, resolvedRecently] = await Promise.all([
      Feedback.aggregate([
        { $group: { _id: { $ifNull: ["$status", "new"] }, count: { $sum: 1 } } },
      ]),
      Feedback.aggregate([
        { $match: { status: { $in: ["new", "in_progress", null] } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Feedback.findOne({ status: { $in: ["new", "in_progress", null] } })
        .sort({ createdAt: 1 })
        .select("createdAt")
        .lean(),
      Feedback.countDocuments({
        status: "resolved",
        resolvedAt: { $gte: new Date(Date.now() - 7 * DAY_MS) },
      }),
    ]);

    const statusMap = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));

    return res.status(200).json({
      data: {
        new: statusMap.new || 0,
        inProgress: statusMap.in_progress || 0,
        resolved: statusMap.resolved || 0,
        closed: statusMap.closed || 0,
        byCategory,
        oldestOpenDays: oldestOpen
          ? Math.floor((Date.now() - new Date(oldestOpen.createdAt).getTime()) / DAY_MS)
          : null,
        resolvedLast7Days: resolvedRecently,
      },
    });
  } catch (error) {
    console.error("admin/support stats failed:", error);
    return res.status(500).json({ message: "Could not load stats", error: error.message });
  }
});

/* ═════════════════════════════════ UPDATE ═════════════════════════════════ */

// PUT /admin/support/:id   { status?, priority?, assignToMe?, note? }
//
// One endpoint for every field on a ticket. Working an item is usually several
// changes at once — pick it up, set a priority, leave a note — and splitting
// those across three requests means a half-updated ticket whenever one fails.
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid ticket id" });
    }

    const item = await Feedback.findById(id);
    if (!item) return res.status(404).json({ message: "Ticket not found" });

    const { status, priority, assignToMe, note } = req.body || {};
    const changed = {};

    if (status && ["new", "in_progress", "resolved", "closed"].includes(status)) {
      item.status = status;
      changed.status = status;
      if (status === "resolved" || status === "closed") {
        item.resolvedAt = new Date();
        item.resolvedBy = req.admin._id;
      } else {
        // Reopening clears the resolution, so a ticket that comes back doesn't
        // still claim it was closed last Tuesday.
        item.resolvedAt = null;
        item.resolvedBy = null;
      }
    }

    if (["low", "normal", "high"].includes(priority)) {
      item.priority = priority;
      changed.priority = priority;
    }

    if (assignToMe === true) {
      item.assignedTo = req.admin._id;
      changed.assignedTo = String(req.admin._id);
      // Picking something up implies working it, unless it is already resolved.
      if (item.status === "new") item.status = "in_progress";
    }
    if (assignToMe === false) {
      item.assignedTo = null;
      changed.assignedTo = null;
    }

    if (note && String(note).trim()) {
      item.notes.push({
        body: String(note).trim().slice(0, 5000),
        authorId: req.admin._id,
        createdAt: new Date(),
      });
      changed.noteAdded = true;
    }

    if (!Object.keys(changed).length) {
      return res.status(400).json({ message: "Nothing to change." });
    }

    await item.save();

    await logAdminAction({
      req, action: "support.update", targetType: "feedback", targetId: item._id,
      reason: `Support ticket updated: ${Object.keys(changed).join(", ")}`,
      // The note BODY is not copied into the audit metadata. It is an internal
      // comment that can quote a member's complaint verbatim, and duplicating
      // it into a second collection is copying personal data for no benefit —
      // the ticket itself already holds it.
      metadata: changed,
    });

    const populated = await Feedback.findById(id)
      .populate("assignedTo", "name email")
      .populate("notes.authorId", "name email")
      .lean();

    return res.status(200).json({ message: "Ticket updated.", data: populated });
  } catch (error) {
    console.error("admin/support update failed:", error);
    return res.status(500).json({ message: "Could not update the ticket", error: error.message });
  }
});

// GET /admin/support/categories — distinct categories, for the filter menu.
router.get("/categories", async (req, res) => {
  try {
    const categories = await Feedback.distinct("category");
    return res.status(200).json({ data: categories.filter(Boolean).sort() });
  } catch (error) {
    console.error("admin/support categories failed:", error);
    return res.status(500).json({ message: "Could not load categories", error: error.message });
  }
});

export default router;
