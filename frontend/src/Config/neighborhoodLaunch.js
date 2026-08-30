import { api } from "./api";

export async function fetchLaunchStatus() {
  const { data } = await api.get("/neighborhood/status");
  return data;
}

export async function fetchAllLaunchStatuses() {
  const { data } = await api.get("/neighborhood/all-status");
  return data;
}

export async function fetchCityLaunchStatuses(city) {
  const { data } = await api.get("/neighborhood/all-status", { params: { city } });
  return data;
}

export async function resolveNeighborhood(city, neighborhood, zip) {
  const { data } = await api.post("/neighborhood/resolve", { city, neighborhood, zip });
  return data;
}

export async function joinNeighborhoodLaunch({ city, neighborhood, accountType, zip, formattedAddress }) {
  const { data } = await api.post("/neighborhood/join-launch", {
    city,
    neighborhood,
    accountType,
    zip,
    formattedAddress,
  });
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
