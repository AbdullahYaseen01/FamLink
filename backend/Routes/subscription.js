import express from "express";
import Subscription from "../Schema/subscription.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";
import User from "../Schema/user.js";
import jwt from "jsonwebtoken";
import { sendEmailConfirmation } from "../Services/email/email.js";
import "dotenv/config";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000"
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173" 

const generateEmailToken = (email) => {
  return jwt.sign(
    { email },
    JWT_SECRET,
    { expiresIn: "1h" } // link valid for 1 hour
  );
};

const sendConfirmationEmail = async (userEmail) => {
  const token = generateEmailToken(userEmail);
  const confirmUrl = `${BACKEND_URL}/subscribe/verify-email/${token}`;

  const mailOptions = {
    from: `"Famlink Support" <noreply@famlink.care>`,
    to: userEmail,
    subject: "Please confirm your email",
    html: `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; text-align: center;">
    <div style="max-width: 500px; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #4A90E2; font-size: 22px; margin-bottom: 10px;">📩 Confirm Your Subscription</h2>
      <p style="font-size: 16px; color: #333;">Thanks for joining our newsletter! Please confirm your email to start receiving updates.</p>
      <div style="margin: 25px 0;">
        <a href="${confirmUrl}" 
           style="background-color: #4A90E2; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold;">
          Confirm Email
        </a>
      </div>
      <p style="font-size: 14px; color: #666;">This link will expire in 1 hour. If you didn’t subscribe, you can safely ignore this email.</p>
    </div>
  </div>
`


  }
  await sendEmailConfirmation(mailOptions.to, mailOptions.subject, mailOptions.html)
};

router.post("/news-letter", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if already subscribed
    const user = await Subscription.findOne({ email });

    if (user) {
      return res.status(409).json({
        message: "Already Subscribed",
      });
    }

    //Send Email verification mail
    await sendConfirmationEmail(email)

    // Create new subscription
    // const newSubscription = new Subscription({ email });
    // await newSubscription.save();

    res.status(200).json({
      message: "Confirmation Email Sent!",
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, JWT_SECRET);

    // Update user in DB (set emailVerified = true)
    const newSubscription = new Subscription({ email: decoded.email });
    await newSubscription.save();

    res.send(`
  <div style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
    <div style="max-width: 500px; background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); text-align: center;">
      <h2 style="color: #4A90E2;">🎉 Subscription Confirmed</h2>
      <p style="font-size: 16px; color: #333;">Thank you for verifying your email. You are now subscribed to our newsletter and will start receiving updates soon.</p>
      <a href="${FRONTEND_URL}" 
         style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #4A90E2; color: #fff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
        Go to Famlink
      </a>
    </div>
  </div>
`);
  } catch (err) {
   res.status(400).send(`
  <div style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
    <div style="max-width: 500px; background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); text-align: center;">
      <h2 style="color: #ff6b6b;">❌ Verification Failed</h2>
      <p style="font-size: 16px; color: #333;">The verification link is invalid or has expired.</p>
      <a href="${FRONTEND_URL}"
         style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #ff6b6b; color: #fff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
        Try Again
      </a>
    </div>
  </div>
`);
  }
});

router.get("/", authMiddleware, async (req, res) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user is an admin
    if (user.type !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Only Admins can get this data' });
    }

    const { limit, page, email } = req.query;

    const pageSize = parseInt(limit) || 10;
    const currentPage = parseInt(page) || 1;
    const skip = (currentPage - 1) * pageSize;

    // Optional filter by email
    const filter = {};
    if (email) {
      filter.email = { $regex: email, $options: "i" }; // Case-insensitive search
    }

    const subscribers = await Subscription.find(filter)
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 });

    const totalCount = await Subscription.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / pageSize);

    res.status(200).json({
      status: 200,
      data: subscribers,
      pagination: {
        totalRecords: totalCount,
        totalPages,
        currentPage,
        limit: pageSize,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: err.message,
    });
  }
});

export default router;
