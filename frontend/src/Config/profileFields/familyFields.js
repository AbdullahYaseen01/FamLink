/*
 * The family questionnaire, as the profile surfaces need to see it.
 *
 * One entry per question the family wizard asks — q1 to q23, in the order they
 * are asked. Labels, options, steps, required flags, placeholders and exclusive
 * options all come from FamilyWizard/onboardingConfig.js; this file adds only
 * what the config cannot know: the nannyProfile key each answer lands in, the
 * control it is asked with, and which questions reveal a second field.
 */
import {
  BUDGET_OPTIONS,
  EXCLUSIVE,
  HOSTING_ALIASES,
  NEAR_WORKPLACE,
  OPTIONS,
  QUESTIONS,
  REQUIRED_BY_STEP,
  STEPS,
} from "../../NewComponents/NannyShare/FamilyWizard/onboardingConfig";
import { makeFieldBuilder, legacyField } from "./buildManifest";
import { CONTROL } from "./controls";

const field = makeFieldBuilder({ STEPS, QUESTIONS, REQUIRED_BY_STEP, EXCLUSIVE });

export const FAMILY_FIELDS = [
  /* Step 1 — Share Needs */
  field("q1", {
    dbKey: "nannyShareType",
    control: CONTROL.SINGLE,
    options: OPTIONS.q1,
    /* "Other" turns the answer into free text. The typed string is stored
       lowercased in nannyShareType — it is queried — with the user's own
       capitalisation kept in otherShareTypeSpecify. */
    specifyKey: "otherShareTypeSpecify",
    storedAs: "lowercase",
  }),
  field("q2", {
    dbKey: "hasNanny",
    control: CONTROL.SINGLE,
    options: OPTIONS.q2,
    /* Asked as a sentence, stored as a Boolean. */
    storedAs: "boolean",
  }),
  field("q3", { dbKey: "nannyshareStart", control: CONTROL.DATE }),
  field("q4", { dbKey: "urgency", control: CONTROL.SINGLE, options: OPTIONS.q4 }),

  /* Step 2 — Children */
  field("q5", {
    dbKey: "numberOfChildren",
    control: CONTROL.COUNT_WITH_AGES,
    options: OPTIONS.q5,
    /* The count and the age rows are one question on screen and two keys in
       Mongo; both are queried, so they must stay in step with each other. */
    alsoWrites: ["childrenAges"],
  }),
  field("q6", { dbKey: "childrenSchools", control: CONTROL.TEXT }),
  field("q7", {
    dbKey: "allergiesHealth",
    control: CONTROL.MULTI_OTHER,
    options: OPTIONS.q7,
    isMulti: true,
    specifyKey: "allergiesHealthSpecify",
  }),

  /* Step 3 — Schedule & Care */
  field("q8", { dbKey: "specificDays", control: CONTROL.DAY_SCHEDULE }),
  field("q9", { dbKey: "flexibility", control: CONTROL.SINGLE, options: OPTIONS.q9 }),
  field("q10", {
    dbKey: "childResponsibilities",
    control: CONTROL.MULTI,
    options: OPTIONS.q10,
    isMulti: true,
  }),
  field("q11", {
    dbKey: "dailyRoutine",
    control: CONTROL.MULTI_OTHER,
    options: OPTIONS.q11,
    isMulti: true,
    specifyKey: "dailyRoutineSpecify",
  }),
  field("q12", {
    dbKey: "householdAddOns",
    control: CONTROL.MULTI,
    options: OPTIONS.q12,
    isMulti: true,
  }),

  /* Step 4 — Preferences */
  field("q13", {
    dbKey: "hostingPreference",
    control: CONTROL.SINGLE,
    options: OPTIONS.q13,
    aliases: HOSTING_ALIASES,
  }),
  field("q14", {
    dbKey: "pets",
    control: CONTROL.MULTI_OTHER,
    options: OPTIONS.q14,
    isMulti: true,
    specifyKey: "petsSpecify",
  }),
  field("q14b", {
    dbKey: "okayWithPets",
    control: CONTROL.SINGLE,
    options: OPTIONS.q14b,
  }),
  field("q15", {
    dbKey: "parentingStyle",
    control: CONTROL.MULTI_OTHER,
    options: OPTIONS.q15,
    isMulti: true,
    specifyKey: "parentingStyleSpecify",
  }),
  field("q16", {
    dbKey: "preferredNannyLanguages",
    control: CONTROL.MULTI_OTHER,
    options: OPTIONS.q16,
    isMulti: true,
    specifyKey: "preferredNannyLanguagesSpecify",
  }),
  field("q17", {
    dbKey: "houseRules",
    control: CONTROL.MULTI_OTHER,
    options: OPTIONS.q17,
    isMulti: true,
    specifyKey: "houseRulesSpecify",
  }),

  /* Step 5 — Location & Notes */
  field("q18", {
    dbKey: "shareLocation",
    control: CONTROL.MULTI,
    options: OPTIONS.q18,
    isMulti: true,
    /* Not an "Other" reveal: picking the workplace pill among several locations
       reveals a free-text address. isRevealed() handles both tests. */
    reveal: {
      when: NEAR_WORKPLACE,
      dbKey: "specifyNearbyWorkplace",
      control: CONTROL.TEXT,
      /* The revealed input has no label in the wizard, only a placeholder — so
         the placeholder is what a profile row labels it with. Imported, not
         retyped, like every other piece of question text here. */
      label: QUESTIONS.q18.placeholder,
    },
  }),
  field("q19", {
    dbKey: "hourlyBudget",
    control: CONTROL.BUDGET_PILLS,
    /* Each option's display text and its stored value are different strings on
       purpose — the cards render en dashes, parseHourlyRate matches ASCII
       hyphens. Read BUDGET_OPTIONS before touching either. */
    options: BUDGET_OPTIONS,
  }),
  field("q20", {
    dbKey: "communicationPreference",
    control: CONTROL.MULTI_OTHER,
    options: OPTIONS.q20,
    isMulti: true,
    specifyKey: "communicationSpecify",
  }),
  field("q21", {
    dbKey: "backupCare",
    control: CONTROL.MULTI_OTHER,
    options: OPTIONS.q21,
    isMulti: true,
    specifyKey: "backupCareSpecify",
  }),
  field("q22", { dbKey: "openNotes", control: CONTROL.TEXTAREA }),
  field("q23", {
    dbKey: "imageFile",
    control: CONTROL.PHOTO,
    /* The upload writes both profile paths and the account avatar; imageFile is
       the one the browse cards and the public share page already read. */
    alsoWrites: ["profilePhoto"],
  }),
];

/*
 * Kept, not asked. See legacyField() and decision 7.
 *
 * `involvementLevel` is deliberately absent: it is written only by
 * EditNannyShare, which updates the nannyshares collection, so the row on a
 * family PROFILE can never fill. That is a dead row rather than a legacy one.
 */
export const FAMILY_LEGACY_FIELDS = [
  legacyField({
    dbKey: "careDescription",
    label: "Care Description",
    control: CONTROL.TEXTAREA,
  }),
];
