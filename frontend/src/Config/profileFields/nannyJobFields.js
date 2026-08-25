/*
 * Nanny Flow 1 — "looking for a nanny share position" — as the profile surfaces
 * need to see it.
 *
 * One entry per question the wizard asks: q1 to q18 plus qExperience, in the
 * order they are asked. qExperience renders between q2 and q3, and sits there
 * here too; it carries a named id because the mockup's ids run q1-q18 with no
 * gaps and inserting a number would renumber everything after it.
 */
import {
  EXCLUSIVE,
  EXPERIENCE_OPTIONS,
  OPTIONS,
  QUESTIONS,
  RATE_OPTIONS,
  REQUIRED_BY_STEP,
  STEPS,
  WORK_SETUP_ALIASES,
} from "../../NewComponents/NannyShare/NannyShareWizard/onboardingConfig";
import { makeFieldBuilder, legacyField } from "./buildManifest";
import { CONTROL } from "./controls";

const field = makeFieldBuilder({ STEPS, QUESTIONS, REQUIRED_BY_STEP, EXCLUSIVE });

export const NANNY_JOB_FIELDS = [
  /* Step 1 — Share Fit */
  field("q1", { dbKey: "shareExperience", control: CONTROL.SINGLE, options: OPTIONS.q1 }),
  field("q2", {
    dbKey: "multiFamilyComfort",
    control: CONTROL.SINGLE,
    options: OPTIONS.q2,
  }),
  field("qExperience", {
    dbKey: "careExperience",
    control: CONTROL.SINGLE,
    options: EXPERIENCE_OPTIONS,
  }),
  field("q3", { dbKey: "childrenCapacity", control: CONTROL.SINGLE, options: OPTIONS.q3 }),
  field("q4", {
    dbKey: "preferredAges",
    control: CONTROL.MULTI,
    options: OPTIONS.q4,
    isMulti: true,
    /* Stored as [{label, min, max}] resolved through AGE_RANGES, because the
       matcher compares those numbers against a family's children's ages. The
       control works in labels; the payload does the lookup. Flow 2 writes the
       same key with a different meaning — see nannyFamilyFields. */
    storedAs: "ageRanges",
  }),
  field("q5", {
    dbKey: "workSetup",
    control: CONTROL.SINGLE,
    options: OPTIONS.q5,
    aliases: WORK_SETUP_ALIASES,
  }),

  /* Step 2 — Availability */
  field("q6", { dbKey: "specificDays", control: CONTROL.DAY_SCHEDULE }),
  field("q7", { dbKey: "startAvailability", control: CONTROL.DATE }),

  /* Step 3 — Role Details */
  field("q8", {
    dbKey: "responsibilities",
    control: CONTROL.MULTI,
    options: OPTIONS.q8,
    isMulti: true,
  }),
  field("q9", { dbKey: "householdHelp", control: CONTROL.SINGLE, options: OPTIONS.q9 }),
  field("q10", { dbKey: "hasTransport", control: CONTROL.SINGLE, options: OPTIONS.q10 }),
  field("q11", { dbKey: "backgroundCheck", control: CONTROL.SINGLE, options: OPTIONS.q11 }),

  /* Step 4 — Rate & Skills */
  field("q12", {
    dbKey: "sharedRate",
    control: CONTROL.RATE_GROUP,
    options: RATE_OPTIONS,
    /* budget.sharedRate.{min,max} is the ONLY nanny rate path the browse filter
       reads, so it is written alongside the two display tokens rather than
       derived at read time. A profile without it survives no narrowed search. */
    alsoWrites: ["soloRate", "rateType", "budget"],
  }),
  field("q13", {
    dbKey: "languages",
    control: CONTROL.MULTI_OTHER,
    options: OPTIONS.q13,
    isMulti: true,
    specifyKey: "languagesSpecify",
  }),
  field("q14", {
    dbKey: "certifications",
    control: CONTROL.MULTI_OTHER,
    options: OPTIONS.q14,
    isMulti: true,
    specifyKey: "certificationsSpecify",
  }),
  field("q15", { dbKey: "customCertifications", control: CONTROL.TEXT }),
  field("q16", { dbKey: "skills", control: CONTROL.TEXT }),

  /* Step 5 — Profile */
  field("q17", { dbKey: "bio", control: CONTROL.TEXTAREA }),
  field("q18", {
    dbKey: "imageFile",
    control: CONTROL.PHOTO,
    alsoWrites: ["profilePhoto"],
  }),
];

/*
 * Kept, not asked. See legacyField() and decision 7.
 *
 * `careType` is here rather than being dropped: this wizard never writes it, but
 * the chat intake and the caregiver funnel both do (sheetData["Type"] through
 * login.jsx), and so does the edit form's own Availability control. Removing the
 * row would blank a real answer for every nanny who arrived that way.
 */
export const NANNY_JOB_LEGACY_FIELDS = [
  legacyField({
    dbKey: "careType",
    label: "Care Type Required",
    control: CONTROL.SINGLE,
  }),
  legacyField({
    dbKey: "careDistance",
    label: "Willing to Travel",
    control: CONTROL.SINGLE,
  }),
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
