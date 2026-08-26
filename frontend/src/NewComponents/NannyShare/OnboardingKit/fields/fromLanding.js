import { fetchWithTimeout } from "../../../../Config/fetchWithTimeout";
import {
  canonicalise,
  LEGACY_ANSWER_ALIASES,
  resolveHasNanny,
} from "../../../../Config/profileFields/normalise";
import { OPTIONS as FAMILY_OPTIONS } from "../../FamilyWizard/onboardingConfig";
import { EXPERIENCE_OPTIONS } from "../../NannyShareWizard/onboardingConfig";
import { OPTIONS as NANNY_FAMILY_OPTIONS } from "../../NannyFamilyWizard/onboardingConfig";

export const LANDING_FLOW = {
  family: "family",
  looking: "looking",
  withFamily: "with-family",
};

const HAS_NANNY = {
  yes: "Yes — we already have a nanny",
  no: "No — we are looking for a nanny",
};

const SHARE_TYPE_ALIASES = {
  ...LEGACY_ANSWER_ALIASES,
  "full-time": "Full-time",
  "part-time": "Part-time",
  other: "Other",
  flexible: "Other",
};

const SCHEDULE_ALIASES = {
  ...LEGACY_ANSWER_ALIASES,
  "full-time": "Full-time",
  "part-time": "Part-time",
  flexible: "Flexible",
};

const AGE_BANDS = [
  { maxYears: 1, label: "Infant" },
  { maxYears: 3, label: "Toddler" },
  { maxYears: 5, label: "Preschool" },
  { maxYears: Infinity, label: "School-age" },
];

export function hasNannyChoiceFrom(value) {
  const resolved = resolveHasNanny(value);
  if (resolved === true) return HAS_NANNY.yes;
  if (resolved === false) return HAS_NANNY.no;
  return "";
}

export function parseLandingChildAges(text) {
  if (Array.isArray(text)) {
    const children = text
      .map((row) => storedAgeToRow(row))
      .filter((row) => row.age);
    return packChildren(children);
  }

  const raw = String(text || "").trim();
  if (!raw) return packChildren([]);

  const parts = raw
    .split(/\s*(?:,|&|and)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);

  const children = parts.map(parseAgePart).filter((row) => row.age);
  return packChildren(children);
}

function packChildren(children) {
  const numberOfChildren = children.length;
  let childCountChoice = "";
  if (numberOfChildren === 1) childCountChoice = "1";
  else if (numberOfChildren === 2) childCountChoice = "2";
  else if (numberOfChildren >= 3) childCountChoice = "3+";

  return {
    numberOfChildren,
    children,
    childCountChoice,
    agesCare: ageBandsFrom(children),
  };
}

function capFamilyChildren(ages, counted = 0) {
  const count = Math.min(ages.numberOfChildren || counted, 4);
  return {
    numberOfChildren: count,
    children:
      ages.children.length > 0
        ? ages.children.slice(0, count)
        : count > 0
          ? Array.from({ length: count }, () => ({ age: "", unit: "months" }))
          : [],
  };
}

function capWithFamilyChildren(ages) {
  const count = Math.min(ages.numberOfChildren, 3);
  return {
    childCountChoice: ages.childCountChoice,
    numberOfChildren: count,
    children: ages.children.slice(0, count),
    agesCare: ages.agesCare,
  };
}

function parseAgePart(part) {
  const trimmed = String(part).trim().toLowerCase();
  const monthMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*month/);
  if (monthMatch) {
    return { age: String(Number(monthMatch[1])), unit: "months" };
  }
  const yearMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*year/);
  if (yearMatch) {
    return { age: String(Number(yearMatch[1])), unit: "years" };
  }
  const bare = trimmed.match(/^(\d+(?:\.\d+)?)$/);
  if (bare) return { age: String(Number(bare[1])), unit: "years" };
  return { age: "", unit: "months" };
}

function storedAgeToRow(row) {
  if (!row || typeof row !== "object") return parseAgePart(row);
  if (row.age != null && String(row.age).trim()) {
    return {
      age: String(row.age).trim(),
      unit: row.unit === "months" ? "months" : "years",
    };
  }
  if (row.unit === "months" && Number.isFinite(Number(row.value))) {
    return { age: String(Math.round(Number(row.value) * 12)), unit: "months" };
  }
  if (Number.isFinite(Number(row.value))) {
    const years = Number(row.value);
    return {
      age: Number.isInteger(years) ? String(years) : String(years),
      unit: "years",
    };
  }
  return parseAgePart(row.label || "");
}

function yearsFromRow(row) {
  const num = parseFloat(row.age);
  if (!Number.isFinite(num) || num <= 0) return null;
  return row.unit === "months" ? num / 12 : num;
}

function ageBandsFrom(children) {
  const bands = [];
  children.forEach((row) => {
    const years = yearsFromRow(row);
    if (years == null) return;
    const band = AGE_BANDS.find((entry) => years < entry.maxYears)?.label;
    if (band && !bands.includes(band)) bands.push(band);
  });
  return bands;
}

function pickOption(value, options, aliases = LEGACY_ANSWER_ALIASES) {
  if (value == null || value === "") return "";
  const next = canonicalise(String(value), options, aliases);
  return options.some((option) => option === next) ? next : "";
}

function isEmptyValue(value) {
  if (value == null || value === "") return true;
  if (typeof value === "number") return value === 0;
  if (Array.isArray(value)) {
    if (!value.length) return true;
    return value.every(
      (item) =>
        item == null ||
        item === "" ||
        (typeof item === "object" && !String(item.age || "").trim()),
    );
  }
  return false;
}

export function mergePrefill(current = {}, incoming = {}) {
  const next = { ...current };
  Object.entries(incoming || {}).forEach(([key, value]) => {
    if (isEmptyValue(value)) return;
    if (!isEmptyValue(current[key])) return;
    next[key] = value;
  });
  return next;
}

export function applyPrefill(current, sources = []) {
  return sources.reduce((acc, source) => mergePrefill(acc, source), current);
}

export function fromLandingChat(answers = {}, flow) {
  if (!answers || typeof answers !== "object") return {};

  if (flow === LANDING_FLOW.family) {
    const ages = capFamilyChildren(parseLandingChildAges(answers.childAges));
    return omitEmpty({
      shareTypeChoice: pickOption(
        answers.careNeeded,
        FAMILY_OPTIONS.q1,
        SHARE_TYPE_ALIASES,
      ),
      hasNannyChoice: hasNannyChoiceFrom(answers.alreadyHaveNanny),
      numberOfChildren: ages.numberOfChildren,
      children: ages.children,
    });
  }

  if (flow === LANDING_FLOW.looking) {
    return omitEmpty({
      careExperience: pickOption(answers.experience, EXPERIENCE_OPTIONS),
    });
  }

  if (flow === LANDING_FLOW.withFamily) {
    const ages = capWithFamilyChildren(parseLandingChildAges(answers.childAges));
    return omitEmpty({
      forWho: pickOption(answers.forWho, NANNY_FAMILY_OPTIONS.q1),
      childCountChoice: ages.childCountChoice,
      numberOfChildren: ages.numberOfChildren,
      children: ages.children,
      agesCare: ages.agesCare,
      currentSchedule: pickOption(
        answers.schedule,
        NANNY_FAMILY_OPTIONS.q5,
        SCHEDULE_ALIASES,
      ),
      joinTiming: pickOption(answers.joinTiming, NANNY_FAMILY_OPTIONS.q6),
      together: pickOption(answers.together, NANNY_FAMILY_OPTIONS.q7),
    });
  }

  return {};
}

export function fromNannyProfile(profile, flow) {
  if (!profile || typeof profile !== "object") return {};

  if (flow === LANDING_FLOW.family) {
    const ages = capFamilyChildren(
      parseLandingChildAges(profile.childrenAges),
      Number(profile.numberOfChildren) || 0,
    );
    return omitEmpty({
      shareTypeChoice: pickOption(
        profile.nannyShareType,
        FAMILY_OPTIONS.q1,
        SHARE_TYPE_ALIASES,
      ),
      hasNannyChoice: hasNannyChoiceFrom(profile.hasNanny),
      numberOfChildren: ages.numberOfChildren,
      children: ages.children,
    });
  }

  if (flow === LANDING_FLOW.looking) {
    return omitEmpty({
      careExperience: pickOption(profile.careExperience, EXPERIENCE_OPTIONS),
    });
  }

  if (flow === LANDING_FLOW.withFamily) {
    const parsed = parseLandingChildAges(profile.childrenAges);
    const count =
      Number(profile.numberOfChildren) || parsed.numberOfChildren || 0;
    const ages = capWithFamilyChildren({
      ...parsed,
      childCountChoice:
        parsed.childCountChoice ||
        (count >= 3 ? "3+" : count > 0 ? String(count) : ""),
      numberOfChildren: count,
    });
    return omitEmpty({
      forWho: pickOption(profile.forWho, NANNY_FAMILY_OPTIONS.q1),
      childCountChoice: ages.childCountChoice,
      numberOfChildren: ages.numberOfChildren,
      children: ages.children,
      agesCare: (Array.isArray(profile.agesCare) && profile.agesCare.length
        ? profile.agesCare.filter(Boolean)
        : ages.agesCare),
      currentSchedule: pickOption(
        profile.currentSchedule || profile.careType,
        NANNY_FAMILY_OPTIONS.q5,
        SCHEDULE_ALIASES,
      ),
      joinTiming: pickOption(profile.joinTiming, NANNY_FAMILY_OPTIONS.q6),
      together: pickOption(profile.together, NANNY_FAMILY_OPTIONS.q7),
    });
  }

  return {};
}

export function fromSheetRecord(record, flow) {
  if (!record || typeof record !== "object") return {};
  const details = parseDetails(record.Details);

  if (flow === LANDING_FLOW.family) {
    const ages = capFamilyChildren(
      parseLandingChildAges(record["Child age(s)"]),
      Number(record["Number of children"]) || 0,
    );
    return omitEmpty({
      shareTypeChoice: pickOption(
        record["Care needed"] || record.Type,
        FAMILY_OPTIONS.q1,
        SHARE_TYPE_ALIASES,
      ),
      hasNannyChoice: hasNannyChoiceFrom(record["Already have nanny"]),
      numberOfChildren: ages.numberOfChildren,
      children: ages.children,
    });
  }

  if (flow === LANDING_FLOW.looking) {
    return omitEmpty({
      careExperience: pickOption(record.Experience, EXPERIENCE_OPTIONS),
    });
  }

  if (flow === LANDING_FLOW.withFamily) {
    const parsed = parseLandingChildAges(record["Child age(s)"]);
    const counted = Number(record["Number of children"]) || 0;
    const ages = capWithFamilyChildren({
      ...parsed,
      childCountChoice:
        parsed.childCountChoice ||
        (counted >= 3 ? "3+" : counted > 0 ? String(counted) : ""),
      numberOfChildren: parsed.numberOfChildren || counted,
    });
    return omitEmpty({
      forWho: pickOption(details.forWho || record.forWho, NANNY_FAMILY_OPTIONS.q1),
      childCountChoice: ages.childCountChoice,
      numberOfChildren: ages.numberOfChildren,
      children: ages.children,
      agesCare: ages.agesCare,
      currentSchedule: pickOption(
        record.Type,
        NANNY_FAMILY_OPTIONS.q5,
        SCHEDULE_ALIASES,
      ),
      joinTiming: pickOption(
        details.joinTiming || record.joinTiming,
        NANNY_FAMILY_OPTIONS.q6,
      ),
      together: pickOption(
        details.together || record.together,
        NANNY_FAMILY_OPTIONS.q7,
      ),
    });
  }

  return {};
}

export function readChatAnswers(flow) {
  const variant =
    flow === LANDING_FLOW.family ? "family" : "caregiver";
  try {
    const raw = sessionStorage.getItem("chatOnboardingState");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed?.[variant]?.answers || {};
  } catch {
    return {};
  }
}

export async function fetchSheetRecord(sheetRecordId) {
  const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  if (!scriptUrl || !sheetRecordId) return null;
  const response = await fetchWithTimeout(
    `${scriptUrl}?recordId=${encodeURIComponent(sheetRecordId)}`,
  );
  const result = await response.json();
  if (result?.status !== "success" || !result?.record) return null;
  return result.record;
}

export async function collectLandingPrefill({
  flow,
  sheetRecordId,
  fetchProfile,
} = {}) {
  const sources = [];

  if (fetchProfile) {
    try {
      const profile = await fetchProfile();
      if (profile) sources.push(fromNannyProfile(profile, flow));
    } catch {
      /* A missing profile must not block the questionnaire. */
    }
  }

  if (sheetRecordId) {
    try {
      const record = await fetchSheetRecord(sheetRecordId);
      if (record) sources.push(fromSheetRecord(record, flow));
    } catch {
      /* A missing or slow Sheet must not block the questionnaire. */
    }
  }

  sources.push(fromLandingChat(readChatAnswers(flow), flow));
  return sources;
}

function parseDetails(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function omitEmpty(partial) {
  return Object.fromEntries(
    Object.entries(partial).filter(([, value]) => !isEmptyValue(value)),
  );
}
