import express from "express";
import {
  requestMatch,
  getNearbyMatches,
} from "../Controllers/match.controller.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";

const router = express.Router();

router.post("/request", authMiddleware, requestMatch);
router.get("/nearby/:userId", getNearbyMatches);

export default router;