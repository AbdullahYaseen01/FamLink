import express from "express";
import { createProfile } from "../Controllers/nanny.controller.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";
import { upload } from "../Services/utils/uploadMiddleware.js";

const router = express.Router();

router.post("/nanny-share/profile", authMiddleware, upload.single("imageFile"), createProfile);

export default router;