import express from "express";
import { saveOnboarding } from "../Controllers/onboarding.controller.js";

const router = express.Router();

router.post("/save", saveOnboarding);

export default router;