import express from "express";
import { captureResourceLead } from "../Controllers/resourceLead.controller.js";

const router = express.Router();

// Public (no auth) — a top-of-funnel visitor requests a free Resource Center
// download. Records the lead and emails/returns the link.
router.post("/capture", captureResourceLead);

export default router;
