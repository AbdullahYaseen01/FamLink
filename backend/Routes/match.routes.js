import express from "express";
import {
  requestMatch,
  getNearbyMatches,
  getOutgoingRequests,
  getIncomingRequests,
  acceptIncomingRequest,
  rejectIncomingRequest,
  undoRejectedIncomingRequest,
  blockMatch,
  unblockMatch,
  getMatchWithUser,
} from "../Controllers/match.controller.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";

const router = express.Router();

router.post("/request", authMiddleware, requestMatch);
router.get("/get-outgoing-requests", authMiddleware, getOutgoingRequests);
router.get("/get-incoming-requests", authMiddleware, getIncomingRequests);
router.post("/accept-incoming-request", authMiddleware, acceptIncomingRequest);
router.post("/reject-incoming-request", authMiddleware, rejectIncomingRequest);
router.post("/undo-reject-incoming-request", authMiddleware, undoRejectedIncomingRequest);
router.post("/block-match", authMiddleware, blockMatch);
router.post("/unblock-match", authMiddleware, unblockMatch);
router.get("/get-match-with-user", authMiddleware, getMatchWithUser);

export default router;