import express from 'express';
import cors from 'cors';
import mongoose from './DB/index.js';
import router from './Routes/index.js';
import { createServer } from 'http'
import { Server } from 'socket.io'
import bookingSocket from './Routes/Socket/socket.js'
import chatSocket from './Routes/Socket/chat.js';
import path from "path";
import { fileURLToPath } from 'url';
import stripeRouter from './Routes/stripeRouter.js'
import cron from 'node-cron'
import { sendAutoEmail } from './Services/email/email.js';
import { startCompleteProfileReminderJob } from './Services/cron/completeProfileReminder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()
const PORT = process.env.PORT || 3000

const db = mongoose.connection;

db.on("error", (error) => {
    console.error("Connection error:", error);
});
db.once("open", function () {
    console.log("DB Connected");
});
const httpServer = createServer(app);

// Stripe webhook first
app.use("/stripe", stripeRouter);

app.use(express.json());
app.use(cors());


export const io = new Server(httpServer, { cors: { origin: "*" } });

bookingSocket(io)
chatSocket(io)

app.use(
    "/assets/uploads",
    express.static(path.join(__dirname, "assets/uploads"))
);

app.use(
    "/assets/audio",
    express.static(path.join(__dirname, "assets/audio"))
);

app.use('/', router);

httpServer.listen(PORT, () => {
    console.log(`Server is running on Port ${PORT}`);
    console.log(`server running in ${process.env.NODE_ENV} mode`)
    // Schedule the "complete your profile" reminder emails.
    startCompleteProfileReminderJob();
});

// httpServer.listen(PORT, '0.0.0.0', () => {
//   console.log(`Server is running on port ${PORT}`);
// });