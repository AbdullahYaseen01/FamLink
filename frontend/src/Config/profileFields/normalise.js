/*
 * Turning what is stored into what a control or a row can use.
 *
 * One copy, shared by both View Profiles and both Edit Profiles. Until now
 * `canonicalise` and `toArray` existed twice — LoginAsFamily/editProfile.jsx and
 * LoginAsNanny/editProfile.jsx — and the two had already diverged: only the
 * nanny one carried a legacy-alias map, so the same stored string rehydrated on
 * one form and rendered as an unmatched tag on the other.
 *
 * The rules encoded here are the ones agreed in
 * docs/profile-consistency/02-legacy-data-read-strategy.md. The policy is
 * normalise on read, repair on write: nothing here mutates the database, and a
 * drifted document is corrected the next time its owner saves.
 */

/*
 * Answers the retired flows wrote that today's options phrase differently.
 *
 * Case alone is not enough for these. OnboardingOptionSelector lowercased
 * whatever it stored, so a case-insensitive match rescues "childcare" and
 * "flexible" on its own — but "rotating homes", "meal/snack prep" and the
 * parenthetical age labels are different strings, not different capitalisation.
 * Without the map they render as unmatched and the next save drops them.
 *
 * Keys are the stored value, lowercased and trimmed.
 */
export const LEGACY_ANSWER_ALIASES = {
  "1-2": "1–2",
  "2-3": "2–3",
  "3-4": "3–4",
  "rotating homes": "Rotating between homes",
  "meal/snack prep": "Meal / snack preparation",
  "nap/bedtime routines": "Nap / bedtime routines",
  "infants (0–1)": "Infants — 0–1",
  "toddlers (1–3)": "Toddlers — 1–3",
  "preschool (3–5)": "Preschool — 3–5",
  "school-age (5+)": "School-age — 5+",
  /* The nanny edit form used to phrase flow 2's Q1 with a parenthetical; the
     wizard uses an em dash and a contraction. The wizard's string wins — it is
     the one being written from now on — and this rescues everything already
     stored the old way. Still live: the chat intake and the caregiver funnel
     both write the parenthetical today. */
  "myself (bringing my own child)": "Myself — I'm bringing my own child",
  /*
   * The two experience answers that are not casing variants of the canonical
   * list, so canonicalise() cannot rescue them on its own.
   *
   * "1-0 year" is the malformed option the chat intake and the caregiver funnel
   * still write; "Over 5 years" is what the nanny edit form's own control
   * offered. Both map onto EXPERIENCE_OPTIONS, which both wizards agreed on.
   */
  "1-0 year": "Less than 1 year",
  "over 5 years": "5+ years",
};

/*
 * Share types the retired six-option control wrote.
 *
 * Separate from the map above because these resolve to LOWERCASE values:
 * nannyShareType is queried, and share.controller.js lowercases the browser's
 * selection before matching it. "Full-time care" and "Part-time care" are
 * today's presets under an older name; the four types the questionnaire
 * genuinely retired (Pickup/Drop-off, After-school, Summer/Seasonal, Weekend)
 * are absent on purpose, so they fall through to "Other" — which is where the
 * wizard puts them too.
 */
export const LEGACY_SHARE_TYPE_ALIASES = {
  "full-time care": "full-time",
  "part-time care": "part-time",
};

/*
 * Match a stored answer to its canonical option: legacy alias first, then an
 * exact-ignoring-case lookup, then the value untouched.
 *
 * Returning the value unchanged when nothing matches is deliberate — free text
 * (skills, custom certifications, an "Other" answer) goes through the same
 * helper, and so does a retired option that has no canonical target. Dropping
 * those would trade a display bug for data loss.
 *
 * `options` is the ACTIVE FLOW'S list, not a union of every flow's. flexibility,
 * certifications and preferredAges are asked differently by different wizards
 * while sharing one field name, so handing a nanny profile the family's list is
 * the specific mistake this argument exists to prevent.
 */
export function canonicalise(value, options = [], aliases = LEGACY_ANSWER_ALIASES) {
  if (Array.isArray(value)) return value.map((item) => canonicalise(item, options, aliases));
  if (typeof value !== "string") return value;

  const key = value.trim().toLowerCase();
  const aliased = aliases[key];
  if (aliased) return aliased;

  return options.find((option) => option.toLowerCase().trim() === key) ?? value;
}

/*
 * Feed a multi-select an array whatever the document holds.
 *
 * communicationPreference and backupCare are declared [String], but documents
 * predating that change hold a plain string and .lean() reads hand the raw value
 * back without casting — so both shapes are in the database right now. Flow 2
 * adds a third case by design: it asks its communication question as a single
 * select and stores the answer as a one-element array.
 */
export function toArray(value) {
  if (value === undefined || value === null || value === "") return undefined;
  return Array.isArray(value) ? value : [value];
}

/*
 * The option list a control should offer: the flow's own options, plus anything
 * already stored that is no longer among them.
 *
 * This is what keeps a retired answer visible and editable without a migration.
 * `canonicalise` covers casing, not vocabulary — the three house rules the
 * family form invented, and the "Water Safety" / "Special Needs" certifications
 * the nanny form invented, have no canonical target at all. Rendering a control
 * that cannot represent its own stored value means the next save silently drops
 * the answer, so the stored values are appended rather than discarded.
 *
 * Order matters: the flow's options come first, in the wizard's order, and the
 * retired ones trail them.
 */
export function optionsWithStored(options = [], stored) {
  const extras = (toArray(stored) || [])
    .filter((v) => typeof v === "string" && v.trim() !== "")
    .filter((v) => !options.some((o) => o.toLowerCase().trim() === v.toLowerCase().trim()));

  return extras.length ? [...options, ...new Set(extras)] : options;
}
