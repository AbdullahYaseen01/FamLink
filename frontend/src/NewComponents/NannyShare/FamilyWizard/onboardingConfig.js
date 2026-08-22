/*
 * Every option string, step heading and validation rule for the family
 * onboarding wizard.
 *
 * ── Source of truth ────────────────────────────────────────────────────────
 *
 * Transcribed mechanically from docs/onboarding-family-mockup.html (the option
 * markup and validateStep()), not hand-typed and not taken from
 * Config/helpFunction.jsx. The stepNData exports there are garbled and would
 * silently ship broken copy: step3Data collapses three parenting styles into a
 * single option "Montessori Attachment parenting RIE", step12Data has "Asthma
 * Medication needs", step4Data has "Outdoor play Errands". Those exports are
 * removed once their last importer is gone.
 *
 * The em/en dashes below are deliberate and come from the mockup. Q19 is the one
 * place display text and stored value must differ -- see BUDGET_OPTIONS.
 */

/*
 * Five, not the six the mockup panels describe. The mockup's step 6 held only
 * Q22 (open note) and Q23 (photo), both optional — a whole screen that Continue
 * could never block on — and the flow is specified at five steps. Q22 and Q23 now
 * close out step 5, which the spec already listed Q22 under.
 */
export const TOTAL_STEPS = 5;

/* Rail labels, card headings and sub-headings, verbatim from the mockup panels. */
export const STEPS = [
  {
    n: 1,
    label: "Share Needs",
    heading: "Let's start with what you're looking for.",
    sub: "Tell FAM what kind of nanny share would work for your family.",
  },
  {
    n: 2,
    label: "Children",
    heading: "Tell us about your children.",
    sub: "This helps FAM find families with compatible care needs.",
  },
  {
    n: 3,
    label: "Schedule & Care",
    heading: "What kind of care does your family need?",
    sub: "Add your schedule and the support you'd like from your nanny.",
  },
  {
    n: 4,
    label: "Preferences",
    heading: "What would make a share work well for your family?",
    sub: "Tell FAM about your home, parenting style, and caregiver preferences.",
  },
  {
    n: 5,
    label: "Location & Notes",
    heading: "A few final details.",
    sub: "FAM will use this information to find compatible families nearby. Add a note and a photo to make a great first impression.",
  },
];

/*
 * The question text itself, keyed by the same ids as OPTIONS.
 *
 * These used to be string literals on each QuestionBlock in steps/. That made
 * this file authoritative for every option string but NOT for the questions
 * those options answer — so anything outside the wizard that needed a label
 * (the profile views, both edit forms) had to retype it, and four hand-typed
 * copies of one sentence is precisely the drift this config exists to prevent.
 *
 * `step` is the step the question renders on, and the order of the keys below is
 * the on-screen order within that step. Config/profileFields reads both to build
 * the profile manifest, so a question that moves steps moves on every surface at
 * once.
 *
 * `placeholder` is the free-text input the question owns — its own field for q6
 * and q22, the "Other" reveal for q1, the "Near my workplace" reveal for q18. No
 * question here owns two, which is why one key is enough.
 */
export const QUESTIONS = {
  q1: {
    label: "What type of nanny share are you looking for?",
    step: 1,
    placeholder: "Please specify...",
  },
  q2: { label: "Do you already have a nanny?", step: 1 },
  q3: { label: "When do you want to start the nanny share?", step: 1 },
  q4: { label: "How urgent is your childcare search?", step: 1 },
  q5: { label: "How many children need care?", step: 2 },
  q6: {
    label: "Which school(s) do they attend?",
    step: 2,
    placeholder: "e.g. Piedmont Elementary, Montclair Nursery School",
  },
  q7: { label: "Any allergies or health considerations?", step: 2 },
  q8: { label: "What days and times do you need care?", step: 3 },
  q9: { label: "How flexible are you with scheduling?", step: 3 },
  q10: { label: "Child-related responsibilities", step: 3 },
  q11: { label: "Daily routines or activities to include", step: 3 },
  q12: { label: "Household add-ons", step: 3 },
  q13: { label: "Hosting preference", step: 4 },
  q14: { label: "Do you have pets?", step: 4 },
  q15: { label: "Parenting style or philosophy", step: 4 },
  q16: { label: "Preferred nanny language(s)", step: 4 },
  q17: { label: "House rules or guidelines", step: 4 },
  q18: {
    label: "Where are you open to having the share take place?",
    step: 5,
    placeholder: "Work location or nearest major intersection",
  },
  q19: { label: "Hourly budget for a nanny share", step: 5 },
  q20: { label: "Preferred communication with another family", step: 5 },
  q21: { label: "Backup care if nanny is unavailable", step: 5 },
  q22: {
    label: "Anything else another family should know?",
    step: 5,
    placeholder: "Add any additional notes here...",
  },
  q23: { label: "Add a profile photo", step: 5 },
};

export const OPTIONS = {
  q1: [
    "Full-time",
    "Part-time",
    "Other",
  ],
  q2: [
    "Yes — we already have a nanny",
    "No — we are looking for a nanny",
  ],
  q4: [
    "Urgent — I need care soon",
    "Actively looking",
    "Just exploring",
  ],
  q5: [
    "1",
    "2",
    "3",
    "4",
  ],
  q7: [
    "Food allergies",
    "Environmental allergies",
    "Asthma",
    "Medication needs",
    "None",
    "Other",
  ],
  q9: [
    "Very flexible",
    "Somewhat flexible",
    "Not flexible",
  ],
  q10: [
    "Transportation",
    "Educational activities",
    "Outdoor play",
    "Storytime / reading",
    "Meal / snack prep for kids",
    "Homework help",
    "Nap / bedtime support",
    "Not applicable",
  ],
  q11: [
    "Nap times",
    "Outdoor play",
    "Educational activities",
    "Structured meal times",
    "Storytime",
    "Arts and crafts",
    "Playdates / outings",
    "Not applicable",
  ],
  q12: [
    "Light housekeeping",
    "Grocery shopping",
    "Errands",
    "Meal prep for the family",
    "Not applicable",
  ],
  q13: [
    "My home",
    "The other family's home",
    "Rotate between homes",
    "Neutral location — e.g. another agreed upon location",
    "Flexible / no preference",
  ],
  q14: [
    "No pets",
    "Dog(s)",
    "Cat(s)",
    "Small animals",
    "Birds",
    "Other",
  ],
  q15: [
    "Montessori",
    "Attachment parenting",
    "RIE",
    "Authoritative",
    "Permissive",
    "Strict",
    "Flexible",
    "Other",
  ],
  q16: [
    "English",
    "Spanish",
    "Mandarin",
    "Cantonese",
    "French",
    "Japanese",
    "Korean",
    "Tagalog",
    "American Sign Language (ASL)",
    "No preference",
    "Other",
  ],
  q17: [
    "Screen time limits",
    "Dietary restrictions",
    "Behavior expectations",
    "Hygiene practices",
    "Chore responsibilities",
    "Other",
  ],
  q18: [
    "Near our home / in our neighborhood",
    "Nearby neighborhoods (within ~10–15 min)",
    "Anywhere in the city that's reasonably close",
    "Near my workplace",
  ],
  q20: [
    "Group chat",
    "Shared calendar",
    "Email updates",
    "Phone calls",
    "Regular in-person meetings",
    "Other",
  ],
  q21: [
    "Family members",
    "Backup nanny service",
    "Friends or neighbors",
    "Local daycare",
    "No backup options",
    "Other",
  ],
};

/*
 * Q19. `total` and `per` are what the cards display; `value` is what gets
 * stored. They cannot be the same string, and the difference is load-bearing:
 *
 *  - The mockup renders en-dashes ($10–$15), so the cards do too.
 *  - parseHourlyRate() in Config/helpFunction.jsx matches /\$N\s*-\s*\$N/ and
 *    /\(each family pays \$N\s*-\s*\$N\)/i, i.e. ASCII hyphens. An en-dash
 *    value parses to {} and the profile silently loses its budget.
 *
 * The seven `value` strings are byte-identical to step7Data.first in the
 * retired PostANannyShare/step7.jsx and to findMatchingRate's rangeData, so
 * deparseHourlyRate round-tripping in the edit forms and the rate matching on
 * profile cards both keep working. Verified: all seven parse to
 * {min,max,minShare,maxShare}, and $40+ to {min,minShare} as that branch
 * intends.
 *
 * Do not "fix" the display to match the stored string, or vice versa.
 */
export const BUDGET_OPTIONS = [
  { total: "$10–$15 total", per: "Each family pays $5–$7.50", value: "$10 - $15 per hour (Each family pays $5 - $7.50)" },
  { total: "$15–$20 total", per: "Each family pays $7.50–$10", value: "$15 - $20 per hour (Each family pays $7.50 - $10)" },
  { total: "$20–$25 total", per: "Each family pays $10–$12.50", value: "$20 - $25 per hour (Each family pays $10 - $12.50)" },
  { total: "$25–$30 total", per: "Each family pays $12.50–$15", value: "$25 - $30 per hour (Each family pays $12.50 - $15)" },
  { total: "$30–$35 total", per: "Each family pays $15–$17.50", value: "$30 - $35 per hour (Each family pays $15 - $17.50)" },
  { total: "$35–$40 total", per: "Each family pays $17.50–$20", value: "$35 - $40 per hour (Each family pays $17.50 - $20)" },
  { total: "$40+ total", per: "Each family pays $20+", value: "$40+ per hour (Each family pays $20+)" },
];

/*
 * Options that clear their group and stand alone. Selecting any other option in
 * the group drops these.
 */
export const EXCLUSIVE = {
  q7: ["None"],
  q10: ["Not applicable"],
  q11: ["Not applicable"],
  q12: ["Not applicable"],
  q14: ["No pets"],
  q16: ["No preference"],
  q21: ["No backup options"],
};

export const OTHER_REVEAL = ["q1", "q7", "q14", "q15", "q16", "q17", "q20", "q21"];

/*
 * Which questions block Continue, per step. Straight from the mockup's
 * validateStep() checks map.
 *
 * Order within each list is the on-screen order, because scrollToFirstError
 * walks it to decide which error is "first".
 *
 * Step 5 ends with Q21, Q22 and Q23, all optional — so the final CTA blocks on
 * Q18-Q20 and nothing else.
 */
export const REQUIRED_BY_STEP = {
  1: ["q1", "q2", "q3", "q4"],
  2: ["q5", "q7"],
  3: ["q8", "q9", "q10"],
  4: ["q13", "q14"],
  5: ["q18", "q19", "q20"],
};

/* Error copy, verbatim from the mockup's .error-msg elements. */
export const ERROR_MESSAGES = {
  q1: "Please select an option to continue.",
  q2: "Please select an option to continue.",
  q3: "Please select a start date to continue.",
  q4: "Please select an option to continue.",
  q5: "Please select the number of children to continue.",
  q7: "Please select at least one option to continue.",
  q8: "Please select at least one day to continue.",
  q9: "Please select an option to continue.",
  q10: "Please select at least one option to continue.",
  q13: "Please select an option to continue.",
  q14: "Please select at least one option to continue.",
  q18: "Please select at least one option to continue.",
  q19: "Please select a budget range to continue.",
  q20: "Please select at least one option to continue.",
};

/* The Q1 pill that turns the answer into free text, and the Q18 pill that
 * reveals the work-location input. Named rather than positional so reordering an
 * option list cannot quietly change which pill is special.
 *
 * OTHER_LABEL now lives in the shared kit, because MultiSelectWithOther has to
 * know it and all three wizards use the same string. Re-exported here so the
 * family flow's existing importers — onboardingPayload.js and
 * LoginAsFamily/editProfile.jsx — keep resolving from one place. */
export { OTHER_LABEL } from "../OnboardingKit/fields/questionState";
export const NEAR_WORKPLACE = "Near my workplace";

/*
 * Stored hosting answers that today's OPTIONS.q13 phrase differently.
 * Applied only to hostingPreference — "Rotating between homes" is a live
 * option on other flows under a different rewrite.
 */
export const HOSTING_ALIASES = {
  "other family's home": "The other family's home",
  "rotating between homes": "Rotate between homes",
  "rotating homes": "Rotate between homes",
  "neutral location (e.g. school pickup)":
    "Neutral location — e.g. another agreed upon location",
};
