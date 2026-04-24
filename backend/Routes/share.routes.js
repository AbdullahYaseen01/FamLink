import express from "express";
import { createShare } from "../Controllers/share.controller.js";

const router = express.Router();

router.post("/setup", createShare);

export default router;