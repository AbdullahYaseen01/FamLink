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

export async function getStatusForNeighborhood(rawCity, rawNeighborhood) {
  const city = norm(rawCity);
  const neighborhood = norm(rawNeighborhood) || city;

  if (!city && !neighborhood) {
    return {
      status: "launching",
      city: "",
      neighborhood: "",
      families: 0,
      nannies: 0,
      familyNeed: FAMILY_NEED,
      nannyNeed: NANNY_NEED,
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

  return {
    status,
    city,
    neighborhood: mine.neighborhood || neighborhood,
    families: mine.families,
    nannies: mine.nannies,
    familyNeed: FAMILY_NEED,
    nannyNeed: NANNY_NEED,
  };
}

export async function getAllNeighborhoodStatuses({ city } = {}) {
  const cityNorm = norm(city);
  const query = { type: { $in: ["Parents", "Nanny"] } };
  if (cityNorm) {
    query["location.city"] = new RegExp(`^${escapeRegex(cityNorm)}$`, "i");
  }

  const users = await User.find(query)
    .select("type location.neighborhood location.city")
    .lean();

  const byCity = {};
  
  for (const u of users) {
    const rawCity = norm(u.location?.city);
    const rawHood = norm(u.location?.neighborhood);
    
    if (!rawCity && !rawHood) continue;

    const city = rawCity || rawHood;
    const hood = rawHood || city;
    const cityKey = keyOf(city);
    const hoodKey = keyOf(hood);

    if (!byCity[cityKey]) {
      byCity[cityKey] = { city, neighborhoods: {} };
    }
    
    if (!byCity[cityKey].neighborhoods[hoodKey]) {
      byCity[cityKey].neighborhoods[hoodKey] = { neighborhood: hood, families: 0, nannies: 0 };
    }
    
    if (u.type === "Parents") {
      byCity[cityKey].neighborhoods[hoodKey].families += 1;
    } else {
      byCity[cityKey].neighborhoods[hoodKey].nannies += 1;
    }
  }

  const results = [];
  
  for (const cityData of Object.values(byCity)) {
    const hoods = Object.values(cityData.neighborhoods);
    const cityActive = hoods.filter(ready).length >= CITY_READY;
    
    for (const hood of hoods) {
      const hoodReady = ready(hood);
      let status = "launching";
      if (cityActive) status = hoodReady ? "active" : "activeGrowing";
      else if (hoodReady) status = "active";
      
      const badge = status === "active" ? "Active" : status === "activeGrowing" ? "Active · Growing" : "Launching";
      
      results.push({
        status,
        badge,
        city: cityData.city,
        neighborhood: hood.neighborhood,
        families: hood.families,
        nannies: hood.nannies,
        familyNeed: FAMILY_NEED,
        nannyNeed: NANNY_NEED,
      });
    }
  }
  
  results.sort((a, b) => {
    if (a.status !== b.status) {
      if (a.status === "active") return -1;
      if (b.status === "active") return 1;
      if (a.status === "activeGrowing") return -1;
      if (b.status === "activeGrowing") return 1;
    }
    return (b.families + b.nannies) - (a.families + a.nannies);
  });
  
  return results;
}
