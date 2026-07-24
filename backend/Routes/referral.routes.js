import express from "express";
import {
  getMyReferral,
  getMyReferredFriends,
  seenReferralRewards,
} from "../Controllers/referral.controller.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";

const router = express.Router();

router.get("/me", authMiddleware, getMyReferral);
router.get("/friends", authMiddleware, getMyReferredFriends);
router.post("/seen-reward", authMiddleware, seenReferralRewards);

export default router;
