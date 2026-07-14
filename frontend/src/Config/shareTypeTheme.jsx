import { Users } from "lucide-react";

// Accent color themes + shared goal labels for each share-type / user goal.
//
// There are four goals, determined by role (Family / Nanny) plus whether the
// user already has a counterpart (a nanny to share, or a family they nanny for).
// Each gets its own accent pair, drawn from the accent colors already used in
// the profile banner (the meta-row icons). The profile banner badge
// (profileCard.jsx / profileList.jsx) and the "Share Type" filter
// (filterSlide.jsx) all read from this single source, so the colors, the
// wording AND the "Role • Goal" formatting stay identical everywhere.

const THEME = {
  familyLooking: { bg: "#D9F0FF", text: "#5FBFFF" }, // blue
  familyHasNanny: { bg: "#E7E9FD", text: "#6466E9" }, // indigo
  nannyLooking: { bg: "#FFF3EA", text: "#C4621A" }, // orange
  nannyHasFamily: { bg: "#E7F6EF", text: "#10B981" }, // green
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

// Shared renderer: "Role • Goal" with the faint separation dot. Used by both the
// profile banner badge and the filter chip so they read exactly the same.
// Expects to sit inside a flex container with a gap (the dot/role/goal are flex
// items) — both call sites use `inline-flex items-center gap-1.5`.
export const ShareTypeLabel = ({ role, goal }) => (
  <>
    <span className="Livvic-Bold font-bold">{role}</span>
    <span className="opacity-30">•</span>
    <span className="Livvic-Bold font-bold">{goal}</span>
  </>
);

// Fully-themed "Share Type" pill — icon + "Role • Goal" on the goal's accent
// colors. Keyed by variant (familyLooking | familyHasNanny | nannyLooking |
// nannyHasFamily). Used by the onboarding match cards.
export const ShareTypeBadge = ({ variant, className = "" }) => {
  const g = SHARE_TYPE_GOALS[variant];
  if (!g) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold Livvic-Bold rounded-full px-3 py-1 text-[11px] md:text-xs flex-shrink-0 ${className}`}
      style={{ backgroundColor: g.theme.bg, color: g.theme.text }}
    >
      <Users size={13} strokeWidth={2} className="flex-shrink-0" />
      <ShareTypeLabel role={g.role} goal={g.goal} />
    </span>
  );
};

// Accent (text) color for a variant — e.g. for a themed avatar background.
export const getVariantTheme = (variant) => SHARE_TYPE_GOALS[variant]?.theme;

// ── Profile banner helpers (keyed off the hasNanny / hasFamily booleans) ──
export const getFamilyTheme = (hasNanny) =>
  (hasNanny ? SHARE_TYPE_GOALS.familyHasNanny : SHARE_TYPE_GOALS.familyLooking).theme;
export const getNannyTheme = (hasFamily) =>
  (hasFamily ? SHARE_TYPE_GOALS.nannyHasFamily : SHARE_TYPE_GOALS.nannyLooking).theme;

export const getFamilyGoal = (hasNanny) =>
  (hasNanny ? SHARE_TYPE_GOALS.familyHasNanny : SHARE_TYPE_GOALS.familyLooking).goal;
export const getNannyGoal = (hasFamily) =>
  (hasFamily ? SHARE_TYPE_GOALS.nannyHasFamily : SHARE_TYPE_GOALS.nannyLooking).goal;

// ── Filter "Share Type" chips (keyed off the exact backend value strings) ──
export const SHARE_TYPE_OPTION_THEME = Object.fromEntries(
  Object.values(SHARE_TYPE_GOALS).map((g) => [g.value, g.theme])
);
