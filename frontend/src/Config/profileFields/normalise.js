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
     wizard uses an em dash and a contraction. The wizard's string wins, and
     this rescues everything already stored the old way. */
  "myself (bringing my own child)": "Myself — I'm bringing my own child",
  /*
   * The two experience answers that are not casing variants of the canonical
   * list, so canonicalise() cannot rescue them on its own.
   *
   * "1-0 year" is the malformed option the chat intake and the caregiver funnel
   * used to write; "Over 5 years" is what older edit/intake controls offered.
   * Both map onto EXPERIENCE_OPTIONS, which both wizards agreed on.
   */
  "1-0 year": "Less than 1 year",
  "over 5 years": "5+ years",
  /* Chat Branch B and LookingForJob/Screen1 used to offer "1-3 miles"; the
     wizard's first band is "1–2 miles". The en-dash bands that follow are the
     same numbers with ASCII hyphens, which canonicalise's case lookup cannot
     match because "3-5 miles" and "3–5 miles" are different strings. */
  "1-3 miles": "1–2 miles",
  "3-5 miles": "3–5 miles",
  "5-10 miles": "5–10 miles",
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
  /* Family chat `careNeeded` used to offer "Flexible"; the wizard replaced it
     with "Other". nannyShareType is stored lowercase, so the target is too.
     Do not put this in LEGACY_ANSWER_ALIASES: Flow 2's schedule question still
     offers "Flexible", and a global alias would rewrite a live option. */
  "flexible": "other",
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

/*
 * The family questionnaire's Q2 is a sentence ("Yes — we already have a nanny");
 * the schema field is a Boolean. The first word is the whole answer.
 *
 * Matching on the first word rather than the sentence is what lets every writer
 * agree without sharing a vocabulary: the wizard's em-dash phrasing, the plain
 * "Yes"/"No" the chat intake sent for years, and any future rewording all
 * resolve the same way. Those bare answers are deliberately *not* in
 * LEGACY_ANSWER_ALIASES — a global "yes"/"no" rewrite would poison every
 * Yes/No question that goes through canonicalise. null means nothing was
 * chosen — distinct from false, which is a family telling us they have no nanny.
 *
 * Lives here rather than in a wizard payload because the pre-account intake
 * needs it too, and a second copy is how the two vocabularies diverged in the
 * first place.
 */
export function resolveHasNanny(choice) {
  if (typeof choice === "boolean") return choice;
  if (!choice) return null;

  const firstWord = String(choice).trim().split(/\s+/)[0].toLowerCase();
  if (firstWord === "yes") return true;
  if (firstWord === "no") return false;
  return null;
}

/*
 * careType is queried, not displayed: share.controller.js lowercases the
 * browser's schedule selection before matching, the admin facet list is built
 * from distinct("careType"), and OptionPills stores its option strings verbatim.
 * A Title Case value therefore matches nothing and the profile vanishes from
 * every schedule-filtered browse.
 *
 * "Full-time" -> "full-time" is byte-identical to what the retired
 * OnboardingOptionSelector produced for the same question, so existing documents
 * and new ones stay comparable. The Title Case string is kept by whichever
 * display field the flow owns (currentSchedule, nannyShareType).
 */
export function toCareType(value) {
  return (value || "").toLowerCase();
}
