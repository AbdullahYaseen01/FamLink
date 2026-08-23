// V1 Good / Possible / Not-a-Match. Blockers first; FAM Says reports the
// result and never decides it. See FamLink_V1_Good_Possible_Not_Match_Logic.

import { variantFromProfile } from "./shareTypeGoals";
import { getShareTypeCompatibility, viewerShareVariant } from "./userTypeCompatibility";

export const MATCH_STATUS = {
  GOOD: "great",
  POSSIBLE: "possible",
  NONE: "none",
};

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const minutes = (t) => {
  if (!t) return null;
  const m = String(t).match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
};

const isFullTime = (careType) => /full[-\s]?time/i.test(String(careType || ""));
const isPartTime = (careType) => /part[-\s]?time/i.test(String(careType || ""));

const checkedDays = (schedule) =>
  DAY_NAMES.filter((day) => schedule?.[day]?.checked);

const daysOverlap = (a, b) => {
  const left = new Set(checkedDays(a));
  return checkedDays(b).some((day) => left.has(day));
};

const windowsOverlapOnDay = (a, b, day) => {
  const a0 = minutes(a?.[day]?.start);
  const a1 = minutes(a?.[day]?.end);
  const b0 = minutes(b?.[day]?.start);
  const b1 = minutes(b?.[day]?.end);
  if (a0 == null || a1 == null || b0 == null || b1 == null) return true;
  return a0 < b1 && b0 < a1;
};

export function scheduleAligns(viewer, card) {
  const vFt = isFullTime(viewer.careType);
  const cFt = isFullTime(card.careType);
  const vPt = isPartTime(viewer.careType);
  const cPt = isPartTime(card.careType);

  if ((vFt && cPt) || (vPt && cFt)) return false;
  if (!viewer.schedule && !card.schedule) return vFt && cFt;

  if (vFt && cFt) {
    if (!checkedDays(viewer.schedule).length || !checkedDays(card.schedule).length) return true;
    return daysOverlap(viewer.schedule, card.schedule);
  }

  if (!daysOverlap(viewer.schedule, card.schedule)) return false;
  return checkedDays(viewer.schedule).some(
    (day) => card.schedule?.[day]?.checked && windowsOverlapOnDay(viewer.schedule, card.schedule, day)
  );
}

export function milesBetween(a, b) {
  if (!Array.isArray(a) || a.length !== 2 || !Array.isArray(b) || b.length !== 2) return null;
  const toRad = (d) => (d * Math.PI) / 180;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const R = 3958.7613;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function locationAligns(viewer, card) {
  const miles =
    typeof card.distanceMiles === "number"
      ? card.distanceMiles
      : milesBetween(viewer.coordinates, card.coordinates);
  if (typeof miles === "number") return miles <= 3;
  const vN = String(viewer.location?.neighborhood || "").trim().toLowerCase();
  const cN = String(card.location?.neighborhood || "").trim().toLowerCase();
  if (vN && cN) return vN === cN;
  return false;
}

const numsFromText = (text) =>
  String(text || "")
    .match(/(\d+(?:\.\d+)?)/g)
    ?.map(Number)
    .filter((n) => Number.isFinite(n)) || [];

export function rateRange(side) {
  const budget = side.hourlyBudget;
  if (budget && typeof budget === "object") {
    const min = Number(budget.minShare ?? budget.sharedMin ?? budget.min ?? budget.soloMin);
    const max = Number(budget.maxShare ?? budget.sharedMax ?? budget.max ?? budget.soloMax);
    if (Number.isFinite(min) || Number.isFinite(max)) {
      return { min: Number.isFinite(min) ? min : max, max: Number.isFinite(max) ? max : min };
    }
  }
  const solo = numsFromText(side.soloRate);
  if (solo.length) return { min: Math.min(...solo), max: Math.max(...solo) };
  const shared = numsFromText(side.sharedRate);
  if (!shared.length) return null;
  return { min: Math.min(...shared), max: Math.max(...shared) };
}

export function rateAligns(viewer, card) {
  const a = rateRange(viewer);
  const b = rateRange(card);
  if (!a || !b) return false;
  const overlap = a.min <= b.max && b.min <= a.max;
  if (overlap) return true;
  const gap = a.max < b.min ? b.min - a.max : a.min - b.max;
  return gap <= 2;
}

const HOST = {
  my: "my",
  other: "other",
  rotate: "rotate",
};

export function hostingKind(value) {
  const s = String(value || "").toLowerCase();
  if (!s) return null;
  if (s.includes("rotat") || s.includes("flex")) return HOST.rotate;
  if (s.includes("other") || s.includes("their") || s.includes("another")) return HOST.other;
  if (s.includes("my home") || s.includes("your home") || s.includes("our home") || s.includes("at our")) {
    return HOST.my;
  }
  return null;
}

export function hostingAligns(viewer, card) {
  const a = hostingKind(viewer.hosting);
  const b = hostingKind(card.hosting);
  if (!a && !b) return true;
  if (!a || !b) return viewer.role !== "Family" || card.role !== "Family" ? true : false;
  if (a === HOST.rotate && b === HOST.rotate) return true;
  if (a === HOST.my && b === HOST.other) return true;
  if (a === HOST.other && b === HOST.my) return true;
  return false;
}

const toDayjsMs = (value) => {
  if (!value) return null;
  if (value?.$d) return new Date(value.$d).setHours(0, 0, 0, 0);
  const cleaned = String(value).replace(/"/g, "");
  const t = Date.parse(cleaned);
  return Number.isNaN(t) ? null : new Date(t).setHours(0, 0, 0, 0);
};

export function startAligns(viewer, card) {
  const a = toDayjsMs(viewer.start);
  const b = toDayjsMs(card.start);
  if (a == null || b == null) return false;
  return Math.abs(a - b) / 86400000 <= 14;
}

const ageToMonths = (age) => {
  if (age == null) return null;
  if (typeof age === "object") {
    if (Number.isFinite(age.value) && String(age.unit || "").toLowerCase().startsWith("month")) {
      return age.value;
    }
    if (Number.isFinite(age.value)) return age.value * 12;
    return ageToMonths(age.label);
  }
  const s = String(age).toLowerCase();
  const month = s.match(/(\d+(?:\.\d+)?)\s*mo/);
  if (month) return Number(month[1]);
  const year = s.match(/(\d+(?:\.\d+)?)\s*(year|yr)/);
  if (year) return Number(year[1]) * 12;
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return null;
  return n > 0 && n < 15 && !s.includes("month") ? n * 12 : n;
};

const familyMonths = (ages) =>
  (Array.isArray(ages) ? ages : []).map(ageToMonths).filter((n) => n != null);

const bandMonths = (months) => {
  if (months < 12) return 6;
  if (months < 24) return 12;
  if (months < 60) return 18;
  return Infinity;
};

const nannyRanges = (preferred) => {
  const list = Array.isArray(preferred) ? preferred : [];
  return list
    .map((item) => {
      if (item && Number.isFinite(item.min) && Number.isFinite(item.max)) {
        return { min: item.min * 12, max: item.max * 12 };
      }
      const label = String(item?.label || item || "").toLowerCase();
      if (label.includes("infant")) return { min: 0, max: 12 };
      if (label.includes("toddler")) return { min: 12, max: 36 };
      if (label.includes("preschool")) return { min: 36, max: 60 };
      if (label.includes("school")) return { min: 60, max: 216 };
      return null;
    })
    .filter(Boolean);
};

export function ageAligns(viewer, card) {
  const vNanny = viewer.role === "Nanny";
  const cNanny = card.role === "Nanny";

  if (vNanny !== cNanny) {
    const family = vNanny ? card : viewer;
    const nanny = vNanny ? viewer : card;
    const kids = familyMonths(family.ages);
    const ranges = nannyRanges(nanny.preferredAges?.length ? nanny.preferredAges : nanny.ages);
    if (!kids.length || !ranges.length) return false;
    return kids.every((m) => ranges.some((r) => m >= r.min && m <= r.max));
  }

  if (vNanny && cNanny) return false;

  const a = familyMonths(viewer.ages);
  const b = familyMonths(card.ages);
  if (!a.length || !b.length) return false;
  if (a.every((m) => m >= 60) && b.every((m) => m >= 60)) return true;
  return a.some((am) => b.some((bm) => Math.abs(am - bm) <= bandMonths(Math.min(am, bm))));
}

const FACTOR_COPY = {
  schedule: { pass: "schedules line up", fail: "schedules don't fully overlap" },
  location: { pass: "you're nearby", fail: "you're more than 3 miles apart" },
  rate: { pass: "rates align", fail: "rates are more than $2/hr apart" },
  hosting: { pass: "hosting works for both of you", fail: "hosting preferences don't line up" },
  start: { pass: "you can start around the same time", fail: "start dates are more than 14 days apart" },
  age: { pass: "the children's ages are a good fit", fail: "ages aren't in the closest Good Match range" },
};

function famSaysFromFactors(level, factors, blockerSays) {
  if (level === MATCH_STATUS.NONE) return blockerSays || "This user isn't compatible with the type of share you're looking for.";
  const order = ["schedule", "location", "age", "rate", "hosting", "start"];
  if (level === MATCH_STATUS.GOOD) {
    const hits = order.filter((k) => factors[k]).slice(0, 3).map((k) => FACTOR_COPY[k].pass);
    if (hits.length === 0) return "This is a strong overall fit for a nanny share.";
    if (hits.length === 1) return `Great foundation for a nanny share — ${hits[0]}.`;
    return `Your ${hits[0]}, and ${hits.slice(1).join(" and ")} — great foundation for a nanny share.`;
  }
  const failed = order.filter((k) => !factors[k]);
  const passed = order.filter((k) => factors[k]);
  const failBit = failed.slice(0, 2).map((k) => FACTOR_COPY[k].fail).join(" and ");
  const passBit = passed.slice(0, 1).map((k) => FACTOR_COPY[k].pass).join("");
  if (passBit && failBit) return `${passBit.charAt(0).toUpperCase()}${passBit.slice(1)}, but ${failBit}.`;
  return failBit ? `${failBit.charAt(0).toUpperCase()}${failBit.slice(1)}.` : "A few details don't meet every Good Match rule, but this is still worth a conversation.";
}

export function classifyMatch(viewer, card) {
  const typeCompat = getShareTypeCompatibility(viewer.variant, card.variant);
  if (!typeCompat.compatible) {
    return {
      level: MATCH_STATUS.NONE,
      reasons: { blocker: true },
      famSays: typeCompat.famSays,
    };
  }

  const factors = {
    schedule: scheduleAligns(viewer, card),
    location: locationAligns(viewer, card),
    rate: rateAligns(viewer, card),
    hosting: hostingAligns(viewer, card),
    start: startAligns(viewer, card),
    age: ageAligns(viewer, card),
  };
  const allPass = Object.values(factors).every(Boolean);
  const level = allPass ? MATCH_STATUS.GOOD : MATCH_STATUS.POSSIBLE;
  return {
    level,
    reasons: { blocker: false, ...factors },
    famSays: famSaysFromFactors(level, factors, typeCompat.famSays),
  };
}

export function factsFromViewer(user, profile) {
  return {
    role: user?.type === "Parents" ? "Family" : "Nanny",
    variant: viewerShareVariant(user, profile),
    schedule: profile?.specificDays,
    careType: profile?.nannyShareType || profile?.careType,
    hosting: profile?.hostingPreference || profile?.whereCare,
    start: profile?.nannyshareStart || profile?.startAvailability,
    hourlyBudget: profile?.hourlyBudget || profile?.budget,
    ages: profile?.childrenAges,
    preferredAges: profile?.preferredAges,
    location: profile?.userId?.location || user?.location,
    coordinates: profile?.userId?.location?.coordinates || user?.location?.coordinates,
  };
}

export function factsFromFamilyCard(props) {
  return {
    role: "Family",
    variant: variantFromProfile("Family", { hasNanny: props.hasNanny }),
    schedule: props.schedule,
    careType: props.careType,
    hosting: props.hosting,
    start: props.start,
    soloRate: props.soloRate,
    sharedRate: props.sharedRate,
    ages: props.ages,
    location: props.location,
    distanceMiles: props.distanceMiles,
  };
}

export function factsFromNannyCard(props) {
  return {
    role: "Nanny",
    variant: variantFromProfile("Nanny", { hasFamily: props.hasFamily }),
    schedule: props.schedule,
    careType: props.careType,
    hosting: props.whereCare,
    start: props.start,
    soloRate: props.soloRate,
    sharedRate: props.sharedRate,
    hourlyBudget: props.budget,
    ages: props.ages,
    preferredAges: props.preferredAges || (!props.hasFamily ? props.ages : undefined),
    location: props.location,
    distanceMiles: props.distanceMiles,
  };
}

export function classifyProfileCard(user, viewerProfile, cardFacts) {
  return classifyMatch(factsFromViewer(user, viewerProfile), cardFacts);
}
