/*
 * Every option string, step heading and validation rule for the nanny
 * "with a family, looking for a share" wizard.
 *
 * ── Source of truth ────────────────────────────────────────────────────────
 *
 * Transcribed mechanically from docs/onboarding-nanny-flow2-mockup.html (the
 * option markup and validateStep()), not from onboarding-nanny-flow2-specs.md.
 * The spec markdown mangles the rate question into unreadable fragments
 * ("25– 30/hr") and drops the em/en dashes, so the mockup is authoritative for
 * every option string.
 *
 * ── The numbering gap is not a bug ─────────────────────────────────────────
 *
 * The mockup's question ids run q1, q2, q3, q5, q6, q7 — there is no q4 and no
 * qb-4. The spec numbers the same questions 1,2,3,4,6,7, so what the spec calls
 * "Q4" is this file's `q5`. The config is numbered off the MOCKUP, because that
 * is where the option strings and the error copy come from and a second
 * numbering would make every cross-reference ambiguous. Do not "fix" the gap.
 *
 * Two rules here deliberately go beyond the mockup's validateStep() — see
 * REQUIRED_BY_STEP.
 */

export const TOTAL_STEPS = 5;

/* Rail labels, card headings and sub-headings, verbatim from the mockup panels.
 * Every panel's footer reads "Step N of 5" and agrees with its own rail. */
export const STEPS = [
  {
    n: 1,
    label: "Current Setup",
    heading: "Tell us about your current care arrangement.",
    sub: "This helps FAM understand who is already part of the nanny share.",
  },
  {
    n: 2,
    label: "Share Details",
    heading: "How would the nanny share work?",
    sub: "Add the schedule, location, and hosting details for the second family.",
  },
  {
    n: 3,
    label: "Children & Routine",
    heading: "What would be the best fit for the children?",
    sub: "Tell FAM about the ideal age match and the current daily routine.",
  },
  {
    n: 4,
    label: "Expectations",
    heading: "What are you looking for in the new share?",
    sub: "Add your expectations, rate, and matching preferences.",
  },
  {
    n: 5,
    label: "Home & Profile",
    heading: "A few final details.",
    sub: "Tell families about the home environment and finish your profile.",
  },
];

/*
 * The em dash in q1 (U+2014) and the en dashes in q12 (U+2013) are transcribed
 * from the mockup, not typed. Nothing queries them — unlike the other nanny
 * flow's age labels, no string here is a lookup key — but they are what the
 * design renders and what LoginAsNanny/editProfile.jsx has to match to rehydrate
 * the answer.
 */
export const OPTIONS = {
  q1: ["A family I currently work with", "Myself — I'm bringing my own child"],
  /* Drives the CURRENT children age rows. "3+" renders three rows and stores
     numberOfChildren: 3, matching the mockup's updateChildren(3). */
  q2: ["1", "2", "3+"],
  q3: ["Infant", "Toddler", "Preschool", "School-age"],
  /* The one question in this flow whose answer is lowercased on the way out —
     it also writes careType, which share.controller.js queries. See the payload. */
  q5: ["Full-time", "Part-time", "Flexible"],
  q6: ["Same schedule", "Partially overlapping", "Filling gaps", "Flexible"],
  q7: ["Yes", "Sometimes", "No"],
  /* Drives the ADDITIONAL children age rows. A separate list from q2's: these
     are the children who would join, not the ones already in her care. */
  q8: ["1", "2", "3"],
  q9: [
    "Current family's home",
    "Other family's home",
    "Rotating between homes",
    "Neutral location",
  ],
  q11: ["Very flexible", "Somewhat flexible", "Fixed"],
  q12: ["1–2 miles", "3–5 miles", "5–10 miles", "Flexible"],
  q13: ["Similar age", "Younger", "Older", "Flexible"],
  q14: ["Yes", "No"],
  q20: ["Text", "Phone calls", "In person", "Flexible"],
  q22: [
    "English",
    "Spanish",
    "Mandarin",
    "Cantonese",
    "French",
    "Japanese",
    "Korean",
    "Tagalog",
    "American Sign Language (ASL)",
    "Other",
  ],
  q23: ["Yes", "No"],
  /* The multi group q23's "Yes" reveals. */
  q23Pets: ["Dog(s)", "Cat(s)", "Small animals", "Birds", "Other"],
  q24: ["Yes", "No"],
  /*
   * Deliberately SHORTER than the other nanny flow's certifications list — no
   * ECE, no TrustLine. Both flows store the answer in `certifications`; both
   * specs ask for their own list, so they are not unified.
   */
  q26: ["CPR Certified", "First Aid Certified", "None", "Other"],
};

/*
 * Q19. Two stacked single-selects inside one question block.
 *
 * The list lives in the kit: the other nanny questionnaire asks the same
 * question with the same ten ranges, and the stored tokens are load-bearing.
 * Re-exported so the step imports every option it renders from one config.
 */
export { RATE_OPTIONS } from "../OnboardingKit/fields/rateOptions";

/* Options that clear their group and stand alone. */
export const EXCLUSIVE = {
  q26: ["None"],
};

/*
 * Which answer reveals a question's conditional field.
 *
 * Named here rather than compared against a literal "Yes" in the step, so the
 * step that shows the field and the payload that decides whether to send its
 * value cannot drift onto different strings.
 */
export const CONDITIONAL = {
  q14: "Yes", // reveals the school / daycare name
  q23: "Yes", // reveals the pet-type multi group
};

/*
 * Which questions block Continue, per step.
 *
 * Order within each list is the on-screen order, because scrollToFirstError
 * walks it to decide which error is "first".
 *
 * Two additions over the mockup's validateStep():
 *
 * - q19 (rate). The mockup's step 4 checks only [['qb-20','opts']], even though
 *   the rate block carries a `*` and ships its own error string. The spec says
 *   Required: Yes (must select both).
 * - qBio. Not in the mockup or the spec at all — see ERROR_MESSAGES.
 */
export const REQUIRED_BY_STEP = {
  1: ["q1", "q2", "q3", "q5", "q6", "q7"],
  2: ["q8", "q9", "q10", "q11", "q12"],
  3: ["q13", "q14"],
  4: ["q19", "q20"],
  5: ["q23", "q24", "qBio"],
};

/*
 * Error copy, verbatim from the mockup's .error-msg elements.
 *
 * qBio is the exception, and so is the question itself: this flow's mockup has
 * no bio question anywhere, but `bio` is what the nanny cards, Search/ViewProfile
 * and the public /share/:token page print as the blurb — so every nanny who
 * finished this questionnaire would have shipped a blank one. The question and
 * this string are the other nanny flow's Q17, transferred whole so the two
 * questionnaires ask for a bio in the same words.
 */
export const ERROR_MESSAGES = {
  q1: "Please select an option to continue.",
  q2: "Please select an option to continue.",
  q3: "Please select at least one option to continue.",
  q5: "Please select an option to continue.",
  q6: "Please select an option to continue.",
  q7: "Please select an option to continue.",
  q8: "Please select an option to continue.",
  q9: "Please select an option to continue.",
  q10: "Please select a start date to continue.",
  q11: "Please select an option to continue.",
  q12: "Please select an option to continue.",
  q13: "Please select an option to continue.",
  q14: "Please select an option to continue.",
  q19: "Please select both a shared-care and solo-care rate to continue.",
  q20: "Please select an option to continue.",
  q23: "Please select an option to continue.",
  q24: "Please select an option to continue.",
  qBio: "Please write a short bio to continue.",
};
