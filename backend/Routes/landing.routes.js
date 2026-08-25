import express from "express";
import { landingGuidedQa, landingMatches, landingProgress } from "../Controllers/landing.controller.js";

const router = express.Router();

router.post("/matches", landingMatches);
router.post("/guided-qa", landingGuidedQa);
router.post("/progress", landingProgress);

export default router;
