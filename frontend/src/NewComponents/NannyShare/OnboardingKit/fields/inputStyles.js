/*
 * Shared control shell for the wizard's text, textarea, date and time inputs.
 *
 * Native inputs throughout, not antd. The mockup is native, and antd's Input /
 * DatePicker / TimePicker ship their own reset CSS that fights these exact
 * borders and focus rings — the retired wizards worked around that with
 * !important overrides in App.css. antd stays a dependency for the rest of the
 * app; it just has no place in this feature.
 */

export const CONTROL_BASE =
  "w-full rounded-[12px] border-[1.5px] bg-white px-4 py-[13px] text-sm text-[#001243] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#AEC4FF] focus:shadow-[0_0_0_3px_rgba(174,196,255,0.20)]";

export function controlClass(invalid) {
  return `${CONTROL_BASE} ${invalid ? "border-[#DC2626]" : "border-[#E8ECF4]"}`;
}

/* Today in the local timezone, as the `YYYY-MM-DD` a date input expects.
 *
 * Built from the local date parts rather than toISOString(), which converts to
 * UTC first and so returns tomorrow's date for anyone west of Greenwich after
 * their local 4pm-ish — exactly the users this app serves. */
export function todayLocalISODate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
