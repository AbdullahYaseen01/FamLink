import express from "express";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";
import User from "../Schema/user.js";
import { sendWelcomeEmail, sendReferralRewardEmail } from "../Services/email/email.js";
import { creditReferrerForProfileCompletion } from "../Services/utils/referral.js";

const router = express.Router();

// Debug routes stay closed unless explicitly opened.
// - production: always requires a valid token + Admin type
// - non-production: open only when DEBUG_OPEN=true (otherwise auth + Admin)
const debugAuth = (req, res, next) => {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.DEBUG_OPEN === "true"
  ) {
    return next();
  }
  return authMiddleware(req, res, next);
};

const debugAllowed = (requester) => {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.DEBUG_OPEN === "true"
  ) {
    return true;
  }
  return requester?.type === "Admin";
};

// The referral-relevant slice of a user doc, for the inspector below.
const referralView = (u) =>
  u && {
    id: String(u._id),
    name: u.name,
    email: u.email,
    type: u.type,
    nannyProfileCompleted: u.nannyProfileCompleted,
    matchRequestsSent: u.matchRequestsSent,
    referralCode: u.referralCode || null,
    referredBy: u.referredBy ? String(u.referredBy) : null,
    referralCreditedAt: u.referralCreditedAt || null,
    referralCount: u.referralCount || 0,
    referralMatchingUntil: u.referralMatchingUntil || null,
    hasActiveMatching:
      Boolean(u.referralMatchingUntil) &&
      new Date(u.referralMatchingUntil).getTime() > Date.now(),
  };

// Inspect the whole referral chain for one account. Find it by ?email= or
// ?code= (their referralCode), else defaults to the caller. Shows the account,
// who referred them (if anyone), and everyone they've referred with each one's
// credited/pending state — so a "referral didn't pay out" can be pinpointed to
// either "friend was never linked" or "linked but not credited".
// Route: GET /debug/referral?email=friend@example.com
router.get("/referral", debugAuth, async (req, res) => {
  try {
    const requester = await User.findById(req.userId);
    if (!debugAllowed(requester)) {
      return res.status(403).json({ message: "Not available" });
    }

    const { email, code } = req.query;
    const query = email
      ? { email: String(email).trim() }
      : code
      ? { referralCode: String(code).trim().toUpperCase() }
      : { _id: req.userId };

    const account = await User.findOne(query).lean();
    if (!account) {
      return res.status(404).json({ message: "No account matched", query });
    }

    const referrer = account.referredBy
      ? await User.findById(account.referredBy).lean()
      : null;

    // People THIS account referred (i.e. the account is their referrer).
    const referred = await User.find({ referredBy: account._id })
      .select("name email nannyProfileCompleted referralCreditedAt createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      account: referralView(account),
      referredBy: referralView(referrer),
      referredByStatus: account.referredBy
        ? account.referralCreditedAt
          ? "linked & credited"
          : "linked, NOT yet credited"
        : "not linked to any referrer",
      referredFriends: referred.map((f) => ({
        name: f.name,
        email: f.email,
        nannyProfileCompleted: f.nannyProfileCompleted,
        credited: Boolean(f.referralCreditedAt),
        creditedAt: f.referralCreditedAt || null,
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: "debug referral failed", error: err.message });
  }
});

// Manually run the payout for a friend who was linked but never credited (e.g.
// their profile save predates the fix). Idempotent — the atomic claim means a
// friend who was already credited can't pay their referrer twice.
// Route: POST /debug/referral/recredit  body: { "email": "friend@example.com" }
router.post("/referral/recredit", debugAuth, async (req, res) => {
  try {
    const requester = await User.findById(req.userId);
    if (!debugAllowed(requester)) {
      return res.status(403).json({ message: "Not available" });
    }

    const email = String(req.body?.email || "").trim();
    if (!email) return res.status(400).json({ message: "email is required" });

    const friend = await User.findOne({ email }).lean();
    if (!friend) return res.status(404).json({ message: "No account with that email" });
    if (!friend.referredBy) {
      return res.status(400).json({
        message: "This account was never linked to a referrer, so there's nothing to credit",
        hint: "referredBy is null — the referral code didn't reach signup",
      });
    }

    const result = await creditReferrerForProfileCompletion(friend._id);
    if (!result) {
      return res.status(200).json({
        credited: false,
        message: "Already credited (or nothing to do) — no change made",
      });
    }

    const { referrer, referred } = result;
    sendReferralRewardEmail(referrer.email, referrer.name, {
      friendName: referred.name,
      monthsEarned: referrer.referralCount,
      matchingUntil: referrer.referralMatchingUntil,
    }).catch((e) => console.error("recredit email failed:", e));

    return res.status(200).json({
      credited: true,
      referrer: referralView(referrer),
      friend: { name: referred.name, email: referred.email },
    });
  } catch (err) {
    return res.status(500).json({ message: "recredit failed", error: err.message });
  }
});

// Admin-only: trigger a test email to verify the SMTP / OAuth2 setup end-to-end.
// Route: POST /debug/email-test
// Body (optional): { "email": "to@example.com", "name": "First" }
// Defaults to sending to the requesting admin's own email.
router.post("/email-test", authMiddleware, async (req, res) => {
    try {
        const requester = await User.findById(req.userId);

        if (!requester) {
            return res.status(401).json({ message: "Access denied" });
        }

        if (requester.type !== "Admin") {
            return res.status(403).json({ message: "Admin access required" });
        }

        const to = (req.body?.email || requester.email || "").trim();
        const name = req.body?.name || requester.name || "there";

        if (!to) {
            return res.status(400).json({ message: "No recipient email available" });
        }

        const info = await sendWelcomeEmail(to, name, requester);

        return res.status(200).json({
            ok: true,
            message: `Test email sent to ${to}`,
            response: info?.response,
            messageId: info?.messageId,
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            message: "Test email failed",
            error: err?.message || String(err),
        });
    }
});

export default router;
