import express from "express";
import { neighborhoodStatus, allNeighborhoodStatuses, submitLaunchRequest, checkNeighborhoodStatus } from "../Controllers/neighborhood.controller.js";
import { authMiddleware, optionalAuthMiddleware } from "../Services/utils/middlewareAuth.js";

const router = express.Router();
router.get("/status", authMiddleware, neighborhoodStatus);
router.get("/all-status", authMiddleware, allNeighborhoodStatuses);
router.post("/launch-request", optionalAuthMiddleware, submitLaunchRequest);
router.post("/check-status", optionalAuthMiddleware, checkNeighborhoodStatus);
export default router;
