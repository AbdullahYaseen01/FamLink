import NannyProfile from "../../Schema/nannyProfile.js";
import User from "../../Schema/user.js";
import { isActiveServiceZip } from "./allowedZips.js";

/**
 * Hard complementary filters: only return profiles that can match this visitor type.
 */
const matchQueryForProfileType = (profileType) => {
  switch (profileType) {
    case "familyLooking":
      // Show families who have a nanny and want to share.
      return { hasNanny: true };
    case "familyHasNanny":
      // Show families looking for a share (no nanny yet).
      return { hasNanny: false };
    case "nannyLooking":
    case "nannyHasFamily":
      // Show family profiles looking for care / a share.
      return { hasNanny: false };
    default:
      return { hasNanny: true };
  }
};

const expectedUserType = (profileType) => {
  if (profileType === "nannyLooking" || profileType === "nannyHasFamily") {
    return "Parents";
  }
  return "Parents";
};

const sanitizePreview = (profile, user) => {
  const neighborhood =
    user?.location?.neighborhood ||
    user?.location?.city ||
    "Nearby";
  return {
    _id: String(profile._id),
    childrenAges: Array.isArray(profile.childrenAges)
      ? profile.childrenAges.slice(0, 4)
      : [],
    shareLocation: Array.isArray(profile.shareLocation)
      ? profile.shareLocation.slice(0, 3)
      : [],
    hourlyBudget: profile.hourlyBudget || null,
    hourlyBudgetSpecify: profile.hourlyBudgetSpecify || null,
    careType: profile.careType || profile.nannyShareType || null,
    hasNanny: Boolean(profile.hasNanny),
    hasFamily: Boolean(profile.hasFamily),
    displayLocation: neighborhood,
    displayName: "FamLink member",
    shareLocationLabel: neighborhood,
  };
};

export const getLandingMatches = async ({ profileType, zip, areaModeHint }) => {
  const areaMode =
    areaModeHint === "waitlist" || areaModeHint === "active"
      ? areaModeHint
      : isActiveServiceZip(zip)
        ? "active"
        : "waitlist";

  if (areaMode === "waitlist") {
    return { areaMode: "waitlist", profiles: [] };
  }

  const profiles = await NannyProfile.find(matchQueryForProfileType(profileType))
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();

  const userIds = profiles.map((p) => p.userId).filter(Boolean);
  const users = await User.find({
    _id: { $in: userIds },
    type: expectedUserType(profileType),
    nannyProfileCompleted: true,
  })
    .select("_id location type")
    .lean();
  const userById = new Map(users.map((u) => [String(u._id), u]));

  const eligible = [];
  for (const profile of profiles) {
    const user = userById.get(String(profile.userId));
    if (!user) continue;
    eligible.push(sanitizePreview(profile, user));
    if (eligible.length >= 2) break;
  }

  return { areaMode: "active", profiles: eligible };
};
