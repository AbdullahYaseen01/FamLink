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

export const TOTAL_STEPS = 6;

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
    label: "Location & Details",
    heading: "A few final details.",
    sub: "FAM will use this information to find compatible families nearby.",
  },
  {
    n: 6,
    label: "Final Notes",
    heading: "Almost done — a few last things.",
    sub: "Add a note for other families and a photo to help make a great first impression.",
  },
];

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
    "Other family's home",
    "Rotating between homes",
    "Neutral location (e.g. school pickup)",
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
 * Step 6 has none: Q22 and Q23 are both optional, so Complete Profile never
 * blocks.
 */
export const REQUIRED_BY_STEP = {
  1: ["q1", "q2", "q3", "q4"],
  2: ["q5", "q7"],
  3: ["q8", "q9", "q10"],
  4: ["q13", "q14"],
  5: ["q18", "q19", "q20"],
  6: [],
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
 * option list cannot quietly change which pill is special. */
export const OTHER_LABEL = "Other";
export const NEAR_WORKPLACE = "Near my workplace";
