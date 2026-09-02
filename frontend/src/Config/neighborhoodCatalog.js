import { SITE_ORIGIN } from "../data/articlesMeta";
import { CITY_PAGES, FOOTER_CITY_KEYS } from "./cityGeo";

const norm = (s) => String(s || "").trim().toLowerCase();

const row = ({
  id,
  neighborhood,
  city,
  displayName,
  searchText,
  status = "active",
  sharePath = null,
  families = 0,
  nannies = 0,
  familyNeed = 8,
  nannyNeed = 3,
  progress = null,
}) => ({
  id,
  neighborhood,
  city,
  displayName,
  searchText: searchText.toLowerCase(),
  status,
  sharePath,
  families,
  nannies,
  familyNeed,
  nannyNeed,
  progress,
});

function catalogKey(displayName) {
  return String(displayName || "").trim().toLowerCase();
}

function catalogStatusFromLaunch(launchStatus) {
  if (launchStatus === "launching") return "launching";
  if (launchStatus === "activeGrowing") return "activeGrowing";
  return "active";
}

function displayNameFor(city, neighborhood) {
  if (city && neighborhood && neighborhood !== city) {
    return `${neighborhood}, ${city}`;
  }
  return neighborhood || city || "";
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
  const pillStatus = catalogStatusFromLaunch(launchStatus);
  const isLaunching = pillStatus === "launching";
  const displayName = displayNameFor(city, neighborhood);
  const searchText = `${neighborhood || ""} ${city || ""}`.trim();

  return row({
    id: `${city}-${neighborhood}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    neighborhood: neighborhood || city,
    city,
    displayName,
    searchText,
    status: pillStatus,
    families: families ?? 0,
    nannies: nannies ?? 0,
    familyNeed: familyNeed ?? 8,
    nannyNeed: nannyNeed ?? 3,
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

function cityGeoNeighborhoodNames(cityKey, cityLabel) {
  const cityPage = CITY_PAGES.find((p) => p.key === cityKey);
  const fromList = (cityPage?.neighborhoods || []).map((name) => name.trim()).filter(Boolean);
  const fromChildren = CITY_PAGES.filter((p) => p.parent === cityKey)
    .map((p) => p.label)
    .filter(Boolean);
  const seen = new Set();
  const names = [];
  for (const name of [...fromList, ...fromChildren]) {
    const key = norm(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names.sort((a, b) => a.localeCompare(b));
}

function isCityActive(neighborhoods) {
  const activeCount = neighborhoods.filter(
    (n) => n.status === "active" || n.status === "activeGrowing"
  ).length;
  return activeCount >= 2;
}

/** Full cross-city catalog for the browse-all-neighborhoods modal. */
export function buildBrowseNeighborhoodCatalog(apiStatuses = [], { priorityCity } = {}) {
  const apiByCity = {};
  for (const entry of apiStatuses || []) {
    const cityKey = norm(entry.city);
    if (!apiByCity[cityKey]) apiByCity[cityKey] = [];
    apiByCity[cityKey].push(entry);
  }

  const cities = FOOTER_CITY_KEYS.map((cityKey) => {
    const cityPage = CITY_PAGES.find((p) => p.key === cityKey);
    const cityLabel = cityPage?.label || cityKey;
    const cityGeoStatus = cityPage?.status || "active";
    const apiForCity = apiByCity[norm(cityLabel)] || [];

    const merged = new Map();

    const addNeighborhood = (name, fromApi = null) => {
      const neighborhood = String(name || "").trim();
      if (!neighborhood) return;
      const hoodKey = norm(neighborhood);
      const apiMatch =
        fromApi ||
        apiForCity.find((e) => norm(e.neighborhood) === hoodKey || norm(e.city) === hoodKey);

      if (apiMatch) {
        const item = launchStatusToCatalogItem(apiMatch);
        merged.set(hoodKey, item);
        return;
      }

      if (merged.has(hoodKey)) return;

      const defaultStatus = cityGeoStatus === "active" ? "active" : "launching";
      const displayName = displayNameFor(cityLabel, neighborhood);
      merged.set(
        hoodKey,
        row({
          id: `${cityKey}-${hoodKey}`.replace(/[^a-z0-9]+/g, "-"),
          neighborhood,
          city: cityLabel,
          displayName,
          searchText: `${neighborhood} ${cityLabel}`,
          status: defaultStatus,
          families: 0,
          nannies: 0,
          familyNeed: 8,
          nannyNeed: 3,
          progress:
            defaultStatus === "launching"
              ? { familiesHave: 0, familiesNeed: 8, nanniesHave: 0, nanniesNeed: 3 }
              : null,
        })
      );
    };

    for (const name of cityGeoNeighborhoodNames(cityKey, cityLabel)) {
      addNeighborhood(name);
    }
    for (const apiEntry of apiForCity) {
      addNeighborhood(apiEntry.neighborhood || apiEntry.city, apiEntry);
    }

    const neighborhoods = Array.from(merged.values()).sort((a, b) =>
      a.neighborhood.localeCompare(b.neighborhood)
    );

    const activeNeighborhoods = neighborhoods.filter(
      (n) => n.status === "active" || n.status === "activeGrowing"
    );
    const launchingNeighborhoods = neighborhoods.filter((n) => n.status === "launching");

    return {
      cityKey,
      city: cityLabel,
      isActive: isCityActive(neighborhoods),
      activeNeighborhoods,
      launchingNeighborhoods,
      searchText: `${cityLabel} ${neighborhoods.map((n) => n.neighborhood).join(" ")}`.toLowerCase(),
    };
  }).filter((c) => c.activeNeighborhoods.length > 0 || c.launchingNeighborhoods.length > 0);

  const priority = norm(priorityCity);
  if (priority) {
    cities.sort((a, b) => {
      const aMatch = norm(a.city) === priority || a.cityKey === priority;
      const bMatch = norm(b.city) === priority || b.cityKey === priority;
      if (aMatch && !bMatch) return -1;
      if (bMatch && !aMatch) return 1;
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return a.city.localeCompare(b.city);
    });
  } else {
    cities.sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return a.city.localeCompare(b.city);
    });
  }

  return cities;
}

export function filterBrowseNeighborhoodCatalog(query, cities) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return cities;

  return cities
    .map((citySection) => {
      const cityMatches = citySection.searchText.includes(q) || norm(citySection.city).includes(q);
      const activeNeighborhoods = citySection.activeNeighborhoods.filter(
        (n) => cityMatches || n.searchText.includes(q)
      );
      const launchingNeighborhoods = citySection.launchingNeighborhoods.filter(
        (n) => cityMatches || n.searchText.includes(q)
      );
      if (activeNeighborhoods.length === 0 && launchingNeighborhoods.length === 0) return null;
      return { ...citySection, activeNeighborhoods, launchingNeighborhoods };
    })
    .filter(Boolean);
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
        neighborhood: name,
        city: cityLabel,
        displayName,
        searchText: `${name} ${cityLabel}`,
        status: "active",
      });
    })
    .filter(Boolean);

  return [...fromApi, ...fromGeo].sort((a, b) => {
    const aActive = a.status !== "launching";
    const bActive = b.status !== "launching";
    if (aActive !== bActive) return aActive ? -1 : 1;
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
