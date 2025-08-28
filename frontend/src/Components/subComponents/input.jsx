import { Form, Input, Select, Row, Col, Radio } from "antd";
import { toCamelCase } from "./toCamelStr";

const { Option } = Select;
export function InputDa({
  name,
  val,
  req,
  type,
  placeholder,
  defaultValue,
  labelText = "",
  fp
}) {
  const rules = [
    {
      required: req ? false : true,
      message: "",
    },
  ];

  // If it's an email field, add email format validation
  if (type === "email") {
    rules.push({
      type: "email",
      message: "",
    });
  }
  return (
    <div>
      <div className="relative w-full">
        <Form.Item
          style={{ margin: 0, padding: 0 }}
          name={val ? val : toCamelCase(name)}
          rules={rules}
          initialValue={defaultValue}
        >
          <Input
            type={type}
            placeholder={placeholder}
            className={`peer border text-primary border-[#EEEEEE] rounded-[10px] px-4 pt-7 pb-2 ${fp ? 'w-[300px]' : 'w-full'} placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary`}
          />
        </Form.Item>
        <label
          htmlFor={name}
          className="absolute left-4 top-2 text-sm text-[#666666] px-1 z-10"
        >
          {labelText}
        </label>
      </div>
    </div>
  );
}

export function InputPassword() {
  return (
    <div className="flex flex-col items-center gap-y-6 w-full">
      <div className="w-full mt-6">
        {/* <div className="relative w-full">
              <Form.Item style={{ margin: 0, padding: 0 }} name="email">
                <Input
                  type="email"
                  className="peer border text-primary border-[#EEEEEE] rounded-[10px] px-4 pt-7 pb-2 w-full placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Email"
                />
                <label
                  htmlFor="fullName"
                  className="absolute left-4 top-2 text-sm text-[#666666] px-1 z-10"
                >
                  Your Email
                </label>
              </Form.Item>
            </div> */}
        <div className="relative w-full">
          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                message: "",
              },
              {
                pattern: /^.{8,}$/,
                message: "Password must be at least 8 characters!",
              },
            ]}
            hasFeedback
          >
            <Input.Password
              className="peer border border-[#EEEEEE] rounded-[10px] px-4 pt-7 pb-2 w-full  placeholder-transparent focus:outline-none "
              placeholder="Enter your password"
            />
          </Form.Item>
          <label
            htmlFor="password"
            className="absolute left-4 top-2 text-sm text-[#666666] px-1 z-10"
          >
            Password
          </label>
        </div>

        <div className="relative w-full">
          <Form.Item
            name="confirm"
            dependencies={["password"]}
            hasFeedback
            rules={[
              {
                required: true,
                message: "",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(""));
                },
              }),
            ]}
          >
            <Input.Password
              className="peer border border-[#EEEEEE] rounded-[10px] px-4 pt-7 pb-2 w-full  placeholder-transparent focus:outline-none"
              placeholder="Enter password again"
            />
          </Form.Item>
          <label
            htmlFor="confirm password"
            className="absolute left-4 top-2 text-sm text-[#666666] px-1 z-10"
          >
            Confirm Password
          </label>
        </div>
      </div>
    </div>
  );
}

export function InputDOB() {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Generate dates (1-31)
  const dates = Array.from({ length: 31 }, (_, i) => i + 1);

  // Generate years (e.g., from 1900 to current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 101 }, (_, i) => currentYear - i);
  return (
    <div className="relative">
      <Form.Item required>
        <div className="grid grid-cols-3 gap-2 px-4 pt-7 pb-2  border border-[#EEEEEE] rounded-[10px]">
          <Col>
            <Form.Item
              name="month"
              noStyle
              rules={[{ required: true, message: "" }]}
            >
              <Select className="width-dob" placeholder="Month">
                {months.map((month, index) => (
                  <Option key={index} value={month}>
                    {month}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col>
            <Form.Item
              name="date"
              noStyle
              rules={[{ required: true, message: "" }]}
            >
              <Select className="width-dob" placeholder="Date">
                {dates.map((date) => (
                  <Option key={date} value={date}>
                    {date}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col>
            <Form.Item
              name="year"
              noStyle
              rules={[{ required: true, message: "" }]}
            >
              <Select className="width-dob" placeholder="Year">
                {years.map((year) => (
                  <Option key={year} value={year}>
                    {year}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </div>
      </Form.Item>
      <label
        htmlFor="fullName"
        className="absolute left-4 top-2 text-sm text-[#666666] px-1 z-10"
      >
        Date of birth
      </label>
    </div>
  );
}

export function InputRadio({ name, val, value, onRadioChange }) {
  const isChecked = value === val;

  return (
    <div
      className="bg-white px-4 py-4 rounded-[10px] input-width cursor-pointer shadow-soft"
      onClick={() => onRadioChange(val)}
    >
      <div className="flex justify-between items-center">
        <p className="Livvic-SemiBold text-sm">{name}</p>
        <div
          className={`w-5 h-5 rounded-full border-4 transition-colors duration-200 ${
            isChecked ? "border-[#AEC4FF]" : "border-[#EEEEEE]"
          }`}
        />
      </div>
    </div>
  );
}

export function SelectComponent({
  opt,
  selectedValue,
  onSelectChange,
  placeholder,
}) {
  return (
    // <div>
    //   <p className="mb-2 text-xl capitalize Livvic">{placeholder}</p>
    //   <Select
    //     className="custom-select h-12" // Apply custom class here
    //     value={selectedValue}
    //     placeholder={placeholder}
    //     onChange={onSelectChange}
    //     dropdownClassName="custom-dropdown" // Add custom dropdown styles if needed
    //   >
    //     {opt.map((opt) => (
    //       <Option key={opt} value={opt}>
    //         {opt}
    //       </Option>
    //     ))}
    //   </Select>
    <div className="relative w-72">
      <Select
        value={selectedValue}
        bordered={false}
        onChange={onSelectChange}
        className="peer w-full pt-6 pb-2 px-2 border border-[#EEEEEE] rounded-[10px]"
        style={{
          height: "64px",
        }}
        placeholder={placeholder}
      >
        {opt.map((opt) => (
          <Select.Option key={opt} value={opt}>
            <span className="Livvic-SemiBold text-sm text-primary">{opt}</span>
          </Select.Option>
        ))}
      </Select>
      <label className="absolute left-4 top-2 text-sm text-[#666666] px-1 z-10">
        {placeholder}
      </label>
    </div>
  );
}

export function InputTextArea({
  name,
  req,
  placeholder,
  head,
  rows,
  grid,
  labelText,
  form,
}) {
  return (
    <div>
      <div className="relative w-full">
        <Form.Item
          style={{ margin: 0, padding: 0 }}
          name={name} // ✅ always use explicit `name`
          rules={[
            {
              required: req ? true : false,
              message: "",
            },
          ]}
          preserve={false}
        >
          <Input.TextArea
            placeholder={placeholder}
            rows={rows || 6}
            onChange={async (e) => {
              form.setFieldsValue({
                [name]: e.target.value,
              })

            }
            }
            className={`peer border text-primary border-[#EEEEEE] rounded-[10px] px-4 pt-8 pb-2 w-full placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary ${
              !grid && "input-width"
            } no-resize`}
          />
        </Form.Item>
        {labelText && (
          <label
            htmlFor={name}
            className="absolute left-4 top-2 text-sm text-[#666666] px-1 z-10"
          >
            {labelText}
          </label>
        )}
      </div>
    </div>
  );
}
