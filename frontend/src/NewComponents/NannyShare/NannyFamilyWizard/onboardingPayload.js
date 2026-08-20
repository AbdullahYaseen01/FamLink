import { toCareType } from "../../../Config/profileFields/normalise";
import { toChildrenAges } from "../OnboardingKit/fields/childrenAges";
import { OTHER_LABEL } from "../OnboardingKit/fields/questionState";
import { toBudget } from "../OnboardingKit/fields/rateOptions";
import { CONDITIONAL } from "./onboardingConfig";

/*
 * Turns the wizard's flat state into the nannyProfile document.
 *
 * Most fields are already named after their schema field, so this file is only
 * the handful of conversions that are not identity. Each one exists because some
 * existing reader or query depends on the shape.
 */

/*
 * Q8's age rows -> preferredAges, the only numeric age signal this flow has.
 *
 * share.controller.js's age filter compares preferredAges.min/.max against the
 * band the browser asked for, and passes through only profiles where BOTH
 * childrenAges and preferredAges are empty. This flow fills childrenAges (Q2's
 * children, already in her care), so without preferredAges these nannies fail
 * the filter outright rather than falling through it — they would be excluded
 * from every age-narrowed search.
 *
 * Q13 is the question that asks about age fit, but it is qualitative ("Similar
 * age / Younger / Older / Flexible") and cannot produce a number. The ages she
 * enters for the children she is open to taking on are the only numeric source
 * in the flow, so each one becomes a point range: a nanny open to an 18-month-old
 * matches a search band that contains 1.5 years.
 *
 * Derived from the already-normalised rows rather than re-parsing them, so the
 * years conversion is stated once and the two lists cannot disagree.
 */
function toPreferredAges(openToChildrenAges = []) {
  return openToChildrenAges.map(({ label, value }) => ({
    label,
    min: value,
    max: value,
  }));
}

/* Only send a "specify" string when its group actually selected Other. */
function specifyFor(list = [], text = "") {
  return list.includes(OTHER_LABEL) ? text : "";
}

/*
 * The nannyProfile document. Keys are schema field names.
 *
 * The photo is deliberately absent: it is a File, so buildProfileFormData
 * appends it separately under the multer key.
 */
export function buildProfileFields(values) {
  const numberOfChildren = Number(values.numberOfChildren) || 0;
  const openToChildren = Number(values.openToChildren) || 0;

  /* Two independent lists in the same shape. The first is the children already
     in her care, the second the ones she is open to adding — they describe
     different children, so folding them together would claim she is minding
     twice as many as she is. */
  const openToChildrenAges = toChildrenAges(
    values.openToChildrenRows,
    openToChildren,
  );

  const petsAnswered = values.hasPets === CONDITIONAL.q23;
  const schoolAnswered = values.schoolDaycare === CONDITIONAL.q14;

  return {
    /* Step 1 — current setup */
    forWho: values.forWho || "",
    numberOfChildren,
    childrenAges: toChildrenAges(values.children, numberOfChildren),
    agesCare: values.agesCare || [],
    /* Existing schema path that neither new nanny flow wrote, so
       profileCompleteness scored every wizard nanny 10 points short and the
       public share page rendered a null experience. */
    careExperience: values.careExperience || "",
    currentSchedule: values.currentSchedule || "",
    careType: toCareType(values.currentSchedule),
    joinTiming: values.joinTiming || "",
    together: values.together || "",

    /* Step 2 — share details */
    openToChildren,
    openToChildrenAges,
    preferredAges: toPreferredAges(openToChildrenAges),
    whereCare: values.whereCare || "",
    /* Stored as the raw YYYY-MM-DD the input produced. The schema declares a
       String and the read side parses that shape; calling toISOString() here
       would shift the date back a day for anyone west of Greenwich. */
    startAvailability: values.startAvailability || "",
    flexibility: values.flexibility || "",
    matchDistance: values.matchDistance || "",

    /* Step 3 — children & routine */
    matchFit: values.matchFit || "",
    schoolDaycare: values.schoolDaycare || "",
    /* Only when the answer that reveals it is still selected — switching to "No"
       hides the field, and a value the user can no longer see must not be
       submitted. The step clears it too; this is the second line of defence. */
    childrenSchools: schoolAnswered ? values.childrenSchools || "" : "",
    allergies: values.allergies || "",
    typicalDay: values.typicalDay || "",
    routinesPreferences: values.routinesPreferences || "",

    /* Step 4 — expectations */
    expectations: values.expectations || "",
    sharedRate: values.sharedRate || "",
    soloRate: values.soloRate || "",
    /* No hourly/weekly toggle: neither the spec nor the mockup has one. */
    rateType: "hourly",
    /*
     * The bug this flow has shipped with since it existed. Its step 5
     * substituted the FAMILY budget component (FamilyStep7) and stored the
     * answer as hourlyBudget — a family field — so no nanny who came through
     * here has ever had a sharedRate, soloRate or budget, and
     * budget.sharedRate.min is what the browse rate filter reads on the nanny
     * side. Its own dual-rate step was never rendered.
     */
    budget: toBudget(values.sharedRate, values.soloRate),
    /*
     * A one-element array, never a bare string. The schema path is [String]
     * (the family questionnaire asks the same question as a multi-select), and
     * .lean() readers bypass Mongoose casting and see the raw stored value — so
     * a string here would be a THIRD shape alongside the legacy strings and the
     * family's real arrays.
     */
    communicationPreference: values.communicationChoice
      ? [values.communicationChoice]
      : [],
    matchMattersMost: values.matchMattersMost || "",
    languages: values.languages || [],
    languagesSpecify: specifyFor(values.languages, values.languagesSpecify),

    /* Step 5 — home & profile */
    hasPets: values.hasPets || "",
    petTypes: petsAnswered ? values.petTypes || [] : [],
    petTypesSpecify: petsAnswered
      ? specifyFor(values.petTypes, values.petTypesSpecify)
      : "",
    okayWithPets: values.okayWithPets || "",
    openNotes: values.openNotes || "",
    certifications: values.certifications || [],
    certificationsSpecify: specifyFor(
      values.certifications,
      values.certificationsSpecify,
    ),
    bio: values.bio || "",

    /*
     * The live bug this wizard fixes. hasFamily is required:true in the schema
     * and the only writer in the whole app is LoginAsNanny/editProfile.jsx — so
     * a nanny who finished onboarding and never opened Edit Profile had no
     * hasFamily field at all, and Mongo does not match a missing field against
     * {hasFamily: true}. They were invisible to the
     * "Nanny ● With a Family, Looking for a share" browse filter.
     *
     * Constant rather than a question: this whole flow is the nanny who already
     * has one. The mirror flow writes false. A real Boolean, because
     * share.controller.js compares === true — the controller's coerceBooleans
     * turns the FormData round trip back into one.
     */
    hasFamily: true,

    /* Tells createProfile this was a finished questionnaire and which one, so
       the completion flags stop being inferred from the absence of careType —
       which this flow sends. Stripped from the body before the document is
       written. */
    onboardingFlow: "nanny-with-family",
    onboardingStep: 5,
  };
}

/*
 * Multipart body for POST /nanny/nanny-share/profile.
 *
 * FormData stringifies everything, so arrays and objects go over as JSON and the
 * controller's parseIfJson list turns them back. Any array question added later
 * has to be added to that list too, or it lands in Mongo as the literal text
 * "[\"Dog(s)\"]" and is invisible until someone reads the document.
 *
 * The file key is exactly "imageFile" — the name multer's .single() is
 * configured with in nanny.routes.js — and it is appended ONLY when a File
 * exists. The retired Screen4.jsx's buildFormData helper remapped the key to
 * "image", which .single("imageFile") ignores outright; do not copy it.
 */
export function buildProfileFormData(values) {
  const fields = buildProfileFields(values);
  const formData = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    formData.append(
      key,
      typeof value === "object" ? JSON.stringify(value) : String(value),
    );
  });

  if (values.photoFile) formData.append("imageFile", values.photoFile);

  return formData;
}
