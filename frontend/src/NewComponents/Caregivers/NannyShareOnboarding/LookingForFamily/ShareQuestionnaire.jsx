import { useState, useRef, useEffect } from "react";
import { fireToastMessage } from "../../../../toastContainer";
import { useNavigate, useParams } from "react-router-dom";
import { X } from "lucide-react";
import Button from "../../../Button";
import Screen1 from "./Screen1";
import Screen2 from "./Screen2";
import Screen3 from "./Screen3";
import { registerThunk } from "../../../../Components/Redux/authSlice";
import { useDispatch } from "react-redux";
import { nannyshareProfileThunk } from "../../../../Components/Redux/nannyShareSlice";

export const ShareQuestionnaire = () => {
    const { id } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [currentStep, setCurrentStep] = useState(0);
    const [formValues, setFormValues] = useState({});
    const [sheetLoading, setSheetLoading] = useState(false);
    const [sheetUserData, setSheetUserData] = useState(null);

    useEffect(() => {
        const retrieveSheetRecord = async () => {
            if (!id) return;

            const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
            if (!scriptUrl) {
                fireToastMessage({
                    type: "error",
                    message: "Google Script URL is missing.",
                });
                return;
            }

            try {
                setSheetLoading(true);

                const response = await fetch(
                    `${scriptUrl}?recordId=${encodeURIComponent(id)}`
                );
                const result = await response.json();
                if (result.status === "success" && result.record) {
                    setSheetUserData(result.record);
                } else {
                    fireToastMessage({
                        type: "error",
                        message: result.message || "Could not load saved data",
                    });
                }

            } catch (error) {
                console.error("Auto login error:", error);
                fireToastMessage({
                    type: "error",
                    message: "Failed to log in from record.",
                });
            }
            finally {
                setSheetLoading(false);
            }
        };

        retrieveSheetRecord();
    }, [id]);

    const shareFormRef = useRef(null);

    const HandleNext = async () => {
        if (currentStep === 0) {
            shareFormRef.current
                .validateFields()
                .then((values) => {
                    if (!values.location || !values.forWho || !values.numChildren || !values.ages || values.ages.length === 0 || !values.currentSchedule || !values.joinTiming || !values.together) {
                        fireToastMessage({
                            type: "error",
                            message: "Please specify all the fields",
                        });
                        return
                    }
                    setFormValues(prev => ({
                        ...prev,
                        ...values,
                    }));
                    setCurrentStep((prev) => prev + 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                })
                .catch((errorInfo) => {
                    fireToastMessage({
                        type: "error",
                        message: errorInfo?.errorFields?.[0]?.errors?.[0] || "Please fill in all required fields",
                    });
                });
        } else if (currentStep === 1) {
            // Matches Preview Step - Just continue
            setCurrentStep((prev) => prev + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (currentStep === 2) {
            // Account Creation Step
            shareFormRef.current
                .validateFields()
                .then(async (values) => {
                    if (!values.email || !values.password) {
                        fireToastMessage({
                            type: "error",
                            message: "Please enter email and password",
                        });
                        return
                    }
                    if (!id) {
                        console.error("No record ID found in URL");
                        return;
                    }
                    const payload = {
                        action: "update",
                        Id: id,
                        Location: formValues.location?.format_location,
                        Email: values.email,
                        Type: formValues.currentSchedule
                    };

                    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

                    if (!scriptUrl) {
                        console.warn(
                            "VITE_GOOGLE_SCRIPT_URL is not set. Data:",
                            payload,
                        );
                        await new Promise((r) => setTimeout(r, 1400));
                        return;
                    }

                    const formData = new URLSearchParams(payload).toString();
                    setIsLoading(true);
                    try {
                        await fetch(scriptUrl, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded",
                            },
                            body: formData,
                        });

                        await dispatch(nannyshareProfileThunk({
                            careType: formValues.currentSchedule,
                            // careDistance: formValues.distance,
                            // careExperience: formValues.experience
                        }))
                        await Register(values.email, values.password)

                        setIsLoading(false);
                    } catch (errorInfo) {
                        fireToastMessage({
                            type: "error",
                            message:
                                errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
                        });
                    } finally {
                        setIsLoading(false);
                    }
                })
                .catch((errorInfo) => {
                    fireToastMessage({
                        type: "error",
                        message: errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
                    });
                });
        }
    };

    const Register = async (email, password) => {
        const result = await dispatch(
            registerThunk({
                name: sheetUserData?.["Name"] || "Caregiver",
                sheetId: id,
                location: formValues.location,
                goal: "Nanny adding a share",
                email: email,
                password: password,
                type: 'Nanny'
            })
        );

        if (result.payload.status === 200) {
            fireToastMessage({
                success: true,
                message: 'Your account was created successfully'
            });
            navigate(`/login?recordId=${id}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
            window.location.reload();
        } else {
            fireToastMessage({ type: 'error', message: result.payload.message });
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return <Screen1 formRef={shareFormRef} />;
            case 1:
                return <Screen2 location={formValues.location}/>;
            case 2:
                return <Screen3 formRef={shareFormRef} recordId={id} location={formValues.location} careType={formValues.currentSchedule} />;
            default:
                return null;
        }
    };

    if (id && sheetLoading) {
        return <SheetLoadingModal />
    }

    return (
        <div className="lg:px-5 Quicksand">
            {isLoading && <LoadingModal />}

            <div className="lg:mx-10 mx-2 my-10 px-4">
                <div className=" pb-1">
                    {/* <div className="flex justify-end items-center mb-8 px-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="text-2xl text-gray-500" />
                        </button>
                    </div> */}

                       <div className="px-4 py-4 rounded-3xl">
                        <div className="flex justify-center">
                            <div className="flex flex-col w-full">{renderStepContent()}</div>
                        </div>
                    </div>

                    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50">
                        <div className="flex justify-center py-4 space-x-4">
                            {currentStep > 0 && currentStep != 1 && (
                                <Button
                                    action={() => {
                                        if (currentStep > 0) {
                                            setCurrentStep((prev) => prev - 1);
                                        }
                                    }}
                                    btnText={"Back"}
                                    className="border border-[#FFFFFF] text-[#555555]"
                                />
                            )}

                            <div className="flex flex-col items-center">
                                {currentStep === 1 && <p className="Livvic-Bold text-primary text-lg mb-1">
                                    Create an account to connect
                                </p>}

                                <Button
                                    btnText={currentStep === 0 ? "See Matches Near You" : currentStep === 1 ? "Create Account" : "Continue"}
                                    action={() => HandleNext()}
                                    isLoading={isLoading}
                                    className="bg-[#AEC4FF]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LoadingModal = () => (
    <div
        className="fixed inset-0 z-[999] flex items-center justify-center"
        style={{
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0,0,0,0.35)",
        }}
    >
        <div
            className="relative bg-white rounded-3xl shadow-2xl px-10 py-10 flex flex-col items-center text-center max-w-xs w-full mx-4"
            style={{
                animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
        >
            <div className="mb-5" style={{ width: 64, height: 64 }}>
                <svg
                    viewBox="0 0 64 64"
                    fill="none"
                    style={{
                        animation: "spin 1s linear infinite",
                        width: 64,
                        height: 64,
                    }}
                >
                    <circle
                        cx="32"
                        cy="32"
                        r="26"
                        stroke="#AEC4FF"
                        strokeWidth="6"
                        strokeOpacity="0.25"
                    />
                    <path
                        d="M32 6 a26 26 0 0 1 26 26"
                        stroke="#AEC4FF"
                        strokeWidth="6"
                        strokeLinecap="round"
                    />
                </svg>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-1">
                Processing your responses…
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
                We're processing your responses. Just a moment!
            </p>

            <div className="flex gap-1.5 mt-5">
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        className="block rounded-full bg-[#AEC4FF]"
                        style={{
                            width: 8,
                            height: 8,
                            animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
                        }}
                    />
                ))}
            </div>
        </div>

        <style>{`
      @keyframes popIn {
        0%   { opacity: 0; transform: scale(0.85); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      @keyframes bounce {
        0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
        40%            { transform: translateY(-6px); opacity: 1; }
      }
    `}</style>
    </div>
);

const SheetLoadingModal = () => (
    <div
        className="fixed inset-0 z-[999] flex items-center justify-center"
        style={{
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0,0,0,0.35)",
        }}
    >
        <div
            className="relative bg-white rounded-3xl shadow-2xl px-10 py-10 flex flex-col items-center text-center max-w-xs w-full mx-4"
            style={{
                animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
        >
            <div className="mb-5" style={{ width: 64, height: 64 }}>
                <svg
                    viewBox="0 0 64 64"
                    fill="none"
                    style={{
                        animation: "spin 1s linear infinite",
                        width: 64,
                        height: 64,
                    }}
                >
                    <circle
                        cx="32"
                        cy="32"
                        r="26"
                        stroke="#AEC4FF"
                        strokeWidth="6"
                        strokeOpacity="0.25"
                    />
                    <path
                        d="M32 6 a26 26 0 0 1 26 26"
                        stroke="#AEC4FF"
                        strokeWidth="6"
                        strokeLinecap="round"
                    />
                </svg>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-1">
                Please Wait…
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
                We're processing your responses. Just a moment!
            </p>

            <div className="flex gap-1.5 mt-5">
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        className="block rounded-full bg-[#AEC4FF]"
                        style={{
                            width: 8,
                            height: 8,
                            animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
                        }}
                    />
                ))}
            </div>
        </div>

        <style>{`
      @keyframes popIn {
        0%   { opacity: 0; transform: scale(0.85); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      @keyframes bounce {
        0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
        40%            { transform: translateY(-6px); opacity: 1; }
      }
    `}</style>
    </div>
);

export default ShareQuestionnaire;
