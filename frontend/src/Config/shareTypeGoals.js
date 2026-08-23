// The four share types as plain data: role, goal wording, accent colors.
//
// Split out of shareTypeTheme.jsx (which still re-exports it, so every existing
// import keeps working) because two consumers now need this without React: the
// serverless renderer that writes a shared link's Open Graph tags, and the edge
// function that draws the preview image. Both run outside the browser, and
// shareTypeTheme.jsx pulls in lucide-react for its JSX badges — an icon set has
// no business in an edge bundle.
//
// Keep this file free of imports. That is what makes it safe to load from a
// function, and the reason the wording can't drift between the app and the image
// a stranger sees in a Facebook group.

const THEME = {
  familyLooking: { bg: "#EEF3FF", text: "#3B5BDB" },
  familyHasNanny: { bg: "#F5F3FF", text: "#6D28D9" },
  nannyLooking: { bg: "#FFF7ED", text: "#C2410C" },
  nannyHasFamily: { bg: "#F0FDF4", text: "#059669" },
};

// role  → shown before the separation dot
// goal  → short, explanatory label shown after the dot (shared everywhere)
// value → the exact string the backend filter expects. Do NOT change: it is
//         matched in backend/controllers/share.controller.js against the
//         hasNanny / hasFamily flags.
export const SHARE_TYPE_GOALS = {
  familyLooking: { role: "Family", goal: "Looking for a share", value: "Family ● Looking for a share", theme: THEME.familyLooking },
  familyHasNanny: { role: "Family", goal: "Has a nanny, Looking to share", value: "Family ● Has a Nanny, Looking for a share", theme: THEME.familyHasNanny },
  nannyLooking: { role: "Nanny", goal: "Looking for a share position", value: "Nanny ● Looking for a share position", theme: THEME.nannyLooking },
  nannyHasFamily: { role: "Nanny", goal: "With a family, Looking to share", value: "Nanny ● With a Family, Looking for a share", theme: THEME.nannyHasFamily },
};

// Resolve the variant the way the backend does, from role plus whether the user
// already has a counterpart. hasNanny / hasFamily arrive as real booleans or as
// the strings "true"/"false" depending on which save path wrote the profile.
export const variantFromProfile = (role, { hasNanny, hasFamily } = {}) => {
  const asBool = (v) => v === true || v === "true";
  return role === "Family"
    ? asBool(hasNanny)
      ? "familyHasNanny"
      : "familyLooking"
    : asBool(hasFamily)
      ? "nannyHasFamily"
      : "nannyLooking";
};
