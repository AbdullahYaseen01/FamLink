import React, { useEffect } from "react";
import Form from "antd/es/form/Form";
import OnboardingOptionSelector from "../../../Onboarding/OnboardingOptionSelector";

const step1Data = {
    first: [
        "This home",
        "Rotating homes",
        "Flexible"
    ],
    second: [
        "Immediately",
        "Within 2 weeks",
        "Within a month",
        "Flexible"
    ],
    third: [
        "Very flexible",
        "Somewhat flexible",
        "Fixed"
    ]
};

function Step1({ formRef }) {
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
            <p className="text-primary Livvic-Bold text-center text-4xl px-3 mb-6">
                Share Details
            </p>

            <Form form={form} name="validateOnly" autoComplete="off">
                <div className="mx-auto max-w-3xl">

                    <p className="text-lg Livvic-SemiBold text-primary mb-4">
                        Where would care take place?
                    </p>
                    <OnboardingOptionSelector
                        form={form}
                        options={step1Data.first}
                        name={"whereCare"}
                    />

                    <p className="text-lg Livvic-SemiBold text-primary mb-4">
                        When would you like to start a nanny share?
                    </p>
                    <OnboardingOptionSelector
                        form={form}
                        options={step1Data.second}
                        name={"startAvailability"}
                    />

                    <p className="text-lg Livvic-SemiBold text-primary my-4">
                        How flexible is your schedule?
                    </p>
                    <OnboardingOptionSelector
                        form={form}
                        options={step1Data.third}
                        name={"flexibility"}
                    />

                </div>
            </Form>
        </div>
    );
}

export default Step1;