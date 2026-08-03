import { Form, Checkbox, Select, Spin, Input } from "antd";
import { InputDa, InputPassword, InputDOB } from "../input";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { fireToastMessage } from "../../../toastContainer";
import document from "../../../assets/documents/Terms_and_Conditions.pdf";
import PropTypes from "prop-types";

export default function HireStep1({ formRef, head, comm }) {
  const { Option } = Select;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [zipCode, setZipCode] = useState("");

  const onFinish = (value) => {
    return null;
  };

  if (formRef) {
    formRef.current = form;
  }

  HireStep1.propTypes = {
    formRef: PropTypes.shape({ current: PropTypes.any }),
    head: PropTypes.node,
    comm: PropTypes.any,
  };

  const handleZipValidation = async (zip) => {
    if (!zip) return;

    setLoading(true);
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (!res.ok) throw new Error("Invalid ZIP");

      const data = await res.json();
      const finalZip = data["post code"];
      if (finalZip) {
        setZipCode(finalZip);
        form.setFieldsValue({
          zipCode: finalZip,
        });
      } else {
        throw new Error("Invalid structure");
      }
    } catch (err) {
      setZipCode("");
      form.setFieldsValue({ zipCode: "" });
      fireToastMessage({
        type: "error",
        message: "Invalid ZIP code. Please enter a valid U.S. ZIP.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="px-3 width-form font-normal text-center uppercase Livvic offer-font">
        {head}
      </p>
      <div className="flex justify-center my-10">
        <Form
          form={form}
          name="validateOnly"
          autoComplete="off"
          onFinish={onFinish}
        >
          <div className="flex flex-wrap justify-center gap-x-6">
            <InputDa
              type={"text"}
              name={"name"}
              placeholder={"Enter your name"}
            />
            <InputDa
              type={"email"}
              name={"email"}
              placeholder={"Enter your email"}
            />
          </div>

          <div>
            <InputPassword />
          </div>

          <div className="flex flex-wrap justify-start gap-x-6">
            <InputDOB />

            <div>
              <h4 className="mb-2 text-xl capitalize Livvic">Zip Code</h4>
              <Form.Item
                name="zipCode"
                rules={[{ required: true, message: "ZIP code is required" }]}
              >
                <Spin spinning={loading} size="small">
                  <Input
                    name="zipCode"
                    placeholder="Enter ZIP code"
                    value={zipCode}
                    onChange={(e) => {
                      const zip = e.target.value;
                      setZipCode(zip);
                      form.setFieldsValue({ zipCode: zip });
                    }}
                    onBlur={(e) => handleZipValidation(e.target.value.trim())}
                    className="p-4 border-none rounded-3xl input-width"
                    maxLength={10}
                  />
                </Spin>
              </Form.Item>
            </div>
          </div>

          <div className="flex flex-wrap justify-start gap-x-6">
            {comm && (
              <div className="flex flex-col">
                <p className="mb-2 text-xl capitalize text-start Livvic">
                  As an
                </p>
                <Form.Item
                  name="type"
                  rules={[{ required: true, message: "Please select a role" }]}
                >
                  <Select className="width-b" placeholder="As a">
                    <Option key="Parents" value="Parents">
                      Parents
                    </Option>
                    <Option key="Nanny" value="Nanny">
                      Nanny
                    </Option>
                  </Select>
                </Form.Item>
              </div>
            )}
          </div>

          <p className="font-normal text-base text-center already-acc">
            Already have an account?{" "}
            <NavLink
              to="/login"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <span className="underline cursor-pointer">Log in</span>
            </NavLink>
          </p>

          <Form.Item
            className="mx-auto mt-3 mb-0 w-60 line1-20"
            name="remember"
            valuePropName="checked"
            rules={[{ required: true, message: "" }]}
          >
            <Checkbox>
              By proceeding you agree to the{" "}
              <a
                href={document}
                target="_blank"
                className="underline cursor-pointer text-center"
              >
                Terms & Conditions
              </a>
              {" "}and{" "}
              <a
                href="#"
                className="underline cursor-pointer text-center"
                onClick={(e) => e.preventDefault()}
              >
                Privacy Policy
              </a>
            </Checkbox>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
