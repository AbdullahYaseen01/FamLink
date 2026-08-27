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

/*
 * Years of childcare experience.
 *
 * Not in the mockup, and not numbered with the rest: the mockup's ids run q1-q18
 * with no gaps, so inserting a number here would renumber every question after
 * it across this config, the validation, the payload and the spec docs. A named
 * id costs nothing and the other nanny questionnaire already does this with qBio.
 *
 * The retired 5-screen intake asked this and the wizards dropped it. Nothing
 * queries the field — the value is worth 10 points in
 * Services/utils/profileCompleteness.js, which capped every wizard-onboarded
 * nanny below 100%, and Services/utils/shareProfile.js renders it on the public
 * share page, where it was coming through as null.
 *
 * Three of the four strings are byte-identical to the retired Screen1.jsx list,
 * so they stay comparable with the profiles that reached Mongo through the Google
 * Sheet round-trip in Components/Login/login.jsx. Only its malformed first option
 * ("1-0 year") is corrected.
 */
export const EXPERIENCE_OPTIONS = [
  "Less than 1 year",
  "1-3 years",
  "3-5 years",
  "5+ years",
];

/*
 * The question text itself, keyed by the same ids as OPTIONS.
 *
 * Lifted out of the QuestionBlock literals in steps/ for the reason spelled out
 * in the family config: this file was authoritative for every option string but
 * not for the questions those options answer, so every surface outside the
 * wizard had to retype them.
 *
 * `step` is the step the question renders on, and the key order below is the
 * on-screen order within that step — note qExperience sits between q2 and q3,
 * which is where it renders and not where its name would sort.
 *
 * `sharedLabel` / `soloLabel` on q12 are the two sub-labels inside the one rate
 * question; the profile manifest needs them to render the pair as a pair.
 */
export const QUESTIONS = {
  q1: { label: "Have you worked in a nanny share before?", step: 1 },
  q2: {
    label: "Are you comfortable caring for children from multiple families?",
    step: 1,
  },
  qExperience: {
    label: "How many years of childcare experience do you have?",
    step: 1,
  },
  q3: { label: "How many children are you most comfortable caring for?", step: 1 },
  q4: { label: "What ages do you prefer to work with?", step: 1 },
  q5: {
    label: "What type of hosting arrangement are you comfortable with?",
    step: 1,
  },
  q6: { label: "Select your available working days and times", step: 2 },
  q7: { label: "When are you available to start?", step: 2 },
  q8: { label: "What would your role typically include?", step: 3 },
  q9: { label: "Are you open to helping with household tasks?", step: 3 },
  q10: { label: "Do you have your own reliable transportation?", step: 3 },
  q11: { label: "Are you open to undergoing a background check?", step: 3 },
  q12: {
    label: "Set your nanny share rate",
    step: 4,
    sharedLabel: "Shared-care rate",
    soloLabel: "Solo rate",
  },
  q13: { label: "What languages do you speak?", step: 4 },
  q14: {
    label: "Do you have any certifications?",
    step: 4,
    placeholder: "e.g. CPR Certified, First Aid, ECE...",
  },
  q15: {
    label: "Additional certifications or training",
    step: 4,
    placeholder: "e.g. Newborn Care Specialist, Sleep Training Certification...",
  },
  q16: {
    label: "List any special skills",
    step: 4,
    placeholder: "e.g. Bilingual, Newborn care, Sleep training, Tutoring, Swimming...",
  },
  q17: {
    label: "Write a short bio",
    step: 5,
    placeholder:
      "Tell families about your childcare experience, the type of position you're looking for, and what you enjoy about working with children.",
  },
  q18: { label: "Add a profile photo", step: 5 },
};

export const OPTIONS = {
  q1: ["Yes", "No"],
  q2: ["Yes", "No"],
  qExperience: EXPERIENCE_OPTIONS,
  q3: ["1–2", "2–3", "3–4", "Flexible"],
  q4: Object.keys(AGE_RANGES),
  q5: [
    "One family's home",
    "Rotate between families' homes",
    "Neutral location — another agreed-upon location",
    "Flexible / no preference",
  ],
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
 * The list itself lives in the kit: the other nanny questionnaire asks the same
 * question with the same ten ranges, and the stored tokens are load-bearing, so
 * one list rather than two transcriptions that could drift. Re-exported here so
 * the step keeps importing every option it renders from one config.
 */
export { RATE_OPTIONS } from "../OnboardingKit/fields/rateOptions";

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
  1: ["q1", "q2", "qExperience", "q3", "q4", "q5"],
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
  qExperience: "Please select an option to continue.",
  q3: "Please select an option to continue.",
  q4: "Please select at least one option to continue.",
  q5: "Please select an option to continue.",
  q6: "Please select at least one day to continue.",
  q7: "Please select a start date to continue.",
  q8: "Please select at least one option to continue.",
  q9: "Please select an option to continue.",
  q10: "Please select an option to continue.",
  q11: "Please select an option to continue.",
  q12: "Please select a shared-care rate and enter your solo rate range to continue.",
  q17: "Please write a short bio to continue.",
  q18: "Please add a profile photo to continue.",
};

/*
 * Stored workSetup answers that today's OPTIONS.q5 phrase differently.
 * Kept off the global alias map because "Rotating between homes" rewrites to a
 * different string on the family and Flow 2 lists.
 */
export const WORK_SETUP_ALIASES = {
  "one home": "One family's home",
  "rotating between homes": "Rotate between families' homes",
  "rotating homes": "Rotate between families' homes",
  either: "Flexible / no preference",
};
