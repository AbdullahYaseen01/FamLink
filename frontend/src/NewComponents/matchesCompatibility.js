import { stubFamSaysFor } from "../Components/subComponents/profileCardUpgraded";

const asBool = (v) =>
  v === true || v === "true" || v === "yes" || v === "Yes";

export function isCompatible(viewerType, viewedType) {
  if (!viewerType || !viewedType) return true;
  return viewerType === "A" || viewedType === "A";
}

export function variantToShareType(variant) {
  switch (variant) {
    case "familyLooking":
      return "A";
    case "familyHasNanny":
      return "B";
    case "nannyLooking":
      return "C";
    case "nannyHasFamily":
      return "D";
    default:
      return null;
  }
}

export const DEFAULT_FAM_INTRO =
  "Browse profiles and send a match request — your incoming requests and replies will appear here once you're active.";

export function resolveShareType({ type, hasNanny, hasFamily } = {}) {
  const isFamily = type === "Parents" || type === "Family";
  if (isFamily) return asBool(hasNanny) ? "B" : "A";
  return asBool(hasFamily) ? "D" : "C";
}

export function shareTypeCopy(code) {
  switch (code) {
    case "A":
      return { role: "Family", goal: "Looking for a Share" };
    case "B":
      return { role: "Family", goal: "Has a Nanny, Looking to Share" };
    case "C":
      return { role: "Nanny", goal: "Looking for a Share Position" };
    case "D":
      return { role: "Nanny", goal: "With a Family, Looking to Share" };
    default:
      return { role: "", goal: "" };
  }
}

export function formatShareTypeLine(code, fallbackType) {
  const { role, goal } = shareTypeCopy(code);
  if (role && goal) return `${role} · ${goal}`;
  if (fallbackType === "Parents" || fallbackType === "Family") return "Family";
  if (fallbackType === "Nanny") return "Nanny";
  return "";
}

export function viewedTypeFromMatch(profile) {
  return resolveShareType({
    type: profile?.userId?.type,
    hasNanny: profile?.hasNanny,
    hasFamily: profile?.hasFamily,
  });
}

const FAM_SAYS_NOT_MATCH = {
  "B:B": "You both already have a nanny.",
  "B:C": "You already have a nanny.",
  "B:D": "You have a nanny. This nanny is looking for a family to join share.",
  "C:B": "This family already has a nanny.",
  "C:C": "You're both nannies looking for a share position.",
  "C:D": "You're both nannies, so you can't form a share together.",
  "D:B": "This family already has a nanny.",
  "D:C": "You're both nannies, so you can't form a share together.",
  "D:D": "You're both nannies looking for another family.",
};

function stubCompatibleLevel(id) {
  if (!id) return "possible";
  const n = String(id)
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return n % 2 === 0 ? "great" : "possible";
}

export function getCompatibility(viewerType, viewedType, stubId) {
  if (viewerType && viewedType && viewerType !== "A" && viewedType !== "A") {
    return {
      level: "none",
      famSays:
        FAM_SAYS_NOT_MATCH[`${viewerType}:${viewedType}`] ||
        "You're not a match for this share type.",
    };
  }
  const level = stubCompatibleLevel(stubId);
  return { level, famSays: stubFamSaysFor(level) };
}

export function buildFamIntro({ pendingCount = 0, chatCount = 0 } = {}) {
  if (pendingCount > 0 && chatCount > 0) {
    return `You have ${pendingCount} incoming request${pendingCount === 1 ? "" : "s"} and ${chatCount} conversation${chatCount === 1 ? "" : "s"}.`;
  }
  if (pendingCount > 0) {
    return `You have ${pendingCount} incoming match request${pendingCount === 1 ? "" : "s"} waiting for a reply.`;
  }
  if (chatCount > 0) {
    return `You have ${chatCount} active conversation${chatCount === 1 ? "" : "s"}.`;
  }
  return DEFAULT_FAM_INTRO;
}

export function sentStatusLabel(status) {
  switch (status) {
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Declined";
    case "blocked":
      return "Blocked";
    default:
      return "Awaiting reply";
  }
}
