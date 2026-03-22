import { useState, useRef } from "react";
import CustomStepper from "../../../../postSteps";
// import HireStep4 from "../../subComponents/Hire/step4"; // Import your form component
import { fireToastMessage } from "../../../../toastContainer";
import { cleanFormData1 } from "../../../../Components/subComponents/toCamelStr";
import { Form, Input } from "antd";
// import HireStep3 from "../../subComponents/Hire/step3";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
// import HireStep2 from "../../subComponents/Hire/step2";
import { parseHourlyRate } from "../../../../Config/helpFunction";
import { useDispatch, useSelector } from "react-redux";
import { postNannyShare } from "../../../../Components/Redux/nannyShareSlice";
import Button from "../../../Button";
import Step1 from "../step1";
import OpenText from "../OpenText";
import Step2 from "../step2";
import Step7 from "../step7";
import Step8 from "../step8";
import Step3 from "../step3";
import Step4 from "../step4";
import Step5 from "../step5";

const afterSchoolCareOptions = [
  "Not Applicable",
  "Transportation",
  "Snacks/meal prep",
  "Homework help",
  "Activities/outdoor play",
];

export const Seasonal = () => {
  const stepRef = useRef(null);
  const dispatch = useDispatch();
  const [selectedValue, setSelectedValue] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { additionalInfo } = useSelector((s) => s.form);
  const totalStep = 6;
  const [currentStep, setCurrentStep] = useState(0);
  const [formValues, setFormValues] = useState({});
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
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

  // This function will update the state when passed down to HireStep3
  const updateDaysState = (updatedDaysState) => {
    setDaysState(updatedDaysState);
  };

  const jobFormRef = useRef(null);

  const handleChange = (e) => {
    setTextAreaValue(e.target.value);
  };

  const HandleNext = async () => {
    if (currentStep == 0) {
      jobFormRef.current
        .validateFields()
        .then((values) => {
          if (values.flexible && values.hosting && values.nannyshareStart && values.urgency) {
            const selectedDays = Object.entries(daysState).filter(
              ([day, { checked }]) => checked,
            );

            // console.log("start date", startDate);
            // console.log("end date", endDate);

            if (!(startDate && endDate)) {
              fireToastMessage({
                type: "error",
                message: "Please select the start and end dates",
              });
              return;
            }

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

            const dates = {
              startDate: startDate,
              endDate: endDate,
            };

            setFormValues({
              ...formValues,
              Seasonal: dates,
              specificDays: checkedDays,
              flexibility: values.flexible,
              hostingPreference: values.hosting,
              nannyshareStart: values.nannyshareStart,
              urgency: values.urgency,
            });

            jobFormRef.current.resetFields();
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
          // console.log("form", formValues);
          if (values.healthConsideration || values.specifyHealthConsideration) {
            // Extract children ages dynamically
            // console.log("Form", formValues);
            const childrenAges = Object.entries(values)
              .filter(([key, val]) => key.includes("_age") && val) // only ChildX_age keys with values
              .map(([key, ageStr]) => {
                const childIndex = key.split("_")[0]; // e.g., "Child1"
                const unitKey = `${childIndex}_unit`;
                const unit = values[unitKey] || "years"; // default to years if missing

                const num = Number(ageStr);

                // Validation: age must be > 0
                if (isNaN(num) || num <= 0) {
                  fireToastMessage({
                    type: "error",
                    message: `Each child’s age must be greater than 0`,
                  });
                  throw new Error("stop-processing");
                }

                // Normalize to years
                if (unit === "months") {
                  return `${(num / 12).toFixed(2)} yrs`; // convert months to years, keep 2 decimals
                }
                return `${num} yrs`;
              });

            // Stop if nothing valid provided
            if (childrenAges.length === 0) {
              fireToastMessage({
                type: "error",
                message: "Please provide all the child’s ages",
              });
              return;
            }

            // Save to formValues
            setFormValues((prev) => ({
              ...prev,
              numberOfChildren: childrenAges.length,
              childrenAges, // all ages now in years
              childrenSchools: values.schoolAttended || "",
              allergiesHealth: values.healthConsideration
                ? [values.healthConsideration]
                : [],
              allergiesHealthSpecify: values.specifyHealthConsideration || "",
            }));

            // Move to next step
            jobFormRef.current.resetFields();
            setCurrentStep((prev) => prev + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            fireToastMessage({
              type: "error",
              message: "No health considerations provided",
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
          // console.log("Values", values);
          if (values.responsibilities && values.responsibilities.length > 0) {
            const hasNA = values.responsibilities.includes("not applicable");
            if (hasNA && values.responsibilities.length > 1) {
              fireToastMessage({
                type: "error",
                message:
                  "If 'Not Applicable' is selected, remove other selected responsibilities.",
              });
              return; // stop execution
            }
            // Save to formValues
            setFormValues((prev) => ({
              ...prev,
              childResponsibilities: values.responsibilities,
            }));
            // Move to next step
            jobFormRef.current.resetFields();
            setCurrentStep((prev) => prev + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            fireToastMessage({
              type: "error",
              message: "Please provide the responsibilities",
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
          // Move to next step
          if (values.houseRules) {
            // Save to formValues
            setFormValues((prev) => ({
              ...prev,
              houseRules: values.houseRules,
            }));
          }

          if (values.specifyHouseRules) {
            // Save to formValues
            setFormValues((prev) => ({
              ...prev,
              houseRulesSpecify: values.specifyHouseRules,
            }));
          }
          jobFormRef.current.resetFields();
          setCurrentStep((prev) => prev + 1);
          window.scrollTo({ top: 0, behavior: "smooth" });
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
          if (values.hourlyRateSplit || values.specifyHourlyRateSplit) {
            const cleanData = cleanFormData1(values);

            let updatedValues = {
              ...formValues,
              hourlyBudget: parseHourlyRate(cleanData.hourlyRateSplit),
              hourlyBudgetSpecify: cleanData.specifyHourlyRateSplit,
            };
            setFormValues(updatedValues);
            // Move to next step
            jobFormRef.current.resetFields();
            setCurrentStep((prev) => prev + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
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
    } else if (currentStep == 5) {
      jobFormRef.current
        .validateFields()
        .then(async (values) => {
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
              message: "Please fill out all the required fields",
            });
          }
        })
        .catch((errorInfo) => {
          // console.group("Form validation failed");
          // console.log("Full errorInfo:", errorInfo); // whole object
          // console.log("Error fields:", errorInfo.errorFields);
          // console.log("Out-of-date fields:", errorInfo.outOfDate);
          // console.groupEnd();

          fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
        });
    } else if (currentStep == 6) {
      jobFormRef.current
        .validateFields()
        .then(async (values) => {
          // Convert {0: {key: 'nannyShareType', value: 'After-school care'}}
          // → { nannyShareType: 'After-school care' }
          const normalizedInfo = Object.values(additionalInfo).reduce(
            (acc, item) => {
              if (item?.key && item?.value) {
                acc[item.key] = item.value;
              }
              return acc;
            },
            {},
          );
          let updatedValues = { ...formValues, ...normalizedInfo };

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
          // console.group("Form validation failed");
          // console.log("Full errorInfo:", errorInfo); // whole object
          // console.log("Error fields:", errorInfo.errorFields);
          // console.log("Out-of-date fields:", errorInfo.outOfDate);
          // console.groupEnd();

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
          <Step2
            formRef={jobFormRef}
            daysState={daysState}
            setDaysState={setDaysState}
            seasonal={true}
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
          />
        );
      case 1:
        return (
          // <HireStep3
          //   daysState={daysState}
          //   setDaysState={updateDaysState}
          //   head={"What is your desired schedule for nanny care?"}
          // />
          <Step3
            formRef={jobFormRef}
            selectedValue={selectedValue}
            setSelectedValue={setSelectedValue}
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
          <Step4
            formRef={jobFormRef}
            options={afterSchoolCareOptions}
            householdAddOns={false}
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
          <Step5 formRef={jobFormRef} parentingRule={false} />
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
          <Step7 formRef={jobFormRef} petsInfo={false} />
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
          <Step8 formRef={jobFormRef} involvement={false} backUp={false} />
        );
      case 6:
        return (
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
      <div className="lg:px-10 px-2">
        <CustomStepper totalSteps={totalStep} currentStep={currentStep} />
      </div>

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
                btnText={totalStep === currentStep ? "Post a Job" : "Continue"}
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
