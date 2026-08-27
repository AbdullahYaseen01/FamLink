/*
 * Nanny Flow 2 — "already with a family, looking for a share" — as the profile
 * surfaces need to see it.
 *
 * One entry per question the wizard asks: q1 to q27 with no q4, plus qExperience
 * and qBio, in the order they are asked. The numbering gap is transcribed from
 * the mockup and is not a mistake; see the top of the config.
 *
 * This is the flow the profile surfaces cover worst — fifteen of these questions
 * have neither a view row nor an edit field today — so this manifest is the
 * checklist Tasks 3.5 and 4.1 work through.
 */
import {
  CONDITIONAL,
  EXCLUSIVE,
  EXPERIENCE_OPTIONS,
  OPTIONS,
  QUESTIONS,
  RATE_OPTIONS,
  REQUIRED_BY_STEP,
  STEPS,
  WHERE_CARE_ALIASES,
} from "../../NewComponents/NannyShare/NannyFamilyWizard/onboardingConfig";
import { makeFieldBuilder, legacyField } from "./buildManifest";
import { CONTROL } from "./controls";

const field = makeFieldBuilder({ STEPS, QUESTIONS, REQUIRED_BY_STEP, EXCLUSIVE });

export const NANNY_FAMILY_FIELDS = [
  /* Step 1 — Current Setup */
  field("q1", { dbKey: "forWho", control: CONTROL.SINGLE, options: OPTIONS.q1 }),
  field("q2", {
    dbKey: "numberOfChildren",
    control: CONTROL.COUNT_WITH_AGES,
    options: OPTIONS.q2,
    /* The children already in her care. Deliberately a different list from q8's,
       which is the children who could join — folding the two together would
       claim she is minding twice as many as she is. */
    alsoWrites: ["childrenAges"],
  }),
  field("q3", {
    dbKey: "agesCare",
    control: CONTROL.MULTI,
    options: OPTIONS.q3,
    isMulti: true,
  }),
  field("qExperience", {
    dbKey: "careExperience",
    control: CONTROL.SINGLE,
    options: EXPERIENCE_OPTIONS,
  }),
  field("q5", {
    dbKey: "currentSchedule",
    control: CONTROL.SINGLE,
    options: OPTIONS.q5,
    /* careType is the lowercased mirror, and it is queried three ways by
       share.controller.js. currentSchedule keeps the Title Case for display. */
    alsoWrites: ["careType"],
  }),
  field("q6", { dbKey: "joinTiming", control: CONTROL.SINGLE, options: OPTIONS.q6 }),
  field("q7", { dbKey: "together", control: CONTROL.SINGLE, options: OPTIONS.q7 }),

  /* Step 2 — Share Details */
  field("q8", {
    dbKey: "openToChildren",
    control: CONTROL.SINGLE,
    options: OPTIONS.q8,
  }),
  field("q9", {
    dbKey: "whereCare",
    control: CONTROL.SINGLE,
    options: OPTIONS.q9,
    aliases: WHERE_CARE_ALIASES,
  }),
  field("q10", { dbKey: "startAvailability", control: CONTROL.DATE }),
  field("q11", { dbKey: "flexibility", control: CONTROL.SINGLE, options: OPTIONS.q11 }),
  field("q12", { dbKey: "matchDistance", control: CONTROL.SINGLE, options: OPTIONS.q12 }),

  /* Step 3 — Children & Routine */
  field("q13", { dbKey: "matchFit", control: CONTROL.SINGLE, options: OPTIONS.q13 }),
  field("q14", {
    dbKey: "schoolDaycare",
    control: CONTROL.SINGLE,
    options: OPTIONS.q14,
    reveal: {
      when: CONDITIONAL.q14,
      dbKey: "childrenSchools",
      control: CONTROL.TAGS,
      /* The profile row is the school question. "Yes" is not useful on its
         own — print the school name as the answer. "No" stays a chip. */
      asAnswer: true,
      label: QUESTIONS.q14.placeholder,
    },
  }),
  field("q15", { dbKey: "allergies", control: CONTROL.TAGS, isMulti: true }),
  field("q16", { dbKey: "typicalDay", control: CONTROL.TEXTAREA }),
  field("q17", { dbKey: "routinesPreferences", control: CONTROL.TEXTAREA }),

  /* Step 4 — Expectations */
  field("q18", { dbKey: "expectations", control: CONTROL.TEXTAREA }),
  field("q19", {
    dbKey: "sharedRate",
    control: CONTROL.RATE_GROUP,
    options: RATE_OPTIONS,
    alsoWrites: ["soloRate", "rateType", "budget"],
  }),
  field("q20", {
    dbKey: "communicationPreference",
    control: CONTROL.SINGLE,
    options: OPTIONS.q20,
    /* Asked as a single select, stored as a one-element array — the schema path
       is [String] because the family questionnaire asks the same question as a
       multi-select, and .lean() readers see the raw stored value. */
    storedAs: "singletonArray",
  }),
  field("q21", { dbKey: "matchMattersMost", control: CONTROL.TEXTAREA }),
  field("q22", {
    dbKey: "languages",
    control: CONTROL.MULTI_OTHER,
    options: OPTIONS.q22,
    isMulti: true,
    specifyKey: "languagesSpecify",
  }),

  /* Step 5 — Home & Profile */
  field("q23", {
    dbKey: "hasPets",
    control: CONTROL.SINGLE,
    options: OPTIONS.q23,
    /* "Yes" reveals a whole multi-select, not just a text box. Its own "Other"
       pill reveals petTypesSpecify beneath it. */
    reveal: {
      when: CONDITIONAL.q23,
      dbKey: "petTypes",
      control: CONTROL.MULTI_OTHER,
      options: OPTIONS.q23Pets,
      isMulti: true,
      specifyKey: "petTypesSpecify",
      /* The one label in this manifest that is written here rather than
         imported: the wizard gives this reveal neither a label nor a
         placeholder, so there is nothing to import. Kept short and factual. */
      label: "Pets in the home",
    },
  }),
  field("q24", { dbKey: "okayWithPets", control: CONTROL.SINGLE, options: OPTIONS.q24 }),
  field("q25", { dbKey: "openNotes", control: CONTROL.TEXTAREA }),
  field("q26", {
    dbKey: "certifications",
    control: CONTROL.MULTI_OTHER,
    /* Deliberately SHORTER than Flow 1's list — no ECE, no TrustLine. Both flows
       store the answer in `certifications`, which is why a profile view must
       never derive a Yes/No from a question this flow does not ask. */
    options: OPTIONS.q26,
    isMulti: true,
    specifyKey: "certificationsSpecify",
  }),
  field("qBio", { dbKey: "bio", control: CONTROL.TEXTAREA }),
  field("q27", {
    dbKey: "imageFile",
    control: CONTROL.PHOTO,
    alsoWrites: ["profilePhoto"],
  }),
];

/*
 * Kept, not asked. See legacyField() and decision 7.
 *
 * Shorter than Flow 1's list on purpose. `careType` is absent because this flow
 * writes it itself, from q5. `careDistance` is absent because this flow asks its
 * own distance question (q12, matchDistance) and the two are different fields
 * with different readers.
 */
export const NANNY_FAMILY_LEGACY_FIELDS = [
  legacyField({
    dbKey: "ageGroupsExp",
    label: "Experience with Ages",
    control: CONTROL.MULTI,
    isMulti: true,
  }),
  legacyField({
    dbKey: "salaryExp",
    label: "Salary Expectations",
    control: CONTROL.TEXT,
  }),
];
