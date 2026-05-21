import React, { useEffect, useState } from "react";
import { Form, Spin } from "antd";
import Autocomplete from "react-google-autocomplete";
import OnboardingOptionSelector from "../../Onboarding/OnboardingOptionSelector";
import { NavLink } from "react-router-dom";
import { Users } from "lucide-react";

const step1Data = {
  forWho: ["A family I currently work with", "Myself (bringing my own child)"],
  numChildren: ["1", "2", "3+"],
  ages: ["Infant", "Toddler", "Preschool", "School-age"],
  schedule: ["Full-time", "Part-time", "Flexible"],
  joinTiming: ["Same schedule", "Partially overlapping", "Filling gaps", "Flexible"],
  together: ["Yes", "Sometimes", "No"],
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
        <div className='flex md:flex-row flex-col-reverse justify-between items-start md:gap-6 gap-0'>
          {/* Header */}
          <div>
            <p className="text-primary Livvic-Bold text-3xl sm:text-4xl mb-2">
              Tell us about your current setup
            </p>
            <p className="text-gray-500 Livvic-Medium text-base sm:text-lg max-w-md mb-2">
              This helps us show you the most relevant nanny share matches.
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

        <Form form={form} layout="vertical" className="max-w-3xl mt-10 sm:mt-6">

          <section className="mb-10">
            <p className="text-lg Livvic-SemiBold text-primary mb-4">
              Who is this nanny share for?
            </p>
            <OnboardingOptionSelector form={form} options={step1Data.forWho} name="forWho" />
          </section>

          <section className="mb-10">
            <p className="text-lg Livvic-SemiBold text-primary mb-4">
              How many children are currently in your care?
            </p>
            <OnboardingOptionSelector form={form} options={step1Data.numChildren} name="numChildren" />
          </section>

          <section className="mb-10">
            <p className="text-lg Livvic-SemiBold text-primary mb-2">
              What are their ages?
            </p>
            <p className="text-sm text-gray-400 mb-4 Livvic-Medium">Select all that apply</p>
            <OnboardingOptionSelector form={form} options={step1Data.ages} name="ages" multi={true} />
          </section>

          <section className="mb-10">
            <p className="text-lg Livvic-SemiBold text-primary mb-4">
              Where is care currently based?
            </p>
            <Form.Item name="location" rules={[{ required: true, message: "Address is required" }]}>
              <Spin spinning={loading} size="small">
                <Autocomplete
                  apiKey={import.meta.env.VITE_GOOGLE_KEY}
                  className="w-full sm:w-3/4 md:w-3/5 rounded-xl px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#AEC4FF] focus:border-transparent transition-all placeholder:text-gray-400"
                  value={location}
                  onPlaceSelected={async (place) => {
                    const address = place.formatted_address;
                    const components = place?.address_components || [];
                    const get = (type) => components.find((c) => c.types.includes(type))?.long_name || "";
                    const extractedCity = get("locality") || get("administrative_area_level_2");
                    const extractedNeighborhood =
                      get("neighborhood") || get("sublocality_level_1") || get("sublocality");
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
                    form.setFieldsValue({ location: locationObj });
                    setLoading(false);
                  }}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setLoading(e.target.value.length > 0);
                  }}
                  onBlur={() => setLoading(false)}
                  options={{ types: ["geocode"], componentRestrictions: { country: "us" } }}
                  placeholder="Enter zipcode"
                />
              </Spin>
            </Form.Item>
          </section>

          <section className="mb-10">
            <p className="text-lg Livvic-SemiBold text-primary mb-4">
              What schedule are you currently working?
            </p>
            <OnboardingOptionSelector form={form} options={step1Data.schedule} name="currentSchedule" />
          </section>

          <section className="mb-10">
            <p className="text-lg Livvic-SemiBold text-primary mb-4">
              When would a second family join?
            </p>
            <OnboardingOptionSelector form={form} options={step1Data.joinTiming} name="joinTiming" />
          </section>

          <section className="mb-10">
            <p className="text-lg Livvic-SemiBold text-primary mb-4">
              Would the children be together at the same time?
            </p>
            <OnboardingOptionSelector form={form} options={step1Data.together} name="together" />
          </section>

        </Form>
      </div>
    </div>
  );
}

export default Screen1;