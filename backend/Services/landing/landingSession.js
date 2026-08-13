import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required for landing sessions");
}

const PURPOSE = "landing_fam_v1";
const TTL = "7d";

/** Profile-type keys aligned with frontend SHARE_TYPE_GOALS. */
export const LANDING_PROFILE_TYPES = [
  "familyLooking",
  "familyHasNanny",
  "nannyLooking",
  "nannyHasFamily",
];

export const mintLandingSessionToken = ({
  profileType,
  zip,
  areaMode,
}) => {
  if (!LANDING_PROFILE_TYPES.includes(profileType)) {
    throw new Error("Invalid profileType");
  }
  if (areaMode !== "active" && areaMode !== "waitlist") {
    throw new Error("Invalid areaMode");
  }
  return jwt.sign(
    {
      purpose: PURPOSE,
      profileType,
      zip: zip ? String(zip) : null,
      areaMode,
      onboardingComplete: true,
    },
    JWT_SECRET,
    { expiresIn: TTL }
  );
};

export const verifyLandingSessionToken = (token) => {
  if (!token || typeof token !== "string") return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded?.purpose !== PURPOSE || !decoded?.onboardingComplete) {
      return null;
    }
    if (!LANDING_PROFILE_TYPES.includes(decoded.profileType)) return null;
    return decoded;
  } catch {
    return null;
  }
};

export const landingAuthFromRequest = (req) => {
  const header = req.headers["x-landing-session"] || req.headers["authorization"];
  let token = null;
  if (typeof header === "string") {
    token = header.startsWith("Bearer ") ? header.slice(7) : header;
  }
  if (!token && req.body?.landingSessionToken) {
    token = req.body.landingSessionToken;
  }
  if (!token && req.query?.token) {
    token = req.query.token;
  }
  return verifyLandingSessionToken(token);
};
