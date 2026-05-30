import express from "express";
import {
  requestMatch,
  getNearbyMatches,
  getOutgoingRequests,
  getIncomingRequests,
  acceptIncomingRequest,
  rejectIncomingRequest,
} from "../controllers/match.controller.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";

const router = express.Router();

router.post("/request", authMiddleware, requestMatch);
router.get("/get-outgoing-requests", authMiddleware, getOutgoingRequests);
router.get("/get-incoming-requests", authMiddleware, getIncomingRequests);
router.post("/accept-incoming-request", authMiddleware, acceptIncomingRequest);
router.post("/reject-incoming-request", authMiddleware, rejectIncomingRequest);

export default router;