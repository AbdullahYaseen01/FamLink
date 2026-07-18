import express from "express";
import { createProfile, updateProfile } from "../Controllers/nanny.controller.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";
import { upload } from "../Services/utils/uploadMiddleware.js";

const router = express.Router();

router.post("/nanny-share/profile", authMiddleware, upload.single("imageFile"), createProfile);
router.patch("/nanny-share/profile", authMiddleware, upload.single("imageFile"), updateProfile);

export default router;