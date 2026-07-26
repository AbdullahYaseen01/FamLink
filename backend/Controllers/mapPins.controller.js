import User from "../Schema/user.js";

// Approximate coverage areas for the programmatic city/neighborhood pages
// (Category 4.1). Public endpoint: it powers a marketing map for logged-out
// visitors, so it must NEVER leak personal data.
//
// It does NOT return per-person points. There is no coordinate in the response
// that belongs to anybody. Members are snapped to cells of a FIXED global grid
// and only a cell centre, a display radius, and a head count leave the server.
// Three properties hold, and each one closes a specific attack:
//
//   1. GRID IS FIXED AND GLOBAL, anchored at (0, 0) — never at the query
//      centre. Panning or re-centring the map cannot shift the grid to
//      triangulate a finer position, and moving house inside a cell changes
//      nothing in the response, so averaging many requests reveals nothing.
//   2. EVERY PUBLISHED CIRCLE COVERS AT LEAST `MIN_GROUP` MEMBERS. A cell that
//      would expose fewer is merged into the next grid up, and if it is still
//      short it is not drawn at all. So a circle never stands for one
//      identifiable household — it always represents a group.
//   3. MEMBERSHIP USES THE CELL CENTRE's distance to the query point, never the
//      member's real distance. Otherwise an attacker could sweep the `radius`
//      parameter, watch for the moment a circle appears, binary-search a
//      member's exact distance from a chosen centre, and trilaterate from a few
//      centres. Testing the cell caps that attack at cell resolution.
//
// Seeing an actual neighborhood or contacting anyone requires registering.

const MAX_USERS = 2000; // candidates scanned per request (cells, not people, are returned)
const DEFAULT_RADIUS_M = 8000;
const MAX_RADIUS_M = 50000;
const M_PER_DEG_LAT = 111320;

// Base grid cell height in degrees of latitude. 0.03° ≈ 3.3 km, so the smallest
// cell we will ever publish covers ~11 km² — a ~2-mile square. That's a
// district, not a street: knowing someone's cell gives you nowhere to turn up.
const BASE_LAT_DEG = 0.03;
const BASE_SIDE_M = BASE_LAT_DEG * M_PER_DEG_LAT; // ~3340 m
const BASE_HALF_DIAGONAL_M = (BASE_SIDE_M * Math.SQRT2) / 2; // ~2361 m

// Grid levels, as multiples of the base cell: ~3.3 km, then ~6.7 km. Sparse
// cells roll up from one level to the next until the group is big enough to
// publish. Each level's step is a power-of-two multiple of the base and is
// anchored at 0, so a fine cell always nests exactly inside a coarse one.
const LEVEL_MULTIPLIERS = [1, 2];
const COARSEST_LAT_DEG = BASE_LAT_DEG * LEVEL_MULTIPLIERS[LEVEL_MULTIPLIERS.length - 1];

// Smallest number of members a drawn circle may represent. Below this the cell
// merges upward, and if even the coarsest cell falls short the group is counted
// in the headline totals but never drawn. This is what makes "each circle is
// many families and caregivers" true rather than aspirational.
const MIN_GROUP = 3;

// The drawn circle is 10% wider than the cell's half-diagonal, so it is a
// strict superset of the area the count could have come from ("somewhere in
// this circle" is literally true) and neighbouring circles overlap instead of
// tiling — the blobs never resolve into a crisp grid a viewer could read
// boundaries off.
const DRAW_OVERSHOOT = 1.1;

// Longitude degrees shrink as you leave the equator. Deriving the correction
// from the COARSEST band (not each level's own band) is what keeps the levels
// nested: every cell that shares a coarse parent also shares its correction.
const bandCos = (realLat) => {
  const bandIdx = Math.floor(realLat / COARSEST_LAT_DEG);
  const bandLat = (bandIdx + 0.5) * COARSEST_LAT_DEG;
  return Math.max(Math.cos((bandLat * Math.PI) / 180), 0.05);
};

// Snap a real coordinate to the centre of its cell at the given level.
const cellFor = (realLat, realLng, mult) => {
  const latStep = BASE_LAT_DEG * mult;
  const lngStep = latStep / bandCos(realLat);
  const latIdx = Math.floor(realLat / latStep);
  const lngIdx = Math.floor(realLng / lngStep);
  const sideM = latStep * M_PER_DEG_LAT;
  const halfDiagonalM = (sideM * Math.SQRT2) / 2;
  return {
    lat: (latIdx + 0.5) * latStep,
    lng: (lngIdx + 0.5) * lngStep,
    sideM,
    halfDiagonalM,
    radiusMeters: Math.round(halfDiagonalM * DRAW_OVERSHOOT),
    key: `${mult}:${latIdx}:${lngIdx}`,
  };
};

// Distance in metres (equirectangular approximation is plenty at city scale).
const distanceM = (aLat, aLng, bLat, bLng) => {
  const cos = Math.cos(((aLat + bLat) / 2) * (Math.PI / 180));
  const dx = (bLng - aLng) * cos * (Math.PI / 180) * 6371000;
  const dy = (bLat - aLat) * (Math.PI / 180) * 6371000;
  return Math.hypot(dx, dy);
};

// Bucket members into cells at one level. Returns groups keyed by cell.
const groupByCell = (members, mult) => {
  const groups = new Map();
  for (const m of members) {
    const cell = cellFor(m.lat, m.lng, mult);
    let group = groups.get(cell.key);
    if (!group) {
      group = { cell, members: [], nannies: 0, parents: 0 };
      groups.set(cell.key, group);
    }
    group.members.push(m);
    if (m.type === "nanny") group.nannies++;
    else group.parents++;
  }
  return groups;
};

// GET /location/map-pins?lat=..&lng=..&radius=..
// Returns { center, radiusMeters, counts, areas:[{ lat, lng, radiusMeters,
// nannies, parents, total }] }.
// Number("") and Number(null) are both 0, so a request with a blank or missing
// lat/lng would sail through validation and quietly return an empty map for the
// Gulf of Guinea — which the page then renders as "be the first one here".
// Anything that isn't a non-blank scalar has to become NaN and get rejected.
const toCoord = (raw) => {
  if (typeof raw !== "string" && typeof raw !== "number") return NaN;
  const str = String(raw).trim();
  return str === "" ? NaN : Number(str);
};

export const getMapPins = async (req, res) => {
  try {
    const lat = toCoord(req.query.lat);
    const lng = toCoord(req.query.lng);
    if (
      !Number.isFinite(lat) || !Number.isFinite(lng) ||
      lat < -90 || lat > 90 || lng < -180 || lng > 180
    ) {
      return res.status(400).json({ message: "Valid lat and lng are required." });
    }

    const radius = Math.min(
      Math.max(Number(req.query.radius) || DEFAULT_RADIUS_M, 500),
      MAX_RADIUS_M
    );

    // Fetch well past the requested radius. A cell qualifies if it OVERLAPS the
    // requested circle, so a member can sit up to a full coarse-cell diagonal
    // beyond it and still belong to a cell we publish — and a published cell's
    // count has to be complete or the number on the map is wrong.
    const coarsestSideM = COARSEST_LAT_DEG * M_PER_DEG_LAT;
    const fetchRadius = radius + coarsestSideM * Math.SQRT2;

    // $near already restricts to documents with a valid geometry, so no
    // separate "coordinates exist" filter is needed (and overlapping predicates
    // on a $near path are best avoided).
    const users = await User.find({
      type: { $in: ["Parents", "Nanny"] },
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: fetchRadius,
        },
      },
    })
      .select("_id type +location.coordinates")
      .limit(MAX_USERS)
      .lean();

    // Real coordinates live only inside this function, and only long enough to
    // be bucketed. Nothing below ever emits one.
    const members = [];
    for (const u of users) {
      const coords = u.location?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) continue;
      const [realLng, realLat] = coords;
      if (!Number.isFinite(realLat) || !Number.isFinite(realLng)) continue;
      members.push({
        lat: realLat,
        lng: realLng,
        type: u.type === "Nanny" ? "nanny" : "parent",
      });
    }

    // Roll sparse cells up the grid levels until each group clears MIN_GROUP.
    const groups = [];
    let pending = members;
    for (const mult of LEVEL_MULTIPLIERS) {
      if (pending.length === 0) break;
      const isLastLevel = mult === LEVEL_MULTIPLIERS[LEVEL_MULTIPLIERS.length - 1];
      const carry = [];
      for (const group of groupByCell(pending, mult).values()) {
        const total = group.nannies + group.parents;
        if (total >= MIN_GROUP) {
          groups.push({ ...group, total, drawn: true });
        } else if (isLastLevel) {
          // Too few even at the coarsest grid: counted, never drawn.
          groups.push({ ...group, total, drawn: false });
        } else {
          carry.push(...group.members);
        }
      }
      pending = carry;
    }

    let nannies = 0;
    let parents = 0;
    let hidden = 0;
    const areas = [];

    for (const group of groups) {
      // Overlap test on the CELL — see property 3 at the top of the file.
      // Overlap rather than centre-inside matters because the tightest
      // neighborhood pages ask for a 2.5 km radius, which is smaller than a
      // cell: a centre-inside test would hand them an empty map even with
      // members standing right there.
      // The margin is always the BASE cell's half-diagonal, never the (possibly
      // merged) cell's own. Letting a 6.7 km merged cell claim a 4.7 km margin
      // made every East Bay neighborhood page report the same head count,
      // because they all scooped up the same handful of coarse cells.
      const reach = radius + BASE_HALF_DIAGONAL_M;
      if (distanceM(lat, lng, group.cell.lat, group.cell.lng) > reach) continue;

      nannies += group.nannies;
      parents += group.parents;

      if (!group.drawn) {
        hidden += group.total;
        continue;
      }

      areas.push({
        lat: Number(group.cell.lat.toFixed(4)),
        lng: Number(group.cell.lng.toFixed(4)),
        radiusMeters: group.cell.radiusMeters,
        nannies: group.nannies,
        parents: group.parents,
        total: group.total,
      });
    }

    // Densest areas last so they paint on top of the sparse ones.
    areas.sort((a, b) => a.total - b.total);

    return res.status(200).json({
      center: { lat, lng },
      radiusMeters: radius,
      minGroup: MIN_GROUP,
      counts: {
        nannies,
        parents,
        total: nannies + parents,
        areas: areas.length,
        // Members in range who fell below MIN_GROUP anywhere on the grid, so
        // they are in the headline numbers but have no circle of their own.
        hidden,
      },
      areas,
    });
  } catch (err) {
    console.error("getMapPins failed:", err);
    return res
      .status(500)
      .json({ message: "Could not load map areas.", error: err.message });
  }
};
