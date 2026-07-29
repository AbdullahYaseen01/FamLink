import express from "express";
import { captureOnboardingLead } from "../Controllers/onboardingLead.controller.js";
import { rateLimit } from "../Services/utils/rateLimit.js";

const router = express.Router();

// Public (no auth) — fires the moment someone finishes the intake questions,
// which is before they have an account. Unlike the waitlist and resource-lead
// endpoints this one sends no email, so the ceiling is here to stop a script
// filling the collection with junk rows the nudge cron would later mail.
router.post(
  "/capture",
  rateLimit({
    name: "onboarding-lead",
    limit: 20,
    windowSec: 60 * 60,
    message: "Too many submissions. Please try again shortly.",
  }),
  captureOnboardingLead
);

export default router;
