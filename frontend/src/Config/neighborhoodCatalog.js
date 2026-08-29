import { SITE_ORIGIN } from "../data/articlesMeta";

const row = ({ id, displayName, searchText, status = "active", sharePath = null, progress = null }) => ({
  id,
  displayName,
  searchText: searchText.toLowerCase(),
  status,
  sharePath,
  progress,
});

function catalogKey(displayName) {
  return String(displayName || "").trim().toLowerCase();
}

export function launchStatusToCatalogItem(status) {
  const {
    city,
    neighborhood,
    status: launchStatus,
    families,
    nannies,
    familyNeed,
    nannyNeed,
  } = status;
  const isLaunching = launchStatus === "launching";
  const displayName =
    city && neighborhood && neighborhood !== city
      ? `${neighborhood}, ${city}`
      : neighborhood || city;
  const searchText = `${neighborhood || ""} ${city || ""}`.trim();

  return row({
    id: `${city}-${neighborhood}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    displayName,
    searchText,
    status: isLaunching ? "launching" : "active",
    progress: isLaunching
      ? {
          familiesHave: families ?? 0,
          familiesNeed: familyNeed ?? 8,
          nanniesHave: nannies ?? 0,
          nanniesNeed: nannyNeed ?? 3,
        }
      : null,
  });
}

/** Build the neighborhood list for one city's modal from live API data + cityGeo fallbacks. */
export function buildCityNeighborhoodCatalog(cityLabel, apiStatuses = [], neighborhoods = []) {
  const fromApi = (apiStatuses || []).map(launchStatusToCatalogItem);
  const seen = new Set(fromApi.map((item) => catalogKey(item.displayName)));

  const fromGeo = (neighborhoods || [])
    .map((name, index) => {
      const displayName = `${name}, ${cityLabel}`;
      if (seen.has(catalogKey(displayName)) || seen.has(catalogKey(name))) return null;
      return row({
        id: `${cityLabel}-${index}-${name}`,
        displayName,
        searchText: `${name} ${cityLabel}`,
        status: "active",
      });
    })
    .filter(Boolean);

  return [...fromApi, ...fromGeo].sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    return a.displayName.localeCompare(b.displayName);
  });
}

/** @deprecated Use buildCityNeighborhoodCatalog with API data instead. */
export function getCityNeighborhoodCatalog(cityLabel, neighborhoods = []) {
  return buildCityNeighborhoodCatalog(cityLabel, [], neighborhoods);
}

export function filterNeighborhoodCatalog(query, catalog) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return catalog;
  return catalog.filter((item) => item.searchText.includes(q));
}

/** Matches WaitlistShareModal — `/join/{sheetId}`, fallback `waitlist` when anonymous. */
export function neighborhoodInviteLink(sheetId) {
  const id = String(sheetId || "").trim() || "waitlist";
  return `${SITE_ORIGIN}/join/${encodeURIComponent(id)}`;
}

export function shareUrlFor(item, sheetId) {
  return neighborhoodInviteLink(sheetId ?? item?.sheetId);
}
