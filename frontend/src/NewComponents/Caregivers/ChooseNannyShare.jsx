import React, { useState } from 'react';
import { useNavigate, NavLink } from "react-router-dom";
import { Form } from 'antd';
import Button from '../Button';
import { InputDa } from '../../Components/subComponents/input';
import { fireToastMessage } from '../../toastContainer';

/* ─────────────────────────────────────────
   Loading Modal
───────────────────────────────────────── */
const LoadingModal = () => (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.35)" }}
    >
        <div
            className="relative bg-white rounded-3xl shadow-2xl px-10 py-10 flex flex-col items-center text-center max-w-xs w-full mx-4"
            style={{ animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}
        >
            <div className="mb-5" style={{ width: 64, height: 64 }}>
                <svg viewBox="0 0 64 64" fill="none" style={{ animation: "spin 1s linear infinite", width: 64, height: 64 }}>
                    <circle cx="32" cy="32" r="26" stroke="#AEC4FF" strokeWidth="6" strokeOpacity="0.25" />
                    <path d="M32 6 a26 26 0 0 1 26 26" stroke="#AEC4FF" strokeWidth="6" strokeLinecap="round" />
                </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Processing your info…</h2>
            <p className="text-gray-400 text-sm leading-relaxed">Finding the best nanny share path for you!</p>
            <div className="flex gap-1.5 mt-5">
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        className="block rounded-full bg-[#AEC4FF]"
                        style={{ width: 8, height: 8, animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }}
                    />
                ))}
            </div>
        </div>
        <style>{`
            @keyframes popIn { 0% { opacity:0; transform:scale(0.85); } 100% { opacity:1; transform:scale(1); } }
            @keyframes spin  { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
            @keyframes bounce { 0%,80%,100% { transform:translateY(0); opacity:0.4; } 40% { transform:translateY(-6px); opacity:1; } }
        `}</style>
    </div>
);

/* ─────────────────────────────────────────
   Maybe Later Modal
───────────────────────────────────────── */
const MaybeLaterModal = ({ onClose }) => (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.35)" }}
    >
        <div
            className="relative bg-white rounded-3xl shadow-2xl px-8 py-10 flex flex-col items-center text-center max-w-sm w-full mx-4"
            style={{ animation: "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both" }}
        >
            <div className="flex items-center justify-center rounded-full mb-5" style={{ width: 68, height: 68, background: "#AEC4FF" }}>
                <svg width="50%" height="50%" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                        stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-snug">We'll be in touch! 💌</h2>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Create a free account to browse compatible nanny share positions in your area right now.
            </p>
            <NavLink
                to="/joinNow"
                className="w-full block text-center bg-[#AEC4FF] hover:opacity-90 transition-opacity rounded-full py-3 text-base font-bold text-black mb-3"
                style={{ textDecoration: "none" }}
            >
                Create account to see positions now
            </NavLink>
            <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                No thanks
            </button>
        </div>
        <style>{`@keyframes popIn { 0% { opacity:0; transform:scale(0.85); } 100% { opacity:1; transform:scale(1); } }`}</style>
    </div>
);

/* ─────────────────────────────────────────
   Success Modal
───────────────────────────────────────── */
const SuccessModal = ({ onClose, selectedPath, navigate, recordId }) => {
    const [showMaybeLater, setShowMaybeLater] = useState(false);

    if (showMaybeLater) return <MaybeLaterModal onClose={onClose} />;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.35)" }}
        >
            <div
                className="relative bg-white rounded-3xl shadow-2xl px-8 py-10 flex flex-col items-center text-center max-w-sm w-full mx-4"
                style={{ animation: "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both" }}
            >
                <div
                    className="flex items-center justify-center rounded-full mb-5"
                    style={{ width: 68, height: 68, background: "#AEC4FF", animation: "scaleIn 0.4s 0.1s cubic-bezier(0.34,1.56,0.64,1) both" }}
                >
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <path
                            d="M7 16.5L13 22.5L25 10"
                            stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                            style={{ strokeDasharray: 30, strokeDashoffset: 0, animation: "drawCheck 0.4s 0.3s ease both" }}
                        />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-snug">You're all set! 🎉</h2>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                    Great choice! Your profile is being set up.{" "}
                    <span className="Livvic-Bold">
                        {selectedPath === 1
                            ? "We'll help you find a second family to join your current setup."
                            : "We'll start matching you with compatible nanny share families."}
                    </span>
                </p>
                <button
                    type="button"
                    onClick={() => navigate(selectedPath === 1 ? `/caregiver/nanny-share/looking-for-another-family/${recordId}` : `/caregiver/nanny-share/looking-for-nanny-share-job/${recordId}`)}
                    className="w-full block text-center bg-[#AEC4FF] hover:opacity-90 transition-opacity rounded-full py-3 text-base font-bold text-black mb-3"
                >
                    Continue – create my account
                </button>
                <button
                    type="button"
                    onClick={() => setShowMaybeLater(true)}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                    Maybe later
                </button>
            </div>
            <style>{`
                @keyframes popIn    { 0% { opacity:0; transform:scale(0.85); } 100% { opacity:1; transform:scale(1); } }
                @keyframes scaleIn  { 0% { transform:scale(0); } 100% { transform:scale(1); } }
                @keyframes drawCheck { from { stroke-dashoffset:30; } to { stroke-dashoffset:0; } }
            `}</style>
        </div>
    );
};

/* ─────────────────────────────────────────
   Path Options
───────────────────────────────────────── */
const pathOptions = [
    {
        value: 1,
        title: "I already work with a family",
        description: "Open up your schedule to a second family and turn your current role into a nanny share — earn more while staying with the family you love.",
    },
    {
        value: 2,
        title: "I'm looking for a nanny share position",
        description: "Prefer nanny share roles? Enjoy better pay, a social environment for kids, and a more structured setup. Create your profile and get matched with two compatible families.",
    },
];

/* ─────────────────────────────────────────
   Main Form
───────────────────────────────────────── */
const ChooseNannyShare = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [selectedPath, setSelectedPath] = useState(null);
    const [recordId, setRecordId] = useState("");
    const [pathError, setPathError] = useState(false);

    const handleGoBack = () => navigate("/");

    const resetFormState = () => {
        form.resetFields();
        setSelectedPath(null);
        setPathError(false);
    };

    const onFinish = async (values) => {
        if (!selectedPath) {
            setPathError(true);
            return;
        }

        if (!values.name ) {
            fireToastMessage({ type: "error", message: "Please fill out all the fields" });
            return;
        }

        setLoading(true);
        const newRecordId = crypto.randomUUID();

        const data = {
            action: "create",
            Timestamp: new Date().toISOString(),
            Id: newRecordId,
            Name: values.name || "",
            Path: selectedPath === 1 ? "Already works with a family" : "Looking for nanny share position",
            Type: "Nanny share caregiver"
        };

        const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

        if (!scriptUrl) {
            console.warn("VITE_GOOGLE_SCRIPT_URL is not set. Data:", data);
            await new Promise((r) => setTimeout(r, 1400));
            setLoading(false);
            resetFormState();
            setRecordId(newRecordId);
            setShowSuccess(true);
            return;
        }

        try {
            const formData = new URLSearchParams(data).toString();
            const response = await fetch(scriptUrl, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData,
            });
            const result = await response.text();
            console.log("Google Script response:", result);
            setRecordId(newRecordId);
        } catch (error) {
            console.error("Submission error:", error);
            fireToastMessage({ type: "error", message: "Something went wrong. Please try again." });
            setLoading(false);
            return;
        } finally {
            setLoading(false);
            resetFormState();
            setShowSuccess(true);
        }
    };

    const onFinishFailed = () => {
        if (!selectedPath) setPathError(true);
    };

    return (
        <>
            {loading && <LoadingModal />}

            {!loading && showSuccess && (
                <SuccessModal
                    onClose={() => setShowSuccess(false)}
                    selectedPath={selectedPath}
                    navigate={navigate}
                    recordId={recordId}
                />
            )}

            <div className="mb-6 container mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-primary Livvic-Bold text-center text-2xl sm:text-2xl md:text-3xl lg:text-4xl px-4 mb-6 leading-tight">
                    Basic Info
                </p>

                <div className="flex justify-center mt-6 py-4">
                    <Form
                        form={form}
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        name="chooseNannyShareForm"
                        autoComplete="off"
                        layout="vertical"
                        className="w-full max-w-2xl space-y-6 bg-white/5 p-6 rounded-2xl"
                    >
                        {/* Name */}
                        <InputDa type="text" name="name" placeholder="Enter your name" labelText="Name" />

                        {/* Email */}
                        {/* <InputDa name="email" placeholder="Enter your email" labelText="Email" type="email" required={true} /> */}

                        {/* Path selector */}
                        <div>
                            <p className="text-lg Livvic-SemiBold text-primary mb-4">
                                Choose your path <span className="text-red-400">*</span>
                            </p>
                            <div className="flex flex-col sm:flex-row items-stretch gap-6">
                                {pathOptions.map((opt) => {
                                    const isSelected = selectedPath === opt.value;
                                    return (
                                        <div
                                            key={opt.value}
                                            onClick={() => { setSelectedPath(opt.value); setPathError(false); }}
                                            className={`flex-1 cursor-pointer flex flex-col gap-4 rounded-xl border-2 p-5 transition-colors duration-200
                                                ${pathError ? "border-red-400" : isSelected ? "border-[#AEC4FF]" : "border-[#EEEEEE]"}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors duration-200
                                                    ${isSelected ? "border-[#AEC4FF]" : "border-gray-300"}`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#AEC4FF]" />}
                                                </div>
                                                <h2 className="onboarding-subHead leading-snug m-0">{opt.title}</h2>
                                            </div>
                                            <p className="onboarding-para flex-1 m-0">{opt.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                            {pathError && (
                                <p className="text-red-400 text-xs mt-2">Please select a path to continue.</p>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-4 pt-6 w-full max-w-lg mx-auto">
                            <Button
                                btnText="Go Back"
                                action={handleGoBack}
                                className="w-full sm:w-auto py-3 sm:py-4 flex items-center justify-center rounded-full text-lg Livvic-Bold text-primary hover:bg-white/5 transition-all"
                            />
                            <Form.Item className="mb-0 w-full sm:w-auto">
                                <Button
                                    btnText="Continue"
                                    htmlType="submit"
                                    className="bg-[#AEC4FF] w-full py-3 sm:py-4 flex items-center justify-center rounded-full text-lg Livvic-Bold text-black"
                                    disabled={loading}
                                />
                            </Form.Item>
                        </div>
                    </Form>
                </div>
            </div>
        </>
    );
};

export default ChooseNannyShare;