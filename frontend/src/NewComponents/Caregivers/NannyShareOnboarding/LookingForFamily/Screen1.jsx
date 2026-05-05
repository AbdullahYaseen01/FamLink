import React, { useEffect, useState } from "react";
import { Form, Spin } from "antd";
import Autocomplete from "react-google-autocomplete";
import OnboardingOptionSelector from "../../Onboarding/OnboardingOptionSelector";

const step1Data = {
    forWho: ["A family I currently work with", "Myself (bringing my own child)"],
    numChildren: ["1", "2", "3+"],
    ages: ["Infant", "Toddler", "Preschool", "School-age"],
    schedule: ["Full-time", "Part-time", "Flexible"],
    joinTiming: ["Same schedule", "Partially overlapping", "Filling gaps", "Flexible"],
    together: ["Yes", "Sometimes", "No"]
};

function Screen1({ formRef }) {
    const [form] = Form.useForm();
    const [location, setLocation] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    useEffect(() => {
        if (formRef) formRef.current = form;
    }, [formRef, form]);

    return (
        <div className="mb-6">
            <p className="text-primary Livvic-Bold text-center text-4xl px-3 mb-6">
                Current Role Details
            </p>

            <Form form={form} layout="vertical" className="max-w-3xl mx-auto mt-12">
                <section className="mb-10">
                    <p className="text-lg Livvic-SemiBold text-primary mb-4">
                        Who is this nanny share for?
                    </p>
                    <OnboardingOptionSelector
                        form={form}
                        options={step1Data.forWho}
                        name="forWho"
                    />
                </section>

                <section className="mb-10">
                    <p className="text-lg Livvic-SemiBold text-primary mb-4">
                        How many children are currently in your care?
                    </p>
                    <OnboardingOptionSelector
                        form={form}
                        options={step1Data.numChildren}
                        name="numChildren"
                    />
                </section>

                <section className="mb-10">
                    <p className="text-lg Livvic-SemiBold text-primary mb-2">
                        What are their ages?
                    </p>
                    <p className="text-sm text-gray-400 mb-4 font-medium">Select all that apply</p>
                    <OnboardingOptionSelector
                        form={form}
                        options={step1Data.ages}
                        name="ages"
                        multi={true}
                    />
                </section>

                <section className="mb-10">
                    <p className="text-lg Livvic-SemiBold text-primary mb-4">
                        Where is care currently based?
                    </p>
                    <div className="relative">
                        <Form.Item
                            name="location"
                            rules={[{ required: true, message: "City and neighborhood are required" }]}
                        >
                            <Spin spinning={loading} size="small">
                                <Autocomplete
                                    apiKey={import.meta.env.VITE_GOOGLE_KEY}
                                    style={{
                                        width: "55%",
                                        borderRadius: "10px",
                                        padding: "0.75rem",
                                        border: "1px solid #D6DDEB",
                                    }}
                                    placeholder="Enter City + Neighborhood"
                                    value={location}
                                    onPlaceSelected={(place) => {
                                        const address = place.formatted_address;
                                        const components = place?.address_components || [];
                                        const get = (type) => components.find((c) => c.types.includes(type))?.long_name || "";

                                        const locationObj = {
                                            address: address,
                                            city: get("locality") || get("administrative_area_level_2"),
                                            neighborhood: get("neighborhood") || get("sublocality_level_1"),
                                            lat: place?.geometry?.location?.lat(),
                                            lng: place?.geometry?.location?.lng(),
                                        };

                                        setLocation(address);
                                        form.setFieldsValue({ location: locationObj });
                                        setLoading(false);
                                    }}
                                    onChange={(e) => {
                                        setLocation(e.target.value);
                                        setLoading(e.target.value.length > 0);
                                    }}
                                    onBlur={() => setLoading(false)}
                                    options={{
                                        types: ["(cities)"],
                                        componentRestrictions: { country: "us" },
                                    }}
                                />
                            </Spin>
                        </Form.Item>
                    </div>
                </section>

                <section className="mb-10">
                    <p className="text-lg Livvic-SemiBold text-primary mb-4">
                        What schedule are you currently working?
                    </p>
                    <OnboardingOptionSelector
                        form={form}
                        options={step1Data.schedule}
                        name="currentSchedule"
                    />
                </section>

                <section className="mb-10">
                    <p className="text-lg Livvic-SemiBold text-primary mb-4">
                        When would a second family join?
                    </p>
                    <OnboardingOptionSelector
                        form={form}
                        options={step1Data.joinTiming}
                        name="joinTiming"
                    />
                </section>

                <section className="mb-10">
                    <p className="text-lg Livvic-SemiBold text-primary mb-4">
                        Would the children be together at the same time?
                    </p>
                    <OnboardingOptionSelector
                        form={form}
                        options={step1Data.together}
                        name="together"
                    />
                </section>
            </Form>
        </div>
    );
}

export default Screen1;
