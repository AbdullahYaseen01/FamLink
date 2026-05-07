import { useState, useRef } from "react";
import { fireToastMessage } from "../../../../toastContainer";
import { useNavigate, useParams } from "react-router-dom";
import { X } from "lucide-react";
import Button from "../../../Button";
import Screen1 from "./Screen1";
import Screen2 from "./Screen2";
import Screen3 from "./Screen3";
import Screen4 from "./Screen4";
import { registerThunk } from "../../../../Components/Redux/authSlice";
import { useDispatch } from "react-redux";

export const ShareQuestionnaire = () => {
    const { id } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [currentStep, setCurrentStep] = useState(0);
    const [formValues, setFormValues] = useState({});

    const shareFormRef = useRef(null);

    const HandleNext = async () => {
        if (currentStep === 0) {
            shareFormRef.current
                .validateFields()
                .then((values) => {
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
        } else if (currentStep === 3) {
            // Final Share Details Step
            shareFormRef.current
                .validateFields()
                .then(async (values) => {
                    const finalData = { ...formValues, ...values };
                    setIsLoading(true);
                    try {
                        await Register(finalData);
                        setIsLoading(false);
                    } catch (error) {
                        console.error("Submission error:", error);
                        fireToastMessage({ type: "error", message: "Failed to save profile" });
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

    const Register = async (data) => {
        const result = await dispatch(
            registerThunk({
                name: data.firstName,
                email: data.email,
                password: data.password,
                type: 'Nanny',
                goal: "Nanny adding a share",
                shareDetails: data
            })
        );

        if (result.payload.status === 200) {
            fireToastMessage({
                success: true,
                message: 'Your account and share profile were created successfully'
            });
            navigate(`/login?email=${encodeURIComponent(data.email)}&password=${encodeURIComponent(data.password)}`);
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
                return <Screen2 />;
            case 2:
                return <Screen3 formRef={shareFormRef} />;
            case 3:
                return <Screen4 formRef={shareFormRef} />;
            default:
                return null;
        }
    };

    return (
        <div className="lg:px-5 Quicksand min-h-screen bg-[#FAFAFA]">
            {isLoading && <LoadingModal />}

            <div className="lg:mx-10 mx-2 py-10 px-4">
                <div className="max-w-4xl mx-auto pt-8 pb-32">
                    <div className="flex justify-between items-center mb-8 px-4">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${((currentStep + 1) / 4) * 100}%` }}
                                ></div>
                            </div>
                            <span className="text-xs text-gray-400 font-medium">Step {currentStep + 1} of 4</span>
                        </div>
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="text-2xl text-gray-500" />
                        </button>
                    </div>

                    <div className="px-4 py-4">
                        <div className="flex justify-center">
                            <div className="flex flex-col w-full">{renderStepContent()}</div>
                        </div>
                    </div>

                    <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-gray-100 z-50">
                        <div className="max-w-4xl mx-auto flex justify-center items-center py-6 px-6 gap-4">
                            {currentStep > 0 && (
                                <button
                                    onClick={() => setCurrentStep((prev) => prev - 1)}
                                    className="px-8 py-3 rounded-full border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
                                >
                                    Back
                                </button>
                            )}

                            <div className="flex flex-col items-center flex-1 max-w-sm">
                                <Button
                                    btnText={
                                        currentStep === 0 ? "See Matches Near You" :
                                            currentStep === 1 ? "Create Account to Connect" :
                                                currentStep === 2 ? "Create Account & Continue" :
                                                    "Complete Profile"
                                    }
                                    action={() => HandleNext()}
                                    isLoading={isLoading}
                                    className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 py-4 rounded-full text-lg font-bold transition-all transform hover:scale-[1.02]"
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
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl p-10 flex flex-col items-center text-center max-w-xs w-full mx-4 animate-in zoom-in duration-300">
            <div className="mb-6 relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Setting up your share...</h2>
            <p className="text-gray-500 text-sm">We're finding the best matches for you.</p>
        </div>
    </div>
);

export default ShareQuestionnaire;
