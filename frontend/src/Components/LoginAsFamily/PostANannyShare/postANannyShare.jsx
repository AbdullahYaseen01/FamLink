import { useState, useRef } from "react";
import CustomStepper from "../../../postSteps";
import HireStep4 from "../../subComponents/Hire/step4"; // Import your form component
import { fireToastMessage } from "../../../toastContainer";
import { cleanFormData1 } from "../../subComponents/toCamelStr";
import { Form, Input } from "antd";
import HireStep3 from "../../subComponents/Hire/step3";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import HireStep2 from "../../subComponents/Hire/step2";
import {
  parseHourlyRate,
  step2Data,
  step3Data,
  step4Data,
  step5Data,
  step6Data,
  step7Data,
  step8Data,
  step9Data,
  step10Data,
  step11Data,
  step12Data,
  step13Data,
} from "../../../Config/helpFunction";
import { useDispatch } from "react-redux";
import { postNannyShare } from "../../Redux/nannyShareSlice";
import Button from "../../../NewComponents/Button";
import Step1 from "../../../NewComponents/NannyShare/PostANannyShare/step1";
import { addOrUpdateAdditionalInfo } from "../../Redux/formValue";
import OpenText from "../../../NewComponents/NannyShare/PostANannyShare/OpenText";
import Step2 from "../../../NewComponents/NannyShare/PostANannyShare/step2";
import Step7 from "../../../NewComponents/NannyShare/PostANannyShare/step7";
import Step8 from "../../../NewComponents/NannyShare/PostANannyShare/step8";

export const PostANannyShare = () => {
  const stepRef = useRef(null);
  const dispatch = useDispatch();
  const [selectedValue, setSelectedValue] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const totalStep = 15;
  const [currentStep, setCurrentStep] = useState(0);
  const [formValues, setFormValues] = useState({});
  const [textAreaValue, setTextAreaValue] = useState(
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  );

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Initialize the state in the parent component
  const [daysState, setDaysState] = useState(
    daysOfWeek.reduce((acc, day) => {
      acc[day] = { checked: false, start: null, end: null };
      return acc;
    }, {}),
  );

  const jobFormRef = useRef(null);

  const handleChange = (e) => {
    setTextAreaValue(e.target.value);
  };

  const HandleNext = async () => {
    if (currentStep == 0) {
      jobFormRef.current
        .validateFields()
        .then((values) => {
          // const hasValues = Object.keys(values || {}).length > 0;
          console.log("Values", values);
          if ((values.option || values.specifyOption) && values.hasNanny && values.shareLocation) {
            const route = values.option ?? values.specifyOption;
            dispatch(
              addOrUpdateAdditionalInfo({
                key: "nannyShareType",
                value: route,
              }),
            );
            dispatch(
              addOrUpdateAdditionalInfo({
                key: "hasNanny",
                value: values.hasNanny,
              }),
            );
            dispatch(
              addOrUpdateAdditionalInfo({
                key: "shareLocation",
                value: values.shareLocation,
              }),
            );
            if (values.specifyNearbyWorkplace) {
              dispatch(
                addOrUpdateAdditionalInfo({
                  key: "specifyNearbyWorkplace",
                  value: values.specifyNearbyWorkplace,
                }),
              );
            }
            if (route === "full-time care") {
              navigate("/family/post-a-nannyShare/fulltime-care");
            } else if (route === "part-time care") {
              navigate("/family/post-a-nannyShare/parttime-care");
            } else if (route === "pickup/drop-off (Carpool style)") {
              navigate("/family/post-a-nannyShare/pickup-dropoff");
            } else if (route === "after-school care") {
              navigate("/family/post-a-nannyShare/after-school");
            } else if (route === "summer/Seasonal") {
              navigate("/family/post-a-nannyShare/seasonal");
            } else if (route === "weekend nanny share") {
              navigate("/family/post-a-nannyShare/weekend");
            } else {
              setFormValues({
                ...formValues,
                otherShareTypeSpecify: route,
              });
              setCurrentStep((prev) => prev + 1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          } else {
            fireToastMessage({
              type: "error",
              message: "Select one type or specify if other. Please fill all the details",
            });
          }
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
          if (values.describeCare) {
            setFormValues({
              ...formValues,
              careDescription: values.describeCare,
            });
            setCurrentStep((prev) => prev + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            fireToastMessage({
              type: "error",
              message: "Please specify the care before proceeding",
            });
          }
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
        .then((values) => {
          if (values.flexible && values.hosting) {
            const selectedDays = Object.entries(daysState).filter(
              ([day, { checked }]) => checked,
            );

            if (selectedDays.length === 0) {
              fireToastMessage({
                type: "error",
                message: "Atleast select one day and time.",
              });
              return;
            }
            let allValid = true; // Flag to check if all selected days have valid start and end times
            let invalidDays = [];

            // Loop through selected days to ensure each has a valid start and end time
            selectedDays.forEach(([day, { start, end }]) => {
              if (!start || !end) {
                allValid = false;
                invalidDays.push(day); // Collect days with missing start or end times
              } else if (start.isSame(end)) {
                allValid = false;
                invalidDays.push(day); // Collect days where start and end are the same
              } else if (end.isBefore(start)) {
                // Error if end time is before start time
                allValid = false;
                invalidDays.push(day); // Collect days where end is before start
              }
            });

            if (!allValid) {
              fireToastMessage({
                type: "error",
                message: `The following selected days have invalid start or end times: ${invalidDays.join(
                  ", ",
                )}`,
              });
              return;
            }
            const checkedDays = Object.entries(daysState)
              .filter(([day, data]) => data.checked) // Keep only those with checked: true
              .reduce((acc, [day, data]) => {
                // Convert start and end times to string (ISO format or any preferred format)
                const start = data.start.toISOString(); // Assuming start is a date object
                const end = data.end.toISOString(); // Assuming end is a date object

                acc[day] = {
                  ...data,
                  start, // Replace the start time with a string
                  end, // Replace the end time with a string
                };
                return acc;
              }, {});

            setFormValues({
              ...formValues,
              specificDays: checkedDays,
              flexibility: values.flexible,
              hostingPreference: values.hosting,
            });
            setCurrentStep((prev) => prev + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            fireToastMessage({
              type: "error",
              message:
                "Please provide flexibility, hosting info and select atleast one day and time.",
            });
          }
        })
        .catch((errorInfo) => {
          // Handle validation failure
          fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
        });
    } else if (currentStep == 3) {
      jobFormRef.current
        .validateFields()
        .then((values) => {
          if (values.hourlyRateSplit || values.specifyHourlyRateSplit) {
            const cleanData = cleanFormData1(values);

            let updatedValues = {
              ...formValues,
              hourlyBudget: parseHourlyRate(cleanData.hourlyRateSplit),
              hourlyBudgetSpecify: cleanData.specifyHourlyRateSplit,
            };
            setFormValues(updatedValues);
            jobFormRef.current.resetFields();
            setCurrentStep((prev) => prev + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            // Show an error message if no option is selected
            fireToastMessage({
              type: "error",
              message: "Select or specify an hourly rate to proceed",
            });
          }
        })
        .catch((errorInfo) => {
          // Handle validation failure
          fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
        });
    } else if (currentStep == 4) {
      jobFormRef.current
        .validateFields()
        .then((values) => {
          // Check if the preferredLocation (or whatever your field is) has been set
          if (
            values.prefferedCommunication ||
            values.specifyPrefferedCommunication
          ) {
            // If form is valid, submit it and move to the next step

            let updatedValues = {
              ...formValues,
              // Store single value, or empty string if not provided
              communicationPreference: values.prefferedCommunication || "",
              communicationSpecify: values.specifyPrefferedCommunication || "",

              backupCare: values.backupAvailable || "",
              backupCareSpecify: values.specifyBackupAvailable || "",

              involvementLevel: values.involvement || "",
            };

            setFormValues(updatedValues);
            jobFormRef.current.resetFields();
            setCurrentStep((prev) => prev + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            // Show an error message if no option is selected
            fireToastMessage({
              type: "error",
              message: "Please fill out all the fields",
            });
          }
        })
        .catch((errorInfo) => {
          // Handle validation failure
          fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
        });
    } else if (currentStep == 5) {
      jobFormRef.current
        .validateFields()
        .then(async (values) => {
          let updatedValues = { ...formValues };

          // Only add additionalInfo if it exists
          if (values.additionalInfo) {
            updatedValues.openNotes = values.additionalInfo;
            setFormValues(updatedValues);
          }

          try {
            const { data } = await dispatch(
              postNannyShare({
                ...updatedValues,
              }),
            ).unwrap();
            fireToastMessage({
              success: true,
              message: data.message,
            });
            setIsLoading(false);
            navigate("/family/nannyShare");
          } catch (err) {
            setIsLoading(false);
            fireToastMessage({ type: "error", message: err.message });
          }
          jobFormRef.current.resetFields();
          window.scrollTo({ top: 0, behavior: "smooth" });
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
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          // <HireStep2
          //   opt={Array.from({ length: 4 }, (_, i) => i + 1)}
          //   formRef={jobFormRef}
          //   selectedValue={selectedValue}
          //   handleSelectChange={setSelectedValue}
          // />
          <Step1 formRef={jobFormRef} />
        );
      case 1:
        return (
          // <HireStep3
          //   daysState={daysState}
          //   setDaysState={updateDaysState}
          //   head={"What is your desired schedule for nanny care?"}
          // />
          <OpenText
            title={"Please describe the type of care you’re looking for"}
            formRef={jobFormRef}
            openFieldName={"describeCare"}
            placeholder={"Describe..."}
          />
        );

      case 2:
        return (
          // <HireStep4
          //   formRef={jobFormRef || {}}
          //   inputName={"Specify"}
          //   head={"How flexible are you with scheduling and arrangements?"}
          //   data={step2Data}
          // />
          <Step2
            formRef={jobFormRef}
            daysState={daysState}
            setDaysState={setDaysState}
          />
        );

      case 3:
        return (
          // <HireStep4
          //   formRef={jobFormRef || {}}
          //   inputName={"Specify"}
          //   head={"Do you have a specific parenting style or philosophy?"}
          //   data={step3Data}
          // />
          <Step7 formRef={jobFormRef} petsInfo={false} />
        );
      case 4:
        return (
          // <HireStep4
          //   checkBox={true}
          //   formRef={jobFormRef || {}}
          //   inputName={"Specify"}
          //   head={"What responsibilities would you like the nanny to handle?"}
          //   data={step4Data}
          // />
          <Step8 formRef={jobFormRef} involvement={false} />
        );
      case 5:
        return (
          // <HireStep4
          //   formRef={jobFormRef || {}}
          //   inputName={"Specify"}
          //   head={"What is your hourly budget for a nanny share?"}
          //   subHead2={
          //     "This is the total hourly rate for the nanny. If split between two families, you will each pay half of the selected amount."
          //   }
          //   data={step5Data}
          // />
          <OpenText
            title={
              "Anything else another family should know? (optional free-text)"
            }
            formRef={jobFormRef}
            openFieldName={"additionalInfo"}
            placeholder={"Specify..."}
            required={false}
          />
        );
    }
  };
  return (
    <div className="lg:px-5 Quicksand">
      {/* Stepper Component */}
      {/* <div className="lg:px-10 px-2">
        <CustomStepper
          stepCount={totalStep}
          currentStep={currentStep}
          onChange={setCurrentStep}
          ref={stepRef}
        />
      </div> */}

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
              {currentStep > 0 && (
                // <button
                //     className="mx-auto text-[#38AEE3] bg-white border border-[#38AEE3] lg:w-48 w-24 lg:py-2 py-1 rounded-full font-normal text-base transition hover:opacity-60 duration-700 delay-150 ease-in-out"
                //     onClick={() => {
                //         if (currentStep > 0) {
                //             stepRef.current?.prev();
                //         }
                //     }}
                // >
                //     Back
                // </button>
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

              {/* <button
                                className="mx-auto bg-[#38AEE3] text-white lg:w-48 w-24 lg:py-2 py-1 border-none rounded-full font-normal text-base transition hover:-translate-y-1 duration-700 delay-150 ease-in-out hover:scale-110 disabled:opacity-70 disabled:cursor-not-allowed"
                                onClick={HandleNext}
                                disabled={isLoading} // Disable while loading
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8h4z" />
                                        </svg>
                                        Post a Job
                                    </span>
                                ) : (
                                    (totalStep - 1) === currentStep ? 'Post a Job' : 'Continue'
                                )}
                            </button> */}
              <Button
                btnText={
                  totalStep - 1 === currentStep ? "Post a Job" : "Continue"
                }
                action={() => HandleNext()}
                isLoading={isLoading}
                loadingBtnText="Post a Job"
                className="bg-[#AEC4FF]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
