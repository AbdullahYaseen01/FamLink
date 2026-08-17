import { useQuestionInvalid } from "./questionState";

/*
 * The wizard's pill selector. Mirrors `.opt` / `.opt-dot` and the selectOpt()
 * semantics in docs/onboarding-family-mockup.html.
 *
 * ── Not a replacement for OnboardingOptionSelector ─────────────────────────
 *
 * The caregiver flows use NewComponents/Caregivers/Onboarding/
 * OnboardingOptionSelector.jsx, which is antd-Form-coupled and lowercases every
 * value it stores. That lowercasing is why the retired FullTime.jsx compared
 * against the literal "not applicable".
 *
 * This component stores option strings VERBATIM. For every field the family
 * wizard writes that is display-only, Title Case is an improvement — profiles
 * stop rendering "not applicable" and "dog(s)". The one field where casing is
 * load-bearing is nannyShareType, which share.controller.js queries lowercased;
 * onboardingPayload.js lowercases that one on the way out, and nowhere else.
 */

const PILL_BASE =
  "inline-flex items-center gap-[7px] px-4 py-[9px] rounded-full border-[1.5px] text-[13px] transition-colors focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(174,196,255,0.20)]";

const PILL_IDLE =
  "border-[#E8ECF4] bg-transparent text-[#6B7280] Livvic-SemiBold hover:border-[#001243] hover:text-[#001243]";

const PILL_SELECTED =
  "border-[#AEC4FF] bg-[#AEC4FF] text-[#001243] Livvic-Bold";

const PILL_INVALID = "border-[#DC2626]";

/* 6×6 dot, per the spec's "Dot indicator" row. */
function Dot({ selected }) {
  return (
    <span
      aria-hidden="true"
      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
        selected ? "bg-[#001243]" : "bg-[#E8ECF4]"
      }`}
    />
  );
}

/* Options may be plain strings or {label, value} — normalise once. */
function toOption(option) {
  return typeof option === "string"
    ? { label: option, value: option }
    : option;
}

export default function OptionPills({
  options = [],
  value,
  onChange,
  multi = false,
  exclusive = [],
  className = "",
}) {
  const invalid = useQuestionInvalid();
  const selectedValues = multi ? value || [] : value ? [value] : [];

  function handleClick(optionValue) {
    if (!multi) {
      /* Mockup selectOpt(): a single-select group clears then re-adds, so
         clicking the already-selected pill is a no-op rather than a deselect.
         Required single-selects are the majority here, and silently emptying
         one on a stray second tap reads as a bug. */
      if (optionValue === value) return;
      onChange(optionValue);
      return;
    }

    const current = value || [];
    const isSelected = current.includes(optionValue);
    const isExclusive = exclusive.includes(optionValue);

    if (isExclusive) {
      /* "None" / "Not applicable" / "No pets" / "No preference": clears the
         group and stands alone. Deselecting it is allowed, which the mockup
         does not permit — there, tapping "None" on a required question traps
         the user with no way back short of a page reload. */
      onChange(isSelected ? [] : [optionValue]);
      return;
    }

    /* Any normal pick drops whatever exclusive option was held. */
    const withoutExclusives = current.filter((v) => !exclusive.includes(v));

    onChange(
      isSelected
        ? withoutExclusives.filter((v) => v !== optionValue)
        : [...withoutExclusives, optionValue],
    );
  }

  return (
    <div
      className={`flex flex-wrap gap-2.5 ${className}`}
      role={multi ? "group" : "radiogroup"}
    >
      {options.map((raw) => {
        const { label, value: optionValue } = toOption(raw);
        const selected = selectedValues.includes(optionValue);

        return (
          <button
            key={optionValue}
            type="button"
            onClick={() => handleClick(optionValue)}
            role={multi ? "checkbox" : "radio"}
            aria-checked={selected}
            className={`${PILL_BASE} ${
              selected ? PILL_SELECTED : PILL_IDLE
            } ${invalid && !selected ? PILL_INVALID : ""}`}
          >
            <Dot selected={selected} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
