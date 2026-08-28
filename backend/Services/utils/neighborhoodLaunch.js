import User from "../../Schema/user.js";
import { escapeRegex } from "./adminAuth.js";

export const FAMILY_NEED = 8;
export const NANNY_NEED = 3;
const CITY_READY = 2;

const norm = (s) => String(s || "").trim();
const keyOf = (s) => norm(s).toLowerCase();
const ready = (h) => (h.families || 0) >= FAMILY_NEED && (h.nannies || 0) >= NANNY_NEED;

export async function getLaunchStatusForUser(user) {
  const city = norm(user?.location?.city);
  const neighborhood = norm(user?.location?.neighborhood) || city;
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
    .select("type location.neighborhood location.city")
    .lean();

  const byHood = {};
  for (const u of users) {
    const label = norm(u.location?.neighborhood) || norm(u.location?.city) || "Unknown";
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
