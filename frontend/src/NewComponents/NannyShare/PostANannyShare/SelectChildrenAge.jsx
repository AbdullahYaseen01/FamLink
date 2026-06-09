import React, { useState } from "react";
import { SelectComponent } from "../../../Components/subComponents/input";
import { Form, Input, Select } from "antd";

function SelectChildrenAge({
  opt,
  selectedValue,
  handleSelectChange,
  numberOfChildren = null,
  childrenAges = "",
}) {
  const [localCount, setLocalCount] = useState(
    selectedValue || numberOfChildren || null
  );

  const handleChange = (val) => {
    setLocalCount(val);
    handleSelectChange?.(val); // still notify parent if needed
  };

  return (
    <div className="flex flex-col">
      <div>
        <SelectComponent
          opt={opt}
          selectedValue={localCount}  // ✅ use local state
          onSelectChange={handleChange}
          placeholder={"Children"}
        />
      </div>

      {Number(localCount) >= 1 && (
        <>
          <p className="text-lg text-primary Livvic-SemiBold my-6">
            Their ages
          </p>

          <div className="flex flex-wrap gap-3">
            {[...Array(Number(localCount))].map((_, index) => {
              const childAgeData = childrenAges?.split(",")[index]?.trim() || "";

              const isMonths = childAgeData.toLowerCase().includes("month");
              const numMatch = childAgeData.match(/(\d+)/);
              const age = numMatch ? numMatch[1] : "";
              const unit = isMonths ? "months" : "years";

              return (
                <Form.Item
                  key={index}
                  style={{ marginBottom: "8px" }}
                  required
                  className="flex items-center"
                >
                  <Input.Group compact>
                    <Form.Item
                      name={`Child${index + 1}_age`}
                      noStyle
                      initialValue={age || ""}
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
                        placeholder={`${index + 1} Child`}
                        min={1}
                        style={{ width: 80, height: 32 }}
                      />
                    </Form.Item>

                    <Form.Item
                      name={`Child${index + 1}_unit`}
                      noStyle
                      initialValue={unit}
                    >
                      <Select style={{ width: 110, height: 32 }}>
                        <Select.Option value="months">Months Old</Select.Option>
                        <Select.Option value="years">Years Old</Select.Option>
                      </Select>
                    </Form.Item>
                  </Input.Group>
                </Form.Item>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default SelectChildrenAge;