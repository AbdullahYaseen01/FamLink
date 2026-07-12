
import { useRef, useState } from "react";
import HireStep4 from "../../step4";
import { Form } from "antd";
import { useNavigate } from "react-router-dom";
import { CloseOutlined } from '@ant-design/icons';
import { fireToastMessage } from "../../../../../toastContainer";
import { addOrUpdateAdditionalInfo } from "../../../../Redux/formValue";
import { Input } from 'antd';
import { useDispatch, useSelector } from "react-redux";
import { registerThunk } from "../../../../Redux/authSlice";
import Button from "../../../../../NewComponents/Button";

export default function HouseManager() {
    const [step, setStep] = useState(1);
    const hireStepFormRef = useRef(null);
    const [formData, setFormData] = useState()
    const [textAreaValue, setTextAreaValue] = useState('');
    const dispatch = useDispatch()
    const val = useSelector((s) => s.form)
    const [form] = Form.useForm();
    const handleBack = () => {
        if (step > 1) { // Move to the previous step
            setStep(prevStep => prevStep - 1);
        }
    };

    const navigate = useNavigate()
    const handleGoBack = () => {
        navigate('/joinNow'); // Navigate back in history
    };
    const Register = async () => {
        const beforeAddInfo = val.additionalInfo;
        const updatedAddInfo = [...beforeAddInfo];
        if (textAreaValue && textAreaValue.length > 0) {
            updatedAddInfo.push({ key: 'houseManager', value: ({ ...formData, specialReq: textAreaValue }) });
        }
        else{
           updatedAddInfo.push({ key: 'houseManager', value: formData })
        }

        const result = await dispatch(registerThunk({ ...val, additionalInfo: updatedAddInfo, type: "Parents" }));

        if (result.payload.status === 200) {
            fireToastMessage({ success: true, message: "Your account was created successfully" });
            navigate('/login');
            window.location.reload();
        }
        else {
            fireToastMessage({ type: 'error', message: result.payload.message });
        }
    };
    const handleNext = async () => {
        if (step == 1 && hireStepFormRef.current) {
            hireStepFormRef.current
                .validateFields()
                .then((values) => {
                    if (values.option?.length > 0) {
                        // If form is valid, submit it and move to the next step
                        
                        setFormData({ ...formData, specificDuties: values })
                        hireStepFormRef.current.resetFields();
                        setStep(prevStep => prevStep + 1); // Move to the next step
                    } else {
                        // Show an error message if no option is selected
                        fireToastMessage({ type: 'error', message: 'Select at least one option' });
                    }

                    // setStep((prevStep) => prevStep + 1);
                })
                .catch((errorInfo) => {
                    // Handle validation failure
                          fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
                });
        }
        else if (step == 2 && hireStepFormRef.current) {
            hireStepFormRef.current
                .validateFields()
                .then((values) => {
                    if (values.option?.length > 0) {
                        // If form is valid, submit it and move to the next step
                        
                        setFormData({ ...formData, reqHouseMang: values })
                        hireStepFormRef.current.resetFields();
                        setStep(prevStep => prevStep + 1); // Move to the next step
                    } else {
                        // Show an error message if no option is selected
                        fireToastMessage({ type: 'error', message: 'Select at least one option' });
                    }

                    // setStep((prevStep) => prevStep + 1);
                })
                .catch((errorInfo) => {
                    // Handle validation failure
                          fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
                });
        }
        else if (step == 3 && hireStepFormRef.current) {
            hireStepFormRef.current
                .validateFields()
                .then((values) => {
                    if (values.option?.length > 0) {
                        // If form is valid, submit it and move to the next step
                        
                        setFormData({ ...formData, preferToWork: values })
                        hireStepFormRef.current.resetFields();
                        setStep(prevStep => prevStep + 1); // Move to the next step
                    } else {
                        // Show an error message if no option is selected
                        fireToastMessage({ type: 'error', message: 'Select at least one option' });
                    }

                    // setStep((prevStep) => prevStep + 1);
                })
                .catch((errorInfo) => {
                    // Handle validation failure
                          fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
                });
        }
        else if (step == 4 && hireStepFormRef.current) {
            hireStepFormRef.current
                .validateFields()
                .then((values) => {
                    if (values.option?.length > 0) {
                        // If form is valid, submit it and move to the next step
                        
                        setFormData({ ...formData, preferSchedule: values })
                        hireStepFormRef.current.resetFields();
                        setStep(prevStep => prevStep + 1); // Move to the next step
                    } else {
                        // Show an error message if no option is selected
                        fireToastMessage({ type: 'error', message: 'Select at least one option' });
                    }

                    // setStep((prevStep) => prevStep + 1);
                })
                .catch((errorInfo) => {
                    // Handle validation failure
                          fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
                });
        }
        else if (step == 5 && hireStepFormRef.current) {
            hireStepFormRef.current
                .validateFields()
                .then((values) => {
                    if (values.option?.length > 0) {
                        // If form is valid, submit it and move to the next step
                        
                        setFormData({ ...formData, cookingSer: values })
                        hireStepFormRef.current.resetFields();
                        setStep(prevStep => prevStep + 1); // Move to the next step
                    } else {
                        // Show an error message if no option is selected
                        fireToastMessage({ type: 'error', message: 'Select at least one option' });
                    }

                    // setStep((prevStep) => prevStep + 1);
                })
                .catch((errorInfo) => {
                    // Handle validation failure
                          fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
                });
        }
        else if (step == 6 && hireStepFormRef.current) {
            hireStepFormRef.current
                .validateFields()
                .then((values) => {
                    if (values.option?.length > 0) {
                        // If form is valid, submit it and move to the next step
                        
                        setFormData({ ...formData, reqAss: values })
                        hireStepFormRef.current.resetFields();
                        setStep(prevStep => prevStep + 1); // Move to the next step
                    } else {
                        // Show an error message if no option is selected
                        fireToastMessage({ type: 'error', message: 'Select at least one option' });
                    }

                    // setStep((prevStep) => prevStep + 1);
                })
                .catch((errorInfo) => {
                    // Handle validation failure
                          fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
                });
        }
        else if (step == 7) {
            Register()
        }
    }

    const step1Data = [
        {
            name: "Cleaning"
        },
        {
            name: "Organizing"
        },
        {
            name: "Managing household staff"
        },
        {
            name: "Manage household"
        },
    ];
    const step2Data = [
        {
            name: "Daily"
        },
        {
            name: "Weekly"
        },
        {
            name: "Bi-weekly"
        },
        {
            name: "Occasional"
        },
    ]
    const step3Data = [
        {
            name: "Part-time"
        },
        {
            name: "Full-time"
        },
        {
            name: "Occasional"
        },
    ]
    const step4Data = [
        {
            name: "Specific days of the week"
        },
        {
            name: "Flexible"
        },
    ]
    const step5Data = [
        {
            name: "For child"
        },
        {
            name: "For family"
        }
    ]
    const step6Data = [
        {
            name: "Yes"
        },
        {
            name: "No"
        }
    ]


    const renderStepContent = () => {
        switch (step) {
            case 1: return (
                <HireStep4 formRef={hireStepFormRef} head={"House Manager/Housekeeper"} data={step1Data} checkBox={true} inputNot={true} subHead1={"What specific duties do you need help with?"} />
            )
            case 2: return (
                <HireStep4 formRef={hireStepFormRef} head={"House Manager/Housekeeper"} data={step2Data} checkBox={true} inputNot={true} subHead1={"How often do you require house management or housekeeping services?"} />
            )
            case 3: return (
                <HireStep4 formRef={hireStepFormRef} head={"House Manager/Housekeeper"} data={step3Data} checkBox={true} inputNot={true} subHead1={"Would you prefer to work"} />
            )
            case 4: return (
                <HireStep4 formRef={hireStepFormRef} head={"House Manager/Housekeeper"} data={step4Data} checkBox={true} subHead1={"What is your preferred schedule for these services?"} inputNot={true} />
            )
            case 5: return (
                <HireStep4 formRef={hireStepFormRef} head={"House Manager/Housekeeper"} data={step5Data} checkBox={true} subHead1={"Do you require cooking services? If so, for whom?"} inputNot={true} />
            )
            case 6: return (
                <HireStep4 formRef={hireStepFormRef} head={"House Manager/Housekeeper"} data={step6Data} checkBox={true} subHead1={"Do you require assistance with errands and grocery shopping?"} inputNot={true} />
            )
            case 7: return (
                <>
                    <p className='font-normal Livvic uppercase px-3 offer-font text-center mb-5 width-form'>
                        House Manager/Housekeeper
                    </p>
                    <Form className='flex justify-center' form={form} name="validateOnly" autoComplete="off">
                        <div>
                            <p className='Livvic text-xl mb-2 input-text line1-20'>Do you have any special requirements or preferences for the music instructor?</p>
                            <Form.Item
                                name={'anySpecialRequirements'}
                                rules={[
                                    {
                                        required: false,
                                        message: ''
                                    },
                                ]}
                            >
                                <Input.TextArea
                                    placeholder={'Specify'}
                                    rows={6}
                                    value={textAreaValue} // Bind the text area value to the state
                                    onChange={(e) => setTextAreaValue(e.target.value)}
                                    className='input-width py-4 rounded-3xl border-none no-resize'
                                />
                            </Form.Item>
                        </div>
                    </Form >
                </>
            )
        }
    }
    return (
        <>
            <div className="padd-res">
                <div className="rounded-3xl py-4 px-4" >
                    <div className='flex justify-end'>
                        <button onClick={handleGoBack}>
                            <CloseOutlined style={{ fontSize: "24px" }} />
                        </button>
                    </div>
                          <div className="flex justify-center">
            <div className="flex flex-col justify-between">
              {renderStepContent()}

              <div className="my-5 flex gap-4 justify-center">
                {step > 1 && (
                  // <button
                  //   style={{ border: "1px solid #AEC4FF" }}
                  //   className="py-2 bg-white rounded-full my-0 mx-6 px-10 text-base font-normal mt-2"
                  //   onClick={handleBack}
                  // >
                  //   Back
                  // </button>
                   <Button btnText={"Back"} action={() => handleBack()} className="border border-[#EEEEEE]"/>
                )}
                {step < 10 && (
                  // <button
                  //   style={{ background: "#85D1F1" }}
                  //   className="py-2 rounded-full my-0 mx-auto px-6 text-base font-normal transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-700 "
                  //   onClick={handleNext}
                  // >
                  //   Continue
                  // </button>
                  <Button btnText={"Continue"} action={() => handleNext()} className="bg-blue-300"/>
                )}
              </div>
            </div>
          </div>
                </div>
            </div>
        </>
    )
}