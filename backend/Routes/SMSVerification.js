import express from "express"
import { authMiddleware } from "../Services/utils/middlewareAuth.js";
import User from "../Schema/user.js";
import { sendOtpSMS } from "../Services/sms/sms.js";
import { generateTokens } from "./Auth.js";

const router = express.Router();

const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString(); // Generates a 4-digit OTP
};

router.post("/send-otp", authMiddleware, async (req, res) => {
    const id = req.userId;
    const { phoneNo } = req.body
    if (!phoneNo) {
        res.status(500).json({
            message: "Failed to find a phone number"
        })
    }
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.verified?.phoneVer) {
            return res.status(404).json({ message: "User already varified" });
        }
        const existingUser = await User.find({
            _id: { $ne: id }, // exclude self
            phoneNo: phoneNo,
            "verified.phoneVer": true
        })
        if (existingUser.length > 0) {
            return res.status(404).json({ message: "Verified phone number already exist" });
        }
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 2 * 60 * 1000); // 15 minutes expiry

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();
        console.log(`[SMS OTP] Phone: ${phoneNo}, OTP: ${otp}`); // For debugging
        try {
            await sendOtpSMS(phoneNo, otp);
        } catch (smsError) {
            console.error("SMS Service Error:", smsError.message);
        }
        res.status(200).json({ message: "OTP sent successfully." });
    } catch (error) {
        res.status(500).json(error);
    }
})

// Resend OTP API
router.post("/resend-otp", authMiddleware, async (req, res) => {
    const id = req.userId;
    const { phoneNo } = req.body
    if (!phoneNo) {
        res.status(500).json({
            message: "Failed to find a phone number"
        })
    }
    try {
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.verified?.phoneVer) {
            return res.status(400).json({ message: "User already verified" });
        }

        // Check if current time is greater than otpExpiry
        if (user.otpExpiry && new Date() < user.otpExpiry) {
            return res.status(400).json({
                message: "OTP is still valid, please wait before requesting a new one.",
            });
        }

        // Generate a new OTP
        const otp = generateOTP();
        user.otp = otp; // Set the new OTP
        user.otpExpiry = new Date(Date.now() + 2 * 60 * 1000); // Set OTP expiry time to 2 minutes

        await user.save(); // Save the updated user document

        console.log(`[SMS OTP Resend] Phone: ${phoneNo}, OTP: ${otp}`);
        try {
            await sendOtpSMS(phoneNo, otp);
        } catch (smsError) {
            console.error("SMS Service Error:", smsError.message);
        }
        res.status(200).json({ message: "OTP resent successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.post("/verify-otp", authMiddleware, async (req, res) => {
    const id = req.userId;
    try {
        let user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { oneTimePass, phoneNo } = req.body;

        if (!phoneNo) {
            res.status(500).json({
                message: "Failed to find a phone number"
            })
        }

        if (user.verified?.phoneVer) {
            return res.status(400).json({ message: "User already verified" });
        }

        if (user.otp !== oneTimePass) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (new Date() > user.otpExpiry) {
            return res.status(400).json({ message: "OTP expired" });
        }

        // Update user verification status and clear OTP fields
        user.verified.phoneVer = true;
        user.phoneNo = phoneNo;
        user.otp = undefined;
        user.otpExpiry = undefined;

        console.log("Updated User:", user);

        await user.save()
            .then(() => console.log('User updated successfully'))
            .catch(err => console.error('Error saving user:', err)); // Save the updated user document

        // Generate tokens
        const { accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry } =
            await generateTokens(user._id.toString());

        const {
            password: _password,
            online,
            ActiveAt,
            otp,
            otpExpiry,
            ...userDetails
        } = user.toObject();

        // Return successful response
        return res.status(200).json({
            message: "Phone number verified successfully",
            user: userDetails,
            accessToken,
            refreshToken,
            accessTokenExpiry,
            refreshTokenExpiry,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

export default router;