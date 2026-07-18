import ResourceLead from "../Schema/resourceLead.js";
import { sendResourceDownloadEmail } from "../Services/email/email.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Base URL used to build the absolute download link that goes in the email.
const APP_URL =
  process.env.APP_URL || process.env.CLIENT_URL || "https://www.famlink.care";

// Catalog of the downloadable lead magnets. Slug -> printable page path on the
// frontend + a human title for the email. Kept server-side so we only ever mail
// a link for a resource we actually recognise, and the email names it correctly.
const RESOURCES = {
  "nanny-share-agreement": {
    title: "Nanny Share Agreement Template",
    path: "/nanny-share-resources/nanny-share-agreement",
  },
  "payroll-tax-guide": {
    title: "Nanny Share Payroll & Tax Guide",
    path: "/nanny-share-resources/payroll-tax-guide",
  },
};

// Same rationale as Routes/waitlist.js: this endpoint is public and mails
// whatever address it is handed, so it is throttled in memory. An address only
// gets one copy per resource per window (a double-submit or retry must not send
// a second email), and one IP can only trigger a handful of sends. The state is
// disposable — a restart just reopens the window, worst case one duplicate mail.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_IP = 15;

const sentTo = new Map(); // `${email}|${resource}` -> timestamp
const ipHits = new Map(); // ip -> timestamp[]

const sweepExpired = (now) => {
  for (const [key, at] of sentTo) {
    if (now - at > WINDOW_MS) sentTo.delete(key);
  }
  for (const [ip, hits] of ipHits) {
    const recent = hits.filter((at) => now - at < WINDOW_MS);
    if (recent.length) ipHits.set(ip, recent);
    else ipHits.delete(ip);
  }
};

// POST /resource-leads/capture  { email, name?, neighborhood?, careTimeline?, resource }
// Public (no auth) — fires before the visitor has an account. Records the lead,
// emails the download link, and returns the link for immediate access.
export const captureResourceLead = async (req, res) => {
  try {
    const { email, name, neighborhood, careTimeline, resource } = req.body || {};

    const address = String(email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(address)) {
      return res
        .status(400)
        .json({ message: "A valid email address is required." });
    }

    const meta = RESOURCES[resource];
    if (!meta) {
      return res.status(400).json({ message: "Unknown resource requested." });
    }

    const downloadUrl = `${APP_URL}${meta.path}`;

    // Persist the lead. A DB failure must not block the download the visitor was
    // promised, so it is logged and we still hand back the link.
    try {
      await ResourceLead.create({
        email: address,
        name: String(name || "").trim(),
        neighborhood: String(neighborhood || "").trim(),
        careTimeline: String(careTimeline || "").trim(),
        resource,
      });
    } catch (err) {
      console.error("Resource lead save failed:", err);
    }

    // Mail the link — throttled per (email, resource) and per IP.
    const now = Date.now();
    sweepExpired(now);

    const ip = req.ip || "unknown";
    const hits = ipHits.get(ip) || [];
    const throttleKey = `${address}|${resource}`;

    if (hits.length < MAX_PER_IP && !sentTo.has(throttleKey)) {
      // Claim the slot before awaiting the send so two near-simultaneous submits
      // can't both get past the check and each send a copy.
      sentTo.set(throttleKey, now);
      ipHits.set(ip, [...hits, now]);
      try {
        await sendResourceDownloadEmail(address, name, {
          resourceTitle: meta.title,
          downloadUrl,
        });
      } catch (err) {
        // Release the claim so a failed send stays retryable rather than being
        // locked out for an hour by our own throttle.
        sentTo.delete(throttleKey);
        console.error("Resource download email failed:", err);
      }
    }

    // The download is always returned — the email is a courtesy copy, not the
    // gate. The visitor gave us their details; they get their resource.
    return res.status(200).json({
      message: "Your resource is ready.",
      resource,
      downloadUrl,
    });
  } catch (err) {
    console.error("captureResourceLead failed:", err);
    return res
      .status(500)
      .json({ message: "Could not process your request.", error: err.message });
  }
};
