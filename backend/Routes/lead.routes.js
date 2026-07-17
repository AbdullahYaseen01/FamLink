import express from "express";
import { createLead } from "../Controllers/lead.controller.js";

const router = express.Router();

// 1. We create a POST doorway. When an external service (like Make.com) 
// sends data to this specific path, we hand it over to our "createLead" clerk.
router.post("/incoming", createLead);

// You can add more doors here later, like:
// router.get("/", getAllLeads);

export default router;
