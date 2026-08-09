// Env validation must run before route modules import Stripe / JWT helpers.
import { allowedOrigins, corsOrigin } from "./Services/utils/loadEnv.js";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "./DB/index.js";
import router from "./Routes/index.js";
import { createServer } from "http";
import { Server } from "socket.io";
import bookingSocket from "./Routes/Socket/socket.js";
import chatSocket from "./Routes/Socket/chat.js";
import path from "path";
import { fileURLToPath } from "url";
import stripeRouter from "./Routes/stripeRouter.js";
import { multerErrorHandler } from "./Services/utils/uploadMiddleware.js";
import { startCompleteProfileReminderJob } from "./Services/cron/completeProfileReminder.js";
import { startWeeklyResourcesJob } from "./Services/cron/weeklyResources.js";
import { startNewUsersInAreaJob } from "./Services/cron/newUsersInArea.js";
import { startReengagementJob } from "./Services/cron/reengagementReminder.js";
import { startOnboardingNudgeJob } from "./Services/cron/onboardingNudge.js";
import { startFeedbackRequestJob } from "./Services/cron/feedbackRequest.js";
import { startTrafficRollupJob } from "./Services/cron/trafficRollup.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const db = mongoose.connection;

db.on("error", (error) => {
  console.error("Connection error:", error);
});
db.once("open", function () {
  console.log("DB Connected");
});
const httpServer = createServer(app);

// Security headers (API-safe defaults; CSP left permissive for JSON APIs).
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Stripe webhook first (needs raw body before express.json)
app.use("/stripe", stripeRouter);

app.use(express.json());
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

// Default maxHttpBufferSize (1MB) is too small for base64-encoded voice
// messages, which silently disconnects the socket and drops the send.
export const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  maxHttpBufferSize: 10 * 1024 * 1024,
});

bookingSocket(io);
chatSocket(io);

// Legacy local uploads. New uploads go to Cloudinary; this path remains for
// older files. Hardened: no directory listing, no dotfiles, nosniff so a
// mislabeled .html/.svg cannot execute as a document in modern browsers.
const staticUploadOpts = {
  dotfiles: "deny",
  index: false,
  redirect: false,
  setHeaders: (res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    // Prefer download over inline render for anything ambiguous.
    res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
  },
};

app.use(
  "/assets/uploads",
  express.static(path.join(__dirname, "assets/uploads"), staticUploadOpts)
);

app.use(
  "/assets/audio",
  express.static(path.join(__dirname, "assets/audio"), staticUploadOpts)
);

app.use("/", router);

// Multer fileFilter / size rejections surface as errors — return JSON 400s.
app.use(multerErrorHandler);

httpServer.listen(PORT, () => {
  console.log(`Server is running on Port ${PORT}`);
  console.log(`server running in ${process.env.NODE_ENV} mode`);
  // Schedule the "complete your profile" reminder emails.
  startCompleteProfileReminderJob();
  // Weekly nanny share resources digest (email 12) — Tuesday morning.
  startWeeklyResourcesJob();
  // Weekly "new families in your area" digest (email 13) — Wednesday morning.
  startNewUsersInAreaJob();
  // Re-engagement / win-back for 30-day-inactive users (email 16) — daily.
  startReengagementJob();
  // Nudge for people who answered the intake questions but never created an
  // account (email 20) — hourly, a few hours after they dropped off.
  startOnboardingNudgeJob();
  // Ask 30-day members what they think (email 15) — daily, once per account.
  startFeedbackRequestJob();
  // Roll raw page views up into daily traffic totals. Not optional: raw views
  // are deleted after 180 days by a TTL index, so any history older than that
  // exists only because this job wrote it.
  startTrafficRollupJob();
});
