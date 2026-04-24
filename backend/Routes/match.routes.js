import express from "express";
import {
  requestMatch,
  getNearbyMatches,
} from "../Controllers/match.controller.js";

const router = express.Router();

router.post("/request", requestMatch);
router.get("/nearby/:userId", getNearbyMatches);

export default router;