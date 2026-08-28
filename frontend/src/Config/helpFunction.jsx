import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { postPostJob } from "../Components/Redux/postJobSlice";
import { fireToastMessage } from "../toastContainer";
import { format, isToday, isYesterday } from "date-fns";
import dayjs from "dayjs";

// A nanny share's start date reaches the UI in three shapes: a dayjs object
// straight from the Ant Design picker, an ISO string from the API, and — in
// older records — an ISO string that still carries its JSON quotes
// ('"2026-08-01T00:00:00.000Z"'). The profile card
// (Components/subComponents/profileCard.jsx) has always normalised all three;
// the detail views printed the raw value, so one share could read
// "August 1, 2026" on its card and "2026-08-01T00:00:00.000Z" on its own page.
export function formatStartDate(value) {
  if (!value) return "";
  if (dayjs.isDayjs(value)) {
    return value.isValid() ? value.format("MMMM D, YYYY") : "Invalid Date";
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/"/g, "");
    const parsed = dayjs(cleaned);
    // Not every answer is a date — some shares say "Flexible" or "ASAP", and
    // those must survive untouched rather than become "Invalid Date".
    return parsed.isValid() ? parsed.format("MMMM D, YYYY") : cleaned;
  }
  return String(value);
}

export const formatTimeRange = (startISO, endISO) => {
  const start = new Date(startISO);
  const end = new Date(endISO);

  const formattedStart = format(start, "hh:mm a");
  const formattedEnd = format(end, "hh:mm a");

  return `${formattedStart} - ${formattedEnd}`;
};


export function formatCreatedAt(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);

  if (isToday(date)) {
    return `Today, ${format(date, "hh:mm a")}`;
  } else if (isYesterday(date)) {
    return `Yesterday, ${format(date, "hh:mm a")}`;
  } else {
    return `${format(date, "MMMM d")}, ${format(date, "hh:mm a")}`;
  }
}

export function parseHourlyRate(str) {
  const result = {};

  // Check for "$40+ per hour"
  const ratePlusMatch = str.match(/\$(\d+(?:\.\d+)?)\+/);
  if (ratePlusMatch) {
    result.min = parseFloat(ratePlusMatch[1]);
  } else {
    const rateRangeMatch = str.match(
      /\$(\d+(?:\.\d+)?)\s*-\s*\$(\d+(?:\.\d+)?)/
    );
    if (rateRangeMatch) {
      result.min = parseFloat(rateRangeMatch[1]);
      result.max = parseFloat(rateRangeMatch[2]);
    }
  }

  // Check for share range or share plus
  const shareRangeMatch = str.match(
    /\(each family pays \$([\d.]+)\s*-\s*\$([\d.]+)\)/i
  );
  if (shareRangeMatch) {
    result.minShare = parseFloat(shareRangeMatch[1]);
    result.maxShare = parseFloat(shareRangeMatch[2]);
  } else {
    const sharePlusMatch = str.match(
      /\(each family pays \$(\d+(?:\.\d+)?)\+\)/i
    );
    if (sharePlusMatch) {
      result.minShare = parseFloat(sharePlusMatch[1]);
    }
  }

  return result;
}

/* ── Hourly budget: one place that understands every shape it's stored in ──
 *
 * `hourlyBudget` reaches the UI as three different things, because three
 * different questionnaires have written it over time:
 *
 *   { min, max, minShare, maxShare }   the current shape
 *   '{"minShare":20,...}'              the same, stringified by a FormData save
 *   "$20 - $25 per hour (Each ...)"    a display string written straight to the DB
 *
 * That last one is why profiles show "$20 - $undefined per hour": an edit form
 * built the label from a budget that had no maxShare, and the raw label went to
 * the server. Records like that already exist, so reading has to cope with them
 * rather than assume they're gone.
 *
 * Every card and detail row goes through these, so a malformed value is
 * repaired once instead of leaking into each screen's own ternary. */

// A usable positive number, or undefined. Rejects "", null, NaN and the string
// "undefined" — all of which have shown up in stored budgets.
const rateNumber = (value) => {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

const pickRateFields = (obj) => {
  const out = {};
  for (const key of ["min", "max", "minShare", "maxShare"]) {
    const n = rateNumber(obj?.[key]);
    if (n !== undefined) out[key] = n;
  }
  return out;
};

// Read a legacy display string back into numbers.
const parseLegacyRateString = (str) => {
  const out = pickRateFields(parseHourlyRate(str));

  // "(Each family pays …)" is what distinguishes the two writers. With the
  // clause, the leading range is the combined rate and the clause is the split.
  // Without it, the string was built from the per-family numbers, so the
  // leading range IS the split — which is also how the cards have always shown
  // these strings.
  const hasShareClause = /each family pays/i.test(str);
  if (!hasShareClause && out.minShare === undefined && out.maxShare === undefined) {
    if (out.min !== undefined) out.minShare = out.min;
    if (out.max !== undefined) out.maxShare = out.max;
    delete out.min;
    delete out.max;
  }

  // "$20 - $undefined per hour" matches neither range pattern, but it still
  // tells us the floor. Recover that rather than showing nothing — a share
  // advertised at "$20+" is true and useful; "$undefined" is neither.
  if (out.min === undefined && out.minShare === undefined) {
    const firstAmount = str.match(/\$\s*(\d+(?:\.\d+)?)/);
    const salvaged = rateNumber(firstAmount?.[1]);
    if (salvaged !== undefined) {
      if (hasShareClause) out.min = salvaged;
      else out.minShare = salvaged;
    }
  }

  return out;
};

// Any stored hourlyBudget → { min, max, minShare, maxShare }, holding only
// fields that are real numbers. Never throws; unreadable input yields {}.
export function normalizeHourlyBudget(value) {
  if (!value) return {};

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return {};
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return pickRateFields(JSON.parse(trimmed));
      } catch {
        return parseLegacyRateString(trimmed);
      }
    }
    return parseLegacyRateString(trimmed);
  }

  return pickRateFields(value);
}

// Whole dollars stay whole, cents keep both digits: $12.5 reads as a typo.
const money = (n) => (Number.isInteger(n) ? `${n}` : n.toFixed(2));

// Bounds are always rendered low-to-high. Some stored budgets have them the
// other way round, and "$25 - $20/hr" reads as a mistake on our part.
const rateRange = (low, high, suffix) => {
  if (low === undefined && high === undefined) return null;
  if (low !== undefined && high !== undefined) {
    const [a, b] = low <= high ? [low, high] : [high, low];
    return a === b ? `~$${money(a)}${suffix}` : `~$${money(a)}–$${money(b)}${suffix}`;
  }
  return `~$${money(low ?? high)}+${suffix}`;
};

// What each family pays in the share, e.g. "~$20 - $25/hr per family".
// Returns null when the profile has no usable share rate.
export function formatSharedRate(hourlyBudget) {
  const { minShare, maxShare } = normalizeHourlyBudget(hourlyBudget);
  return rateRange(minShare, maxShare, "/hr per family");
}

// What one family would pay on its own, e.g. "~$40 - $50/hr".
export function formatSoloRate(hourlyBudget) {
  const { min, max } = normalizeHourlyBudget(hourlyBudget);
  return rateRange(min, max, "/hr");
}

const pickNestedRateFields = (budget) => ({
  sharedMin: rateNumber(budget?.sharedRate?.min),
  sharedMax: rateNumber(budget?.sharedRate?.max),
  soloMin: rateNumber(budget?.soloRate?.min),
  soloMax: rateNumber(budget?.soloRate?.max),
});

export function normalizeNannyBudget(value) {
  if (!value) return {};
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return {};
    try {
      return pickNestedRateFields(JSON.parse(trimmed));
    } catch {
      return {};
    }
  }
  return pickNestedRateFields(value);
}

export function formatNannySharedRate(budget) {
  const { sharedMin, sharedMax } = normalizeNannyBudget(budget);
  /* budget.sharedRate stores the combined share total (same as RATE_OPTIONS label). */
  return rateRange(sharedMin, sharedMax, "/hr");
}

export function formatNannySharePerFamily(budget) {
  const { sharedMin, sharedMax } = normalizeNannyBudget(budget);
  if (sharedMin === undefined && sharedMax === undefined) return null;
  const half = (n) => (n === undefined ? undefined : Math.round((n / 2) * 100) / 100);
  return rateRange(half(sharedMin), half(sharedMax), "/hr per family");
}

export function formatNannySoloRate(budget) {
  const { soloMin, soloMax } = normalizeNannyBudget(budget);
  return rateRange(soloMin, soloMax, "/hr");
}

const rateToken = (token, suffix) => {
  if (!token) return "N/A";
  const value = String(token).trim();
  if (!value) return "N/A";
  if (value.startsWith("$")) return value;

  const openEnded = value.includes("+");
  const [rawMin, rawMax] = value.replace("+", "").split("-");
  const min = rateNumber(rawMin);
  const max = openEnded ? undefined : rateNumber(rawMax);
  if (min !== undefined) return rateRange(min, max, suffix);

  return `$${value}${suffix}`;
};

export function formatShareTotalFromToken(token, rateType = "hourly") {
  const formatted = rateToken(token, `/${rateType === "weekly" ? "wk" : "hr"}`);
  return formatted === "N/A" ? null : formatted;
}

export function formatSharePerFamilyFromToken(token, rateType = "hourly") {
  if (!token) return null;
  const value = String(token).trim();
  if (!value) return null;
  const suffix = `/${rateType === "weekly" ? "wk" : "hr"} per family`;
  const openEnded = value.includes("+");
  const [rawMin, rawMax] = value.replace("+", "").split("-");
  const min = rateNumber(rawMin);
  const max = openEnded ? undefined : rateNumber(rawMax);
  if (min === undefined && max === undefined) return null;
  const half = (n) => (n === undefined ? undefined : Math.round((n / 2) * 100) / 100);
  return rateRange(half(min), half(max), suffix);
}

/* Browse-card primary: combined share hourly (never the nanny's solo rate). */
export const formatPlacedNannySharedRate = (profile) =>
  formatNannySharedRate(profile?.budget) ||
  formatSoloRate(profile?.hourlyBudget) ||
  formatShareTotalFromToken(profile?.sharedRate, profile?.rateType);

/* Browse-card secondary: per-family split of the share rate. */
export const formatPlacedNannyShareSplit = (profile) =>
  formatNannySharePerFamily(profile?.budget) ||
  formatSharedRate(profile?.hourlyBudget) ||
  formatSharePerFamilyFromToken(profile?.sharedRate, profile?.rateType);

export const formatPlacedNannySoloRate = (profile) =>
  formatNannySoloRate(profile?.budget) ||
  formatSoloRate(profile?.hourlyBudget) ||
  rateToken(profile?.soloRate, `/${profile?.rateType === "weekly" ? "wk" : "hr"}`);

/** Card props: primary = share total, secondary = per-family. Ignores solo. */
export function nannyCardRates(profile) {
  if (!profile) return { shareTotal: null, perFamily: null };
  if (profile.hasFamily) {
    return {
      shareTotal: formatPlacedNannySharedRate(profile),
      perFamily: formatPlacedNannyShareSplit(profile),
    };
  }
  return {
    shareTotal:
      formatNannySharedRate(profile.budget) ||
      formatShareTotalFromToken(profile.sharedRate, profile.rateType),
    perFamily:
      formatNannySharePerFamily(profile.budget) ||
      formatSharePerFamilyFromToken(profile.sharedRate, profile.rateType),
  };
}
// The inverse: numbers → the labelled option the questionnaires store and the
// edit forms preselect. Guards every branch on a real number, because the
// unguarded version is what wrote "$20 - $undefined per hour" in the first
// place.
export function deparseHourlyRate(rateObj) {
  const { min, max, minShare, maxShare } = normalizeHourlyBudget(rateObj);

  let result = "";

  if (min !== undefined && max !== undefined) {
    result = `$${money(min)} - $${money(max)} per hour`;
  } else if (min !== undefined) {
    result = `$${money(min)}+ per hour`;
  } else if (max !== undefined) {
    result = `$${money(max)}+ per hour`;
  }

  if (minShare !== undefined && maxShare !== undefined) {
    result += `${result ? " " : ""}(Each family pays $${money(minShare)} - $${money(maxShare)})`;
  } else if (minShare !== undefined || maxShare !== undefined) {
    result += `${result ? " " : ""}(Each family pays $${money(minShare ?? maxShare)}+)`;
  }

  return result;
}

export function convertAgeRanges(ageRanges) {
  const label = {
    "Infant": { min: 0, max: 1 },
    "Toddler": { min: 1, max: 3 },
    "Preschool": { min: 3, max: 5 },
    "School-age": { min: 3, max: null }
  };

  let min = Infinity;
  let max = null;

  ageRanges.forEach((age) => {
    const { min: minAge, max: maxAge } = label[age];

    min = Math.min(minAge, min);          // fix 1 & 2

    if (maxAge !== null) {
      max = max === null ? maxAge : Math.max(maxAge, max);  // fix 3
    }
  });

  return {
    min: min === Infinity ? null : min,
    max,
  };
}

export function resolveChildrenAges(formValues, { silent = false } = {}) {
  const ages = [];
  const declared = Number(formValues?.numberOfChildren);
  const count = Number.isFinite(declared) && declared > 0 ? declared : null;

  for (let i = 1; count ? i <= count : true; i++) {
    const age = formValues[`Child${i}_age`];
    if (count == null && age === undefined) break;

    const unit = formValues[`Child${i}_unit`] || "years";
    const num = parseFloat(age);

    if (isNaN(num) || num <= 0) {
      if (silent) continue;
      fireToastMessage({
        type: "error",
        message: "Each child's age must be greater than 0",
      });
      return [];
    }

    ages.push({
      label: `${age} ${unit === "months" ? "months" : "yrs"}`,
      value: unit === "months" ? num / 12 : num,
      unit,
    });
  }

  return ages;
}

export function findMatchingRate(hourlyRate) {
  const rangeData = [
    {
      name: "$15 - $20 per hour (Each family pays $7.50 - $10)",
      val: "$15 - $20 per hour (Each family pays $7.50 - $10)",
    },
    {
      name: "$20 - $25 per hour (Each family pays $10 - $12.50)",
      val: "$20 - $25 per hour (Each family pays $10 - $12.50)",
    },
    {
      name: "$25 - $30 per hour (Each family pays $12.50 - $15)",
      val: "$25 - $30 per hour (Each family pays $12.50 - $15)",
    },
    {
      name: "$30 - $35 per hour (Each family pays $15 - $17.50)",
      val: "$30 - $35 per hour (Each family pays $15 - $17.50)",
    },
    {
      name: "$35 - $40 per hour (Each family pays $17.50 - $20)",
      val: "$35 - $40 per hour (Each family pays $17.50 - $20)",
    },
    {
      name: "$40 - $45 per hour (Each family pays $20 - $22.50)",
      val: "$40 - $45 per hour (Each family pays $20 - $22.50)",
    },
    {
      name: "$45 - $50 per hour (Each family pays $22.50 - $25)",
      val: "$45 - $50 per hour (Each family pays $22.50 - $25)",
    },
    {
      name: "$50+ per hour (Each family pays $25+)",
      val: "$50+ per hour (Each family pays $25+)",
    },
  ];

  const format = (num) => Number(num).toFixed(2).replace(/\.00$/, "");

  if (!hourlyRate) return "N/A"; // 🔒 Guard against undefined/null

  if (!hourlyRate.max && !hourlyRate.maxShare) {
    const target = `$${format(
      hourlyRate.min
    )}+ per hour (Each family pays $${format(hourlyRate.minShare)}+)`;
    return rangeData.find((option) => option.val === target)?.name || "N/A";
  } else {
    const target = `$${format(hourlyRate.min)} - $${format(
      hourlyRate.max
    )} per hour (Each family pays $${format(hourlyRate.minShare)} - $${format(
      hourlyRate.maxShare
    )})`;
    return rangeData.find((option) => option.val === target)?.name || "N/A";
  }
}

export function findMatchingRate1(hourlyRate) {
  if (!hourlyRate || !hourlyRate.min) return "N/A";
  const step2Data = [
    { name: "$10 - $15 per hour" },
    { name: "$15 - $20 per hour" },
    { name: "$20 - $25 per hour" },
    { name: "$25 - $30 per hour" },
    { name: "$30 - $35 per hour" },
    { name: "$35+ per hour" },
  ];
  const min = hourlyRate.min;
  const max = hourlyRate.max;

  if (!max) {
    if (min >= 35) return "$35+ per hour";
    return "N/A";
  }

  const format = (num) => `$${Number(num).toFixed(0)}`;
  const label = `${format(min)} - ${format(max)} per hour`;

  // Check if label exists in step2Data
  const match = step2Data.find((item) => item.name === label);
  return match?.name || "N/A";
}

export const checkEmptyFields = (data, fields) => {
  const emptyFields = [];

  fields.forEach((field) => {
    const value = data[field];
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0)
    ) {
      emptyFields.push(field);
    }
  });

  return emptyFields;
};

export const useJobSubmitter = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const submitJob = async ({ jobType, formValues, textAreaValue }) => {
    try {
      const { data } = await dispatch(
        postPostJob({
          jobType,
          [jobType]: {
            ...formValues,
            jobDescription: textAreaValue,
          },
        })
      ).unwrap();

      fireToastMessage({
        success: true,
        message: data.message,
      });

      navigate(-1);
    } catch (err) {
      fireToastMessage({
        type: "error",
        message: err.message || "Something went wrong",
      });
    }
  };

  return { submitJob };
};

export const formatKey = (key) => {
  return key
    .replace(/([A-Z])/g, " $1") // add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()); // capitalize first letter
};

/* The step2Data…step13Data option lists that used to sit here are gone.
 *
 * They were the family questionnaire's options, and they were garbled: three
 * parenting styles collapsed into one option "Montessori Attachment parenting
 * RIE", "Asthma Medication needs" as a single allergy, "Outdoor play Errands" as
 * a single responsibility. Their only importers were the retired fan-out
 * (postANannyShare.jsx) and Type/FullTime.jsx, both deleted. The questionnaire's
 * options now live in one authoritative place —
 * NewComponents/NannyShare/FamilyWizard/onboardingConfig.js — transcribed from
 * the vendored mockup rather than from these.
 *
 * `prefer` and `hourlyData` below survive on purpose: JobListing/job-listing-view.jsx
 * imports both. Hire.jsx, Job.jsx and PostAJob/house-manager.jsx reference names
 * like step4Data but define their own local consts, so they were never affected.
 */
export const prefer = [
  { name: "Full-time" },
  { name: "Part-time" },
  { name: "Occasional" },
  { name: "Flexible" },
];

export const hourlyData = [
  { name: "$10 - $15 per hour" },
  { name: "$15 - $20 per hour" },
  { name: "$20 - $25 per hour" },
  { name: "$25 - $30 per hour" },
  { name: "$30 - $35 per hour" },
  { name: "$35+ per hour" },
];

export function formatCardAge(age) {
  if (age == null || age === "") return "";
  if (typeof age === "object") {
    if (Array.isArray(age)) return age.map(formatCardAge).filter(Boolean).join(" · ");
    const n = Number(age.value ?? age.age);
    const unit = String(age.unit || "").toLowerCase();
    if (Number.isFinite(n)) {
      // childrenAges.value is years; months unit means convert back to months
      if (unit.startsWith("month") || (!unit && n < 1)) {
        const months = Math.max(1, Math.round(n < 1 || unit.startsWith("month") ? n * 12 : n));
        return `${months} ${months === 1 ? "month" : "months"}`;
      }
      const years = Math.round(n);
      return `${years} ${years === 1 ? "year" : "years"}`;
    }
    if (age.label) return formatCardAge(age.label);
    return "";
  }
  let s = String(age).replace(/[\[\]"]/g, "").trim();
  if (/child|children|nanny|family|newborn|toddler|infant|preschool|experience/i.test(s)) return s;
  s = s
    .replace(/\byrs\.?\b/gi, "years")
    .replace(/\byr\.?\b/gi, "year")
    .replace(/\bmos\.?\b/gi, "months")
    .replace(/\bmonths\b/gi, "months")
    .replace(/\byears\b/gi, "years");
  s = s.replace(/\b1 years\b/gi, "1 year").replace(/\b1 months\b/gi, "1 month");
  if (/month|year/i.test(s)) return s;
  const ageNum = parseFloat(s);
  if (isNaN(ageNum)) return s;
  if (ageNum < 1 || ageNum % 1 !== 0) {
    const months = Math.max(1, Math.round(ageNum * 12));
    return `${months} ${months === 1 ? "month" : "months"}`;
  }
  return `${ageNum} ${ageNum === 1 ? "year" : "years"}`;
}

const hasBrowseValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0 && value !== "N/A";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    return Object.values(value).some((v) => v === true || v?.checked || (v !== null && v !== undefined && String(v).trim() !== "" && v !== "N/A"));
  }
  return Boolean(value);
};

const hasBrowseSchedule = (schedule) => {
  if (!schedule || typeof schedule !== "object") return false;
  return Object.values(schedule).some((day) => day === true || day?.checked);
};

export const isBrowseReadyProfile = (profile) => {
  const user = profile?.userId && typeof profile.userId === "object" ? profile.userId : profile;
  if (!profile || user?.nannyProfileCompleted !== true) return false;
  const hasStart = hasBrowseValue(profile.nannyshareStart) || hasBrowseValue(profile.startAvailability);
  if (user?.type === "Parents") {
    return hasBrowseSchedule(profile.specificDays)
      && hasBrowseValue(profile.hourlyBudget)
      && hasBrowseValue(profile.hostingPreference)
      && hasStart;
  }
  const hostingOk = !profile.hasFamily || hasBrowseValue(profile.whereCare);
  const hasRate = hasBrowseValue(profile.hourlyBudget) || hasBrowseValue(profile.budget)
    || hasBrowseValue(profile.soloRate) || hasBrowseValue(profile.sharedRate);
  return (hasBrowseSchedule(profile.specificDays) || hasBrowseValue(profile.careType)) && hasRate && hostingOk && hasStart;
};

export const navItemsArticles = [
  "Community Resources",
  "Tips for Parents",
  "Tips For Nannies",
  "Platform Tips",
  "Special Needs Care",
  "Do It Yourself",
  "Nanny Activities",
  "News",
];
