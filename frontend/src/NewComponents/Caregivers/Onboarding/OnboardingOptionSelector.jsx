import { useState, useEffect } from "react";
import { Form } from "antd";
import { Input } from "antd";

export default function OnboardingOptionSelector({
  form,
  defaultCheckedValue,
  defaultCheckedValues,
  options = [],
  name,
  openFieldName = "",
  multi = false,
  specify = false,
  placeholder = "",
  numericTypeSpecify = false,
  selectAll = true,
  resetKey,
}) {
  const [selectedOption, setSelectedOption] = useState(
    defaultCheckedValue?.toLowerCase?.() ?? null
  );

  const [selectedOptions, setSelectedOptions] = useState(
    defaultCheckedValues?.map((v) => v.toLowerCase()) ?? []
  );

  // When resetKey changes, clear local state AND sync the form field explicitly
  useEffect(() => {
    if (resetKey === undefined) return;
    const empty = multi ? [] : null;
    if (multi) {
      setSelectedOptions([]);
    } else {
      setSelectedOption(null);
    }
    // Directly overwrite the form field — resetFields() alone won't update
    // initialValue-based Form.Items after first mount
    form.setFieldsValue({ [name]: empty });
  }, [resetKey]);

  useEffect(() => {
  if (!multi && defaultCheckedValue) {
    form.setFieldsValue({ [name]: defaultCheckedValue.toLowerCase() });
  }
  if (multi && defaultCheckedValues?.length) {
    form.setFieldsValue({ [name]: defaultCheckedValues.map(v => v.toLowerCase()) });
  }
}, []); // run once on mount

  const handleSelectAll = () => {
    if (selectedOptions.length === options.length) {
      setSelectedOptions([]);
      form.setFieldsValue({ [name]: [] });
    } else {
      const allValues = options.map((opt) =>
        (typeof opt === "string" ? opt : opt.value).toLowerCase()
      );
      setSelectedOptions(allValues);
      form.setFieldsValue({ [name]: allValues });
    }
  };

  const handleMultiToggle = (option) => {
    const valueLower = (typeof option === "string" ? option : option.value).toLowerCase();
    const updated = selectedOptions.includes(valueLower)
      ? selectedOptions.filter((v) => v !== valueLower)
      : [...selectedOptions, valueLower];
    setSelectedOptions(updated);
    form.setFieldsValue({ [name]: updated });
  };

  const handleToggle = (option) => {
    const valueLower = (typeof option === "string" ? option : option.value).toLowerCase();
    if (selectedOption === valueLower) {
      setSelectedOption(null);
      form.setFieldsValue({ [name]: null });
    } else {
      setSelectedOption(valueLower);
      form.setFieldsValue({ [name]: valueLower });
    }
  };

  return (
    <>
      {/* Hidden Form.Item just to register the field — no initialValue */}
      <Form.Item name={name} style={{ margin: 0, padding: 0, display: "none" }}>
        <input type="hidden" />
      </Form.Item>

      <div className="flex flex-wrap gap-4">
        {options.map((opt, i) => {
          const value = typeof opt === "string" ? opt : opt.value;
          const label = typeof opt === "string" ? opt : opt.label;
          const valueLower = value.toLowerCase();

          const selected = multi
            ? selectedOptions.includes(valueLower)
            : selectedOption === valueLower;

          return (
            <div
              key={i}
              onClick={() => (multi ? handleMultiToggle(opt) : handleToggle(opt))}
              className={`cursor-pointer rounded-full px-6 py-2 transition-all ${
                selected
                  ? "bg-[#AEC4FF] text-primary"
                  : "border border-[#EEEEEE] text-[#555]"
              }`}
            >
              <p className="Livvic-Medium text-md">{label}</p>
            </div>
          );
        })}
      </div>

      {multi && selectAll && (
        <p
          className="text-gray-500 cursor-pointer hover:text-blue-500 transition-colors my-4 w-fit"
          onClick={handleSelectAll}
        >
          {selectedOptions.length === options.length ? "Deselect All" : "Select all that apply"}
        </p>
      )}

      {specify && (
        <Form.Item
          style={{ padding: 0, margin: 0 }}
          name={openFieldName}
          rules={[{ required: false, message: "" }]}
        >
          {numericTypeSpecify ? (
            <Input
              type="number"
              placeholder="Specify your budget in numeric value"
              className="my-4 w-full max-w-2xl py-4 rounded-xl border-2 border-gray-200 focus:border-blue-400 shadow-sm"
            />
          ) : (
            <Input.TextArea
              rows={4}
              placeholder={placeholder}
              className="my-4 w-full max-w-2xl py-4 rounded-xl border-2 border-gray-200 focus:border-blue-400 shadow-sm"
            />
          )}
        </Form.Item>
      )}
    </>
  );
}