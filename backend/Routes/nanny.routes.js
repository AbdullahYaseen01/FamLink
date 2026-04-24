import express from "express";
import { createProfile } from "../Controllers/nanny.controller.js";

const router = express.Router();

router.post("/profile", createProfile);

export default router;