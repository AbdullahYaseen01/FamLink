import express from "express";
import User from "../Schema/user.js";
import OnboardingLead from "../Schema/onboardingLead.js";
import WaitlistEntry from "../Schema/waitlistEntry.js";
import {
  signUnsubscribe,
  verifyUnsubscribe,
} from "../Services/utils/unsubscribeToken.js";
import { sendEmail } from "../Services/email/email.js";

const router = express.Router();

const APP_URL =
  process.env.APP_URL || process.env.CLIENT_URL || "https://famlink.care";

// Every email category the footer link switches off. One link, both
// categories — someone clicking Unsubscribe means all of it, not the one
// category the email they happened to be reading belongs to.
const ALL_OFF = {
  platformUpdates: false,
  newsletter: false,
};

// POST /unsubscribe  { email, token }
// Public (no auth) — the HMAC in the link is the credential.
router.post("/", async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res
        .status(400)
        .json({ message: "This unsubscribe link is incomplete." });
    }

    if (!verifyUnsubscribe(email, token)) {
      return res
        .status(400)
        .json({ message: "This unsubscribe link is invalid." });
    }

    const user = await User.findOne({ email });

    // Don't leak whether the address has an account — report success either way.
    if (user) {
      user.notifications = user.notifications || {};
      user.notifications.email = { ...ALL_OFF };
      user.markModified("notifications.email");
      await user.save();
    }

    // An address can also be on the list without an account: someone who
    // answered the intake questions and never signed up gets email 20, whose
    // footer carries this same link. They have no notifications.email.* flags
    // to switch off, so the opt-out is recorded on the lead instead — without
    // it, clicking Unsubscribe on the only email they've had from us would
    // silently do nothing.
    //
    // The waitlist row is stamped for the same reason: it is the row the launch
    // email is sent from, and `unsubscribedAt` there is the only thing that can
    // withdraw a consent given on the form. The schema always had the field and
    // nothing ever wrote it, so an address with no account stayed consented on
    // the waitlist however many times they unsubscribed.
    //
    // ONLY when there is no account. A member's two flags above already say No,
    // and they are the flags Settings writes — stamping the waitlist row as
    // well would leave a permanent override, so a member who later switched the
    // newsletter back on would still be excluded and nothing on the Settings
    // screen would explain why.
    const address = String(email).trim().toLowerCase();
    const now = new Date();

    try {
      await Promise.all([
        OnboardingLead.updateOne(
          { email: address, unsubscribedAt: null },
          { $set: { unsubscribedAt: now } }
        ),
        ...(user
          ? []
          : [
              WaitlistEntry.updateOne(
                { email: address, unsubscribedAt: null },
                { $set: { unsubscribedAt: now, updatedAt: now } }
              ),
            ]),
      ]);
    } catch (err) {
      // The user-side opt-out above already succeeded (or there was no user);
      // don't turn a lead-bookkeeping failure into a failed unsubscribe.
      console.error("Lead unsubscribe failed:", err?.message || err);
    }

    return res.status(200).json({
      message: "You've been unsubscribed from FamLink emails.",
      email,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// POST /unsubscribe/request  { email }
// Used when someone opens /unsubscribe without a signed token — e.g. from a
// campaign-app send, where the link can't carry our HMAC. We email them the
// signed one-click link rather than unsubscribing on the spot, so nobody can
// unsubscribe an address they don't control. Always responds the same way, so
// the endpoint can't be used to discover which addresses have accounts.
router.post("/request", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const generic = {
      message:
        "If that address is on our list, we've just emailed it an unsubscribe link.",
    };

    const user = await User.findOne({ email });
    if (!user) return res.status(200).json(generic);

    const url = `${APP_URL}/unsubscribe?email=${encodeURIComponent(
      user.email
    )}&token=${signUnsubscribe(user.email)}`;

    sendEmail(
      user.email,
      "Confirm your FamLink unsubscribe",
      `<div style="font-family: Arial, sans-serif; font-size: 15px; color: #374151; line-height: 1.7;">
         <p>You asked to stop receiving FamLink emails.</p>
         <p><a href="${url}" style="color:#001243;font-weight:700;">Click here to confirm and unsubscribe</a></p>
         <p style="color:#9CA3AF;font-size:13px;">If you didn't request this, you can ignore this email — nothing has changed.</p>
       </div>`
    );

    return res.status(200).json(generic);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

export default router;
