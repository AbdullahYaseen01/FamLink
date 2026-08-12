/*
 * Q8's day list and empty value, kept out of DayScheduleField.jsx so that file
 * exports only its component.
 *
 * Order matters: it is the order the days render in, and the key order the
 * `specificDays` object carries into Mongo, where several read-side surfaces
 * iterate it to build day chips.
 */

export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function emptySchedule() {
  return DAYS.reduce((acc, day) => {
    acc[day] = { checked: false, start: "", end: "" };
    return acc;
  }, {});
}

/*
 * "09:00" -> an ISO timestamp, anchored to the questionnaire's start date so the
 * stamp is a real moment rather than epoch.
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
 * The `specificDays` shape Mongo stores, built from DayScheduleField's value.
 *
 * Keeps all seven days rather than only the checked ones. Existing documents
 * carry the full week (the retired wizards seeded daysState with every day), and
 * editProfile.jsx rebuilds its own state by reading every day off this object.
 * Emitting a uniform shape means read-side code sees the same thing for old and
 * new records.
 *
 * Lives beside DAYS rather than in a wizard's payload builder because both the
 * family flow and the nanny flows write this field, and the shape is the
 * schedule's, not any one questionnaire's.
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
