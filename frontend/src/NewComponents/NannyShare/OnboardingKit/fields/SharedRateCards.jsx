import { Check } from "lucide-react";
import { useQuestionInvalid } from "./questionState";

/*
 * Shared-care rate cards: total hourly on top, per-family half underneath.
 * No decorative icons — selected state is a navy border and a check badge.
 */
export default function SharedRateCards({ options = [], value, onChange }) {
  const invalid = useQuestionInvalid();

  return (
    <div
      className="grid grid-cols-2 min-[720px]:grid-cols-4 gap-2.5"
      role="radiogroup"
    >
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
            className={`relative flex flex-col items-center text-center px-2.5 py-3.5 rounded-[14px] border-[1.5px] transition-colors focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(174,196,255,0.20)] ${
              selected
                ? "border-[#001243] bg-white"
                : `bg-white hover:border-[#001243] ${
                    invalid ? "border-[#DC2626]" : "border-[#E8ECF4]"
                  }`
            }`}
          >
            {selected && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#001243] flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </span>
            )}
            <span className="text-[13px] Livvic-Bold text-[#001243] leading-tight">
              {option.label}
            </span>
            {option.per && (
              <>
                <span className="block w-8 h-px bg-[#E8ECF4] my-1.5" aria-hidden="true" />
                <span className="text-[10.5px] Livvic-Medium text-[#9CA3AF] leading-tight">
                  {option.per}
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
