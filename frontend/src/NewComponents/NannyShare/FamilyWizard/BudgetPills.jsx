import { useQuestionInvalid } from "../OnboardingKit/fields/questionState";

/*
 * Q19 only. The spec calls this the "Budget Options (special variant)": a
 * rounded rectangle rather than a pill, stacking the total rate over the
 * per-family rate. Mirrors `.budget-opts` in
 * docs/onboarding-family-mockup.html.
 *
 * `options` are {total, per, value}. The displayed `total`/`per` use en-dashes
 * to match the mockup; `value` is the ASCII-hyphenated string that actually
 * gets stored, because parseHourlyRate() in Config/helpFunction.jsx matches on
 * `$N - $N`. onboardingConfig.js is where that split is spelled out — do not
 * "fix" one to match the other.
 */
export default function BudgetPills({ options = [], value, onChange }) {
  const invalid = useQuestionInvalid();

  return (
    <div className="flex flex-wrap gap-2.5" role="radiogroup">
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => {
              if (!selected) onChange(option.value);
            }}
            className={`flex items-center gap-[7px] min-w-[160px] max-[600px]:min-w-[140px] px-4 py-2.5 rounded-[12px] border-[1.5px] text-left transition-colors focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(174,196,255,0.20)] ${
              selected
                ? "border-[#AEC4FF] bg-[#AEC4FF]"
                : `bg-transparent hover:border-[#001243] ${
                    invalid ? "border-[#DC2626]" : "border-[#E8ECF4]"
                  }`
            }`}
          >
            <span
              aria-hidden="true"
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                selected ? "bg-[#001243]" : "bg-[#E8ECF4]"
              }`}
            />
            <span className="flex flex-col gap-px">
              <span className="text-[13px] Livvic-Bold text-[#001243]">
                {option.total}
              </span>
              <span
                className={`text-[11px] Livvic-Medium ${
                  selected ? "text-[#001243]/70" : "text-[#9CA3AF]"
                }`}
              >
                {option.per}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
