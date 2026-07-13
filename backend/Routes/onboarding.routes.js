import express from "express";
import { saveOnboarding } from "../controllers/onboarding.controller.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";

const router = express.Router();

router.post("/save", authMiddleware, saveOnboarding);

export default router;