import { useQuestionInvalid } from "./questionState";
import { controlClass } from "./inputStyles";
import { fromSoloToken, toSoloToken } from "./rateOptions";

/*
 * Solo rate as a clean min–max pair. No decorative icons; $ and /hr are text.
 */
export default function SoloRateRangeField({ value = "", onChange }) {
  const invalid = useQuestionInvalid();
  const { min, max } = fromSoloToken(value);

  function update(nextMin, nextMax) {
    onChange(toSoloToken(nextMin, nextMax));
  }

  return (
    <div className="flex items-start gap-3">
      <MoneyBox
        invalid={invalid}
        value={min}
        onChange={(next) => update(next, max)}
        caption="Minimum"
      />
      <span className="mt-[13px] text-[#9CA3AF] Livvic-Bold" aria-hidden="true">
        –
      </span>
      <MoneyBox
        invalid={invalid}
        value={max}
        onChange={(next) => update(min, next)}
        caption="Maximum"
      />
    </div>
  );
}

function MoneyBox({ value, onChange, caption, invalid }) {
  return (
    <label className="flex-1 min-w-0">
      <span className={`${controlClass(invalid)} flex items-center gap-1 py-[11px]`}>
        <span className="text-[#9CA3AF] Livvic-Medium">$</span>
        <input
          inputMode="decimal"
          value={value}
          placeholder="00"
          onChange={(event) => onChange(event.target.value.replace(/[^\d.]/g, ""))}
          className="w-full min-w-0 border-0 bg-transparent p-0 text-sm text-[#001243] outline-none placeholder:text-[#9CA3AF]"
        />
        <span className="shrink-0 text-[#9CA3AF] Livvic-Medium">/hr</span>
      </span>
      <span className="mt-1.5 block text-center text-[11px] Livvic-Medium text-[#9CA3AF]">
        {caption}
      </span>
    </label>
  );
}
