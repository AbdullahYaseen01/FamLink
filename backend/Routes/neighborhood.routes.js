import express from "express";
import { neighborhoodStatus, allNeighborhoodStatuses } from "../Controllers/neighborhood.controller.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";

const router = express.Router();
router.get("/status", authMiddleware, neighborhoodStatus);
router.get("/all-status", authMiddleware, allNeighborhoodStatuses);
export default router;
