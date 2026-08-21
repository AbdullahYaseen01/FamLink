import express from "express";
import { createProfile, updateProfile } from "../Controllers/nanny.controller.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";
import { uploadProfilePhoto } from "../Services/utils/uploadMiddleware.js";

const router = express.Router();

router.post("/nanny-share/profile", authMiddleware, uploadProfilePhoto, createProfile);
router.patch("/nanny-share/profile", authMiddleware, uploadProfilePhoto, updateProfile);

export default router;