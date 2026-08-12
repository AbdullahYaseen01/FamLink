import OptionPills from "./OptionPills";
import TextField from "./TextField";
import { OTHER_LABEL } from "./questionState";

/*
 * A multi-select whose "Other" pill reveals a free-text input. The family wizard
 * uses this shape for eight questions and the nanny wizards for two more, so it
 * lives in the kit rather than being spelled out ten times.
 *
 * Takes its `options` and `exclusive` list as props rather than looking them up
 * by question key: the kit is shared by three wizards with three different
 * configs, and a lookup would tie it to one of them.
 *
 * Deselecting "Other" clears the specify text as well as hiding it. The mockups
 * only toggle visibility, which would let a stale petsSpecify the user can no
 * longer see reach Mongo.
 */
export default function MultiSelectWithOther({
  options = [],
  exclusive = [],
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
        options={options}
        value={value}
        onChange={handleChange}
        multi
        exclusive={exclusive}
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
