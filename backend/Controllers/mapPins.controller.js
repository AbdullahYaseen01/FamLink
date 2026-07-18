import User from "../Schema/user.js";

// Approximate map pins for the programmatic city/neighborhood pages (Category
// 4.1). Public endpoint: it powers a marketing map for logged-out visitors, so
// it must NEVER leak personal data. It returns only a coarse pin type and a
// deliberately fuzzed coordinate — no name, id, address, or contact. Seeing an
// exact location or contacting anyone requires registering (enforced on the
// client, and by the fact that this endpoint simply never returns that data).

const MAX_PINS = 300;
const DEFAULT_RADIUS_M = 8000;
const MAX_RADIUS_M = 50000;

// How far each pin is randomly displaced from the true location (~0.006° ≈
// 600–700m). The offset is SEEDED FROM THE USER ID so it's stable across
// requests — otherwise an observer could average many requests to triangulate
// the real point. Deterministic fuzzing defeats that.
const JITTER_DEG = 0.006;

// Deterministic [0,1) pair derived from a string (FNV-1a + a mixed variant).
const seededPair = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const a = ((h >>> 0) % 100000) / 100000;
  let h2 = Math.imul(h ^ 0x9e3779b9, 2654435761);
  const b = ((h2 >>> 0) % 100000) / 100000;
  return [a, b];
};

// GET /location/map-pins?lat=..&lng=..&radius=..
// Returns { center, radiusMeters, counts, pins:[{ lat, lng, type }] }.
export const getMapPins = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
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

    // $near already restricts to documents with a valid geometry, so no
    // separate "coordinates exist" filter is needed (and overlapping predicates
    // on a $near path are best avoided).
    const users = await User.find({
      type: { $in: ["Parents", "Nanny"] },
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: radius,
        },
      },
    })
      .select("_id type location.coordinates")
      .limit(MAX_PINS)
      .lean();

    const cosLat = Math.cos((lat * Math.PI) / 180) || 1;
    let nannies = 0;
    let parents = 0;

    const pins = users
      .map((u) => {
        const coords = u.location?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) return null;
        const [realLng, realLat] = coords;

        // Stable fuzz so the pin can't be triangulated across requests.
        const [a, b] = seededPair(String(u._id));
        const fuzzLat = realLat + (a * 2 - 1) * JITTER_DEG;
        const fuzzLng = realLng + ((b * 2 - 1) * JITTER_DEG) / cosLat;

        const type = u.type === "Nanny" ? "nanny" : "parent";
        if (type === "nanny") nannies++;
        else parents++;

        return {
          lat: Number(fuzzLat.toFixed(5)),
          lng: Number(fuzzLng.toFixed(5)),
          type,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      center: { lat, lng },
      radiusMeters: radius,
      counts: { nannies, parents, total: pins.length },
      pins,
    });
  } catch (err) {
    console.error("getMapPins failed:", err);
    return res
      .status(500)
      .json({ message: "Could not load map pins.", error: err.message });
  }
};
