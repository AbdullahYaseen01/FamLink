import User from "../../Schema/user.js";
import AdminOverride from "../../Schema/adminOverride.js";
import { escapeRegex } from "./adminAuth.js";

export const FAMILY_NEED = 8;
export const NANNY_NEED = 3;
const CITY_READY = 2;

const norm = (s) => String(s || "").trim();
const keyOf = (s) => norm(s).toLowerCase();
const ready = (h) => (h.families || 0) >= FAMILY_NEED && (h.nannies || 0) >= NANNY_NEED;

export async function getLaunchStatusForUser(user) {
  const city = norm(user?.location?.city);
  const neighborhood = norm(user?.location?.neighborhoodDisplayName) || norm(user?.location?.neighborhood) || city;
  const tractGeoid = norm(user?.location?.tract_geoid);
  
  // Fetch dynamic Admin Overrides
  const activeOverrides = await AdminOverride.find({ isActive: true }).lean();
  const overrideCityKeys = activeOverrides.map(o => keyOf(o.city));

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

  // If this user's city or neighborhood has an Admin Override, they are automatically Active
  const hasAdminOverride = overrideCityKeys.includes(keyOf(city)) || overrideCityKeys.includes(keyOf(neighborhood));

  // Determine which field to query to find local users. We use tract_geoid if available, otherwise city.
  // The grouping is done at the city level anyway to check if the city is Active.
  const query = city ? { "location.city": new RegExp(`^${escapeRegex(city)}$`, "i") } : {};

  const users = await User.find({
    type: { $in: ["Parents", "Nanny"] },
    ...query,
  })
    .select("type location.neighborhood location.city location.tract_geoid location.neighborhoodDisplayName")
    .lean();

  const LaunchRequest = (await import("../../Schema/launchRequest.js")).default;
  const launchQuery = city ? { "city": new RegExp(`^${escapeRegex(city)}$`, "i") } : {};
  const launchRequests = await LaunchRequest.find(launchQuery)
    .select("accountType neighborhood city tract_geoid userId email")
    .lean();

  const byGeoid = {};
  const processedUserIds = new Set();
  const processedEmails = new Set();

  const processEntry = (uGeoid, uHoodName, type, id, email) => {
    if (id) {
      if (processedUserIds.has(String(id))) return;
      processedUserIds.add(String(id));
    }
    if (email) {
      if (processedEmails.has(email.toLowerCase())) return;
      processedEmails.add(email.toLowerCase());
    }

    if (!byGeoid[uGeoid]) byGeoid[uGeoid] = { neighborhood: uHoodName, families: 0, nannies: 0 };
    
    if (type === "Parents" || type === "Family") byGeoid[uGeoid].families += 1;
    else byGeoid[uGeoid].nannies += 1;
  };

  for (const u of users) {
    const uGeoid = norm(u.location?.tract_geoid) || keyOf(u.location?.neighborhood) || keyOf(u.location?.city);
    const uHoodName = norm(u.location?.neighborhoodDisplayName) || norm(u.location?.neighborhood) || norm(u.location?.city) || "Unknown";
    processEntry(uGeoid, uHoodName, u.type, u._id, u.email);
  }

  for (const r of launchRequests) {
    const uGeoid = norm(r.tract_geoid) || keyOf(r.neighborhood) || keyOf(r.city);
    const uHoodName = norm(r.neighborhood) || norm(r.city) || "Unknown";
    processEntry(uGeoid, uHoodName, r.accountType, r.userId, r.email);
  }

  // Find this user's specific block
  const myGeoidKey = tractGeoid || keyOf(neighborhood);
  const mine = byGeoid[myGeoidKey] || { neighborhood, families: 0, nannies: 0 };
  
  const cityActive = hasAdminOverride || Object.values(byGeoid).filter(ready).length >= CITY_READY;
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
    .select("type location.neighborhood location.city location.tract_geoid location.neighborhoodDisplayName")
    .lean();

  const LaunchRequest = (await import("../../Schema/launchRequest.js")).default;
  const launchRequests = await LaunchRequest.find()
    .select("accountType neighborhood city tract_geoid userId email")
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
  // Fetch Admin Overrides
  const activeOverrides = await AdminOverride.find({ isActive: true }).lean();
  const overrideCityKeys = activeOverrides.map(o => keyOf(o.city));

  const cityNorm = norm(city);
  const query = { type: { $in: ["Parents", "Nanny"] } };
  if (cityNorm) {
    query["location.city"] = new RegExp(`^${escapeRegex(cityNorm)}$`, "i");
  }

  const users = await User.find(query)
    .select("type location.neighborhood location.city location.tract_geoid location.neighborhoodDisplayName")
    .lean();

  const LaunchRequest = (await import("../../Schema/launchRequest.js")).default;
  const launchQuery = cityNorm ? { "city": new RegExp(`^${escapeRegex(cityNorm)}$`, "i") } : {};
  const launchRequests = await LaunchRequest.find(launchQuery)
    .select("accountType neighborhood city tract_geoid userId email")
    .lean();

  const byCity = {};
  const processedUserIds = new Set();
  const processedEmails = new Set();
  
  const processEntry = (rawCity, rawHoodName, tractGeoid, type, id, email) => {
    if (!rawCity && !rawHoodName && !tractGeoid) return;

    if (id) {
      if (processedUserIds.has(String(id))) return;
      processedUserIds.add(String(id));
    }
    if (email) {
      if (processedEmails.has(email.toLowerCase())) return;
      processedEmails.add(email.toLowerCase());
    }

    const city = rawCity || rawHoodName;
    const hoodName = rawHoodName || city;
    const cityKey = keyOf(city);
    
    // Grouping by tract_geoid ensures standardized clustering. If missing during migration, fallback to name.
    const hoodKey = tractGeoid || keyOf(hoodName);

    if (!byCity[cityKey]) {
      byCity[cityKey] = { city, neighborhoods: {} };
    }
    
    if (!byCity[cityKey].neighborhoods[hoodKey]) {
      byCity[cityKey].neighborhoods[hoodKey] = { neighborhood: hoodName, families: 0, nannies: 0 };
    }
    
    if (type === "Parents" || type === "Family") {
      byCity[cityKey].neighborhoods[hoodKey].families += 1;
    } else {
      byCity[cityKey].neighborhoods[hoodKey].nannies += 1;
    }
  };

  for (const u of users) {
    const rawCity = norm(u.location?.city);
    const rawHoodName = norm(u.location?.neighborhoodDisplayName) || norm(u.location?.neighborhood);
    const tractGeoid = norm(u.location?.tract_geoid);
    processEntry(rawCity, rawHoodName, tractGeoid, u.type, u._id, u.email);
  }

  for (const r of launchRequests) {
    const rawCity = norm(r.city);
    const rawHoodName = norm(r.neighborhood);
    const tractGeoid = norm(r.tract_geoid);
    processEntry(rawCity, rawHoodName, tractGeoid, r.accountType, r.userId, r.email);
  }

  const results = [];
  
  for (const [cityKey, cityData] of Object.entries(byCity)) {
    const hoods = Object.values(cityData.neighborhoods);
    
    // City is active if it has Admin Override OR >= 2 ready neighborhoods
    const cityHasAdminOverride = overrideCityKeys.includes(cityKey);
    const cityActive = cityHasAdminOverride || hoods.filter(ready).length >= CITY_READY;
    
    for (const hood of hoods) {
      const hoodReady = ready(hood);
      const hoodHasAdminOverride = overrideCityKeys.includes(keyOf(hood.neighborhood));
      
      let status = "launching";
      if (cityActive || hoodHasAdminOverride) status = (hoodReady || hoodHasAdminOverride) ? "active" : "activeGrowing";
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
