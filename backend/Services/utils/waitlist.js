import WaitlistEntry from "../../Schema/waitlistEntry.js";
import { isInsideLaunchRadius, cityFromLocation, zipFromLocation } from "./serviceArea.js";

// Capture layer for Schema/waitlistEntry.js.
//
// Called from the public funnels (waitlist form, onboarding-lead capture) and
// from registration. Everything that decides what a waitlist row looks like —
// which location fields are kept, how the launch-radius flag is resolved, what
// counts as consent — lives here so the three call sites can't drift apart,
// which is exactly how the frontend ended up with three copies of the zip list.

// Reduce whatever location shape the caller has into the coarse subset the
// waitlist stores. THE COORDINATES ARE DROPPED HERE, deliberately: this is the
// only lead collection that gets serialised back to a client, and the admin
// table shows a city, never a point. See the schema's comment.
const coarseLocation = (raw) => {
  if (!raw || typeof raw !== "object") {
    // A bare string still yields a zip and sometimes a city.
    const zip = zipFromLocation(raw) || "";
    return {
      city: "",
      region: "",
      neighborhood: "",
      zip,
      formatted: typeof raw === "string" ? raw.trim().slice(0, 300) : "",
    };
  }

  const formatted = String(raw.formatted || raw.format_location || "").trim();
  const city = String(raw.city || "").trim() || (cityFromLocation(raw) || "");

  // "1 Broadway, Oakland, CA 94607, USA" → "CA 94607" is second from the end.
  let region = String(raw.region || raw.state || "").trim();
  if (!region && formatted) {
    const parts = formatted.split(",").map((p) => p.trim());
    if (parts.length >= 2) region = parts[parts.length - 2].replace(/\s*\d{5}(-\d{4})?$/, "").trim();
  }

  return {
    // Title-cased for display; the filter lowercases both sides so casing here
    // never affects matching.
    city: city ? city.replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 100) : "",
    region: region.slice(0, 100),
    neighborhood: String(raw.neighborhood || "").trim().slice(0, 100),
    zip: zipFromLocation(raw) || "",
    formatted: formatted.slice(0, 300),
  };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Upsert one waitlist row. Idempotent on email.
 *
 * NEVER THROWS. Registration and the public capture endpoints call this as a
 * side-effect, and a bookkeeping failure must not fail someone's signup — the
 * admin console has a backfill that recovers anything missed.
 *
 * @returns {Promise<boolean>} whether a row was written
 */
export const recordWaitlistEntry = async ({
  email,
  name = "",
  userType = "unknown",
  location = null,
  source = "unknown",
  notifyConsent = false,
  userId = null,
  onboardingCompletedAt = null,
}) => {
  const address = String(email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(address)) return false;

  try {
    const coarse = coarseLocation(location);
    const now = new Date();

    // Fields that a later visit is allowed to improve. `$set` on a repeat visit
    // refreshes what they told us most recently.
    const set = {
      name: String(name || "").trim().slice(0, 200),
      location: coarse,
      insideLaunchRadius: isInsideLaunchRadius(location || coarse),
      updatedAt: now,
    };

    if (userType === "Parents" || userType === "Nanny") set.userType = userType;
    if (userId) set.userId = userId;

    // Consent is one-way here: ticking the box sets it, and NOT ticking it on a
    // later visit does not clear it. Withdrawing consent goes through
    // unsubscribe, which stamps `unsubscribedAt` and is checked separately —
    // so a second visit with the box unticked can't quietly re-subscribe or
    // un-subscribe anyone, and both states have an explicit provenance.
    if (notifyConsent === true) set.notifyConsent = true;

    await WaitlistEntry.updateOne(
      { email: address },
      {
        $set: set,
        $setOnInsert: {
          email: address,
          source,
          // When they actually finished the questions. Falls back to now for a
          // live capture; the backfill passes the real historical date.
          onboardingCompletedAt: onboardingCompletedAt || now,
          createdAt: now,
          launchNotifiedAt: null,
        },
      },
      { upsert: true }
    );

    return true;
  } catch (err) {
    // A duplicate-key race means the row this call wanted already exists, which
    // is the desired end state rather than a failure.
    if (err?.code === 11000) return true;
    console.error("recordWaitlistEntry failed:", err?.message || err);
    return false;
  }
};

// Everyone in a city who asked to be told about launch and hasn't been told.
//
// The three conditions are the whole contract of the launch email, so they live
// in one place rather than being retyped in the route: consented, not
// unsubscribed since, not already notified.
export const pendingLaunchRecipients = async (city, { limit = 5000 } = {}) => {
  const query = {
    notifyConsent: true,
    unsubscribedAt: null,
    launchNotifiedAt: null,
  };

  if (city) {
    // Anchored, case-insensitive exact match rather than a substring: "Oakland"
    // must not also select "West Oakland Heights" in a mail-everyone action.
    query["location.city"] = new RegExp(
      `^${String(city).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      "i"
    );
  }

  return WaitlistEntry.find(query)
    .select("email name userId location userType")
    .limit(limit)
    .lean();
};
