// User-type incompatibility — the only V1 Not-a-Match blockers.
// Good / Possible scoring lives in matchClassification.js.

import { variantFromProfile } from "./shareTypeGoals";

const INCOMPATIBLE_FAM_SAYS = {
  familyHasNanny: {
    familyHasNanny: "You both already have a nanny, so this user isn't compatible with the type of share you're looking for.",
    nannyLooking: "You already have a nanny.",
    nannyHasFamily: "You have a nanny. This nanny is looking for a family to join a share.",
  },
  nannyLooking: {
    familyHasNanny: "This family already has a nanny.",
    nannyLooking: "You're both nannies looking for a share position, so you can't form a share together.",
    nannyHasFamily: "You're both nannies, so you can't form a share together.",
  },
  nannyHasFamily: {
    familyHasNanny: "This family already has a nanny.",
    nannyLooking: "You're both nannies, so you can't form a share together.",
    nannyHasFamily: "You're both nannies looking for another family.",
  },
};

export function viewerShareVariant(user, profile) {
  if (!user) return null;
  return variantFromProfile(user.type === "Parents" ? "Family" : "Nanny", {
    hasNanny: profile?.hasNanny ?? user?.hasNanny,
    hasFamily: profile?.hasFamily ?? user?.hasFamily,
  });
}

export function getShareTypeCompatibility(viewerVariant, cardVariant) {
  if (!viewerVariant || !cardVariant || viewerVariant === "familyLooking") {
    return { compatible: true, famSays: "" };
  }
  const famSays = INCOMPATIBLE_FAM_SAYS[viewerVariant]?.[cardVariant] || "";
  return { compatible: !famSays, famSays };
}
