import express from "express";
import { sendOtpEmail } from "../Services/email/email.js";
import { client, connectRedis } from "../Services/RedisClient.js";

const router = express.Router();

// Connect Redis before starting server
await connectRedis();

// In-memory storage for OTPs (use Redis in production)
const otpStorage = new Map();

const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString(); // Generates a 4-digit OTP
};

// Send OTP to email
router.post("/send-otp", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            message: "Email address is required"
        });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            message: "Invalid email format"
        });
    }

    try {
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

        // Store OTP in memory with expiry
        // otpStorage.set(email, {
        //     otp: otp,
        //     expiry: otpExpiry,
        //     attempts: 0
        // });

        const otpData = {
            otp,
            expiry: otpExpiry,
            attempts: 0
        };

        await client.set(email, JSON.stringify(otpData), { EX: 15 * 60 }); // store with TTL = 1 hour

        await sendOtpEmail(email, otp);

        res.status(200).json({
            message: "OTP sent to your email"
        });
    } catch (error) {
        console.error("Send OTP error:", error);
        res.status(500).json({ message: "Failed to send OTP" });
    }
});

// Resend OTP to email
router.post("/resend-otp", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            message: "Email address is required"
        });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            message: "Invalid email format"
        });
    }

    try {
        const existingOtp = otpStorage.get(email);

        // Check if OTP is still valid
        if (existingOtp && new Date() < existingOtp.expiry) {
            return res.status(400).json({
                message: "OTP is still valid, please wait before requesting a new one"
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        // const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

        // Update OTP in storage
        // otpStorage.set(email, {
        //     otp: otp,
        //     expiry: otpExpiry,
        //     attempts: 0
        // });

        const otpData = {
            otp,
            expiry: otpExpiry,
            attempts: 0
        };

        await client.set(email, JSON.stringify(otpData), { EX: 15 * 60 });

        await sendOtpEmail(email, otp);

        res.status(200).json({
            message: "OTP resent successfully"
        });
    } catch (error) {
        console.error("Resend OTP error:", error);
        res.status(500).json({ message: "Failed to resend OTP" });
    }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({
            message: "Email and OTP are required"
        });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            message: "Invalid email format"
        });
    }

    try {
        const storedOtpDataStr = await client.get(email);

        if (!storedOtpDataStr) {
            return res.status(400).json({ message: "No OTP found for this email" });
        }


        const storedOtpData = JSON.parse(storedOtpDataStr);

        // Check if OTP expired
        if (new Date() > storedOtpData.expiry) {
            // otpStorage.delete(email); // Clean up expired OTP
            return res.status(400).json({ message: "OTP expired" });
        }

        // Check attempt limit (optional security measure)
        if (storedOtpData.attempts >= 3) {
            otpStorage.delete(email); // Clean up after max attempts
            return res.status(400).json({ message: "Too many attempts. Please request a new OTP" });
        }

        // Verify OTP
        if (storedOtpData.otp !== otp) {
            storedOtpData.attempts++;
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // OTP verified successfully - clean up
        otpStorage.delete(email);

        res.status(200).json({
            message: "Email verified successfully",
            verified: true
        });
    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({ message: "Verification failed" });
    }
});

export default router;