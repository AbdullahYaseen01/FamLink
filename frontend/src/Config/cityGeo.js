// Geo lookup for the programmatic city/neighborhood landing pages (Category
// 4.1). Maps a URL slug (e.g. "oakland-ca" or "rockridge") to a map center +
// zoom so the Leaflet map can render without a geocoding round-trip. Slugs are
// matched case-insensitively; a "-ca"/"-us" state suffix is ignored.
//
// Coordinates are approximate neighborhood centroids — precision isn't critical
// because the pins themselves are intentionally fuzzed.
const CITY_GEO = {
  // Cities
  "san-francisco": { lat: 37.7749, lng: -122.4194, zoom: 12, label: "San Francisco", radius: 9000 },
  oakland: { lat: 37.8044, lng: -122.2712, zoom: 12, label: "Oakland", radius: 8000 },
  berkeley: { lat: 37.8715, lng: -122.273, zoom: 13, label: "Berkeley", radius: 6000 },
  alameda: { lat: 37.7652, lng: -122.2416, zoom: 13, label: "Alameda", radius: 5000 },
  emeryville: { lat: 37.8313, lng: -122.2852, zoom: 14, label: "Emeryville", radius: 4000 },
  albany: { lat: 37.8869, lng: -122.2977, zoom: 14, label: "Albany", radius: 4000 },
  "san-leandro": { lat: 37.7249, lng: -122.1561, zoom: 13, label: "San Leandro", radius: 5000 },
  "castro-valley": { lat: 37.6941, lng: -122.0863, zoom: 13, label: "Castro Valley", radius: 5000 },

  // Oakland neighborhoods
  rockridge: { lat: 37.8447, lng: -122.2523, zoom: 14, label: "Rockridge", radius: 3500 },
  temescal: { lat: 37.8353, lng: -122.2637, zoom: 14, label: "Temescal", radius: 3500 },
  "piedmont-avenue": { lat: 37.8271, lng: -122.2506, zoom: 14, label: "Piedmont Avenue", radius: 3000 },
  montclair: { lat: 37.8285, lng: -122.2091, zoom: 14, label: "Montclair", radius: 3500 },
  "grand-lake": { lat: 37.811, lng: -122.257, zoom: 14, label: "Grand Lake", radius: 3000 },
  "adams-point": { lat: 37.8117, lng: -122.2606, zoom: 15, label: "Adams Point", radius: 2500 },
  lakeshore: { lat: 37.8047, lng: -122.2489, zoom: 14, label: "Lakeshore", radius: 3000 },

  // Berkeley neighborhoods
  elmwood: { lat: 37.858, lng: -122.254, zoom: 15, label: "Elmwood", radius: 2500 },
  "north-berkeley": { lat: 37.882, lng: -122.276, zoom: 14, label: "North Berkeley", radius: 3500 },
  "west-berkeley": { lat: 37.869, lng: -122.29, zoom: 14, label: "West Berkeley", radius: 3500 },
  "downtown-berkeley": { lat: 37.8701, lng: -122.2681, zoom: 15, label: "Downtown Berkeley", radius: 2500 },
};

// The service-area default when a slug isn't in the table (East Bay / Oakland).
const DEFAULT_GEO = { lat: 37.8044, lng: -122.2712, zoom: 12, label: "the East Bay", radius: 12000 };

// US state abbreviations we strip off the end of a slug ("oakland-ca" → "oakland").
const STATE_SUFFIXES = new Set([
  "ca", "ny", "tx", "fl", "il", "wa", "ma", "co", "or", "dc", "us",
]);

// Turn a slug into a display name ("piedmont-avenue" → "Piedmont Avenue"),
// dropping a trailing state abbreviation.
export const formatCitySlug = (slug) => {
  if (!slug) return "";
  const parts = String(slug).toLowerCase().split("-");
  if (parts.length > 1 && STATE_SUFFIXES.has(parts[parts.length - 1])) parts.pop();
  return parts
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

// Resolve a slug to { lat, lng, zoom, label, radius }. Falls back to the East
// Bay center, but keeps the slug's own formatted name as the label so the page
// still reads correctly for an unlisted area.
export const resolveCityGeo = (slug) => {
  if (!slug) return { ...DEFAULT_GEO };
  const parts = String(slug).toLowerCase().split("-");
  if (parts.length > 1 && STATE_SUFFIXES.has(parts[parts.length - 1])) parts.pop();
  const key = parts.join("-");
  if (CITY_GEO[key]) return { ...CITY_GEO[key] };
  return { ...DEFAULT_GEO, label: formatCitySlug(slug) || DEFAULT_GEO.label };
};
