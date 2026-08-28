import express from "express";
import { neighborhoodStatus } from "../Controllers/neighborhood.controller.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";

const router = express.Router();
router.get("/status", authMiddleware, neighborhoodStatus);
export default router;
