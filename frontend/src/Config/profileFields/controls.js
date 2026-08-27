/*
 * The answer formats the three onboarding wizards actually ask in.
 *
 * One `control` per manifest entry, and it is the single thing that decides how
 * an answer is rendered on a View Profile and which input appears on an Edit
 * Profile. Named constants rather than bare strings so a typo is a crash at
 * import time instead of a question that silently renders as nothing.
 *
 * The list is closed on purpose: it is derived from what OnboardingKit/fields
 * exposes, and a wizard cannot ask a question in a format that is not here. If a
 * new field component is added to the kit, it gets a constant here in the same
 * change — that is the whole mechanism keeping the profile surfaces honest about
 * the format an answer was given in.
 */
export const CONTROL = {
  /* OptionPills, single. Stored as one option string. */
  SINGLE: "single",

  /* OptionPills with multi. Stored as an array of option strings. */
  MULTI: "multi",

  /* MultiSelectWithOther — a MULTI whose "Other" pill reveals a free-text input.
     The text lands in the entry's `specifyKey`, never appended to the array. */
  MULTI_OTHER: "multiOther",

  /* TextField — one line of free text. */
  TEXT: "text",

  /* TextAreaField — multi-line free text. */
  TEXTAREA: "textarea",

  /* TagInputField — optional list answers committed on comma or Enter. */
  TAGS: "tags",

  /* DateField. Stored as the raw "YYYY-MM-DD" the input produced, never an ISO
     timestamp — see the payload builders on why calling toISOString() here
     shifts the date a day west of Greenwich. */
  DATE: "date",

  /* DayScheduleField. Stored as the seven-day object, including unchecked days. */
  DAY_SCHEDULE: "daySchedule",

  /* OptionPills for the count, plus ChildrenAgesField rows for the ages. One
     question, two stored keys — the count in `dbKey`, the rows in `alsoWrites`. */
  COUNT_WITH_AGES: "countWithAges",

  /* Two stacked RateGroupFields, shared and solo, inside one question. Writes
     the two tokens plus rateType and the numeric `budget` the browse filter
     reads. */
  RATE_GROUP: "rateGroup",

  /* BudgetPills — the family's single hourly-budget question. Its display text
     and its stored value are deliberately different strings; see BUDGET_OPTIONS. */
  BUDGET_PILLS: "budgetPills",

  /* PhotoUploadField. */
  PHOTO: "photo",
};

/*
 * Does this entry's reveal condition hold for `value`?
 *
 * Two shapes of reveal exist across the wizards and this collapses them: an
 * equality test ("Yes" reveals the school name) and an inclusion test ("Near my
 * workplace" among several selected locations reveals the work address). Both
 * are written as `reveal.when` on the manifest entry, and consumers ask this
 * rather than reimplementing the test per question — which is how the wizard and
 * the edit form come to disagree about when a field is visible.
 */
export function isRevealed(value, when) {
  if (when === undefined || when === null) return false;
  if (Array.isArray(value)) return value.includes(when);
  return value === when;
}
