/*
 * The age rows a child-count question reveals — one per child, count driven by
 * the pill above it.
 *
 * Rendered three times across two questionnaires: the family's "how many
 * children need care", and both of the nanny "already with a family" flow's
 * lists (the children already in her care, and the additional ones she can take
 * on). Same component, different state keys.
 *
 * A NEW component, deliberately not a change to
 * NewComponents/NannyShare/PostANannyShare/SelectChildrenAge.jsx. That file has
 * two consumers outside these flows (NannyShare/Profile/EditNannyShare,
 * LoginAsNanny/editProfile), both coupled to antd Form and to flat
 * `Child{n}_age` / `Child{n}_unit` field names. Reworking it to serve the
 * wizards would break two unrelated screens.
 *
 * Value is `[{ age, unit }]`; `age` stays a string because it is bound to a
 * number input, and coercing on every keystroke fights the user mid-typing.
 * onboardingPayload.js does the months→years conversion.
 */

const UNITS = ["Months", "Years"];

export default function ChildrenAgesField({ count = 0, value = [], onChange }) {
  if (!count) return null;

  /* Render exactly `count` rows regardless of how long `value` currently is:
     growing keeps what was already typed, shrinking truncates. Mockup defaults a
     fresh row to Months. */
  const rows = Array.from(
    { length: count },
    (_, i) => value[i] || { age: "", unit: "months" },
  );

  function patchRow(index, patch) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="flex flex-col gap-2.5 mt-3.5">
      {rows.map((row, index) => (
        <div
          key={index}
          className="flex items-center gap-3 flex-wrap rounded-[12px] border-[1.5px] border-[#E8ECF4] bg-[#F4F6FB] px-4 py-3"
        >
          <span className="min-w-[52px] text-[12px] Livvic-Bold text-[#6B7280]">
            Child {index + 1}
          </span>

          <input
            type="number"
            min="0"
            max="18"
            inputMode="numeric"
            placeholder="Age"
            value={row.age}
            onChange={(e) => patchRow(index, { age: e.target.value })}
            aria-label={`Child ${index + 1} age`}
            className="w-[68px] rounded-[8px] border-[1.5px] border-[#E8ECF4] bg-white px-2 py-2 text-center text-sm text-[#001243] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#AEC4FF] focus:shadow-[0_0_0_3px_rgba(174,196,255,0.20)]"
          />

          <div className="inline-flex rounded-[8px] border-[1.5px] border-[#E8ECF4] overflow-hidden">
            {UNITS.map((unit) => {
              const unitValue = unit.toLowerCase();
              const active = row.unit === unitValue;

              return (
                <button
                  key={unit}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={`Child ${index + 1} age in ${unit.toLowerCase()}`}
                  onClick={() => patchRow(index, { unit: unitValue })}
                  className={`px-3 py-2 text-[12px] transition-colors focus:outline-none ${
                    active
                      ? "bg-[#EEF3FF] text-[#001243] Livvic-Bold"
                      : "bg-white text-[#9CA3AF] Livvic-SemiBold hover:text-[#001243]"
                  }`}
                >
                  {unit}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
