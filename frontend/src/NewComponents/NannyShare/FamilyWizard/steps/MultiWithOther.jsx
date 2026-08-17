import { OptionPills, TextField } from "../fields";
import { EXCLUSIVE, OPTIONS, OTHER_LABEL } from "../onboardingConfig";

/*
 * A multi-select whose "Other" pill reveals a free-text input. Eight questions
 * use this shape (Q7, Q14, Q15, Q16, Q17, Q20, Q21 — and Q1 as a single-select
 * variant), so it lives here rather than being spelled out eight times.
 *
 * Deselecting "Other" clears the specify text as well as hiding it. The mockup
 * only toggles visibility, which would let a stale petsSpecify the user can no
 * longer see reach Mongo.
 */
export default function MultiWithOther({
  qKey,
  value = [],
  specifyValue = "",
  onChange,
  onSpecifyChange,
  placeholder = "Please specify...",
}) {
  const showOther = value.includes(OTHER_LABEL);

  function handleChange(next) {
    onChange(next);
    if (!next.includes(OTHER_LABEL) && specifyValue) onSpecifyChange("");
  }

  return (
    <>
      <OptionPills
        options={OPTIONS[qKey]}
        value={value}
        onChange={handleChange}
        multi
        exclusive={EXCLUSIVE[qKey] || []}
      />
      {showOther && (
        <div className="mt-3">
          <TextField
            value={specifyValue}
            onChange={onSpecifyChange}
            placeholder={placeholder}
          />
        </div>
      )}
    </>
  );
}
