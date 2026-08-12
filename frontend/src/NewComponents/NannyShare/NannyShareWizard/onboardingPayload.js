import { OTHER_LABEL } from "../OnboardingKit/fields/questionState";
import { toSpecificDays } from "../OnboardingKit/fields/schedule";
import { AGE_RANGES } from "./onboardingConfig";

/*
 * Turns the wizard's flat state into the nannyProfile document.
 *
 * Most fields are already named after their schema field, so this file is only
 * the handful of conversions that are not identity. Each one exists because some
 * existing reader or query depends on the shape.
 */

/*
 * Q4 -> preferredAges. Queried, not merely displayed: share.controller.js
 * compares preferredAges.min/.max against the family's childrenAges.value, and
 * checks $size on it. So it has to be [{label, min, max}] with real Numbers.
 *
 * A label that is not in AGE_RANGES would spread nothing and store
 * {label, min: undefined, max: undefined}, which no age filter can match — and
 * nothing would say so. It cannot happen here, because onboardingConfig derives
 * the Q4 option list from these very keys, but the fallback is spelled out
 * rather than left implicit.
 */
export function toPreferredAges(labels = []) {
  return labels.reduce((acc, label) => {
    const range = AGE_RANGES[label];
    if (range) acc.push({ label, ...range });
    return acc;
  }, []);
}

/*
 * "30-35" -> {low: 30, high: 35}. Ported verbatim from the RANGES parser in the
 * CompleteProfile/Step5.jsx this wizard replaces, so the numbers stored for a
 * given token do not change between the two.
 *
 * The "+" branch estimates an upper bound from the lower one, which is why the
 * open-ended tokens ("45-50+", "40-45+") can carry a trailing figure the display
 * label does not: it is never read.
 */
export function parseRange(val) {
  if (!val) return { low: 0, high: 0 };

  if (val.includes("+")) {
    const base = parseFloat(val);
    return { low: base, high: base * 1.15 };
  }

  const [low, high] = val.split("-").map(Number);
  return { low, high };
}

/* budget is what the browse filter reads; sharedRate/soloRate are the labels
 * the profile screens print. Both are stored, as the retired Step5 did. */
function toBudget(values) {
  const shared = parseRange(values.sharedRate);
  const solo = parseRange(values.soloRate);

  return {
    sharedRate: { min: shared.low, max: shared.high },
    soloRate: { min: solo.low, max: solo.high },
  };
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
  return {
    shareExperience: values.shareExperience || "",
    multiFamilyComfort: values.multiFamilyComfort || "",
    childrenCapacity: values.childrenCapacity || "",
    preferredAges: toPreferredAges(values.preferredAgeLabels),
    workSetup: values.workSetup || "",

    specificDays: toSpecificDays(values.specificDays, values.startAvailability),
    /* Stored as the raw YYYY-MM-DD the input produced. The schema declares a
       String and the read side parses that shape; calling toISOString() here
       would shift the date back a day for anyone west of Greenwich. */
    startAvailability: values.startAvailability || "",

    responsibilities: values.responsibilities || [],
    householdHelp: values.householdHelp || "",
    hasTransport: values.hasTransport || "",
    backgroundCheck: values.backgroundCheck || "",

    sharedRate: values.sharedRate || "",
    soloRate: values.soloRate || "",
    /* No hourly/weekly toggle: neither the spec nor the mockup has one, so the
       weekly half of the retired Step5's RANGES table goes with it. */
    rateType: "hourly",
    budget: toBudget(values),

    languages: values.languages || [],
    languagesSpecify: specifyFor(values.languages, values.languagesSpecify),
    certifications: values.certifications || [],
    certificationsSpecify: specifyFor(
      values.certifications,
      values.certificationsSpecify,
    ),
    customCertifications: values.customCertifications || "",
    skills: values.skills || "",

    bio: values.bio || "",

    /*
     * The live bug this wizard fixes. hasFamily is required:true in the schema
     * and the only writer in the whole app is LoginAsNanny/editProfile.jsx — so
     * a nanny who finished onboarding and never opened Edit Profile had no
     * hasFamily field at all, and Mongo does not match a missing field against
     * {hasFamily: false}. They were invisible to the
     * "Nanny ● Looking for a share position" browse filter.
     *
     * Constant rather than a question: this whole flow is the nanny who has no
     * family. The mirror flow writes true.
     */
    hasFamily: false,

    /* Tells createProfile this was a finished questionnaire and which one, so
       the completion flags stop being inferred from the absence of careType.
       Stripped from the body before the document is written. */
    onboardingFlow: "nanny-share",
    onboardingStep: 5,
  };
}

/*
 * Multipart body for POST /nanny/nanny-share/profile.
 *
 * FormData stringifies everything, so arrays and objects go over as JSON and the
 * controller's parseIfJson list turns them back. Any array question added later
 * has to be added to that list too, or it lands in Mongo as a JSON string.
 *
 * The file key is exactly "imageFile" — the name multer's .single() is
 * configured with in nanny.routes.js — and it is appended ONLY when a File
 * exists. The retired Screen4.jsx appended it unconditionally, so a profile
 * saved with no photo sent the literal string "null", multer read it as a text
 * field, and `imageFile: "null"` was written straight into the profile. Its
 * buildFormData helper also remapped the key to "image", which
 * .single("imageFile") ignores outright; do not copy either.
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
