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
  third: ["Within the next month", "In 1–3 months", "In 3+ months / flexible"],
  fourth: ["Urgent – I need care soon", "Actively looking", "Just exploring"],
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
              What days and times do you need care?(required)
            </p>
            <OnboardingDaySelector
              daysState={daysState}
              setDaysState={updateDaysState}
            />
          </div>

          <div>
            <p className="text-lg Livvic-SemiBold text-primary mb-4">
              How flexible are you with scheduling?(required)
            </p>
            <OnboardingOptionSelector
              form={form}
              options={step2Data.first}
              name={"flexible"}
            />
          </div>

          <div>
            <p className="text-lg Livvic-SemiBold text-primary mb-4">
              When do you want to start the nanny share?(required)
            </p>
            <OnboardingOptionSelector
              form={form}
              options={step2Data.third}
              name={"nannyshareStart"}
            />
          </div>

          <div>
            <p className="text-lg Livvic-SemiBold text-primary mb-4">
              How urgent is your childcare search?(required)
            </p>
            <OnboardingOptionSelector
              form={form}
              options={step2Data.fourth}
              name={"urgency"}
            />
          </div>

          <div>
            <p className="text-lg Livvic-SemiBold text-primary mb-4">
              Hosting preference(required)
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
