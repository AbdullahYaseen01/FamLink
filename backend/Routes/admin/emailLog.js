import express from "express";

import EmailLog from "../../Schema/emailLog.js";
import { adminOnly, parsePaging, pagingMeta, escapeRegex } from "../../Services/utils/adminAuth.js";

const router = express.Router();
router.use(adminOnly);

// The automated-email log. Read-only, by design — there is no route here that
// edits or deletes a row, because the value of the log is that it records what
// happened rather than what anyone would prefer had happened.

/* ═════════════════════════════════ LIST ═══════════════════════════════════ */

// GET /admin/email-log
//   ?search= &type= &status=accepted|failed|skipped &campaign=
//   &from= &to= &page= &limit=
router.get("/", async (req, res) => {
  try {
    const paging = parsePaging(req.query);
    const query = {};

    const { search, type, status, campaign, from, to } = req.query;

    if (search) {
      const term = new RegExp(escapeRegex(String(search).trim()), "i");
      query.$or = [{ recipient: term }, { subject: term }];
    }

    if (type) query.type = type;
    if (status && ["accepted", "failed", "skipped"].includes(status)) query.status = status;
    if (campaign) query.campaign = campaign;

    if (from || to) {
      query.sentAt = {};
      if (from) query.sentAt.$gte = new Date(from);
      // An end date is inclusive of that whole day. Without the +1, filtering
      // "to 5 March" silently excludes everything sent on 5 March, which reads
      // as missing emails.
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        query.sentAt.$lte = end;
      }
    }

    const [logs, totalRecords] = await Promise.all([
      EmailLog.find(query)
        .sort({ sentAt: -1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .populate("userId", "name email type")
        .lean(),
      EmailLog.countDocuments(query),
    ]);

    return res.status(200).json({ data: logs, pagination: pagingMeta(totalRecords, paging) });
  } catch (error) {
    console.error("admin/email-log list failed:", error);
    return res.status(500).json({ message: "Could not load the email log", error: error.message });
  }
});

/* ═════════════════════════════════ STATS ══════════════════════════════════ */

// GET /admin/email-log/stats?days=30
router.get("/stats", async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [byType, byStatus, daily, campaigns] = await Promise.all([
      EmailLog.aggregate([
        { $match: { sentAt: { $gte: since } } },
        {
          $group: {
            _id: "$type",
            total: { $sum: 1 },
            accepted: { $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
            skipped: { $sum: { $cond: [{ $eq: ["$status", "skipped"] }, 1, 0] } },
            lastSentAt: { $max: "$sentAt" },
          },
        },
        { $sort: { total: -1 } },
      ]),
      EmailLog.aggregate([
        { $match: { sentAt: { $gte: since } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      EmailLog.aggregate([
        { $match: { sentAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$sentAt" } },
            total: { $sum: 1 },
            failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      EmailLog.aggregate([
        { $match: { sentAt: { $gte: since }, campaign: { $ne: null } } },
        {
          $group: {
            _id: "$campaign",
            total: { $sum: 1 },
            accepted: { $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
            sentAt: { $max: "$sentAt" },
          },
        },
        { $sort: { sentAt: -1 } },
        { $limit: 50 },
      ]),
    ]);

    const statusMap = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
    const total = byStatus.reduce((sum, s) => sum + s.count, 0);

    return res.status(200).json({
      data: {
        windowDays: days,
        total,
        accepted: statusMap.accepted || 0,
        failed: statusMap.failed || 0,
        skipped: statusMap.skipped || 0,
        // Share of attempts the mail server took. NOT an inbox-delivery rate,
        // and named so it can't be mistaken for one — knowing whether an email
        // actually landed needs provider webhooks we don't consume yet, and
        // reporting "98% delivered" from this data would be a claim the data
        // cannot support.
        acceptanceRate: total ? Math.round(((statusMap.accepted || 0) / total) * 100) : 0,
        byType,
        daily,
        campaigns,
      },
    });
  } catch (error) {
    console.error("admin/email-log stats failed:", error);
    return res.status(500).json({ message: "Could not load email stats", error: error.message });
  }
});

// GET /admin/email-log/types — the distinct template names, for the filter menu.
router.get("/types", async (req, res) => {
  try {
    const types = await EmailLog.distinct("type");
    return res.status(200).json({ data: types.sort() });
  } catch (error) {
    console.error("admin/email-log types failed:", error);
    return res.status(500).json({ message: "Could not load types", error: error.message });
  }
});

export default router;
