import express from "express";
import {
  neighborhoodStatus,
  allNeighborhoodStatuses,
  resolveNeighborhood,
  joinLaunch,
} from "../Controllers/neighborhood.controller.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";

const router = express.Router();
router.post("/resolve", resolveNeighborhood);
router.post("/join-launch", authMiddleware, joinLaunch);
router.get("/status", authMiddleware, neighborhoodStatus);
// City-scoped requests are public (landing pages); unscoped lists require auth.
router.get("/all-status", (req, res, next) => {
  if (String(req.query.city || "").trim()) return next();
  return authMiddleware(req, res, next);
}, allNeighborhoodStatuses);
export default router;
