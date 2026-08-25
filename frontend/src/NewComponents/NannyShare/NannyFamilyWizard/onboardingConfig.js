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
/*
 * Years of childcare experience. Named rather than numbered, like qBio: the
 * mockup's ids already skip q4 and run to q27, and slotting a number in here
 * would renumber the questions after it across this config, the validation, the
 * payload and the spec doc.
 *
 * Same list and same reasoning as the other nanny questionnaire — the retired
 * intake asked it, the wizards dropped it, and the value is worth 10 points in
 * Services/utils/profileCompleteness.js (which scores both nanny flows through
 * CAREGIVER_CHECKS) plus a rendered field on the public share page. Duplicated
 * rather than imported across wizards, as every other option list here is.
 */
export const EXPERIENCE_OPTIONS = [
  "Less than 1 year",
  "1-3 years",
  "3-5 years",
  "5+ years",
];

/*
 * The question text itself, keyed by the same ids as OPTIONS — so the numbering
 * gap at q4 is here too, deliberately, for the reason at the top of this file.
 *
 * Lifted out of the QuestionBlock literals in steps/ so this config is
 * authoritative for the questions as well as their answers; every surface
 * outside the wizard used to retype them.
 *
 * `step` is the step the question renders on, and the key order below is the
 * on-screen order within that step — qExperience renders between q3 and q5, and
 * qBio between q26 and q27, which is where they sit here.
 *
 * `sharedLabel` / `soloLabel` on q19 are the two sub-labels inside the one rate
 * question; the profile manifest needs them to render the pair as a pair.
 */
export const QUESTIONS = {
  q1: { label: "Who is this nanny share for?", step: 1 },
  q2: { label: "How many children are currently in your care?", step: 1 },
  q3: { label: "What are their ages?", step: 1 },
  qExperience: {
    label: "How many years of childcare experience do you have?",
    step: 1,
  },
  q5: { label: "What schedule are you currently working?", step: 1 },
  q6: { label: "When would a second family join?", step: 1 },
  q7: { label: "Would the children be together at the same time?", step: 1 },
  q8: { label: "How many additional children can join the share?", step: 2 },
  q9: { label: "Where would care take place?", step: 2 },
  q10: { label: "When would you like to start a nanny share?", step: 2 },
  q11: { label: "How flexible is your schedule?", step: 2 },
  q12: { label: "How close should the other family be?", step: 2 },
  q13: { label: "What type of child would be the best fit?", step: 3 },
  q14: {
    label: "Do the children currently attend school or daycare?",
    step: 3,
    placeholder: "Which school or daycare do they attend? (optional)",
  },
  q15: {
    label: "Any allergies or health considerations?",
    step: 3,
    placeholder: "e.g. Peanut allergy, asthma, medication needs...",
  },
  q16: {
    label: "What does a typical day look like?",
    step: 3,
    placeholder:
      "Include meals, naps, school, outdoor time, activities, or anything else that is part of the children's routine.",
  },
  q17: {
    label: "Any important routines or preferences?",
    step: 3,
    placeholder:
      "e.g. Nap at 1pm, no screen time before 3pm, outdoor play every afternoon...",
  },
  q18: {
    label: "What would you expect from a nanny share setup?",
    step: 4,
    placeholder:
      "Include responsibilities, sick days, vacations, guaranteed hours, communication, or anything else important to the arrangement.",
  },
  q19: {
    label: "Set your nanny share rate",
    step: 4,
    sharedLabel: "Shared-care rate",
    soloLabel: "Solo-care rate",
  },
  q20: { label: "How do you typically communicate?", step: 4 },
  q21: {
    label: "What matters most when matching with another family?",
    step: 4,
    placeholder: "e.g. Similar parenting values, compatible schedules, proximity...",
  },
  q22: { label: "What languages do you speak?", step: 4 },
  q23: { label: "Are there pets in the home?", step: 5 },
  q24: {
    label: "Are you comfortable with the other family having pets?",
    step: 5,
  },
  q25: {
    label: "Anything else another family should know?",
    step: 5,
    placeholder: "Add any additional notes here...",
  },
  q26: { label: "Do you have any certifications?", step: 5 },
  qBio: {
    label: "Write a short bio",
    step: 5,
    placeholder:
      "Tell families about your childcare experience, the type of share you're looking for, and what you enjoy about working with children.",
  },
  q27: { label: "Upload a profile photo", step: 5 },
};

export const OPTIONS = {
  q1: ["A family I currently work with", "Myself — I'm bringing my own child"],
  qExperience: EXPERIENCE_OPTIONS,
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

export function isOwnChild(forWho) {
  return String(forWho || "").includes("Myself");
}

export function q2Label(forWho) {
  return isOwnChild(forWho)
    ? "How many children are you bringing?"
    : QUESTIONS.q2.label;
}

export function q5Label(forWho) {
  return isOwnChild(forWho)
    ? "What schedule would you work?"
    : QUESTIONS.q5.label;
}

export function q9Options(forWho) {
  return OPTIONS.q9.map((opt, i) =>
    i === 0 ? { value: opt, label: isOwnChild(forWho) ? "My home" : opt } : opt,
  );
}

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
 * - qExperience. Also not in the mockup: the retired intake asked it, both new
 *   nanny flows dropped it, and profileCompleteness scores it. See OPTIONS.
 */
export const REQUIRED_BY_STEP = {
  1: ["q1", "q2", "q3", "qExperience", "q5", "q6", "q7"],
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
  qExperience: "Please select an option to continue.",
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
