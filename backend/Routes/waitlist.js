import express from "express";
import { sendWaitlistConfirmationEmail } from "../Services/email/email.js";
import { recordWaitlistEntry } from "../Services/utils/waitlist.js";

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// This endpoint is public and mails whatever address it is handed, so it is
// throttled two ways: an address is only confirmed once per window (a double
// submit or a retry must not send a second copy), and one IP can only trigger a
// handful of sends. Kept in memory on purpose — the state is worth nothing, a
// restart just reopens the window, and the worst case is one duplicate email.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_IP = 10;

const sentTo = new Map(); // email -> timestamp
const ipHits = new Map(); // ip -> timestamp[]

const sweepExpired = (now) => {
  for (const [email, at] of sentTo) {
    if (now - at > WINDOW_MS) sentTo.delete(email);
  }
  for (const [ip, hits] of ipHits) {
    const recent = hits.filter((at) => now - at < WINDOW_MS);
    if (recent.length) ipHits.set(ip, recent);
    else ipHits.delete(ip);
  }
};

// POST /waitlist/confirmation  { email, name?, city? }
// Public (no auth) — this fires before the visitor has an account.
router.post("/confirmation", async (req, res) => {
  try {
    const { email, name, city, userType, location, notifyConsent } = req.body || {};

    const address = String(email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(address)) {
      return res
        .status(400)
        .json({ message: "A valid email address is required." });
    }

    // Record them on the waitlist BEFORE the throttle checks below.
    //
    // Ordering matters: the throttle exists to stop a second confirmation
    // EMAIL, not to stop a second capture. A visitor who submits twice, or
    // retries after a network blip, must still end up on the list — and
    // recordWaitlistEntry is an idempotent upsert keyed on the address, so
    // doing it every time costs nothing and losing someone from the waitlist
    // because their first submit was throttled would be silent.
    recordWaitlistEntry({
      email: String(email || "").trim().toLowerCase(),
      name,
      userType,
      location: location || (city ? { city } : null),
      source: "waitlist-form",
      // The form's "tell me when you launch here" checkbox. Only an explicit
      // true is consent.
      notifyConsent: notifyConsent === true,
    }).catch(() => {});

    const now = Date.now();
    sweepExpired(now);

    const ip = req.ip || "unknown";
    const hits = ipHits.get(ip) || [];
    if (hits.length >= MAX_PER_IP) {
      return res
        .status(429)
        .json({ message: "Too many waitlist requests. Try again later." });
    }

    // Already confirmed recently — report success without sending again.
    if (sentTo.has(address)) {
      return res
        .status(200)
        .json({ message: "Confirmation already sent.", sent: false });
    }

    // Claim the slot before awaiting the send, so two near-simultaneous submits
    // can't both get past the check above and each send a copy.
    sentTo.set(address, now);
    ipHits.set(ip, [...hits, now]);

    try {
      await sendWaitlistConfirmationEmail(address, name, city);
    } catch (error) {
      // Release the claim: a send that failed should be retryable rather than
      // locked out for an hour by our own throttle.
      sentTo.delete(address);
      throw error;
    }

    return res
      .status(200)
      .json({ message: "Waitlist confirmation sent.", sent: true });
  } catch (error) {
    console.error("Waitlist confirmation email failed:", error);
    return res.status(500).json({
      message: "Could not send the waitlist confirmation email.",
      error: error.message,
    });
  }
});

export default router;
