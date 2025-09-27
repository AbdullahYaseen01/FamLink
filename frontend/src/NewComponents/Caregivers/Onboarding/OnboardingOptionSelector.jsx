import { useState } from "react";
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
  selectAll=true
}) {
  const [selectedOption, setSelectedOption] = useState(
    defaultCheckedValue?.toLowerCase?.() ?? null
  );

  const [selectedOptions, setSelectedOptions] = useState(
    defaultCheckedValues?.map((v) => v.toLowerCase()) ?? []
  );

  const handleSelectAll = () => {
    if (selectedOptions.length === options.length) {
      // Deselect all
      setSelectedOptions([]);
      form.setFieldsValue({ [name]: [] });
    } else {
      // Select all
      const allValues = options.map((option) =>
        typeof option === "string"
          ? option.toLowerCase()
          : option.value.toLowerCase()
      );
      setSelectedOptions(allValues);
      form.setFieldsValue({ [name]: allValues });
    }
  };

  const handleMultiToggle = (option) => {
    const value = typeof option === "string" ? option : option.value;
    let updated;

    if (selectedOptions.includes(value.toLowerCase())) {
      updated = selectedOptions.filter((v) => v !== value.toLowerCase());
    } else {
      updated = [...selectedOptions, value.toLowerCase()];
    }

    form.setFieldsValue({ [name]: updated });
    setSelectedOptions(updated);
  };

  const handleToggle = (option) => {
    const value = typeof option === "string" ? option : option.value;
    let updated;

    if (selectedOption === value.toLowerCase()) {
      updated = null;
      form.resetFields([name]);
    } else {
      updated = value.toLowerCase();
      form.setFieldsValue({ [name]: value });
    }

    setSelectedOption(updated);
  };

  return (
    <>
      <Form.Item
        style={{ margin: 0, padding: 0 }}
        name={name}
        initialValue={multi ? selectedOptions : selectedOption}
      >
        <div className="flex flex-wrap gap-4">
          {options.map((opt, i) => {
            const value = typeof opt === "string" ? opt : opt.value;
            const label = typeof opt === "string" ? opt : opt.label;

            const selected = multi
              ? selectedOptions.includes(value.toLowerCase())
              : selectedOption === value.toLowerCase();

            return (
              <div
                key={i}
                onClick={() =>
                  multi ? handleMultiToggle(opt) : handleToggle(opt)
                }
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
      </Form.Item>

      <div>
        {multi && selectAll && (
          <p
            className="text-gray-500 cursor-pointer hover:text-blue-500 transition-colors my-4 w-fit"
            onClick={handleSelectAll}
          >
            {selectedOptions.length === options.length
              ? "Deselect All"
              : "Select all that apply"}
          </p>
        )}
        {/* Specify input for Age Groups */}
        {specify && (
          <Form.Item
            style={{ padding: 0, margin: 0 }}
            name={openFieldName}
            rules={[{ required: false, message: "" }]}
            initialValue={null}
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
      </div>
    </>
  );
}
