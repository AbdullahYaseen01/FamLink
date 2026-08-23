import express from "express";
import { landingFamChat, landingMatches, landingProgress } from "../Controllers/landing.controller.js";

const router = express.Router();

router.post("/matches", landingMatches);
router.post("/fam-chat", landingFamChat);
router.post("/progress", landingProgress);

export default router;
