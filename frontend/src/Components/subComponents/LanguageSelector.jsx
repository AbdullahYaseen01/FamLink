import { useEffect, useState } from "react";
import { Form } from "antd";

/*
 * Match a stored answer to the option this control renders.
 *
 * Onboarding stores Title Case ("English"); this control used to lowercase
 * everything it wrote, so a nanny who finished the wizard opened Edit Profile
 * and saw every pill unselected. Canonicalising here means either shape lights
 * the right pill, and a save writes the option string the questionnaire uses.
 */
function toCanonicalList(values, options) {
  const raw = Array.isArray(values) ? values : values ? [values] : [];
  return raw
    .map((value) => {
      if (typeof value !== "string") return null;
      const key = value.toLowerCase().trim();
      return options.find((option) => option.toLowerCase().trim() === key) ?? value;
    })
    .filter(Boolean);
}

function OptionPills({ options, selectedOptions, onToggle }) {
  const { status } = Form.Item.useStatus();
  const invalid = status === "error";

  const isSelected = (option) =>
    selectedOptions.some((value) => value.toLowerCase() === option.toLowerCase());

  return (
    <div className="flex flex-wrap gap-4">
      {options.map((opt, i) => {
        const selectedPill = isSelected(opt);
        return (
          <div
            key={i}
            data-option-pill
            data-selected={selectedPill ? "true" : "false"}
            onClick={() => onToggle(opt)}
            className={`cursor-pointer rounded-full px-6 py-2 transition-all ${
              selectedPill
                ? "bg-[#AEC4FF] text-primary"
                : invalid
                  ? "border border-red-500 text-red-600"
                  : "border border-[#EEEEEE] text-[#555]"
            }`}
          >
            <p className="Livvic-Medium text-md">{opt}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function OptionSelector({
  form,
  defaultCheckedValues = [],
  options = [],
  name,
  required = false,
  requiredMessage = "Please select at least one option.",
}) {
  const incoming = toCanonicalList(defaultCheckedValues, options);
  const incomingKey = incoming.join("\0");
  const [selectedOptions, setSelectedOptions] = useState(incoming);

  useEffect(() => {
    const next = toCanonicalList(defaultCheckedValues, options);
    setSelectedOptions(next);
    if (form && name) form.setFieldsValue({ [name]: next });
    // incomingKey is the stored answer; re-sync only when that answer arrives
    // or changes, not when the parent re-renders with a new array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingKey, form, name]);

  const isSelected = (option) =>
    selectedOptions.some((value) => value.toLowerCase() === option.toLowerCase());

  const handleToggle = (option) => {
    const updated = isSelected(option)
      ? selectedOptions.filter((value) => value.toLowerCase() !== option.toLowerCase())
      : [...selectedOptions, option];

    setSelectedOptions(updated);
    form.setFieldsValue({ [name]: updated });
  };

  return (
    <Form.Item
      style={{ margin: 0, padding: 0 }}
      name={name}
      initialValue={selectedOptions}
      rules={
        required
          ? [{ required: true, type: "array", min: 1, message: requiredMessage }]
          : undefined
      }
    >
      <OptionPills
        options={options}
        selectedOptions={selectedOptions}
        onToggle={handleToggle}
      />
    </Form.Item>
  );
}
