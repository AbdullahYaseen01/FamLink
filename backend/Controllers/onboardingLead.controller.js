import OnboardingLead from "../Schema/onboardingLead.js";
import { recordWaitlistEntry } from "../Services/utils/waitlist.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SOURCES = new Set(["family-match", "caregiver-job", "caregiver-share"]);

// Keep only the fields we know, and only when they look like what they claim.
// The body arrives from a public form, so a location is accepted as a shape,
// never as "whatever the client sent" spread into the document.
const cleanLocation = (raw) => {
  if (!raw || typeof raw !== "object") return undefined;

  const coords = Array.isArray(raw.coordinates)
    ? raw.coordinates.map(Number).slice(0, 2)
    : [];
  const hasCoords = coords.length === 2 && coords.every(Number.isFinite);

  const location = {
    format_location: String(raw.format_location || "").trim(),
    city: String(raw.city || "").trim(),
    neighborhood: String(raw.neighborhood || "").trim(),
    zip: String(raw.zip || "").trim(),
  };

  if (hasCoords) {
    // "Point" matters: without it the doc is not a GeoJSON point.
    location.type = "Point";
    location.coordinates = coords;
  }

  // A location with nothing printable and nothing to search on is not worth
  // storing — it would only produce an email with no city and no cards.
  const usable =
    hasCoords || location.city || location.neighborhood || location.format_location;
  return usable ? location : undefined;
};

// POST /onboarding-leads/capture
//   { email, name?, source?, sheetId?, location?, details? }
//
// Public (no auth) — the whole point is that it fires before there is an
// account. Records the half-finished signup so the nudge cron can find it a few
// hours later; sends nothing itself.
//
// One row per address: a visitor who submits the form twice is the same lead,
// and re-submitting must not earn them a second nudge. The upsert refreshes
// their answers and resume link but never re-arms `nudgeSentAt`, and
// `createdAt` stays at the first attempt so the send window is measured from
// when they actually dropped off.
export const captureOnboardingLead = async (req, res) => {
  try {
    const { email, name, source, sheetId, location, details } = req.body || {};

    const address = String(email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(address)) {
      return res
        .status(400)
        .json({ message: "A valid email address is required." });
    }

    const set = {
      name: String(name || "").trim(),
      source: SOURCES.has(source) ? source : "family-match",
      sheetId: String(sheetId || "").trim(),
      details: String(details || "").trim(),
    };

    const cleaned = cleanLocation(location);
    if (cleaned) set.location = cleaned;

    await OnboardingLead.updateOne(
      { email: address },
      {
        $set: set,
        $setOnInsert: {
          email: address,
          createdAt: new Date(),
          nudgeSentAt: null,
        },
      },
      { upsert: true }
    );

    // Mirror onto the waitlist record the admin console reads.
    //
    // Two collections rather than one because they answer different questions
    // and have different privacy rules: this one keeps exact coordinates and is
    // never serialised to a client, while the waitlist keeps only a city and is
    // read back by the console. See Schema/waitlistEntry.js.
    //
    // NOT opted in: this funnel shows no consent checkbox, so the person
    // appears on the waitlist but the launch-email action will skip them.
    recordWaitlistEntry({
      email: address,
      name: set.name,
      userType: set.source === "family-match" ? "Parents" : "Nanny",
      location: cleaned || null,
      source: set.source,
      notifyConsent: false,
    }).catch(() => {});

    return res.status(200).json({ message: "Saved." });
  } catch (err) {
    // A duplicate-key race (two submits landing at once) means the row this
    // call wanted already exists — that is the desired end state, not an error
    // the visitor should ever hear about.
    if (err?.code === 11000) {
      return res.status(200).json({ message: "Saved." });
    }
    console.error("captureOnboardingLead failed:", err);
    return res
      .status(500)
      .json({ message: "Could not save your answers.", error: err.message });
  }
};

// Called from the signup path: the address now has an account, so it must never
// be nudged. Stamping `nudgeSentAt` retires the lead through the same field the
// cron already filters on, so there is only one condition to get right.
//
// Never throws — this runs inside registration, and a bookkeeping failure here
// must not fail someone's signup. The cron re-checks against the users
// collection anyway, so a missed call costs nothing.
export const retireOnboardingLead = async (email) => {
  const address = String(email || "").trim().toLowerCase();
  if (!address) return;
  try {
    await OnboardingLead.updateOne(
      { email: address, nudgeSentAt: null },
      { $set: { nudgeSentAt: new Date() } }
    );
  } catch (err) {
    console.error("retireOnboardingLead failed:", err?.message || err);
  }
};
