import { useState } from "react";
import { useQuestionInvalid } from "./questionState";
import { controlClass } from "./inputStyles";
import { addTags, splitTags } from "./tags";

/*
 * Optional list answers: type a value, press comma or Enter to pin it as a
 * chip. Same shell as TextField so it sits in the kit with the other controls.
 */
export default function TagInputField({
  value = [],
  onChange,
  placeholder,
  className = "",
}) {
  const invalid = useQuestionInvalid();
  const tags = splitTags(value);
  const [draft, setDraft] = useState("");

  function commit(raw = draft) {
    const next = addTags(tags, raw);
    if (next.length !== tags.length) onChange(next);
    setDraft("");
  }

  function removeAt(index) {
    onChange(tags.filter((_, i) => i !== index));
  }

  function handleChange(event) {
    const next = event.target.value;
    if (next.includes(",") || next.includes("\n")) {
      commit(next);
      return;
    }
    setDraft(next);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
      return;
    }
    if (event.key === "Backspace" && !draft && tags.length) {
      event.preventDefault();
      onChange(tags.slice(0, -1));
    }
  }

  function handlePaste(event) {
    const text = event.clipboardData.getData("text");
    if (!/[,|\n]/.test(text)) return;
    event.preventDefault();
    commit(`${draft}${text}`);
  }

  return (
    <div>
      <div
        className={`${controlClass(invalid)} ${
          tags.length ? "!p-2" : ""
        } flex flex-wrap items-center gap-2 cursor-text ${className}`}
        onClick={(event) => event.currentTarget.querySelector("input")?.focus()}
      >
        {tags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[#AEC4FF] bg-[#AEC4FF] px-3 py-[5px] text-[13px] Livvic-Bold text-[#001243]"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              className="leading-none text-[#001243]/70 hover:text-[#001243]"
              onClick={(event) => {
                event.stopPropagation();
                removeAt(index);
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => commit()}
          onPaste={handlePaste}
          placeholder={tags.length ? "" : placeholder}
          className="flex-1 min-w-[140px] border-0 bg-transparent p-0 text-sm text-[#001243] outline-none placeholder:text-[#9CA3AF]"
        />
      </div>
      <p className="mt-1.5 text-[11px] Livvic-Medium text-[#9CA3AF]">
        Press Enter or comma to add each item.
      </p>
    </div>
  );
}
