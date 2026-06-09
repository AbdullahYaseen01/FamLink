import express from "express";
import { viewShares, viewUserProfile } from "../controllers/share.controller.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";

const router = express.Router();

router.post("/show-profiles", authMiddleware, viewShares);
router.get("/current-user-profile", authMiddleware, viewUserProfile);

export default router;