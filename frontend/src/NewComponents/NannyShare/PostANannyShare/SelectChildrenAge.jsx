import React from "react";
import {
  SelectComponent,
  InputDa,
} from "../../../Components/subComponents/input";
import { Form, Input, Select } from "antd";

function SelectChildrenAge({ opt, selectedValue, handleSelectChange, form }) {
  return (
    <div className="flex flex-col">
      <div>
        <SelectComponent
          opt={opt}
          selectedValue={selectedValue}
          onSelectChange={handleSelectChange}
          placeholder={"Children"}
        />
      </div>

      {selectedValue >= 1 && (
        <>
          <p className="text-lg text-primary Livvic-SemiBold my-6">
            Their ages
          </p>
          <div className="flex flex-wrap gap-3">
            {[...Array(Number(selectedValue))].map((_, index) => (
              <Form.Item
                key={index}
                style={{ marginBottom: "8px" }}
                required
                className="flex items-center"
              >
                <Input.Group compact>
                  {/* Age number input */}
                  <Form.Item
                    name={`Child${index + 1}_age`}
                    noStyle
                    rules={[
                      { required: true, message: "Please provide child’s age" },
                      {
                        validator: (_, value) =>
                          value && value > 0
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

                  {/* Unit selector */}
                  <Form.Item
                    name={`Child${index + 1}_unit`}
                    noStyle
                    initialValue="years"
                  >
                    <Select style={{ width: 90, height: 32 }}>
                      <Select.Option value="months">Months</Select.Option>
                      <Select.Option value="years">Years</Select.Option>
                    </Select>
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default SelectChildrenAge;
