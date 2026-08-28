import { api } from "./api";

const STREET_RE = /\b(st|street|ave|avenue|rd|road|blvd|dr|drive|ln|lane|way|ct|court|pl|place|hwy|highway|pkwy|terrace|circle|cir)\.?$/i;

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

export function launchFromUser(user) {
  const parsed = fromFormat(user?.location?.format_location);
  const city = String(user?.location?.city || "").trim() || parsed.city;
  const neighborhood = String(user?.location?.neighborhood || "").trim() || parsed.neighborhood || city;
  return {
    status: "launching",
    badge: "Launching",
    city,
    neighborhood,
    families: 0,
    nannies: 0,
    familyNeed: 8,
    nannyNeed: 3,
    activityMessage: neighborhood
      ? "Your neighborhood is launching"
      : "Searching nearby cities and neighborhoods...",
  };
}

export async function fetchLaunchStatus() {
  const { data } = await api.get("/neighborhood/status");
  return data;
}

export function famActivityMessage(launch, { goodFound, autoSent, mutual } = {}) {
  if (!launch || launch.status === "launching") {
    return launch?.activityMessage || "Your neighborhood is launching";
  }
  if (mutual) return "New mutual match";
  if (autoSent) return "Automatic match requests sent";
  if (goodFound) return "Good Matches found";
  return launch.activityMessage || "Matching is now active in your neighborhood";
}
