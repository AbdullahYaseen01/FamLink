import { parseHourlyRate } from "../../../Config/helpFunction";
import { DAYS } from "./fields/schedule";
import { OTHER_LABEL } from "./onboardingConfig";

/*
 * Turns the wizard's flat state into the two payload shapes it has to produce:
 * the nannyProfile document (logged in) and the Google Sheet row (logged out).
 *
 * Most fields are already named after their nannyProfile field, so this file is
 * only the handful of conversions that are not identity. Each one exists because
 * some existing reader or query depends on the shape.
 */

/*
 * nannyShareType is the one field in this whole flow where casing is
 * load-bearing, so it is the only one we transform.
 *
 * share.controller.js queries it three ways: the browse filter lowercases the
 * user's selection and matches `$in` (line 89), the share lookup matches it
 * directly (line 304), and the admin facet list is built from
 * distinct("nannyShareType") (line 355). The caregiver side writes the mirror
 * field (careType) through OnboardingOptionSelector, which lowercases. So a
 * Title Case value here would silently match nothing.
 *
 * "Full-time" -> "full-time" is byte-identical to what the retired step1.jsx
 * produced, so existing documents and new ones stay comparable.
 *
 * The free-text "Other" answer is lowercased too. The old flow stored it raw,
 * which meant a family typing "Nights" could never be found by a filter for
 * "nights", and left the admin facet list with case-variant near-duplicates.
 * The user's own capitalisation survives in otherShareTypeSpecify, which is
 * what gets displayed.
 */
function resolveShareType(values) {
  if (values.shareTypeChoice === OTHER_LABEL) {
    const typed = (values.otherShareTypeSpecify || "").trim();
    return {
      nannyShareType: typed.toLowerCase(),
      otherShareTypeSpecify: typed,
    };
  }

  return {
    nannyShareType: (values.shareTypeChoice || "").toLowerCase(),
    otherShareTypeSpecify: "",
  };
}

/*
 * Q2 is a sentence ("Yes — we already have a nanny"), the schema field is a
 * Boolean. Same first-word test the retired fan-out used, so the two flows agree
 * on what a null means (nothing chosen).
 */
function resolveHasNanny(choice) {
  if (!choice) return null;
  const firstWord = choice.split(" ")[0].toLowerCase();
  if (firstWord === "yes") return true;
  if (firstWord === "no") return false;
  return null;
}

/*
 * Reproduces resolveChildrenAges() (Config/helpFunction.jsx) exactly, without
 * needing the flat Child{n}_age keys it walks or the toast it fires.
 *
 * The output shape is not negotiable: share.controller.js queries
 * childrenAges.value with $gte/$lte and checks $size, so `value` must stay a
 * Number normalised to years.
 */
export function toChildrenAges(children = []) {
  return children.reduce((acc, child) => {
    const num = parseFloat(child.age);
    if (Number.isNaN(num) || num <= 0) return acc;

    const unit = child.unit === "months" ? "months" : "years";
    acc.push({
      label: `${child.age} ${unit === "months" ? "months" : "yrs"}`,
      value: unit === "months" ? num / 12 : num,
      unit,
    });
    return acc;
  }, []);
}

/*
 * "09:00" -> an ISO timestamp, anchored to the share's start date so the stamp
 * is a real moment rather than epoch.
 *
 * Readers expect ISO: formatTimeRange does new Date(iso), EditNannyShare feeds
 * it to dayjs(), and the profile day chips go through the same helper. Both ends
 * interpret the value in local time, so the round trip returns the same clock
 * face the user typed.
 */
function toISOTime(dateISO, hhmm) {
  if (!hhmm) return null;
  const day = /^\d{4}-\d{2}-\d{2}$/.test(dateISO || "")
    ? dateISO
    : new Date().toISOString().slice(0, 10);
  const stamp = new Date(`${day}T${hhmm}`);
  return Number.isNaN(stamp.getTime()) ? null : stamp.toISOString();
}

/*
 * Keeps all seven days rather than only the checked ones. Existing documents
 * carry the full week (the retired wizards seeded daysState with every day), and
 * editProfile.jsx rebuilds its own state by reading every day off this object.
 * Emitting a uniform shape means read-side code sees the same thing for old and
 * new records.
 */
export function toSpecificDays(schedule = {}, startDateISO = "") {
  return DAYS.reduce((acc, day) => {
    const entry = schedule[day];
    acc[day] = entry?.checked
      ? {
          checked: true,
          start: toISOTime(startDateISO, entry.start),
          end: toISOTime(startDateISO, entry.end),
        }
      : { checked: false, start: null, end: null };
    return acc;
  }, {});
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
    ...resolveShareType(values),
    hasNanny: resolveHasNanny(values.hasNannyChoice),

    /* Stored as the raw YYYY-MM-DD the input produced. The schema declares a
       String and formatStartDate parses that shape; calling toISOString() here
       would shift the date back a day for anyone west of Greenwich. */
    nannyshareStart: values.nannyshareStart || "",
    urgency: values.urgency || "",

    numberOfChildren: Number(values.numberOfChildren) || 0,
    childrenAges: toChildrenAges(values.children),
    childrenSchools: values.childrenSchools || "",
    allergiesHealth: values.allergiesHealth || [],
    allergiesHealthSpecify: specifyFor(
      values.allergiesHealth,
      values.allergiesHealthSpecify,
    ),

    specificDays: toSpecificDays(values.specificDays, values.nannyshareStart),
    flexibility: values.flexibility || "",
    childResponsibilities: values.childResponsibilities || [],
    dailyRoutine: values.dailyRoutine || [],
    householdAddOns: values.householdAddOns || [],

    hostingPreference: values.hostingPreference || "",
    pets: values.pets || [],
    petsSpecify: specifyFor(values.pets, values.petsSpecify),
    parentingStyle: values.parentingStyle || [],
    parentingStyleSpecify: specifyFor(
      values.parentingStyle,
      values.parentingStyleSpecify,
    ),
    preferredNannyLanguages: values.preferredNannyLanguages || [],
    preferredNannyLanguagesSpecify: specifyFor(
      values.preferredNannyLanguages,
      values.preferredNannyLanguagesSpecify,
    ),
    houseRules: values.houseRules || [],
    houseRulesSpecify: specifyFor(values.houseRules, values.houseRulesSpecify),

    shareLocation: values.shareLocation || [],
    specifyNearbyWorkplace: values.specifyNearbyWorkplace || "",

    hourlyBudget: parseHourlyRate(values.hourlyRateLabel || ""),

    communicationPreference: values.communicationPreference || [],
    communicationSpecify: specifyFor(
      values.communicationPreference,
      values.communicationSpecify,
    ),
    backupCare: values.backupCare || [],
    backupCareSpecify: specifyFor(values.backupCare, values.backupCareSpecify),

    openNotes: values.openNotes || "",
  };
}

/*
 * Multipart body for POST /nanny/nanny-share/profile.
 *
 * FormData stringifies everything, so arrays and objects go over as JSON and the
 * controller's parseIfJson list turns them back. Any array question added later
 * has to be added to that list too, or it lands in Mongo as a JSON string.
 *
 * The file key is exactly "imageFile" -- the name multer's .single() is
 * configured with in nanny.routes.js. Screen4.jsx's buildFormData helper remaps
 * it to "image", which .single("imageFile") ignores, so that path silently
 * uploads nothing; do not copy it.
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

/*
 * Flattens nested objects to parent_key and arrays to a joined string, so the
 * Sheet gets one column per value. Ported from the retired FullTime.jsx so the
 * Apps Script keeps receiving the same column names it already writes.
 */
function flattenObject(obj, parentKey = "", result = {}) {
  Object.entries(obj).forEach(([key, value]) => {
    const newKey = parentKey ? `${parentKey}_${key}` : key;

    if (Array.isArray(value)) {
      result[newKey] = value
        .map((v) => (typeof v === "object" && v !== null ? v.label ?? JSON.stringify(v) : v))
        .join(", ");
    } else if (value !== null && typeof value === "object" && !(value instanceof Date)) {
      flattenObject(value, newKey, result);
    } else {
      result[newKey] = value ?? "";
    }
  });

  return result;
}

/*
 * The urlencoded body the Google Apps Script expects. `Details` carries the
 * whole answer set as JSON; the flattened keys populate the readable columns.
 */
export function buildSheetPayload(values, recordId) {
  const fields = buildProfileFields(values);

  return {
    action: "update",
    Id: recordId,
    Details: JSON.stringify(fields),
    ...flattenObject(fields),
  };
}
