import User from "../Schema/user.js";
import capitalizeUsername from "../Services/captalize.js";
import express from "express";
import "dotenv/config";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { convertToSeconds } from "../Services/utils/convertToSec.js";
import { upload } from "../Services/utils/uploadMiddleware.js";
import { RefreshToken } from "../Schema/resfreshTokes.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";
import { sendWithLimit, sendOtpEmail, sendWelcomeEmail, sendPasswordResetEmail } from "../Services/email/email.js";
import {
  assignReferralCode,
  findReferrerByCode,
  REFERRAL_PROTECTED_FIELDS,
} from "../Services/utils/referral.js";
import { retireOnboardingLead } from "../Controllers/onboardingLead.controller.js";
import { recordWaitlistEntry } from "../Services/utils/waitlist.js";
import { rateLimit } from "../Services/utils/rateLimit.js";
const router = express.Router();

/* ─────────────────────── auth abuse ceilings ─────────────────────────────── */
// Public auth endpoints are the classic brute-force / OTP-spam surface. Limits
// are per IP (see rateLimit.js). Authenticated OTP routes are still limited so
// a stolen token can't burn the mail budget.
const loginLimit = rateLimit({
  name: "auth-login",
  // Generous ceiling: stops credential stuffing without locking out a family
  // that mistypes a few times — or an office NAT that shares one Fly-Client-IP.
  limit: 40,
  windowSec: 15 * 60,
  message: "Too many login attempts. Please try again in a few minutes.",
});
const registerLimit = rateLimit({
  name: "auth-register",
  limit: 8,
  windowSec: 60 * 60,
  message: "Too many registration attempts. Please try again later.",
});
const otpLimit = rateLimit({
  name: "auth-otp",
  limit: 8,
  windowSec: 15 * 60,
  message: "Too many OTP requests. Please try again shortly.",
});
const passwordResetLimit = rateLimit({
  name: "auth-password-reset",
  limit: 8,
  windowSec: 15 * 60,
  message: "Too many password-reset attempts. Please try again shortly.",
});
const refreshLimit = rateLimit({
  name: "auth-refresh",
  limit: 60,
  windowSec: 15 * 60,
  message: "Too many token refresh attempts. Please try again shortly.",
});
const checkUserLimit = rateLimit({
  name: "auth-check-user",
  limit: 30,
  windowSec: 15 * 60,
  message: "Too many requests. Please try again shortly.",
});

/* ─────────────────────── light input gates (auth only) ───────────────────── */
// Narrow checks that reject obvious garbage without changing Google / sheet
// login semantics. Password rules only apply when a password is actually used.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeEmail = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";
const isValidEmail = (email) =>
  Boolean(email) && email.length <= 254 && EMAIL_RE.test(email);
const isValidPassword = (password) =>
  typeof password === "string" &&
  password.length >= 6 &&
  password.length <= 128;

// Prefer exact match (how accounts were stored pre-SEO), then a case-insensitive
// collation fallback for legacy mixed-case rows. Avoid $regex as the primary
// path — it is slower and has bitten lookups on indexed email fields.
const findUserByEmail = async (email, populateReviews = false) => {
  const withReviews = (query) =>
    populateReviews
      ? query.populate({
          path: "reviews.userId",
          select: "name imageUrl",
        })
      : query;

  let user = await withReviews(User.findOne({ email }));
  if (user) return user;

  // strength: 2 → case-insensitive, accent-sensitive
  user = await withReviews(
    User.findOne({ email }).collation({ locale: "en", strength: 2 })
  );
  return user;
};


/* ─────────────────────── account state at sign-in ───────────────────────── */

// Whether this account may sign in, and what to tell them if not.
//
// Extracted into one function because the login handler has two branches
// (Google and password) and the OTP-verification path is a third way in. The
// status check used to live only in the first of those, which meant a blocked
// account could still get a token through the others.
//
// Returns null when sign-in is allowed, or { status, message } to send back.
// MUTATES nothing except an expired suspension, which it lifts — see below.
const accountGate = async (user) => {
  if (user.status === "Deleted") {
    // Deliberately the same message a nonexistent account gets. Confirming
    // that a deleted address once had an account is information nobody signing
    // in needs, and it is exactly what someone probing for a person's
    // membership would be looking for.
    return { status: 404, message: "User not found" };
  }

  if (user.status === "Block") {
    return {
      status: 403,
      message: "Your account has been blocked. Please contact support.",
    };
  }

  if (user.status === "Suspended") {
    // A suspension that has run out lifts itself here, on the next sign-in
    // attempt. No cron, no scheduled job: the only moment the answer matters is
    // when someone tries to log in, so that is where it is computed. A nightly
    // job would leave a user locked out for up to a day after their suspension
    // ended, and would be one more thing that can silently stop running.
    if (user.suspendedUntil && new Date(user.suspendedUntil) <= new Date()) {
      await User.updateOne(
        { _id: user._id },
        { $set: { status: "Active", suspendedUntil: null, suspendedAt: null, moderationReason: null } }
      );
      user.status = "Active";
      return null;
    }

    const until = user.suspendedUntil
      ? new Date(user.suspendedUntil).toLocaleDateString("en-US", {
          month: "long", day: "numeric", year: "numeric",
        })
      : null;

    return {
      status: 403,
      // The reason is never quoted — `moderationReason` is the moderator's own
      // wording and can identify whoever reported them.
      message: until
        ? `Your account is suspended until ${until}. Please contact support if you think this is a mistake.`
        : "Your account is suspended. Please contact support.",
    };
  }

  return null;
};

// Put a newly registered member on the waitlist record.
//
// The waitlist is "everyone who completed onboarding", which includes people
// who went on to create an account — they are the converted rows, and without
// this the admin screen would only ever show the ones who dropped out. Called
// from both registration branches.
//
// Fire-and-forget. recordWaitlistEntry swallows its own errors, and the console
// has a backfill that recovers anything a failure here misses; neither is worth
// failing a signup over.
const captureWaitlist = (user, body = {}) => {
  recordWaitlistEntry({
    email: user.email,
    name: user.name,
    userType: user.type,
    location: { ...(user.location?.toObject?.() ?? user.location), zip: user.zipCode },
    source: "registration",
    // Only an explicit true counts. A registration form that doesn't ask the
    // question yet must not be read as consent to a marketing email.
    notifyConsent: body?.notifyConsent === true || body?.emailNotifications === true,
    userId: user._id,
    onboardingCompletedAt: user.createdAt || new Date(),
  }).catch(() => {});
};

// Record a successful sign-in: timestamp, lifetime count, and distinct active
// days.
//
// `activeDays` only increments when the previous login was on an EARLIER
// calendar day, so someone who signs in six times on Monday counts as one
// active day rather than six — which is the difference between "engaged" and
// "having trouble staying signed in".
//
// Fire-and-forget, as the previous lastLogin write was: bookkeeping must not
// be able to fail a login.
const recordLogin = (user) => {
  const now = new Date();
  const previous = user.lastLogin ? new Date(user.lastLogin) : null;
  const isNewDay =
    !previous || previous.toDateString() !== now.toDateString();

  User.updateOne(
    { _id: user._id },
    {
      $set: { lastLogin: now },
      $inc: { loginCount: 1, ...(isNewDay ? { activeDays: 1 } : {}) },
    }
  ).catch((err) => console.error("Failed to record login:", err?.message || err));
};

// Base URL of the front-end, used to build the password-reset link.
const CLIENT_URL =
  process.env.CLIENT_URL ||
  process.env.FRONTEND_URL ||
  process.env.APP_URL ||
  "https://famlink.care";
import uploadImage from "../Services/utils/uplaodImage.js";
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10");

if (!JWT_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error("JWT_SECRET and REFRESH_TOKEN_SECRET are required");
}

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

router.post("/check-user", checkUserLimit, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!isValidEmail(email)) {
      return res.status(400).send({
        status: 400,
        message: "A valid email is required",
      });
    }

    const existingUser = await findUserByEmail(email);
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



// Registration spreads req.body straight into the new user document, so the
// referral fields have to be stripped before that happens — otherwise a client
// could sign up already holding a chosen code, a forged referredBy, or a
// referralMatchingUntil far in the future, and walk straight past the gate.
// The code the signup link carried arrives separately as `referredByCode`.
const stripReferralFields = (userData) => {
  for (const field of REFERRAL_PROTECTED_FIELDS) delete userData[field];
  delete userData.referredByCode;
  return userData;
};

// Mint this account's own share code and record who referred it. Nothing is
// paid out here — the referrer's free month is granted once this user finishes
// their profile (see creditReferrerForProfileCompletion, called from
// nanny.controller.js), so a throwaway signup earns nobody anything.
//
// Deliberately non-fatal: a bad or unknown code must never fail a registration,
// so every failure path here just leaves the user un-referred.
const applyReferral = async (user, referredByCode) => {
  try {
    await assignReferralCode(user._id);

    if (!referredByCode) {
      console.log(`[referral] ${user._id} signed up with no referral code`);
      return;
    }

    const referrer = await findReferrerByCode(referredByCode);
    // Self-referral would let anyone mint themselves a month with a second
    // email; there's no defence against that beyond the email uniqueness we
    // already have, but the trivial version — pasting your own code — is free
    // to block.
    if (!referrer) {
      console.log(`[referral] ${user._id} signed up with unknown code "${referredByCode}"`);
      return;
    }
    if (String(referrer._id) === String(user._id)) {
      console.log(`[referral] ${user._id} tried to self-refer — ignored`);
      return;
    }

    await User.updateOne({ _id: user._id }, { $set: { referredBy: referrer._id } });
    console.log(
      `[referral] linked ${user._id} → referrer ${referrer._id} (code "${referredByCode}"); payout pending profile save`
    );
  } catch (err) {
    console.error("Failed to apply referral:", err?.message || err);
  }
};

router.post("/register", registerLimit, upload.any(), async (req, res) => {
  try {
    const { name, password, registeredVia, imageFile, referredByCode } = req.body;
    const email = normalizeEmail(req.body?.email);

    if (!isValidEmail(email)) {
      return res.status(400).json({
        status: 400,
        message: "A valid email is required",
      });
    }

    // Password accounts need a usable password. Google sign-up does not.
    if (registeredVia !== "google" && !isValidPassword(password)) {
      return res.status(400).json({
        status: 400,
        message: "Password must be between 6 and 128 characters",
      });
    }

    // Check if email already exists (case-insensitive for legacy rows)
    const existingUser = await findUserByEmail(email);
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
      const userData = stripReferralFields({
        ...req.body,
        email,
        name: capitalizedName,
        verified: { emailVer: true },
        ActiveAt: new Date(),
      })

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

      // Mint this user's own share code and pay out whoever referred them.
      await applyReferral(user, referredByCode);

      // They converted, so the half-finished-signup nudge (email 20) must never
      // reach them. Fire-and-forget: it swallows its own errors, and this is
      // bookkeeping that must not add latency to a signup.
      retireOnboardingLead(user.email);
      captureWaitlist(user, req.body);

      // Send the welcome email (non-blocking — don't fail registration on email errors)
      sendWelcomeEmail(user.email, user.name, user).catch((err) =>
        console.error("Failed to send welcome email:", err)
      );

      return res.status(200).json({
        status: 200,
        message: "User registered successfully",
      });
    }

    const userData = stripReferralFields({
      ...req.body,
      email,
      name: capitalizedName,
      verified: false,
      ActiveAt: new Date(),
    });

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

    // Mint this user's own share code and pay out whoever referred them.
    await applyReferral(user, referredByCode);

    // Same as the Google branch: converting retires the abandoned-onboarding
    // lead so email 20 can never chase someone who already signed up.
    retireOnboardingLead(user.email);
    captureWaitlist(user, req.body);

    // Welcome email for email/password signups. This used to live only in the
    // Google branch above and in the Mongo-backed /verify-otp route, which the
    // frontend never calls — it verifies through /email-verification/verify-otp
    // instead. The result was that only Google users ever got a welcome email.
    //
    // It is sent on account creation and deliberately NOT gated on email
    // verification: the address exists, so we greet them like any real service
    // would. Non-blocking, so a mail failure can never fail a registration.
    sendWelcomeEmail(user.email, user.name, user).catch((err) =>
      console.error("Failed to send welcome email:", err)
    );

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

      // Fetch opposite type users who still take platform updates
      const usersToNotify = await User.find(
        { type: oppositeType, "notifications.email.platformUpdates": { $ne: false } },
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
        <a href="https://famlink.care/login" style="padding: 10px 15px; background: #FDB913; color: white; text-decoration: none; border-radius: 5px;">View Nannies</a>
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
        <a href="https://famlink.care/login" style="padding: 10px 15px; background: #F98300; color: white; text-decoration: none; border-radius: 5px;">View Parents</a>
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

router.post("/login", loginLimit, async (req, res) => {
  try {
    const password = req.body?.password;
    const email = normalizeEmail(req.body?.email);

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "A valid email is required",
      });
    }

    // Find the user by email (case-insensitive — does not lock out legacy rows)
    const user = await findUserByEmail(email, true);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Blocked, suspended or deleted. Covers both the Google and password
    // branches below, which is why it sits before either of them — the status
    // check previously only guarded one path.
    const gate = await accountGate(user);
    if (gate) return res.status(gate.status).json({ message: gate.message });

    // const isPasswordValid = await bcrypt.compare(password, user.password);
    // console.log("Password match:", isPasswordValid);

    const reviews = Array.isArray(user.reviews) ? user.reviews : [];
    const totalRating = reviews.reduce(
      (acc, review) => acc + (Number(review?.rating) || 0),
      0
    );
    const averageRating =
      reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

    const viaGoogle =
      String(user.registeredVia || "").toLowerCase() === "google";

    if (viaGoogle) {
      // Generate tokens
      const { accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry } =
        await generateTokens(user._id.toString());

      // Activity bookkeeping: powers the re-engagement email and the console's
      // activity-frequency column (fire-and-forget).
      recordLogin(user);

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

    // Accounts without a password hash (e.g. Google-only) must not throw inside
    // bcrypt.compare — that surfaced as a generic 500 after the SEO merge.
    if (!user.password || typeof user.password !== "string") {
      return res.status(401).json({
        message: "Invalid password",
      });
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

    // Activity bookkeeping (fire-and-forget) — see recordLogin.
    recordLogin(user);

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
    console.error("Login error:", error?.message || error);
    res.status(500).json({
      message: "Server error",
    });
  }
});

router.post("/refreshToken", refreshLimit, async (req, res) => {
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

        // The same gate as sign-in. Without it, blocking or suspending someone
        // who is already signed in does nothing for up to seven days: they
        // never hit /login again, they just keep refreshing. This is what makes
        // a suspension take effect within the access-token lifetime rather than
        // whenever they next choose to log in.
        const gate = await accountGate(user);
        if (gate) return res.status(gate.status).json({ message: gate.message });

        // A refresh only succeeds within the 7-day refresh window, so treating
        // it as activity keeps lastLogin fresh for anyone still using the app —
        // which is what stops the re-engagement email reaching active users
        // who simply never log out. Fire-and-forget.
        //
        // Deliberately NOT recordLogin(): a token refresh is not a sign-in, and
        // counting it as one would inflate loginCount for anyone who leaves a
        // tab open and make the activity-frequency column meaningless.
        User.updateOne(
          { _id: user._id },
          { $set: { lastLogin: new Date() } }
        ).catch((err) =>
          console.error("Failed to update lastLogin:", err?.message || err)
        );

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

router.post("/send-otp", authMiddleware, otpLimit, async (req, res) => {
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

router.post("/verify-otp", authMiddleware, otpLimit, async (req, res) => {
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
    // Verifying logs the user in — seed lastLogin so a brand-new account has an
    // activity baseline for the re-engagement email even if it never refreshes.
    user.lastLogin = new Date();

    console.log("Updated User:", user);

    await user.save()
      .then(() => console.log('User updated successfully'))
      .catch(err => console.error('Error saving user:', err)); // Save the updated user document

    // Email is now verified — send the welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name, user).catch((err) =>
      console.error("Failed to send welcome email:", err)
    );

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

router.post("/resend-otp", authMiddleware, otpLimit, async (req, res) => {
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
router.post("/forgot-password", passwordResetLimit, async (req, res) => {
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
router.post("/reset-password", passwordResetLimit, async (req, res) => {
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
router.post("/email-resend-otp", otpLimit, async (req, res) => {
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

// ── Link-based password reset ────────────────────────────────────────────────
// Sends the branded reset email (template 10) with a one-time link that expires
// after 1 hour. Always responds 200 with a generic message so the endpoint can't
// be used to discover which emails have accounts.
router.post("/request-password-reset", passwordResetLimit, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const genericResponse = {
      message:
        "If an account exists for that email, a password reset link is on its way.",
    };

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Raw token goes only in the email link; we persist just its hash.
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${CLIENT_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(
      user.email
    )}`;
    const requestTime = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    // Non-blocking: don't reveal send failures to the caller.
    sendPasswordResetEmail(user.email, user.name, resetUrl, requestTime).catch(
      (err) => console.error("Failed to send password-reset email:", err)
    );

    return res.status(200).json(genericResponse);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Consume a reset link: verify the token hash + expiry, then set the new password.
router.post("/reset-password-token", passwordResetLimit, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and new password are required." });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "This reset link is invalid or has expired." });
    }

    user.password = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res
      .status(200)
      .json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

export default router;
