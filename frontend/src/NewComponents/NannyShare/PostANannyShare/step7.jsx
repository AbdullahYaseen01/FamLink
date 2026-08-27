import React, { useEffect } from "react";
import Form from "antd/es/form/Form";
import OnboardingOptionSelector from "../../Caregivers/Onboarding/OnboardingOptionSelector";
import { deparseHourlyRate } from "../../../Config/helpFunction";

const step7Data = {
  first: [
    "$15 - $20 per hour (Each family pays $7.50 - $10)",
    "$20 - $25 per hour (Each family pays $10 - $12.50)",
    "$25 - $30 per hour (Each family pays $12.50 - $15)",
    "$30 - $35 per hour (Each family pays $15 - $17.50)",
    "$35 - $40 per hour (Each family pays $17.50 - $20)",
    "$40 - $45 per hour (Each family pays $20 - $22.50)",
    "$45 - $50 per hour (Each family pays $22.50 - $25)",
    "$50+ per hour (Each family pays $25+)",
  ],

  second: ["No pets", "Dog(s)", "Cat(s)", "Small animals", "Birds"],
};

function Step7({ formRef, petsInfo = true, initialValues }) {
  const [form] = Form.useForm();
  // const allValues = step2Data.map((v) => (v.val ? v.val : toCamelCase(v.name)));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (formRef) {
      formRef.current = form;
    }
  }, [formRef, form]);
  return (
    <div className="mb-6">
      <p className="text-primary Livvic-Bold text-center text-4xl px-3 mb-5">
        {petsInfo ? "Budget & Pets" : "Budget (hourly split)"}
      </p>
      <Form form={form} name="validateOnly" autoComplete="off">
        <div className="space-y-4 mx-auto max-w-4xl">
          <div>
            <p className="text-lg Livvic-SemiBold text-primary mb-4">
              What is your hourly budget for a nanny share? (required) (Families
              see both total rate & their half split)
            </p>
            <OnboardingOptionSelector
              form={form}
              options={step7Data.first}
              name={"hourlyRateSplit"}
              defaultCheckedValue={
                initialValues.hourlyBudget
                  ? deparseHourlyRate(initialValues.hourlyBudget)
                  : ""
              }
              rules={[{ required: true, message: "Please select an hourly budget." }]}
            />
          </div>

          {petsInfo && <div>
            <p className="text-lg Livvic-SemiBold text-primary mb-4">
              Do you have pets? (required)
            </p>
            <OnboardingOptionSelector
              form={form}
              options={step7Data.second}
              name={"pets"}
              defaultCheckedValue={initialValues.pets}
              defaultSpecificValue={initialValues.petsSpecify}
              specify={true}
              placeholder="Other (Specify)"
              openFieldName="specifyPets"
            />
          </div>}
        </div>
      </Form>
    </div>
  );
}

export default Step7;
