import User from "../../Schema/user.js";
import { escapeRegex } from "./adminAuth.js";

export const FAMILY_NEED = 8;
export const NANNY_NEED = 3;
const CITY_READY = 2;
const STREET_RE = /\b(st|street|ave|avenue|rd|road|blvd|dr|drive|ln|lane|way|ct|court|pl|place|hwy|highway|pkwy|terrace|circle|cir)\.?$/i;

const norm = (s) => String(s || "").trim();
const keyOf = (s) => norm(s).toLowerCase();
const ready = (h) => (h.families || 0) >= FAMILY_NEED && (h.nannies || 0) >= NANNY_NEED;

function fromFormat(formatted) {
  const parts = String(formatted || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return { city: "", neighborhood: "" };
  const stateIdx = parts.findIndex((p) => /^[A-Z]{2}(\s+\d{5}(-\d{4})?)?$/.test(p));
  if (stateIdx < 1) return { city: parts[parts.length - 2] || "", neighborhood: "" };
  const city = parts[stateIdx - 1];
  if (STREET_RE.test(city) || /^\d/.test(city)) return { city: "", neighborhood: "" };
  const finer = stateIdx >= 2 ? parts[stateIdx - 2] : "";
  const neighborhood =
    finer && !STREET_RE.test(finer) && !/^\d/.test(finer) ? finer : "";
  return { city, neighborhood };
}

function placeOf(user) {
  const parsed = fromFormat(user?.location?.format_location);
  const city = norm(user?.location?.city) || parsed.city;
  const neighborhood = norm(user?.location?.neighborhood) || parsed.neighborhood || city;
  return { city, neighborhood };
}

export async function getLaunchStatusForUser(user) {
  const { city, neighborhood } = placeOf(user);
  if (!city && !neighborhood) {
    return {
      status: "launching",
      badge: "Launching",
      city: "",
      neighborhood: "",
      families: 0,
      nannies: 0,
      familyNeed: FAMILY_NEED,
      nannyNeed: NANNY_NEED,
      activityMessage: "Searching nearby cities and neighborhoods...",
    };
  }

  const query = city
    ? { "location.city": new RegExp(`^${escapeRegex(city)}$`, "i") }
    : { "location.neighborhood": new RegExp(`^${escapeRegex(neighborhood)}$`, "i") };

  const users = await User.find({
    type: { $in: ["Parents", "Nanny"] },
    ...query,
  })
    .select("type location.neighborhood location.city location.format_location")
    .lean();

  const byHood = {};
  for (const u of users) {
    const loc = placeOf(u);
    const label = loc.neighborhood || loc.city || "Unknown";
    const k = keyOf(label);
    if (!byHood[k]) byHood[k] = { neighborhood: label, families: 0, nannies: 0 };
    if (u.type === "Parents") byHood[k].families += 1;
    else byHood[k].nannies += 1;
  }

  const mine = byHood[keyOf(neighborhood)] || { neighborhood, families: 0, nannies: 0 };
  const cityActive = Object.values(byHood).filter(ready).length >= CITY_READY;
  const hoodReady = ready(mine);
  let status = "launching";
  if (cityActive) status = hoodReady ? "active" : "activeGrowing";
  else if (hoodReady) status = "active";

  const badge = status === "active" ? "Active" : status === "activeGrowing" ? "Active · Growing" : "Launching";
  const activityMessage =
    status === "launching"
      ? (mine.families + mine.nannies > 0 ? "Your neighborhood is launching" : "Searching nearby cities and neighborhoods...")
      : "Matching is now active in your neighborhood";

  return {
    status,
    badge,
    city,
    neighborhood: mine.neighborhood || neighborhood,
    families: mine.families,
    nannies: mine.nannies,
    familyNeed: FAMILY_NEED,
    nannyNeed: NANNY_NEED,
    activityMessage,
  };
}
