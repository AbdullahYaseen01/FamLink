import express from "express";

import users from "./users.js";
import activity from "./activity.js";
import shareLinks from "./shareLinks.js";
import waitlist from "./waitlist.js";
import emailLog from "./emailLog.js";
import matches from "./matches.js";
import messages from "./messages.js";
import reports from "./reports.js";
import terms from "./terms.js";
import analytics from "./analytics.js";
import traffic from "./traffic.js";
import subscriptions from "./subscriptions.js";
import referrals from "./referrals.js";
import support from "./support.js";
import auditLog from "./auditLog.js";
import sheets from "./sheets.js";

// The admin console API, mounted at /admin.
//
// Every sub-router calls `router.use(adminOnly)` at its own top rather than
// relying on a single guard here. That is deliberate duplication: a router
// mounted somewhere else by mistake — or one imported directly by another file
// — carries its own gate with it, so being an admin route and being protected
// are the same fact rather than two facts that have to stay in sync.
const router = express.Router();

router.use("/users", users);
router.use("/activity", activity);
router.use("/share-links", shareLinks);
router.use("/waitlist", waitlist);
router.use("/email-log", emailLog);
router.use("/matches", matches);
router.use("/messages", messages);
router.use("/reports", reports);
router.use("/terms", terms);
router.use("/analytics", analytics);
router.use("/traffic", traffic);
router.use("/subscriptions", subscriptions);
router.use("/referrals", referrals);
router.use("/support", support);
router.use("/audit-log", auditLog);
router.use("/sheets", sheets);

export default router;
