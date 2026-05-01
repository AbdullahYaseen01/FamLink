import User from "../Schema/user.js";
import capitalizeUsername from "../Services/captalize.js";
import express from "express";
import "dotenv/config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { convertToSeconds } from "../Services/utils/convertToSec.js";
import { upload } from "../Services/utils/uploadMiddleware.js";
import { RefreshToken } from "../Schema/resfreshTokes.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";
import { sendWithLimit, sendOtpEmail } from "../Services/email/email.js";
const router = express.Router();
import uploadImage from "../Services/utils/uplaodImage.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your_refresh_token_secret_key";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10");

const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString(); // Generates a 4-digit OTP
};

export const generateTokens = async (userId, oldRefreshToken) => {
  const accessToken = jwt.sign(
    {
      userId,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );

  const refreshToken = jwt.sign(
    {
      userId,
    },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    }
  );

  const accessTokenExpiry =
    Math.floor(Date.now() / 1000) + convertToSeconds(JWT_EXPIRES_IN);
  const refreshTokenExpiry =
    Math.floor(Date.now() / 1000) + convertToSeconds(REFRESH_TOKEN_EXPIRES_IN);

  if (oldRefreshToken) {
    // Update the existing refresh token record
    await RefreshToken.findOneAndUpdate(
      {
        token: oldRefreshToken,
      },
      {
        token: refreshToken,
        expiry: new Date(refreshTokenExpiry * 1000),
      }
    );
  } else {
    // Create a new refresh token record
    const newToken = new RefreshToken({
      userId,
      token: refreshToken,
      expiry: new Date(refreshTokenExpiry * 1000),
    });
    await newToken.save();
  }

  return {
    accessToken,
    refreshToken,
    accessTokenExpiry,
    refreshTokenExpiry,
  };
};

router.post("/check-user", async (req, res) => {
  try {
    const existingUser = await User.findOne({
      email: req.body.email,
    });
    if (existingUser) {
      return res.status(400).send({
        status: 400,
        message: "Email already exists",
      });
    }

    return res.status(200).send({
      status: 200,
      message: "Email not exists",
    });
  } catch (err) {
    return res.status(500).send({
      status: 500,
      message: err.message,
    });
  }
});



router.post("/register", upload.any(), async (req, res) => {
  try {
    const { email, name, password, registeredVia, imageFile } = req.body;
    // console.log("Body", req.body)

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 400,
        message: "Email already exists",
      });
    }


    // Capitalize name
    const capitalizedName = capitalizeUsername(name);
    const imageUrl = ""


    if (registeredVia === "google") {
      const userData = {
        ...req.body,
        name: capitalizedName,
        verified: { emailVer: true },
        ActiveAt: new Date(),
      }

      // Clean location if it's invalid or not an object
      try {
        if (userData.location && typeof userData.location === "string") {
          userData.location = JSON.parse(userData.location);
        }

        if (!userData.location || typeof userData.location !== "object") {
          delete userData.location;
        }
      } catch (parseErr) {
        delete userData.location;
      }

      if (imageFile && imageFile.length > 0) {
        const base64Data = imageFile.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");

        const imgUrl = await uploadImage(buffer, userData.email, "new user");
        userData.imageUrl = imgUrl;
      }


      if (userData.imageUrl && imageUrl) {
        userData.imageUrl = imageUrl
      }

      // Create and save user
      const user = new User(userData);
      await user.save();

      // Optionally notify others only if 'type' is defined (Nanny or Parent)
      // if (user.type === "Nanny" || user.type === "Parents") {
      //   await notifyOppositeUsers(user);
      // }

      return res.status(200).json({
        status: 200,
        message: "User registered successfully",
      });
    }

    const userData = {
      ...req.body,
      name: capitalizedName,
      verified: false,
      ActiveAt: new Date(),
    };

    // Hash password only if provided
    if (password && typeof password === "string") {
      userData.password = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    }


    // Clean location if it's invalid or not an object
    try {
      if (userData.location && typeof userData.location === "string") {
        userData.location = JSON.parse(userData.location);
      }

      if (!userData.location || typeof userData.location !== "object") {
        delete userData.location;
      }
    } catch (parseErr) {
      delete userData.location;
    }

    if (imageFile && imageFile.length > 0) {
      const base64Data = imageFile.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");

      const imgUrl = await uploadImage(buffer, userData.email, "new user");
      userData.imageUrl = imgUrl;
    }


    if (userData.imageUrl && imageUrl) {
      userData.imageUrl = imageUrl
    }

    // Create and save user
    const user = new User(userData);
    await user.save();

    // Optionally notify others only if 'type' is defined (Nanny or Parent)
    // if (user.type === "Nanny" || user.type === "Parents") {
    //   notifyOppositeUsers(user);
    // }

    return res.status(200).json({
      status: 200,
      message: "User registered successfully",
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        status: 400,
        message: "Email already exists",
      });
    }

    return res.status(500).json({
      status: 500,
      message: err.message,
    });
  }
});


async function notifyOppositeUsers(newUser) {
  // Don't await, let it run in background
  (async () => {
    try {
      let oppositeType = newUser.type === "Nanny" ? "Parents" : "Nanny";

      // Fetch opposite type users who have enabled 'newSubInArea' notifications
      const usersToNotify = await User.find(
        { type: oppositeType, "notifications.email.newSubInArea": true },
        "email"
      );

      // Fetch all Admins (Admins always get notified)
      const adminsToNotify = await User.find({ type: "Admin" }, "email");

      // Email list for opposite users
      const userEmails = usersToNotify.map((user) => user.email);

      // Email list for admins
      const adminEmails = adminsToNotify.map((admin) => admin.email);

      // Email content for opposite users
      let subject, message;
      if (newUser.type === "Nanny") {
        subject = "🌟 A Wonderful Nanny Just Arrived!";
        message = `
       <div style="padding: 12px">
        <h2>Great News!</h2>
        <p>A professional and caring nanny named <b>${newUser.name
          }</b> has joined our platform. 
        If you're looking for a reliable nanny, now’s the time to check their profile and connect!</p>
        <br>
        <a href="https://www.famlink.care/login" style="padding: 10px 15px; background: #FDB913; color: white; text-decoration: none; border-radius: 5px;">View Nannies</a>
         <br><br>
      <p style="font-size: 14px; color: #555;">Need help? Contact us at <a href="mailto:${`info@famylink.us`}">${`info@famylink.us`}</a></p>
        </div>
      `;
      } else {
        subject = "🎉 A New Parent Needs a Nanny!";
        message = `
       <div style="padding: 12px">
        <h2>Exciting Opportunity!</h2>
        <p>A new parent named <b>${newUser.name}</b> is searching for a nanny. 
        If you're looking for a job, don't miss this chance to get in touch!</p>
        <br>
        <a href="https://www.famlink.care/login" style="padding: 10px 15px; background: #F98300; color: white; text-decoration: none; border-radius: 5px;">View Parents</a>
       <br><br>
      <p style="font-size: 14px; color: #555;">Need help? Contact us at <a href="mailto:${`info@famylink.us`}">${`info@famylink.us`}</a></p>
      </div>
      `;
      }

      // Email content for Admins
      const adminSubject = "📢 New User Registration";
      const adminMessage = `
    <div style="padding: 12px">
      <h2>New User Alert</h2>
      <p>A new user named <b>${newUser.name}</b> has registered as a <b>${newUser.type}</b>.</p>
      <br>
      <a href="https://admin.famylink.us/" style="padding: 10px 15px; background: #14558F; color: white; text-decoration: none; border-radius: 5px;">View Dashboard</a>
      </div>
    `;

      // Send emails to opposite users
      // await sendWithLimit(userEmails, subject, message);
      // userEmails.forEach(async (email) => await sendEmail(email, subject, message));
      await sendWithLimit(userEmails, subject, message);

      // Send simple notification to admins
      // await sendWithLimit(adminEmails, adminSubject, adminMessage);
      // adminEmails.forEach(async (email) =>
      //   await sendEmail(email, adminSubject, adminMessage)
      // );
      await sendWithLimit(adminEmails, adminSubject, adminMessage);

      console.log(
        `✅ Emails sent to ${userEmails.length} users and ${adminEmails.length} admins`
      );
    } catch (error) {
      console.error("❌ Error sending notifications:", error);
    }
  })();
}

router.post("/login", async (req, res) => {
  try {
    // Extract email and password from the request body
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({
      email,
    }).populate({
      path: "reviews.userId", // Populate the userId in reviews
      select: "name imageUrl", // Only fetch name and imageUrl fields for the reviewer
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.status === "Block") {
      return res.status(403).json({
        message: "Your account has been blocked. Please contact support.",
      });
    }

    // const isPasswordValid = await bcrypt.compare(password, user.password);
    // console.log("Password match:", isPasswordValid);

    const totalRating = user.reviews.reduce(
      (acc, review) => acc + review.rating,
      0
    );
    const averageRating =
      user.reviews.length > 0
        ? (totalRating / user.reviews.length).toFixed(1)
        : 0;

    if (user.registeredVia === "google") {
      // Generate tokens
      const { accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry } =
        await generateTokens(user._id.toString());

      const {
        online,
        ActiveAt,
        otp,
        otpExpiry,
        ...userDetails
      } = user.toJSON();

      userDetails.averageRating = averageRating;

      return res.status(200).json({
        user: userDetails,
        accessToken,
        refreshToken,
        accessTokenExpiry,
        refreshTokenExpiry,
      }); // ✅ Add return here to prevent falling through
    }

    if (!password) {
      return res.status(401).json({
        message: "Authetication Denied",
      })
    }

    // Verify if the provided password matches the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    // Generate tokens
    const { accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry } =
      await generateTokens(user._id.toString());

    // Exclude sensitive fields from the user object
    const {
      password: _password,
      online,
      ActiveAt,
      otp,
      otpExpiry,
      ...userDetails
    } = user.toJSON();

    // Send success response with user details and tokens
    userDetails.averageRating = averageRating;
    res.status(200).json({
      user: userDetails,
      accessToken,
      refreshToken,
      accessTokenExpiry,
      refreshTokenExpiry,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
});

router.post("/refreshToken", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Check if the refresh token is provided
    if (!refreshToken) {
      return res.status(400).json({
        message: "No token provided",
      });
    }

    // Check if the token exists and is not expired
    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
    });
    if (!storedToken || new Date(storedToken.expiry) < new Date()) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    // Verify the token
    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          message: "Invalid token",
        });
      }

      // Ensure decoded contains userId
      if (typeof decoded !== "string" && decoded.userId) {
        const userId = decoded.userId;

        // Generate new tokens
        const {
          accessToken,
          refreshToken: newRefreshToken,
          accessTokenExpiry,
          refreshTokenExpiry,
        } = await generateTokens(userId, refreshToken);

        const user = await User.findById(userId).populate({
          path: "reviews.userId", // Populate the userId in reviews
          select: "name imageUrl", // Only fetch name and imageUrl fields for the reviewer
        });
        if (!user) throw new Error("User not found");

        if (user.status === "Block") {
          return res.status(403).json({
            message: "Your account has been blocked. Please contact support.",
          });
        }
        const totalRating = user.reviews.reduce(
          (acc, review) => acc + review.rating,
          0
        );
        const averageRating =
          user.reviews.length > 0 ? totalRating / user.reviews.length : 0;

        // Exclude sensitive user information
        const {
          password: _password,
          online,
          ActiveAt,
          otp,
          otpExpiry,
          ...userDetails
        } = user.toJSON();

        userDetails.averageRating = averageRating.toFixed(1);
        // Respond with new tokens and user details
        return res.status(200).json({
          user: userDetails,
          accessToken,
          refreshToken: newRefreshToken,
          accessTokenExpiry,
          refreshTokenExpiry,
        });
      } else {
        return res.status(401).json({
          message: "Invalid token payload",
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/send-otp", authMiddleware, async (req, res) => {
  const id = req.userId;
  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verified.emailVer) {
      return res.status(404).json({ message: "User already varified" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 2 * 60 * 1000); // 15 minutes expiry

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    sendOtpEmail(user.email, otp);

    res.status(200).json({ message: "OTP sent to your email." });
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post("/verify-otp", authMiddleware, async (req, res) => {
  const id = req.userId;
  try {
    let user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { oneTimePass } = req.body;

    if (user.verified.emailVer) {
      return res.status(400).json({ message: "User already verified" });
    }

    if (user.otp !== oneTimePass) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Update user verification status and clear OTP fields
    user.verified.emailVer = true;
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
      message: "Email verified successfully",
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

router.post("/resend-otp", authMiddleware, async (req, res) => {
  const id = req.userId;
  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verified.emailVer) {
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

    sendOtpEmail(user.email, otp); // Send the OTP email

    res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Forgot Password API
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 2 * 60 * 1000); // OTP valid for 15 minutes

    // Set OTP and expiry time
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP to the user's email
    sendOtpEmail(user.email, otp);

    return res.status(200).json({ message: "OTP sent to your email." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Reset Password API
router.post("/reset-password", async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    // Find user with the OTP
    const user = await User.findOne({ otp });

    if (!user) {
      return res.status(404).json({ message: "Invalid OTP" });
    }

    // Check if OTP is expired
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // Update the user's password
    user.password = hashedPassword;
    user.otp = undefined; // Clear OTP after successful reset
    user.otpExpiry = undefined; // Clear OTP expiry time
    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Resend OTP API
router.post("/email-resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the existing OTP is still valid
    if (user.otpExpiry && new Date() < user.otpExpiry) {
      return res.status(400).json({
        message: "OTP is still valid, please wait before requesting a new one.",
      });
    }

    // Generate a new OTP and set a new expiry time
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 2 * 60 * 1000); // OTP valid for 2 minutes

    // Update OTP and expiry in the database
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Resend the OTP to the user's email
    sendOtpEmail(user.email, otp);

    return res.status(200).json({ message: "OTP resent to your email." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
