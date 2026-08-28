const LAUNCHING_PROGRESS = {
  familiesHave: 4,
  familiesNeed: 8,
  nanniesHave: 1,
  nanniesNeed: 3,
};

const row = ({ id, displayName, searchText, status = "active", sharePath = null }) => ({
  id,
  displayName,
  searchText: searchText.toLowerCase(),
  status,
  sharePath,
  progress: status === "launching" ? { ...LAUNCHING_PROGRESS } : null,
});

/** Hardcoded launching areas shown in every city's neighborhood modal. */
export const LAUNCHING_NEIGHBORHOODS = [
  row({
    id: "alameda-launching",
    displayName: "Alameda",
    searchText: "alameda",
    status: "launching",
    sharePath: "join/alameda",
  }),
];

/** Active neighborhood labels for one city (from cityGeo `neighborhoods`). */
export function getCityNeighborhoodCatalog(cityLabel, neighborhoods = []) {
  const active = neighborhoods.map((name, index) =>
    row({
      id: `${cityLabel}-${index}-${name}`,
      displayName: `${name}, ${cityLabel}`,
      searchText: `${name} ${cityLabel}`,
      status: "active",
    })
  );

  const activeNames = new Set(active.map((item) => item.displayName.toLowerCase()));
  const launching = LAUNCHING_NEIGHBORHOODS.filter(
    (item) => !activeNames.has(item.displayName.toLowerCase())
  );

  return [...active, ...launching].sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    return a.displayName.localeCompare(b.displayName);
  });
}

export function filterNeighborhoodCatalog(query, catalog) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return catalog;
  return catalog.filter((item) => item.searchText.includes(q));
}

export function shareUrlFor(item) {
  if (!item?.sharePath) return "";
  return `https://famlink.app/${item.sharePath}`;
}
