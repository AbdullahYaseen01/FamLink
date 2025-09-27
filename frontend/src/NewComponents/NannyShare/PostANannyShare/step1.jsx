import React, { useEffect } from "react";
import Form from "antd/es/form/Form";
import OnboardingOptionSelector from "../../Caregivers/Onboarding/OnboardingOptionSelector";

const step1Data = [
  "Full-time care",
  "Part-time care",
  "Pickup/Drop-off (Carpool style)",
  "After-school care",
  "Summer/Seasonal",
];

function Step1({ opt, selectedValue, handleSelectChange, formRef }) {
  const [form] = Form.useForm();
  // const allValues = step2Data.map((v) => (v.val ? v.val : toCamelCase(v.name)));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (formRef) {
      formRef.current = form;
      console.log("Form fields registered:", form.getFieldsValue(true));
    }
  }, [formRef, form]);
  return (
    <div className="mb-6">
      <p className="text-primary Livvic-Bold text-center text-4xl px-3 mb-6">
        Basic Info
      </p>
      <Form form={form} name="validateOnly" autoComplete="off">
        <div className="mx-auto max-w-3xl">
          <p className="text-lg Livvic-SemiBold text-primary mb-4">
            What type of nanny share are you looking for?
          </p>
          <OnboardingOptionSelector
            form={form}
            options={step1Data}
            name={"option"}
            specify={true}
            placeholder="Other (Specify)"
            openFieldName={"specifyOption"}
          />
        </div>
      </Form>
    </div>
  );
}

export default Step1;
