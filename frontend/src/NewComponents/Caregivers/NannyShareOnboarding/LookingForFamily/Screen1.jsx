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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-12">
                <h1 className="text-primary Livvic-Bold text-4xl lg:text-5xl mb-4">
                    Current Role Details
                </h1>
                <p className="text-gray-500 text-lg max-w-xl mx-auto">
                    Tell us about your current arrangement so we can find the perfect second family for your nanny share.
                </p>
            </div>

            <Form form={form} layout="vertical" className="max-w-3xl mx-auto space-y-10">
                <section>
                    <p className="text-xl Livvic-SemiBold text-primary mb-4">
                        Who is this nanny share for?
                    </p>
                    <OnboardingOptionSelector
                        form={form}
                        options={step1Data.forWho}
                        name="forWho"
                    />
                </section>

                <section>
                    <p className="text-xl Livvic-SemiBold text-primary mb-4">
                        How many children are currently in your care?
                    </p>
                    <OnboardingOptionSelector
                        form={form}
                        options={step1Data.numChildren}
                        name="numChildren"
                    />
                </section>

                <section>
                    <p className="text-xl Livvic-SemiBold text-primary mb-2">
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

                <section>
                    <p className="text-xl Livvic-SemiBold text-primary mb-4">
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
                                    className="w-full lg:w-3/4 rounded-2xl px-6 py-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-700 shadow-sm"
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

                <section>
                    <p className="text-xl Livvic-SemiBold text-primary mb-4">
                        What schedule are you currently working?
                    </p>
                    <OnboardingOptionSelector
                        form={form}
                        options={step1Data.schedule}
                        name="currentSchedule"
                    />
                </section>

                <section>
                    <p className="text-xl Livvic-SemiBold text-primary mb-4">
                        When would a second family join?
                    </p>
                    <OnboardingOptionSelector
                        form={form}
                        options={step1Data.joinTiming}
                        name="joinTiming"
                    />
                </section>

                <section>
                    <p className="text-xl Livvic-SemiBold text-primary mb-4">
                        Would the children be together at the same time?
                    </p>
                    <OnboardingOptionSelector
                        form={form}
                        options={step1Data.together}
                        name="together"
                    />
                </section>

                {/* Preview CTA visual hint */}
                <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10 mt-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-2xl">🔍</div>
                        <div>
                            <p className="font-bold text-primary">Preview matches near you</p>
                            <p className="text-sm text-gray-500">We found 12 families looking for a share in your area!</p>
                        </div>
                    </div>
                    <div className="flex -space-x-4 mb-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden shadow-sm">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=family${i}`} alt="Family" />
                            </div>
                        ))}
                        <div className="w-10 h-10 rounded-full border-2 border-white bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shadow-sm">+9</div>
                    </div>
                </div>
            </Form>
        </div>
    );
}

export default Screen1;
