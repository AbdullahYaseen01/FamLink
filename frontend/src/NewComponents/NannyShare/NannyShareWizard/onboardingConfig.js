/*
 * Every option string, step heading and validation rule for the nanny
 * "looking for a share position" wizard.
 *
 * ── Source of truth ────────────────────────────────────────────────────────
 *
 * Transcribed mechanically from docs/onboarding-nanny-flow1-mockup.html (the
 * option markup and validateStep()), not from onboarding-nanny-flow1-specs.md.
 * The spec markdown mangles the rate question into unreadable fragments
 * ("25– 30/hr"), so the mockup is authoritative for every option string.
 *
 * Two rules here deliberately go beyond the mockup's validateStep(), which is
 * wrong in two places — see REQUIRED_BY_STEP.
 *
 * The em/en dashes below are load-bearing, not typography: Q4's labels are the
 * keys of AGE_RANGES.
 */

export const TOTAL_STEPS = 5;

/* Rail labels, card headings and sub-headings, verbatim from the mockup panels.
 * Unlike the family mockup, this one's footer agrees with its own rail — every
 * panel reads "Step N of 5". */
export const STEPS = [
  {
    n: 1,
    label: "Share Fit",
    heading: "Let's find the right nanny share for you.",
    sub: "Tell FAM about your experience and the type of share you're comfortable with.",
  },
  {
    n: 2,
    label: "Availability",
    heading: "When are you available?",
    sub: "Add the days and times that work for your schedule.",
  },
  {
    n: 3,
    label: "Role Details",
    heading: "What would you like your role to include?",
    sub: "Select the responsibilities and work arrangements that fit you.",
  },
  {
    n: 4,
    label: "Rate & Skills",
    heading: "Tell us about your rate and qualifications.",
    sub: "This helps FAM connect you with families whose needs match your experience.",
  },
  {
    n: 5,
    label: "Profile",
    heading: "Finish your nanny profile.",
    sub: "Introduce yourself so families can get to know you.",
  },
];

/*
 * Q4. The one question in this flow whose stored value is queried as a number:
 * share.controller.js compares preferredAges.min/.max against the family's
 * childrenAges.value, so every label has to resolve to a real range.
 *
 * OPTIONS.q4 is derived from these keys rather than written out a second time.
 * The separator is an em-dash (U+2014) and the ranges use en-dashes (U+2013);
 * one wrong glyph in a duplicated list would store {label, min: undefined,
 * max: undefined}, which matches no age filter and fails silently. Deriving
 * makes that mismatch impossible rather than merely unlikely.
 *
 * Not the AGE_LABEL_MAP from the retired Screen4.jsx: its keys are the
 * lowercased parenthetical form ("infants (0–1)") that OnboardingOptionSelector
 * produced, and none of them match these strings.
 */
export const AGE_RANGES = {
  "Infants — 0–1": { min: 0, max: 1 },
  "Toddlers — 1–3": { min: 1, max: 3 },
  "Preschool — 3–5": { min: 3, max: 5 },
  "School-age — 5+": { min: 5, max: 100 },
};

export const OPTIONS = {
  q1: ["Yes", "No"],
  q2: ["Yes", "No"],
  q3: ["1–2", "2–3", "3–4", "Flexible"],
  q4: Object.keys(AGE_RANGES),
  q5: ["One home", "Rotating between homes", "Either"],
  q8: [
    "Childcare",
    "Meal / snack preparation",
    "Educational activities",
    "Outdoor play",
    "Transportation",
    "Homework help",
    "Nap / bedtime routines",
  ],
  q9: [
    "Yes — both child-related and family-related",
    "Child-related tasks only",
    "No — childcare only",
  ],
  q10: ["Yes", "No"],
  q11: ["Yes", "No"],
  q13: [
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
  q14: [
    "CPR Certified",
    "First Aid Certified",
    "Early Childhood Education (ECE)",
    "TrustLine Registered",
    "None",
    "Other",
  ],
};

/*
 * Q12. Two stacked single-selects inside one question block.
 *
 * `label` is what the mockup renders; `value` is what gets stored, and the two
 * cannot be the same string. The values are byte-identical to the RANGES table
 * in the CompleteProfile/Step5.jsx this wizard replaces, so profiles saved
 * through the old flow and through this one stay comparable — and parseRange()
 * in onboardingPayload.js already knows that shape.
 *
 * "$45+/hr" -> "45-50+" and "$40+/hr" -> "40-45+" look like a mismatch and are
 * not: parseRange parseFloats the leading number whenever a "+" is present and
 * estimates the upper bound from it, so the trailing figure is never read.
 */
export const RATE_OPTIONS = {
  shared: [
    { label: "$25–$30/hr", value: "25-30" },
    { label: "$30–$35/hr", value: "30-35" },
    { label: "$35–$40/hr", value: "35-40" },
    { label: "$40–$45/hr", value: "40-45" },
    { label: "$45+/hr", value: "45-50+" },
  ],
  solo: [
    { label: "$20–$25/hr", value: "20-25" },
    { label: "$25–$30/hr", value: "25-30" },
    { label: "$30–$35/hr", value: "30-35" },
    { label: "$35–$40/hr", value: "35-40" },
    { label: "$40+/hr", value: "40-45+" },
  ],
};

/* Options that clear their group and stand alone. */
export const EXCLUSIVE = {
  q14: ["None"],
};

/*
 * Which questions block Continue, per step.
 *
 * Order within each list is the on-screen order, because scrollToFirstError
 * walks it to decide which error is "first".
 *
 * q12 and q18 are additions over the mockup's validateStep(), which has both
 * wrong. Step 4's checks list is empty even though the rate question carries a
 * `*` and ships its own error string, and step 5 checks only the bio even
 * though the photo carries a `*` too. Both specs say Required: Yes.
 */
export const REQUIRED_BY_STEP = {
  1: ["q1", "q2", "q3", "q4", "q5"],
  2: ["q6", "q7"],
  3: ["q8", "q9", "q10", "q11"],
  4: ["q12"],
  5: ["q17", "q18"],
};

/* Error copy, verbatim from the mockup's .error-msg elements. q18 is the one
 * string the mockup does not carry, because it never checks the photo. */
export const ERROR_MESSAGES = {
  q1: "Please select an option to continue.",
  q2: "Please select an option to continue.",
  q3: "Please select an option to continue.",
  q4: "Please select at least one option to continue.",
  q5: "Please select an option to continue.",
  q6: "Please select at least one day to continue.",
  q7: "Please select a start date to continue.",
  q8: "Please select at least one option to continue.",
  q9: "Please select an option to continue.",
  q10: "Please select an option to continue.",
  q11: "Please select an option to continue.",
  q12: "Please select both a shared-care and solo-care rate to continue.",
  q17: "Please write a short bio to continue.",
  q18: "Please add a profile photo to continue.",
};
