import React, { useEffect } from "react";
import Form from "antd/es/form/Form";
import OnboardingOptionSelector from "../../../Onboarding/OnboardingOptionSelector";

const step4Data = {
    first: [
        "Yes",
        "No"
    ],
    second: [
        "Yes",
        "No"
    ],
};

function Step5({ formRef }) {
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
                Pay
            </p>

            <Form form={form} name="validateOnly" autoComplete="off">
                <div className="mx-auto max-w-3xl">

                    <p className="text-lg Livvic-SemiBold text-primary mb-4">
                        What is your total hourly rate for a nanny share?
                        (range input + split visual)
                    </p>
                    {/* <OnboardingOptionSelector
                        form={form}
                        options={step4Data.first}
                        name={"roles"}
                        multi={true}
                    />

                    <p className="text-lg Livvic-SemiBold text-primary mb-4">
                        Are you open to undergoing a background check?
                    </p>
                    <OnboardingOptionSelector
                        form={form}
                        options={step4Data.second}
                        name={"householdTasks"}
                    /> */}

                </div>
            </Form>
        </div>
    );
}

export default Step5;