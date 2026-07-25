// Formatting shared by every surface that renders a nanny share profile card —
// the dashboard cards (Components/subComponents/profileCard.jsx) and the public
// shared-profile card (NewComponents/ShareProfile/SharedProfileCard.jsx).
//
// Kept dependency-free on purpose: the public share page is the first thing a
// stranger loads, and neither of these needs a date library or the store.

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const SHORT_DAYS = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

// "Mon–Fri", or "Mon–Wed, Fri" when the week has a gap. Collapses runs of
// consecutive days rather than listing seven abbreviations.
export const formatScheduleDays = (schedule) => {
  if (!schedule) return "";

  const activeDays = DAY_ORDER.filter((day) => schedule?.[day]?.checked);
  if (!activeDays.length) return "";

  const indexes = activeDays.map((day) => DAY_ORDER.indexOf(day));

  const ranges = [];
  let start = indexes[0];
  let prev = indexes[0];

  for (let i = 1; i < indexes.length; i++) {
    if (indexes[i] !== prev + 1) {
      ranges.push([start, prev]);
      start = indexes[i];
    }
    prev = indexes[i];
  }
  ranges.push([start, prev]);

  return ranges
    .map(([s, e]) =>
      s === e
        ? SHORT_DAYS[DAY_ORDER[s]]
        : `${SHORT_DAYS[DAY_ORDER[s]]}–${SHORT_DAYS[DAY_ORDER[e]]}`
    )
    .join(", ");
};

// Children's ages reach the UI in every shape the questionnaires have ever
// written: an array of {label} objects, a bare array of numbers, a JSON string,
// and — from older records — a single-element array holding a JSON string.
// Normalise all of them to "10 months, 3 years".
//
// A fractional year means months (0.83 → "10 months"); anything that already
// spells out its unit is passed through untouched.
export const formatAgeLabels = (ages) => {
  let parsed = ages;

  if (
    Array.isArray(parsed) &&
    parsed.length === 1 &&
    typeof parsed[0] === "string" &&
    parsed[0].startsWith("[")
  ) {
    try {
      parsed = JSON.parse(parsed[0]);
    } catch {
      /* not JSON after all — fall through and treat as a plain label */
    }
  }

  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = parsed.split(",");
    }
  }

  if (!Array.isArray(parsed)) return null;

  return parsed
    .map((age) => {
      if (typeof age === "object" && age !== null && age.label) return age.label;

      const clean = String(age).replace(/[[\]"]/g, "").trim();
      const lower = clean.toLowerCase();
      if (
        lower.includes("year") ||
        lower.includes("yr") ||
        lower.includes("month") ||
        lower.includes("mo")
      ) {
        return clean;
      }

      const num = parseFloat(clean);
      if (isNaN(num)) return clean;
      if (num % 1 !== 0) {
        const months = Math.round(num * 12);
        return `${months} month${months > 1 ? "s" : ""}`;
      }
      return `${num} year${num > 1 ? "s" : ""}`;
    })
    .join(", ");
};
