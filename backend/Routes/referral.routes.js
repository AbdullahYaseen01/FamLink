import express from "express";
import {
  getMyReferral,
  getMyReferredFriends,
} from "../Controllers/referral.controller.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";

const router = express.Router();

router.get("/me", authMiddleware, getMyReferral);
router.get("/friends", authMiddleware, getMyReferredFriends);

export default router;
