import express from "express";
import { processPhantombusterWebhook } from "../Controllers/phantombuster.js";
import {
  phantombusterWebhookLimit,
  requireWebhookSecret,
} from "../Services/utils/webhookAuth.js";

const router = express.Router();

// POST /phantombuster/webhook — shared secret required (fails closed if unset).
router.post(
  "/webhook",
  phantombusterWebhookLimit,
  requireWebhookSecret("PHANTOMBUSTER_WEBHOOK_SECRET"),
  processPhantombusterWebhook
);

export default router;
