import express from "express";
import { viewShares, viewUserProfile, viewAllProfilesAdmin } from "../Controllers/share.controller.js";
import { getMyShareLink, getPublicSharedProfile } from "../Controllers/shareProfile.controller.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";

const router = express.Router();

router.post("/show-profiles", authMiddleware, viewShares);
router.get("/current-user-profile", authMiddleware, viewUserProfile);
router.get("/admin/all-profiles", authMiddleware, viewAllProfilesAdmin);

// ── Public "Share Profile" links ──
// my-share-link mints the owner's token; public/:token is what a stranger
// following the shared URL loads, and is intentionally unauthenticated.
// Registered above no wildcard, so ordering here is only for readability.
router.get("/my-share-link", authMiddleware, getMyShareLink);
router.get("/public/:token", getPublicSharedProfile);

export default router;