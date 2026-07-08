import express from "express";
import { viewShares, viewUserProfile, viewAllProfilesAdmin } from "../controllers/share.controller.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";

const router = express.Router();

router.post("/show-profiles", authMiddleware, viewShares);
router.get("/current-user-profile", authMiddleware, viewUserProfile);
router.get("/admin/all-profiles", authMiddleware, viewAllProfilesAdmin);

export default router;