import { api } from "./api";

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
