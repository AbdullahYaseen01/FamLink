import React, { useEffect } from "react";
import Form from "antd/es/form/Form";
import OnboardingDaySelector from "../../Caregivers/Onboarding/OnboardingDaySelector";
import OnboardingOptionSelector from "../../Caregivers/Onboarding/OnboardingOptionSelector";
import StartEndDatePicker from "./StartEndDatePicker";

const step2Data = {
  first: ["Very flexible", "Somewhat flexible", "Not flexible"],
  second: [
    "Your home",
    "Other family’s home",
    "Rotating between homes",
    "Neutral location (e.g., school pickup spot)",
  ],
};

function Step2({
  daysState,
  setDaysState,
  formRef,
  hostingOption,
  seasonal = false,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
}) {
  const updateDaysState = (updatedDaysState) => {
    setDaysState(updatedDaysState);
  };

  const [form] = Form.useForm();
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
      <p className="text-primary Livvic-Bold text-center text-4xl px-3 mb-5">
        Schedule & Hosting
      </p>
      <Form form={form} name="validateOnly" autoComplete="off">
        <div className="space-y-4 mx-auto max-w-3xl">
          {seasonal && (
            <div>
              <p className="text-lg Livvic-SemiBold text-primary mb-4">
                What dates do you need care? (start & end date)
              </p>
              <StartEndDatePicker
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
              />
            </div>
          )}
          <div>
            <p className="text-lg Livvic-SemiBold text-primary mb-4">
              What days and times do you need care?
            </p>
            <OnboardingDaySelector
              daysState={daysState}
              setDaysState={updateDaysState}
            />
          </div>

          <div>
            <p className="text-lg Livvic-SemiBold text-primary mb-4">
              How flexible are you with scheduling?
            </p>
            <OnboardingOptionSelector
              form={form}
              options={step2Data.first}
              name={"flexible"}
            />
          </div>

          <div>
            <p className="text-lg Livvic-SemiBold text-primary mb-4">
              Hosting preference
            </p>
            <OnboardingOptionSelector
              form={form}
              options={hostingOption ?? step2Data.second}
              name={"hosting"}
            />
          </div>
        </div>
      </Form>
    </div>
  );
}

export default Step2;
