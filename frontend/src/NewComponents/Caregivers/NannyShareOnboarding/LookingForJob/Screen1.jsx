import React, { useEffect, useState } from "react";
import { Form, Spin, Input } from "antd";
import Autocomplete from "react-google-autocomplete";
import OnboardingOptionSelector from "../../Onboarding/OnboardingOptionSelector";

const step1Data = {
    experience: ["1-0 years", "1-3 years", "3-5 years", "5+ years"],
    schedule: ["Full-Time", "Part-Time", "Flexible"],
    distance: ["1-3 miles", "3-5 miles", "5-10 miles", "Flexible"],
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
                Quick setup to find matches near you
            </p>

            <Form form={form} name="validateOnly" autoComplete="off">
                <div className="mx-auto max-w-3xl mt-12">

                    <p className="text-lg Livvic-SemiBold text-primary mb-4">
                        How many years of childcare experience?
                    </p>
                    <OnboardingOptionSelector
                        form={form}
                        options={step1Data.experience}
                        name="experience"
                    />

                    <p className="text-lg Livvic-SemiBold text-primary mt-6 mb-4">
                        What schedule are you looking for?
                    </p>
                    <OnboardingOptionSelector
                        form={form}
                        options={step1Data.schedule}
                        name="nannyShareType"
                    />

                    <p className="text-lg Livvic-SemiBold text-primary mt-6 mb-4">
                        Where are you based?
                    </p>
                    <div className="relative">
                        <Form.Item
                            name="location"
                            rules={[{ required: true, message: "Address is required" }]}
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
                                    value={location}
                                    onPlaceSelected={async (place) => {
                                        const address = place.formatted_address;
                                        const components = place?.address_components || [];

                                        const get = (type) =>
                                            components.find((c) => c.types.includes(type))?.long_name || "";

                                        const extractedCity =
                                            get("locality") || get("administrative_area_level_2");

                                        const extractedNeighborhood =
                                            get("neighborhood") ||
                                            get("sublocality_level_1") ||
                                            get("sublocality");

                                        const lat = place?.geometry?.location?.lat();
                                        const lng = place?.geometry?.location?.lng();

                                        const locationObj = {
                                            type: "Point",
                                            coordinates: [lng, lat],
                                            format_location: address,
                                            city: extractedCity,
                                            neighborhood: extractedNeighborhood,
                                        };

                                        setLocation(address);
                                        form.setFieldsValue({
                                            location: locationObj,
                                        });

                                        setLoading(false);
                                    }}
                                    onChange={(e) => {
                                        setLocation(e.target.value);
                                        setLoading(e.target.value.length > 0);
                                    }}
                                    onBlur={() => setLoading(false)}
                                    options={{
                                        types: ["geocode"],
                                        componentRestrictions: { country: "us" },
                                    }}
                                />
                            </Spin>
                        </Form.Item>
                    </div>

                    <p className="text-lg Livvic-SemiBold text-primary mb-4">
                        How far are you willing to travel?
                    </p>
                    <OnboardingOptionSelector
                        form={form}
                        options={step1Data.distance}
                        name="distance"
                    />

                </div>
            </Form>
        </div>
    );
}

export default Screen1;