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

export const JobQuestionnaire = () => {
    const { id } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const totalStep = 15;
    const [currentStep, setCurrentStep] = useState(0);
    const [formValues, setFormValues] = useState({});
    // const [showSuccessModal, setShowSuccessModal] = useState(false); // ✅ modal state
    const [sheetLoading, setSheetLoading] = useState(false);
    const [sheetUserData, setSheetUserData] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false); // ✅ modal state

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

    const jobFormRef = useRef(null);

    const HandleNext = async () => {
        if (currentStep == 0) {
            jobFormRef.current
                .validateFields()
                .then((values) => {
                    if (!values.location || !values.experience || !values.nannyShareType || !values.distance) {
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
                        message:
                            errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
                    });
                });
        } else if (currentStep == 1) {
            jobFormRef.current
                .validateFields()
                .then((values) => {
                    setCurrentStep((prev) => prev + 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                })
                .catch((errorInfo) => {
                    fireToastMessage({
                        type: "error",
                        message:
                            errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
                    });
                });
        } else if (currentStep == 2) {
            jobFormRef.current
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
                        Location: JSON.stringify(formValues.location),
                        Email: values.email,
                        distance: formValues.distance
                    };

                    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

                    if (!scriptUrl) {
                        console.warn(
                            "VITE_GOOGLE_SCRIPT_URL is not set. Data:",
                            payload,
                        );
                        await new Promise((r) => setTimeout(r, 1400));
                        // setIsLoading(false);
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
                            careType: formValues.nannyShareType,
                            careDistance: formValues.distance,
                            careExperience: formValues.experience
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
                        message:
                            errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
                    });
                });
        }
    };

    const Register = async (email, password) => {
        const result = await dispatch(
            registerThunk({ name: sheetUserData?.["Name"], sheetId: id, location: { ...formValues.location, distance: formValues.distance }, goal: "Looking for nanny share job", email: email, password: password, type: 'Nanny' })
        )

        if (result.payload.status === 200) {
            fireToastMessage({
                success: true,
                message: 'Your account was created successfully'
            })
            navigate(`/login?recordId=${id}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`)
            window.location.reload()
        } else {
            fireToastMessage({ type: 'error', message: result.payload.message })
        }
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return <Screen1 formRef={jobFormRef} />;
            case 1:
                return (
                    <Screen2 formRef={jobFormRef} />
                );
            case 2:
                return (
                    <Screen3 formRef={jobFormRef} recordId={id} location={formValues.location} distance={formValues.distance} careType={formValues.nannyShareType} careExperience={formValues.experience} />
                );
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
            {/* ✅ Final success modal */}
            {/* {showSuccessModal && (
                <FinalSuccessModal
                    recordId={id}
                    onClose={() => {
                        setShowSuccessModal(false);
                        navigate("/");
                    }}
                />
            )} */}

            <div className="lg:mx-10 mx-2 my-10 px-4">
                <div className="pt-8 pb-4">
                    <div className="flex justify-end lg:mr-6">
                        <button onClick={() => navigate(-1)}>
                            <X className="text-2xl" />
                        </button>
                    </div>

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

// const FinalSuccessModal = ({ onClose, recordId }) => {
//     const navigate = useNavigate();

//     return (
//         <div
//             className="fixed inset-0 z-[999] flex items-center justify-center"
//             style={{
//                 backdropFilter: "blur(8px)",
//                 backgroundColor: "rgba(0,0,0,0.35)",
//             }}
//         >
//             <div
//                 className="relative bg-white rounded-3xl shadow-2xl px-8 py-10 flex flex-col items-center text-center max-w-sm w-full mx-4"
//                 style={{
//                     animation: "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
//                 }}
//             >
//                 {/* Success Icon */}
//                 <div
//                     className="flex items-center justify-center rounded-full mb-5"
//                     style={{
//                         width: 68,
//                         height: 68,
//                         background: "#FFADE1",
//                         animation:
//                             "scaleIn 0.4s 0.1s cubic-bezier(0.34,1.56,0.64,1) both",
//                     }}
//                 >
//                     <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
//                         <path
//                             d="M7 16.5L13 22.5L25 10"
//                             stroke="white"
//                             strokeWidth="3"
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             style={{
//                                 strokeDasharray: 30,
//                                 strokeDashoffset: 0,
//                                 animation: "drawCheck 0.4s 0.3s ease both",
//                             }}
//                         />
//                     </svg>
//                 </div>

//                 <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-snug">
//                     You’re all set! 🎉
//                 </h2>

//                 <p className="text-gray-600 text-sm mb-6 leading-relaxed">
//                     Thanks for sharing those details. We’ll use this information to
//                     manually match you into a nanny share and email you with an update
//                     within 24 hours.
//                 </p>

//                 <button
//                     type="button"
//                     onClick={() =>
//                         navigate(`/hire?recordId=${recordId || ""}`)
//                     }
//                     className="w-full block text-center bg-[#FFADE1] hover:bg-[#f99dd5] transition-colors rounded-full py-3 text-base font-bold text-black"
//                 >
//                     Set up my FamLink profile now
//                 </button>

//                 <p className="text-xs text-gray-500 mt-3 mb-4 leading-relaxed max-w-[280px]">
//                     Save and update your info, and view your nanny-share matches in one
//                     place.
//                 </p>

//                 <button
//                     type="button"
//                     onClick={onClose}
//                     className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
//                 >
//                     Close for now
//                 </button>
//             </div>

//             <style>{`
//         @keyframes popIn {
//           0%   { opacity: 0; transform: scale(0.85); }
//           100% { opacity: 1; transform: scale(1); }
//         }
//         @keyframes scaleIn {
//           0%   { transform: scale(0); }
//           100% { transform: scale(1); }
//         }
//         @keyframes drawCheck {
//           from { stroke-dashoffset: 30; }
//           to   { stroke-dashoffset: 0; }
//         }
//       `}</style>
//         </div>
//     );
// };

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
                        stroke="#FFADE1"
                        strokeWidth="6"
                        strokeOpacity="0.25"
                    />
                    <path
                        d="M32 6 a26 26 0 0 1 26 26"
                        stroke="#FFADE1"
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
                        className="block rounded-full bg-[#FFADE1]"
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
                Preparing the questions…
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
                We're processing your responses and preparing the questions. Just a moment!
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