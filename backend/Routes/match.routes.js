import express from "express";
import {
  requestMatch,
  getNearbyMatches,
} from "../controllers/match.controller.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";

const router = express.Router();

router.post("/request", authMiddleware, requestMatch);

export default router;