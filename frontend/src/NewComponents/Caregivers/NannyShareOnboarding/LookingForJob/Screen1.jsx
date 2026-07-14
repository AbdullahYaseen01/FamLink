import React, { useEffect, useState } from "react";
import { Form, Spin, Input } from "antd";
import Autocomplete from "react-google-autocomplete";
import OnboardingOptionSelector from "../../Onboarding/OnboardingOptionSelector";
import { NavLink } from "react-router-dom";
import { Users } from "lucide-react";
import { zipFromPlace } from "../../../../Config/serviceArea";

const step1Data = {
    experience: ["1-0 year", "1-3 years", "3-5 years", "5+ years"],
    schedule: ["Full-time", "Part-time", "Flexible"],
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
        <div className="relative px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto relative">
                <div className='flex md:flex-row flex-col-reverse justify-between items-start'>
                    {/* Header */}
                    <div className="mb-4">
                        <p className="text-primary Livvic-Bold text-4xl mb-2">
                            Tell us about your experience
                        </p>
                        <p className="text-gray-500 Livvic-Medium text-base sm:text-lg max-w-md mb-2">
                            Answer a few quick questions so we can connect you with compatible families near you.
                        </p>
                    </div>
                    {/* Banner — stacks on mobile, floats right on lg+ */}
                    <div className="flex justify-center mb-6 ">
                        <div className="shadow-soft rounded-2xl bg-white py-4 px-6 w-fit">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 shrink-0">
                                    <Users className="w-5 h-5 text-[#AEC4FF]" />
                                </div>
                                <div>
                                    <p className="Livvic-SemiBold text-sm text-gray-700 leading-tight"> Need to set up a family profile?</p>
                                    <NavLink
                                        to="/find-nanny-share"
                                        className="text-[#AEC4FF] Livvic-Medium text-sm hover:opacity-80 transition-opacity no-underline"
                                    >
                                        Click Here
                                    </NavLink>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Form form={form} name="validateOnly" autoComplete="off">
                    <div className="mx-auto max-w-3xl">

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

                                            // City / neighborhood suggestions carry no postal_code — look it
                                            // up, otherwise the service-area check waitlists a valid caregiver.
                                            const zip = await zipFromPlace(place);

                                            const locationObj = {
                                                type: "Point",
                                                coordinates: [lng, lat],
                                                format_location: address,
                                                city: extractedCity,
                                                neighborhood: extractedNeighborhood,
                                                zip,
                                            };

                                            setLocation(extractedNeighborhood !== extractedCity ? `${extractedNeighborhood}, ${extractedCity}` : extractedCity);
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
        </div>
    );
}

export default Screen1;