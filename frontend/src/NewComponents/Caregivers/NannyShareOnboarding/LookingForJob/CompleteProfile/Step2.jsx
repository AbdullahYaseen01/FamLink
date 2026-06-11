import React, { useEffect } from "react";
import Form from "antd/es/form/Form";
import OnboardingOptionSelector from "../../../Onboarding/OnboardingOptionSelector";
import OnboardingDaySelector from "../../../Onboarding/OnboardingDaySelector";

const step2Data = [
    "Immediately", "Within 2 weeks", "Within a month", "Flexible"
]


function Step2({ formRef, daysState, setDaysState, initialValues }) {
    const [form] = Form.useForm();

    const updateDaysState = (updatedDaysState) => {
        setDaysState(updatedDaysState);
    };

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
            <p className="text-primary Livvic-Bold text-center text-4xl px-3 mb-6">
                Availability
            </p>

            <Form form={form} name="validateOnly" autoComplete="off">
                <div className="mx-auto max-w-3xl">

                    <p className="text-lg Livvic-SemiBold text-primary mb-4">
                        Select your working days and times
                    </p>
                    <OnboardingDaySelector
                        daysState={daysState}
                        setDaysState={updateDaysState}
                    />

                    <p className="text-lg Livvic-SemiBold text-primary mb-4">
                        When are you available to start?
                    </p>
                    <OnboardingOptionSelector
                        form={form}
                        options={step2Data}
                        name={"startAvailability"}
                        defaultCheckedValue={initialValues?.startAvailability}
                    />

                </div>
            </Form>
        </div>
    );
}

export default Step2;