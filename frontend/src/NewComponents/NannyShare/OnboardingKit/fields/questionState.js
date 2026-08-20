import { createContext, useContext } from "react";

/*
 * The non-component half of QuestionBlock. Separate file so both it and the
 * field components can import from here without any of them exporting a
 * non-component alongside a component (react-refresh/only-export-components).
 */

/*
 * Lets the control inside a question redden its own border without every step
 * threading the same flag twice — once to QuestionBlock for the label and icon,
 * once to the input. Anything rendered outside a block just reads false.
 */
export const QuestionInvalidContext = createContext(false);

export function useQuestionInvalid() {
  return useContext(QuestionInvalidContext);
}

/*
 * The pill label that turns a question's answer into free text.
 *
 * Lives here rather than in a wizard's config because all three wizards use the
 * same string and MultiSelectWithOther has to know it. Named rather than
 * positional so reordering an option list cannot quietly change which pill is
 * special. onboardingConfig.js re-exports it for the family flow's existing
 * importers.
 */
export const OTHER_LABEL = "Other";

/*
 * DOM id for a question, derived from its config key (`q1` → `famwiz-q1`).
 *
 * Derived rather than looked up in a key→id table, so the error map and the
 * scroll target cannot drift apart. Prefixed because a bare `q1` is generic
 * enough to collide with something else on the page.
 */
export function questionDomId(key) {
  return `famwiz-${key}`;
}

/*
 * Scrolls to the first question that failed validation, matching the mockup's
 * validateStep().
 *
 * Takes the step's required keys in question order rather than deriving order
 * from the error map: Object.keys order is insertion order, which would make
 * "first error" mean "first one validated" rather than "topmost on screen".
 */
export function scrollToFirstError(orderedKeys, errors) {
  const firstKey = orderedKeys.find((key) => errors?.[key]);
  if (!firstKey) return;
  document
    .getElementById(questionDomId(firstKey))
    ?.scrollIntoView({ behavior: "smooth", block: "center" });
}
