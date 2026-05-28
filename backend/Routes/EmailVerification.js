import express from "express";
import { sendOtpEmail } from "../Services/email/email.js";
import { client, connectRedis } from "../Services/RedisClient.js";

const router = express.Router();

// Connect Redis once
await connectRedis();

const generateOTP = () => {
  return Math.floor(
    1000 + Math.random() * 9000
  ).toString();
};

const validateEmail = (email) => {
  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);
};



/* ==========================
   SEND OTP
========================== */

router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email address is required",
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      message: "Invalid email format",
    });
  }

  try {
    // Check if OTP already exists
    const existingOtpStr =
      await client.get(email);

    if (existingOtpStr) {
      return res.status(400).json({
        message:
          "OTP already sent. Please wait before requesting another.",
      });
    }

    const otp = generateOTP();

    const otpData = {
      otp,
      attempts: 0,
    };

    // Store for 15 mins
    await client.set(
      email,
      JSON.stringify(otpData),
      {
        EX: 15 * 60,
      }
    );

    await sendOtpEmail(email, otp);

    return res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error(
      "Send OTP error:",
      error
    );

    return res.status(500).json({
      message: "Failed to send OTP",
    });
  }
});



/* ==========================
   RESEND OTP
========================== */

router.post("/resend-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message:
        "Email address is required",
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      message:
        "Invalid email format",
    });
  }

  try {
    const existingOtpStr =
      await client.get(email);

    const existingOtp =
      existingOtpStr
        ? JSON.parse(
            existingOtpStr
          )
        : null;

    // Prevent resend while active OTP exists
    if (existingOtp) {
      return res.status(400).json({
        message:
          "OTP is still active. Please wait.",
      });
    }

    const otp = generateOTP();

    const otpData = {
      otp,
      attempts: 0,
    };

    await client.set(
      email,
      JSON.stringify(otpData),
      {
        EX: 15 * 60,
      }
    );

    await sendOtpEmail(email, otp);

    return res.status(200).json({
      message:
        "OTP resent successfully",
    });
  } catch (error) {
    console.error(
      "Resend OTP error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to resend OTP",
    });
  }
});



/* ==========================
   VERIFY OTP
========================== */

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      message:
        "Email and OTP are required",
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      message:
        "Invalid email format",
    });
  }

  try {
    const storedOtpDataStr =
      await client.get(email);

    if (!storedOtpDataStr) {
      return res.status(400).json({
        message:
          "OTP expired or not found",
      });
    }

    const storedOtpData =
      JSON.parse(
        storedOtpDataStr
      );

    // Max attempts
    if (
      storedOtpData.attempts >=
      3
    ) {
      await client.del(email);

      return res.status(400).json({
        message:
          "Too many attempts. Request a new OTP.",
      });
    }

    // Wrong OTP
    if (
      storedOtpData.otp !== otp
    ) {
      storedOtpData.attempts++;

      // Preserve remaining TTL
      const ttl =
        await client.ttl(
          email
        );

      await client.set(
        email,
        JSON.stringify(
          storedOtpData
        ),
        {
          EX: ttl > 0 ? ttl : 900,
        }
      );

      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    // Success → remove OTP
    await client.del(email);

    return res.status(200).json({
      message:
        "Email verified successfully",
      verified: true,
    });
  } catch (error) {
    console.error(
      "Verify OTP error:",
      error
    );

    return res.status(500).json({
      message:
        "Verification failed",
    });
  }
});

export default router;