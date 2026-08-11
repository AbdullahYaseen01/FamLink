import { useQuestionInvalid } from "./questionState";
import { DAYS, emptySchedule } from "./schedule";

/*
 * Q8. Seven day toggles; the Start/End inputs for a day appear only once that
 * day is on, per the spec's "Time inputs appear per-day only when that day is
 * toggled on".
 *
 * Value shape is `{ Monday: { checked, start, end }, ... }` with start/end as
 * "HH:mm" strings. It stays in that shape all the way to onboardingPayload.js,
 * which converts to the ISO timestamps every existing reader expects
 * (formatTimeRange, EditNannyShare's dayjs(time), the profile day chips).
 * Keeping the conversion in one place means the component never has to know
 * about the Q3 start date the ISO stamps get anchored to.
 */

/* famwiz-time-input is not cosmetic: Flowbite's forms reset blanks the native
   clock indicator on every time input in the app, and index.css keys the rule
   that restores it off this class. */
const TIME_INPUT =
  "famwiz-time-input rounded-[8px] border-[1.5px] border-[#E8ECF4] bg-white px-2.5 py-2 text-[12.5px] text-[#001243] outline-none transition-colors focus:border-[#AEC4FF] focus:shadow-[0_0_0_3px_rgba(174,196,255,0.20)]";

export default function DayScheduleField({ value, onChange }) {
  const invalid = useQuestionInvalid();
  const schedule = value || emptySchedule();

  function toggleDay(day) {
    const wasChecked = schedule[day]?.checked;

    onChange({
      ...schedule,
      /* Clearing the times on toggle-off is deliberate. The mockup only hides
         the inputs, which leaves a time the user can no longer see still sitting
         in state — and it would then reach the payload if they toggled the day
         back on and off again. */
      [day]: wasChecked
        ? { checked: false, start: "", end: "" }
        : { ...schedule[day], checked: true },
    });
  }

  function setTime(day, which, time) {
    onChange({
      ...schedule,
      [day]: { ...schedule[day], [which]: time },
    });
  }

  return (
    <div className="flex flex-col gap-2.5">
      {DAYS.map((day) => {
        const { checked, start, end } = schedule[day] || {};

        return (
          <div
            key={day}
            className="grid grid-cols-[120px_1fr_1fr] gap-2.5 items-center max-[600px]:grid-cols-1"
          >
            <button
              type="button"
              role="checkbox"
              aria-checked={Boolean(checked)}
              onClick={() => toggleDay(day)}
              className={`inline-flex items-center gap-[7px] px-4 py-[9px] rounded-full border-[1.5px] text-[13px] transition-colors focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(174,196,255,0.20)] ${
                checked
                  ? "border-[#AEC4FF] bg-[#AEC4FF] text-[#001243] Livvic-Bold"
                  : `bg-transparent text-[#6B7280] Livvic-SemiBold hover:border-[#001243] hover:text-[#001243] ${
                      invalid ? "border-[#DC2626]" : "border-[#E8ECF4]"
                    }`
              }`}
            >
              <span
                aria-hidden="true"
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  checked ? "bg-[#001243]" : "bg-[#E8ECF4]"
                }`}
              />
              {day}
            </button>

            {checked && (
              <>
                <label className="flex items-center gap-2">
                  <span className="text-[11px] Livvic-SemiBold text-[#9CA3AF] shrink-0">
                    Start
                  </span>
                  <input
                    type="time"
                    value={start || ""}
                    onChange={(e) => setTime(day, "start", e.target.value)}
                    className={`${TIME_INPUT} w-full`}
                  />
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-[11px] Livvic-SemiBold text-[#9CA3AF] shrink-0">
                    End
                  </span>
                  <input
                    type="time"
                    value={end || ""}
                    onChange={(e) => setTime(day, "end", e.target.value)}
                    className={`${TIME_INPUT} w-full`}
                  />
                </label>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
