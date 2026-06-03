import { useState, useRef, useEffect } from "react";
import { fireToastMessage } from "../../../../toastContainer";
import { useNavigate, useParams } from "react-router-dom";
import { X } from "lucide-react";
import Button from "../../../Button";
import Step1 from "./CompleteProfile/Step1";
import Step2 from "./CompleteProfile/Step2";
import Step3 from "./CompleteProfile/Step3";
import Step4 from "./CompleteProfile/Step4";
import Step5 from "./CompleteProfile/Step5";
import Step6 from "./CompleteProfile/Step6";
import Step7 from "./CompleteProfile/Step7";
import { useDispatch, useSelector } from "react-redux";
import { setNannyProfileCompleted } from "../../../../Components/Redux/authSlice";
import { nannyshareProfileThunk } from "../../../../Components/Redux/nannyShareSlice";

export const Screen4 = () => {
    const { id } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const totalStep = 6;
    const [currentStep, setCurrentStep] = useState(0);
    const [formValues, setFormValues] = useState({});
    
    const [image, setImage] = useState(null); // Default image
    const [file, setFile] = useState(null);

    const handleImageChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            const imageUrl = URL.createObjectURL(selectedFile);
            setImage(imageUrl); // Preview the image
            setFile(selectedFile); // Store the file for upload
        }
    };

    const familyFormRef = useRef(null);

    const HandleNext = async () => {
        if (currentStep < totalStep) {
            familyFormRef.current
                .validateFields()
                .then((values) => {
                    // Check required fields dynamically if needed or rely on antd rules
                    if (currentStep === 0 && (!values.whereCare || !values.startAvailability || !values.flexibility)) {
                        fireToastMessage({ type: "error", message: "Please specify all the fields" });
                        return;
                    }
                    if (currentStep === 1 && (!values.matchFit || !values.schoolDaycare)) {
                        fireToastMessage({ type: "error", message: "Please specify all the fields" });
                        return;
                    }
                    if (currentStep === 4 && (!values.hasPets || !values.okayWithPets || !values.matchDistance)) {
                        fireToastMessage({ type: "error", message: "Please specify all the fields" });
                        return;
                    }
                    if (currentStep === 5 && !values.communicationPreference) {
                        fireToastMessage({ type: "error", message: "Please specify your communication preference" });
                        return;
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
                        message: errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
                    });
                });
        } else if (currentStep === totalStep) {
            familyFormRef.current
                .validateFields()
                .then(async (values) => {
                    if (values.bio) {
                        setIsLoading(true);
                        const formData = buildFormData(values, formValues);
                        if (file) {
                            formData.append("imageFile", file);
                        }
                        try {
                            await dispatch(nannyshareProfileThunk(formData));

                            fireToastMessage({
                                success: true,
                                message: "Profile created",
                            });

                            dispatch(setNannyProfileCompleted());
                            navigate("/dashboard");
                        } catch (errorInfo) {
                            fireToastMessage({
                                type: "error",
                                message: errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
                            });
                        } finally {
                            setIsLoading(false);
                        }
                    } else {
                        fireToastMessage({
                            type: "error",
                            message: "Please fill out the bio field",
                        });
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

    const buildFormData = (values, formValues) => {
        const formData = new FormData();

        const appendData = (data) => {
            Object.entries(data).forEach(([key, value]) => {
                if (value === undefined || value === null) return;

                if (key === "imageFile") {
                    formData.append("image", value);
                    return;
                }

                if (Array.isArray(value)) {
                    formData.append(key, JSON.stringify(value));
                    return;
                }

                if (typeof value === "object") {
                    formData.append(key, JSON.stringify(value));
                    return;
                }

                formData.append(key, value);
            });
        };

        appendData(values);
        appendData(formValues);

        return formData;
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return <Step1 formRef={familyFormRef} />;
            case 1:
                return <Step2 formRef={familyFormRef} />;
            case 2:
                return <Step3 formRef={familyFormRef} />;
            case 3:
                return <Step4 formRef={familyFormRef} />;
            case 4:
                return <Step5 formRef={familyFormRef} />;
            case 5:
                return <Step6 formRef={familyFormRef} />;
            case 6:
                return <Step7 formRef={familyFormRef} image={image} handleImageChange={handleImageChange} />;
            default:
                return null;
        }
    };

    return (
        <div className="lg:px-5 Quicksand">
            {isLoading && <LoadingModal />}

            <div className="lg:mx-10 mx-2 px-4">
                <div className=" pb-4 pt-8">
                    {/* <div className="flex justify-end lg:mr-6">
                        <button onClick={() => navigate(-1)}>
                            <X className="text-2xl" />
                        </button>
                    </div> */}

                    <div className="px-4 pb-4 rounded-3xl">
                        <div className="flex">
                            <div className="flex flex-col w-full">{renderStepContent()}</div>
                        </div>
                    </div>

                    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50">
                        <div className="flex justify-center py-4 space-x-4">
                            {currentStep > 0 && (
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

                            <Button
                                btnText={totalStep === currentStep ? "Submit Responses" : "Continue"}
                                action={() => HandleNext()}
                                isLoading={isLoading}
                                loadingBtnText={"Saving Responses"}
                                className="bg-[#AEC4FF]"
                            />
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

            <h2 className="text-xl Livvic-Bold text-gray-900 mb-1">
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

export default Screen4;
