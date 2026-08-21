/*
 * Family onboarding wizard — visual token contract.
 *
 * Vendored from docs/onboarding-family-mockup.html (its `:root` block) so
 * parity survives the reference host going away. That file is the authority on
 * anything this one does not cover.
 *
 * ── READ THIS BEFORE USING ANY VALUE BELOW ─────────────────────────────────
 *
 * These constants are for inline `style={{ ... }}` ONLY.
 *
 * Tailwind resolves arbitrary values by scanning source *text*, so an
 * interpolated class emits no CSS at all:
 *
 *   className={`bg-[${t.blueTint}]`}   ✗ silently unstyled
 *   className="bg-[#EEF3FF]"           ✓
 *
 * Every Tailwind arbitrary value in this feature must be written as a literal.
 * The exports here exist for the handful of places a literal cannot go —
 * notably ProgressRail's per-step opacity and any computed colour.
 *
 * Deliberately NOT added to tailwind.config.js as a `colors` extension: ~200
 * files already depend on `.text-primary` / `.bg-primary` from index.css, and
 * introducing theme names like `primary`/`blue` risks shadowing them.
 *
 * Font weights map to the Livvic helper classes, not to `font-*` utilities
 * (the family is split across four files plus Livvic-Black, added in index.css):
 *   900 → Livvic-Black   800/700 → Livvic-Bold
 *   600 → Livvic-SemiBold   500 → Livvic-Medium   400 → Livvic
 *
 * Two classes are no-ops in this codebase and must not be used here:
 *   `Quicksand`      — App.css sets `font-size: Quicksand`, which is invalid
 *   `Livvic-Regular` — no such helper exists (the 400 weight is plain `Livvic`)
 *
 * Breakpoint convention: the mockup breaks at 600px. Tailwind's `sm:` is 640px,
 * so where the exact figure matters use `max-[600px]:`.
 */

// Text, headings, active labels, Continue button fill
export const navy = "#001243";
// Active step circle, selected option fill, input focus ring
export const blue = "#AEC4FF";
// Icon squares, hover fills, progress track
export const blueTint = "#EEF3FF";
// Icon square borders, solid border on a filled photo upload
export const blueMid = "#C8D8FF";

// Sub-headings, Back button text, upcoming step labels
export const muted = "#6B7280";
// Placeholder text, footer step count, budget per-family line
export const mutedLight = "#9CA3AF";
// Input borders, dividers, inactive step lines
export const border = "#E8ECF4";
// Page background, children age rows
export const bg = "#F4F6FB";
export const white = "#FFFFFF";

// Completed step: circle fill, border + connecting line, label/glyph
export const greenCircle = "#D1FAE5";
export const greenLine = "#6EE7B7";
export const greenText = "#065F46";

// Required asterisk, error text and borders, Remove-photo pill
export const red = "#DC2626";
// Error state on a question block's icon square
export const errBg = "#FEF2F2";
export const errBorder = "#FECACA";

export const shadowCard = "0 2px 16px rgba(0,18,67,0.06)";
export const focusRing = "0 0 0 3px rgba(174,196,255,0.20)";
export const activeStepRing = "0 0 0 3px rgba(174,196,255,0.3)";

/*
 * Upcoming steps in the progress rail fade by distance from the active step.
 * Straight from the mockup's `updateProgressBar`, which assigns
 * `.upcoming-{1..4}` by `Math.min(dist, 4)`.
 *
 * Lives here because it is genuinely computed per step — the one case where a
 * literal Tailwind class cannot express the value.
 */
export const upcomingOpacity = { 1: 0.75, 2: 0.55, 3: 0.38, 4: 0.25 };

export function opacityForDistance(distance) {
  if (distance <= 0) return 1;
  return upcomingOpacity[Math.min(distance, 4)];
}
