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
