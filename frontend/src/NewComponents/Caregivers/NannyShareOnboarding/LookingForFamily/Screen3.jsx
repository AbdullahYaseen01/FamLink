import React, { useEffect, useState } from "react";
import { Form, Slider, Upload, message } from "antd";
import { Upload as UploadIcon, CheckCircle2, ShieldCheck, Truck, Award } from "lucide-react";
import OnboardingOptionSelector from "../../Onboarding/OnboardingOptionSelector";

const step4Data = {
    where: ["Current home", "Rotating homes", "Flexible"],
    flexibility: ["Very flexible", "Somewhat flexible", "Fixed"],
    matchFit: ["Similar age", "Younger", "Older", "Flexible"],
    distance: ["1-2 miles", "3-5 miles", "5-10 miles", "Flexible"],
    transport: ["Yes", "No"],
    background: ["Yes", "No"],
    certs: ["CPR Certified", "First Aid Certified", "Other"]
};

function Screen3({ formRef }) {
    const [form] = Form.useForm();
    const [rate, setRate] = useState(25);
    const [photoUrl, setPhotoUrl] = useState(null);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    useEffect(() => {
        if (formRef) formRef.current = form;
        form.setFieldsValue({ hourlyRate: 25 });
    }, [formRef, form]);

    const handleRateChange = (val) => {
        setRate(val);
        form.setFieldsValue({ hourlyRate: val });
    };

    const handleUpload = (info) => {
        // Set the preview image as soon as the file is selected
        if (info.file.originFileObj) {
            setPhotoUrl(URL.createObjectURL(info.file.originFileObj));
        }

        if (info.file.status === 'done') {
            message.success(`${info.file.name} file uploaded successfully`);
        } else if (info.file.status === 'error') {
            // It might fail because the mock URL is dead, but we still have the preview
            message.error(`${info.file.name} file upload failed, but preview is generated.`);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="text-center mb-12">
                <h1 className="text-primary Livvic-Bold text-4xl lg:text-5xl mb-4">
                    Share Details
                </h1>
                <p className="text-gray-500 text-lg max-w-xl mx-auto">
                    Almost done! These details help us build your light profile to share with potential families.
                </p>
            </div>

            <Form form={form} layout="vertical" className="max-w-3xl mx-auto space-y-12 pb-12">

                {/* SETUP SECTION */}
                <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                            <CheckCircle2 size={24} />
                        </div>
                        <h2 className="text-2xl Livvic-Bold text-primary">Setup</h2>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <p className="text-lg Livvic-SemiBold text-primary mb-4">
                                Where would care take place?
                            </p>
                            <OnboardingOptionSelector
                                form={form}
                                options={step4Data.where}
                                name="whereCare"
                            />
                        </div>

                        <div>
                            <p className="text-lg Livvic-SemiBold text-primary mb-4">
                                How flexible is your schedule for a second family?
                            </p>
                            <OnboardingOptionSelector
                                form={form}
                                options={step4Data.flexibility}
                                name="flexibility"
                            />
                        </div>
                    </div>
                </section>

                {/* PAY SECTION WITH VISUAL */}
                <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                            <span className="font-bold text-lg">$</span>
                        </div>
                        <h2 className="text-2xl Livvic-Bold text-primary">Pay</h2>
                    </div>

                    <div className="space-y-10">
                        <div>
                            <p className="text-lg Livvic-SemiBold text-primary mb-2">
                                What is your total hourly rate for a nanny share?
                            </p>
                            <p className="text-sm text-gray-400 mb-8 font-medium">This is the total rate paid by both families combined</p>

                            <div className="px-4 mb-12">
                                <Form.Item name="hourlyRate">
                                    <Slider
                                        min={20}
                                        max={60}
                                        value={rate}
                                        onChange={handleRateChange}
                                        trackStyle={{ backgroundColor: '#AEC4FF', height: 8 }}
                                    // handleStyle={{ borderColor: '#AEC4FF', height: 24, width: 24, marginTop: -8, boxShadow: '0 4px 10px rgba(174, 196, 255, 0.4)' }}
                                    // railStyle={{ height: 8, borderRadius: 4 }}
                                    />
                                </Form.Item>
                                <div className="flex justify-between text-gray-400 font-bold text-sm">
                                    <span>$20</span>
                                    <span className="text-primary text-3xl font-black">${rate}<span className="text-lg">/hr</span></span>
                                    <span>$60</span>
                                </div>
                            </div>

                            {/* Split Visual */}
                            <div className="bg-gray-50 rounded-3xl p-8 border border-dashed border-gray-200">
                                <p className="text-center text-gray-500 font-bold mb-6 uppercase tracking-wider text-xs">Estimated Split Cost</p>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 text-center">
                                        <div className="bg-white p-4 rounded-2xl shadow-sm mb-2 border border-blue-100">
                                            <p className="text-primary font-black text-2xl">${(rate * 0.6).toFixed(2)}</p>
                                        </div>
                                        <p className="text-xs text-gray-500 font-semibold">Family 1 (60%)</p>
                                    </div>
                                    <div className="text-gray-300 font-bold text-xl">+</div>
                                    <div className="flex-1 text-center">
                                        <div className="bg-white p-4 rounded-2xl shadow-sm mb-2 border border-blue-100">
                                            <p className="text-primary font-black text-2xl">${(rate * 0.6).toFixed(2)}</p>
                                        </div>
                                        <p className="text-xs text-gray-500 font-semibold">Family 2 (60%)</p>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                                    <p className="text-xs text-gray-400 italic">
                                        *Families usually pay 60-70% of your single-family rate in a share.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* MATCH PREFERENCES */}
                <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                            <CheckCircle2 size={24} />
                        </div>
                        <h2 className="text-2xl Livvic-Bold text-primary">Match Preferences</h2>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <p className="text-lg Livvic-SemiBold text-primary mb-4">
                                What type of child would be the best fit?
                            </p>
                            <OnboardingOptionSelector
                                form={form}
                                options={step4Data.matchFit}
                                name="matchFit"
                            />
                        </div>

                        <div>
                            <p className="text-lg Livvic-SemiBold text-primary mb-4">
                                How close should the other family be?
                            </p>
                            <OnboardingOptionSelector
                                form={form}
                                options={step4Data.distance}
                                name="matchDistance"
                            />
                        </div>
                    </div>
                </section>

                {/* TRUST SIGNALS */}
                <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                            <ShieldCheck size={24} />
                        </div>
                        <h2 className="text-2xl Livvic-Bold text-primary">Trust Signals</h2>
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center justify-between gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-4">
                                <Truck className="text-gray-400" />
                                <p className="font-semibold text-primary">Reliable transportation?</p>
                            </div>
                            <OnboardingOptionSelector
                                form={form}
                                options={step4Data.transport}
                                name="hasTransport"
                            />
                        </div>

                        <div className="flex items-center justify-between gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-4">
                                <ShieldCheck className="text-gray-400" />
                                <p className="font-semibold text-primary">Open to background check?</p>
                            </div>
                            <OnboardingOptionSelector
                                form={form}
                                options={step4Data.background}
                                name="openToBackground"
                            />
                        </div>
                    </div>
                </section>

                {/* LIGHT PROFILE */}
                <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600">
                            <Award size={24} />
                        </div>
                        <h2 className="text-2xl Livvic-Bold text-primary">Light Profile</h2>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <p className="text-lg Livvic-SemiBold text-primary mb-4">
                                Tell us about the family you work for
                            </p>
                            <Form.Item name="description">
                                <textarea
                                    rows={4}
                                    className="w-full rounded-2xl px-6 py-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-700 shadow-sm"
                                    placeholder="Tell us about the family you work for, your experience, and what you're looking for in a second family..."
                                />
                            </Form.Item>
                        </div>

                        <div>
                            <p className="text-lg Livvic-SemiBold text-primary mb-4">
                                Do you have any certifications?
                            </p>
                            <OnboardingOptionSelector
                                form={form}
                                options={step4Data.certs}
                                name="certifications"
                                multi={true}
                            />
                        </div>

                        <div>
                            <p className="text-lg Livvic-SemiBold text-primary mb-4">
                                Upload a photo (recommended)
                            </p>
                            <div className="flex items-center gap-6">
                                <div className="w-32 h-32 rounded-3xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                    {photoUrl ? (
                                        <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <UploadIcon className="text-gray-300" size={32} />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                                        Profiles with photos get 3x more interest from families.
                                    </p>
                                    <Upload
                                        name="avatar"
                                        showUploadList={false}
                                        action="https://www.mocky.io/v2/5cc8019d300000980a055e76" // Mock upload URL
                                        onChange={handleUpload}
                                    >
                                        <button type="button" className="px-6 py-2 rounded-full border border-primary text-primary font-bold hover:bg-primary/5 transition-all">
                                            Upload Photo
                                        </button>
                                    </Upload>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </Form>
        </div>
    );
}

export default Screen3;
