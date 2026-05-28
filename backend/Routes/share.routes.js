import express from "express";
import { viewShares } from "../controllers/share.controller.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";

const router = express.Router();

router.post("/show-profiles", authMiddleware, viewShares);

export default router;