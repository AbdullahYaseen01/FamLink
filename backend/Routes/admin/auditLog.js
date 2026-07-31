import express from "express";

import AdminAction from "../../Schema/adminAction.js";
import { adminOnly, parsePaging, pagingMeta } from "../../Services/utils/adminAuth.js";

const router = express.Router();
router.use(adminOnly);

// The admin audit trail, read-only.
//
// There is deliberately no route here that edits or deletes a row, and there
// should never be one. A trail an admin can edit answers no question that
// matters — the whole value of "who deleted this family's account" is that the
// answer cannot be changed by whoever deleted it.

// GET /admin/audit-log?action=&adminId=&targetUserId=&from=&to=&page=&limit=
router.get("/", async (req, res) => {
  try {
    const paging = parsePaging(req.query);
    const query = {};

    const { action, adminId, targetUserId, from, to } = req.query;

    if (action) query.action = action;
    if (adminId) query.adminId = adminId;
    if (targetUserId) query.targetUserId = targetUserId;

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const [entries, totalRecords] = await Promise.all([
      AdminAction.find(query)
        .populate("adminId", "name email")
        .populate("targetUserId", "name email type status")
        .sort({ createdAt: -1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .lean(),
      AdminAction.countDocuments(query),
    ]);

    return res.status(200).json({ data: entries, pagination: pagingMeta(totalRecords, paging) });
  } catch (error) {
    console.error("admin/audit-log failed:", error);
    return res.status(500).json({ message: "Could not load the audit log", error: error.message });
  }
});

// GET /admin/audit-log/actions — the distinct action names, for the filter menu.
router.get("/actions", async (req, res) => {
  try {
    const actions = await AdminAction.distinct("action");
    return res.status(200).json({ data: actions.sort() });
  } catch (error) {
    console.error("admin/audit-log actions failed:", error);
    return res.status(500).json({ message: "Could not load actions", error: error.message });
  }
});

export default router;
