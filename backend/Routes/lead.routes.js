import express from "express";
import { createLead } from "../Controllers/lead.controller.js";
import { processPhantombusterWebhook } from "../Controllers/phantombuster.js";
import { verifyWebhookSecret } from "../Middleware/verifyWebhookSecret.js";

const router = express.Router();

// Make.com / PhantomBuster must send: x-webhook-secret: <WEBHOOK_SECRET>
router.post("/incoming", verifyWebhookSecret, createLead);
router.post("/phantombuster", verifyWebhookSecret, processPhantombusterWebhook);

export default router;
