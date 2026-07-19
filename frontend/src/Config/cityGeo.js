// Geo + SEO lookup for the programmatic city/neighborhood landing pages
// (Category 4.1). Maps a URL slug (e.g. "oakland-ca" or "rockridge") to a map
// center + zoom so the Leaflet map can render without a geocoding round-trip,
// plus the SEO fields the prerender script (scripts/prerender-meta.mjs) and the
// internal-linking components need. This file is imported by Node at build
// time — keep it plain JS with no JSX/asset imports.
//
// Per entry:
//   canonicalSlug — the ONE slug we want indexed (cities keep their "-ca"
//                   suffix to match the sitemap/footer URLs; neighborhoods are
//                   bare). resolveCityGeo() accepts suffixed variants but the
//                   canonical always points here.
//   parent        — cityGeo key of the containing city (neighborhoods only).
//   blurb         — unique intro copy rendered on the page and used to build
//                   the meta description, so the ~20 templated pages don't all
//                   read identically to Google.
//
// Coordinates are approximate neighborhood centroids — precision isn't critical
// because the pins themselves are intentionally fuzzed.
const CITY_GEO = {
  // Cities
  "san-francisco": {
    lat: 37.7749, lng: -122.4194, zoom: 12, label: "San Francisco", radius: 9000,
    canonicalSlug: "san-francisco-ca",
    blurb:
      "From Noe Valley strollers to Golden Gate Park playdates, San Francisco families use nanny shares to make in-home care affordable in one of the country's priciest childcare markets. Shares here usually pair families within the same neighborhood to keep mornings simple.",
  },
  oakland: {
    lat: 37.8044, lng: -122.2712, zoom: 12, label: "Oakland", radius: 8000,
    canonicalSlug: "oakland-ca",
    blurb:
      "Oakland is the heart of East Bay nanny sharing, with active families from Rockridge to Grand Lake looking to pair up. Sharing a nanny here typically saves each family 30–50% compared to hiring alone.",
  },
  berkeley: {
    lat: 37.8715, lng: -122.273, zoom: 13, label: "Berkeley", radius: 6000,
    canonicalSlug: "berkeley-ca",
    blurb:
      "Berkeley families — many juggling university schedules — use nanny shares for flexible, in-home care that daycare waitlists can't match. Shares often form around North Berkeley, Elmwood, and the Gourmet Ghetto.",
  },
  alameda: {
    lat: 37.7652, lng: -122.2416, zoom: 13, label: "Alameda", radius: 5000,
    canonicalSlug: "alameda-ca",
    blurb:
      "Alameda's flat, walkable streets and beach playgrounds make it easy for two island families to share one great nanny. Many shares form around Central Alameda and Bay Farm Island.",
  },
  emeryville: {
    lat: 37.8313, lng: -122.2852, zoom: 14, label: "Emeryville", radius: 4000,
    canonicalSlug: "emeryville-ca",
    blurb:
      "Emeryville sits at the crossroads of Oakland, Berkeley, and the Bay Bridge commute, making it a natural meeting point for nanny share families. Its compact size means most matches live only a few minutes apart.",
  },
  albany: {
    lat: 37.8869, lng: -122.2977, zoom: 14, label: "Albany", radius: 4000,
    canonicalSlug: "albany-ca",
    blurb:
      "Albany's small-town feel and top-rated schools draw young families who pair up for nanny shares near Solano Avenue and Memorial Park. North Berkeley families frequently join Albany shares too.",
  },
  "san-leandro": {
    lat: 37.7249, lng: -122.1561, zoom: 13, label: "San Leandro", radius: 5000,
    canonicalSlug: "san-leandro-ca",
    blurb:
      "San Leandro families share nannies to get personalized infant care without the daycare waitlist, often pairing near Estudillo Estates and Washington Manor. BART access also makes shares with Oakland families practical.",
  },
  "castro-valley": {
    lat: 37.6941, lng: -122.0863, zoom: 13, label: "Castro Valley", radius: 5000,
    canonicalSlug: "castro-valley-ca",
    blurb:
      "Castro Valley parents use nanny shares to keep infants and toddlers in a home setting while splitting the cost with a neighbor. Shares often form around Castro Village and the Palomares Hills area.",
  },

  // Oakland neighborhoods
  rockridge: {
    lat: 37.8447, lng: -122.2523, zoom: 14, label: "Rockridge", radius: 3500,
    canonicalSlug: "rockridge", parent: "oakland",
    blurb:
      "Rockridge's stroller-friendly College Avenue and quick BART access make it one of the East Bay's most active nanny share pockets. Most shares here pair families within walking distance of each other.",
  },
  temescal: {
    lat: 37.8353, lng: -122.2637, zoom: 14, label: "Temescal", radius: 3500,
    canonicalSlug: "temescal", parent: "oakland",
    blurb:
      "Temescal families meet at Frog Park and the Sunday farmers market — and many end up sharing a nanny with a household just a few blocks away. It's one of North Oakland's most active nanny share neighborhoods.",
  },
  "piedmont-avenue": {
    lat: 37.8271, lng: -122.2506, zoom: 14, label: "Piedmont Avenue", radius: 3000,
    canonicalSlug: "piedmont-avenue", parent: "oakland",
    blurb:
      "Piedmont Avenue's café strip and nearby Dracena Quarry Park make it a natural hub for nanny share families in central Oakland. Shares here often include families from neighboring Grand Lake and Rockridge.",
  },
  montclair: {
    lat: 37.8285, lng: -122.2091, zoom: 14, label: "Montclair", radius: 3500,
    canonicalSlug: "montclair", parent: "oakland",
    blurb:
      "Up in the Oakland hills, Montclair families share nannies to bring flexible, in-home care to a neighborhood where daycare options are sparse. Montclair Park and the village shops are favorite meetup spots.",
  },
  "grand-lake": {
    lat: 37.811, lng: -122.257, zoom: 14, label: "Grand Lake", radius: 3000,
    canonicalSlug: "grand-lake", parent: "oakland",
    blurb:
      "Grand Lake families pair up for nanny shares between Lake Merritt walks and Saturday's famous farmers market. Its central location also draws share partners from Adams Point and Lakeshore.",
  },
  "adams-point": {
    lat: 37.8117, lng: -122.2606, zoom: 15, label: "Adams Point", radius: 2500,
    canonicalSlug: "adams-point", parent: "oakland",
    blurb:
      "Adams Point's apartment-dense blocks beside Lake Merritt are full of young families looking to split a nanny. Children's Fairyland and the lakeside lawns are everyday destinations for shares here.",
  },
  lakeshore: {
    lat: 37.8047, lng: -122.2489, zoom: 14, label: "Lakeshore", radius: 3000,
    canonicalSlug: "lakeshore", parent: "oakland",
    blurb:
      "Lakeshore families share nannies around the Lakeshore Avenue shops and the east side of Lake Merritt. Shares often team up with nearby Grand Lake and Trestle Glen households.",
  },

  // Berkeley neighborhoods
  elmwood: {
    lat: 37.858, lng: -122.254, zoom: 15, label: "Elmwood", radius: 2500,
    canonicalSlug: "elmwood", parent: "berkeley",
    blurb:
      "Elmwood's quiet streets and the shops at College and Ashby anchor one of Berkeley's most family-dense pockets. Nanny shares here often pair with neighboring Rockridge families across the Oakland line.",
  },
  "north-berkeley": {
    lat: 37.882, lng: -122.276, zoom: 14, label: "North Berkeley", radius: 3500,
    canonicalSlug: "north-berkeley", parent: "berkeley",
    blurb:
      "North Berkeley families form nanny shares around the Gourmet Ghetto, Live Oak Park, and the Monterey Market blocks. Flexible in-home care is a popular alternative to the area's long preschool waitlists.",
  },
  "west-berkeley": {
    lat: 37.869, lng: -122.29, zoom: 14, label: "West Berkeley", radius: 3500,
    canonicalSlug: "west-berkeley", parent: "berkeley",
    blurb:
      "West Berkeley's mix of new condos and classic bungalows houses many young families working around Fourth Street and the Gilman district. Nanny shares here keep infant care close to home and off the freeway.",
  },
  "downtown-berkeley": {
    lat: 37.8701, lng: -122.2681, zoom: 15, label: "Downtown Berkeley", radius: 2500,
    canonicalSlug: "downtown-berkeley", parent: "berkeley",
    blurb:
      "Downtown Berkeley families — many tied to campus schedules — use nanny shares for care that flexes around semesters and commutes. BART access makes pairing with families across the East Bay easy.",
  },
};

// Every canonical landing page, for the prerender script, the sitemap, and the
// internal-linking components. `key` is the CITY_GEO lookup key.
export const CITY_PAGES = Object.entries(CITY_GEO).map(([key, entry]) => ({
  key,
  ...entry,
}));

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

// Resolve a slug to { lat, lng, zoom, label, radius, canonicalSlug, known, … }.
// Falls back to the East Bay center with known:false — callers use that to
// noindex the page, since any unlisted slug would otherwise render as an
// indexable near-duplicate.
export const resolveCityGeo = (slug) => {
  if (!slug) return { ...DEFAULT_GEO, known: false };
  const parts = String(slug).toLowerCase().split("-");
  if (parts.length > 1 && STATE_SUFFIXES.has(parts[parts.length - 1])) parts.pop();
  const key = parts.join("-");
  if (CITY_GEO[key]) return { ...CITY_GEO[key], key, known: true };
  return { ...DEFAULT_GEO, label: formatCitySlug(slug) || DEFAULT_GEO.label, known: false };
};
