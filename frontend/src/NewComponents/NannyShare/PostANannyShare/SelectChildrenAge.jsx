import React, { useState, useEffect } from "react";
import { Form, Input, Select } from "antd";

function SelectChildrenAge({
  form,
  opt,
  selectedValue,
  handleSelectChange,
  numberOfChildren = null,
  childrenAges = "",
  part = "all",
}) {
  const [localCount, setLocalCount] = useState(
    selectedValue || numberOfChildren || null
  );

  useEffect(() => {
    if (selectedValue !== undefined && selectedValue !== null) {
      setLocalCount(selectedValue);
    } else if (numberOfChildren !== undefined && numberOfChildren !== null) {
      setLocalCount(numberOfChildren);
    }
  }, [selectedValue, numberOfChildren]);

  useEffect(() => {
    if (childrenAges && form && localCount >= 1) {
      const agesArray = typeof childrenAges === 'string' ? childrenAges.split(",") : childrenAges;
      const fieldsToUpdate = {};
      for (let index = 0; index < Number(localCount); index++) {
        let childAgeData = typeof agesArray[index] === 'string' ? agesArray[index].trim() : String(agesArray[index]?.label || "");
        const isMonths = childAgeData.toLowerCase().includes("month") || childAgeData.toLowerCase().includes("mo");
        const numMatch = childAgeData.match(/(\d+)/);
        const age = numMatch ? numMatch[1] : "";
        const unit = isMonths ? "months" : "years";

        fieldsToUpdate[`Child${index + 1}_age`] = age;
        fieldsToUpdate[`Child${index + 1}_unit`] = unit;
      }
      form.setFieldsValue(fieldsToUpdate);
    }
  }, [childrenAges, localCount, form]);

  const handleChange = (val) => {
    setLocalCount(val);
    handleSelectChange?.(val); // still notify parent if needed
  };

  const countSelect = (
      <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Number of Children</span>} style={{ marginBottom: 0 }}>
        <Select
          className="h-[50px] w-full rounded-xl border-gray-200 Livvic-Medium"
          value={localCount}
          onChange={handleChange}
          placeholder="How many children?"
        >
          {opt.map((num) => (
            <Select.Option key={num} value={num}>{num}</Select.Option>
          ))}
        </Select>
      </Form.Item>
  );

  const ageRows = Number(localCount) >= 1 && (
        <div className="flex flex-col gap-4 w-full max-w-[25%] min-w-[220px]">
          {[...Array(Number(localCount))].map((_, index) => {
            const childAgeData = childrenAges?.split(",")[index]?.trim() || "";

            const isMonths = childAgeData.toLowerCase().includes("month");
            const numMatch = childAgeData.match(/(\d+)/);
            const age = numMatch ? numMatch[1] : "";
            const unit = isMonths ? "months" : "years";

            return (
              <Form.Item
                key={index}
                label={<span className="Livvic-SemiBold text-gray-500">Age of Child {index + 1}</span>}
                className="mb-0"
              >
                <div className="flex gap-2">
                  <Form.Item
                    name={`Child${index + 1}_age`}
                    initialValue={age || ""}
                    className="mb-0 flex-1 min-w-0"
                    validateTrigger="onSubmit"
                    rules={[
                      { required: true, message: "Please provide child's age" },
                      {
                        validator: (_, value) =>
                          value && Number(value) > 0
                            ? Promise.resolve()
                            : Promise.reject("Age must be greater than 0"),
                      },
                    ]}
                  >
                    <Input
                      type="number"
                      placeholder="Age"
                      min={1}
                      className="rounded-xl border-gray-200 py-3 px-4 Livvic-Medium"
                    />
                  </Form.Item>
                  <Form.Item
                    name={`Child${index + 1}_unit`}
                    initialValue={unit}
                    className="mb-0 shrink-0"
                  >
                    <Select className="h-[48px] w-[110px] rounded-xl Livvic-Medium">
                      <Select.Option value="years">Years</Select.Option>
                      <Select.Option value="months">Months</Select.Option>
                    </Select>
                  </Form.Item>
                </div>
              </Form.Item>
            );
          })}
        </div>
  );

  if (part === "count") return countSelect;
  if (part === "ages") return ageRows || null;

  return (
    <div className="flex flex-col">
      {countSelect}
      {ageRows ? <div className="mt-6">{ageRows}</div> : null}
    </div>
  );
}

export default SelectChildrenAge;