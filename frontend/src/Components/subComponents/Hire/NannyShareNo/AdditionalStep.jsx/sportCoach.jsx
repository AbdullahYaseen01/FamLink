import { useRef, useState } from "react";
import HireStep4 from "../../step4";
import HireStep3 from "../../step3";
import { Form, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { CloseOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fireToastMessage } from "../../../../../toastContainer";
import { addOrUpdateAdditionalInfo } from "../../../../Redux/formValue";
import { cleanFormData1 } from "../../../toCamelStr";
import { registerThunk } from "../../../../Redux/authSlice";
import Button from "../../../../../NewComponents/Button";

export default function SportCoach() {
  const [step, setStep] = useState(1);
  const hireStepFormRef = useRef(null);
  const [formData, setFormData] = useState();
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [textAreaValue, setTextAreaValue] = useState();
  const v = useSelector((s) => s.additionalSer.value);
  const valuesArray = Object.entries(v); // Get an array of [key, value] pairs
  const val = useSelector((s) => s.form);

  // Find the index of 'specializedCaregiver'
  const specializedIndex = valuesArray.findIndex(
    ([key]) => key === "sportsCoaches"
  );

  // Extract only the true values after 'specializedCaregiver'
  const trueValuesAfterSpecialized = valuesArray
    .slice(specializedIndex + 1) // Get the entries after 'specializedCaregiver'
    .filter(([, value]) => value === true) // Filter only those with a value of true
    .map(([key]) => key);

  const handleBack = () => {
    if (step > 1) {
      // Move to the previous step
      setStep((prevStep) => prevStep - 1);
    }
  };

  const navigate = useNavigate();
  const handleGoBack = () => {
    navigate("/joinNow"); // Navigate back in history
  };

  const Register = async () => {
    const beforeAddInfo = val.additionalInfo;
    const updatedAddInfo = [...beforeAddInfo];
    if (textAreaValue && textAreaValue.length > 0) {
      updatedAddInfo.push({
        key: "sportCoach",
        value: { ...formData, specialReq: textAreaValue },
      });
    } else {
      updatedAddInfo.push({ key: "sportCoach", value: formData });
    }

    const result = await dispatch(
      registerThunk({ ...val, additionalInfo: updatedAddInfo, type: "Parents" })
    );

    if (result.payload.status === 200) {
      fireToastMessage({
        success: true,
        message: "Your account was created successfully",
      });
      navigate("/login");
      window.location.reload();
    } else {
      fireToastMessage({ type: "error", message: result.payload.message });
    }
  };
  const handleNext = async () => {
    if (step == 1 && hireStepFormRef.current) {
      hireStepFormRef.current
        .validateFields()
        .then((values) => {
          if (values.option?.length > 0) {
            // If form is valid, submit it and move to the next step

            const cleanData = cleanFormData1(values);
            setFormData({ sportsDoYouWant: cleanData });
            hireStepFormRef.current.resetFields();
            setStep((prevStep) => prevStep + 1); // Move to the next step
          } else {
            // Show an error message if no option is selected
            fireToastMessage({
              type: "error",
              message: "Select at least one option",
            });
          }

          // setStep((prevStep) => prevStep + 1);
        })
        .catch((errorInfo) => {
          // Handle validation failure
                fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });;
        });
    } else if (step == 2 && hireStepFormRef.current) {
      hireStepFormRef.current
        .validateFields()
        .then((values) => {
          if (values.option?.length > 0) {
            // If form is valid, submit it and move to the next step

            setFormData({ ...formData, skillLevel: values });
            hireStepFormRef.current.resetFields();
            setStep((prevStep) => prevStep + 1); // Move to the next step
          } else {
            // Show an error message if no option is selected
            fireToastMessage({
              type: "error",
              message: "Select at least one option",
            });
          }

          // setStep((prevStep) => prevStep + 1);
        })
        .catch((errorInfo) => {
          // Handle validation failure
                fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });;
        });
    } else if (step == 3 && hireStepFormRef.current) {
      hireStepFormRef.current
        .validateFields()
        .then((values) => {
          if (values.option?.length > 0) {
            // If form is valid, submit it and move to the next step

            setFormData({ ...formData, duration: values });
            hireStepFormRef.current.resetFields();
            setStep((prevStep) => prevStep + 1); // Move to the next step
          } else {
            // Show an error message if no option is selected
            fireToastMessage({
              type: "error",
              message: "Select at least one option",
            });
          }

          // setStep((prevStep) => prevStep + 1);
        })
        .catch((errorInfo) => {
          // Handle validation failure
                fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });;
        });
    } else if (step == 4 && hireStepFormRef.current) {
      hireStepFormRef.current
        .validateFields()
        .then((values) => {
          if (values.option?.length > 0) {
            // If form is valid, submit it and move to the next step

            setFormData({ ...formData, eachSession: values });
            hireStepFormRef.current.resetFields();
            setStep((prevStep) => prevStep + 1); // Move to the next step
          } else {
            // Show an error message if no option is selected
            fireToastMessage({
              type: "error",
              message: "Select at least one option",
            });
          }

          // setStep((prevStep) => prevStep + 1);
        })
        .catch((errorInfo) => {
          // Handle validation failure
                fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });;
        });
    } else if (step == 5 && hireStepFormRef.current) {
      hireStepFormRef.current
        .validateFields()
        .then((values) => {
          if (values.option?.length > 0) {
            // If form is valid, submit it and move to the next step

            setFormData({ ...formData, specificLoc: values });
            hireStepFormRef.current.resetFields();
            setStep((prevStep) => prevStep + 1); // Move to the next step
          } else {
            // Show an error message if no option is selected
            fireToastMessage({
              type: "error",
              message: "Select at least one option",
            });
          }

          // setStep((prevStep) => prevStep + 1);
        })
        .catch((errorInfo) => {
          // Handle validation failure
                fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });;
        });
    } else if (step == 6 && hireStepFormRef.current) {
      hireStepFormRef.current
        .validateFields()
        .then((values) => {
          if (values.option?.length > 0) {
            // If form is valid, submit it and move to the next step

            setFormData({ ...formData, specificGoal: values });
            hireStepFormRef.current.resetFields();
            setStep((prevStep) => prevStep + 1); // Move to the next step
          } else {
            // Show an error message if no option is selected
            fireToastMessage({
              type: "error",
              message: "Select at least one option",
            });
          }

          // setStep((prevStep) => prevStep + 1);
        })
        .catch((errorInfo) => {
          // Handle validation failure
                fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });;
        });
    } else if (step == 7 && hireStepFormRef.current) {
      hireStepFormRef.current
        .validateFields()
        .then((values) => {
          if (values.option?.length > 0) {
            // If form is valid, submit it and move to the next step

            setFormData({ ...formData, coachingStyle: values });
            hireStepFormRef.current.resetFields();
            setStep((prevStep) => prevStep + 1); // Move to the next step
          } else {
            // Show an error message if no option is selected
            fireToastMessage({
              type: "error",
              message: "Select at least one option",
            });
          }

          // setStep((prevStep) => prevStep + 1);
        })
        .catch((errorInfo) => {
          // Handle validation failure
                fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });;
        });
    } else if (step == 8 && hireStepFormRef.current) {
      const selectedDays = Object.entries(daysState).filter(
        ([day, { checked }]) => checked
      );

      if (selectedDays.length === 0) {
        fireToastMessage({
          type: "error",
          message: "At least one day must be selected.",
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
            ", "
          )}`,
        });
        return;
      }

      // Additional checks for overlapping times (uncomment if needed)
      // if (selectedDays.length >= 2) {
      //     let overlapping = false;

      //     // Compare each selected day's start and end times
      //     for (let i = 0; i < selectedDays.length; i++) {
      //         const [day1, { start: start1, end: end1 }] = selectedDays[i];

      //         for (let j = i + 1; j < selectedDays.length; j++) {
      //             const [day2, { start: start2, end: end2 }] = selectedDays[j];

      //             // Ensure no overlapping times
      //             if (
      //                 (start1.isBefore(end2) && end1.isAfter(start2)) || // Check overlap between two days
      //                 (start1.isSame(end2) || start2.isSame(end1))
      //             ) {
      //                 // console.log(`Error: Time overlap between ${day1} and ${day2}`);
      //                 overlapping = true;
      //                 break;
      //             }
      //         }
      //         if (overlapping) break;
      //     }

      //     if (overlapping) {
      //         return;
      //     }
      // }

      // If all checks pass, proceed with submission
      // console.log('Submitted Days Schedule:', daysState);
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
      setFormData({ ...formData, specificDaysAndTime: checkedDays });
      setStep((prevStep) => prevStep + 1);
    }
    if (step == 9) {
      const hasSpecialReq = trueValuesAfterSpecialized.length > 0;

      // Update formData with special requirements if textAreaValue is presen

      if (hasSpecialReq) {
        if (textAreaValue && textAreaValue.length > 0) {
          dispatch(
            addOrUpdateAdditionalInfo({
              key: "sportCoach",
              value: { ...formData, specialReq: textAreaValue },
            })
          );
        } else {
          dispatch(
            addOrUpdateAdditionalInfo({ key: "sportCoach", value: formData })
          );
        }
        if (v.musicInstructor) {
          return navigate("/music");
        } else if (v.swimInstructor) {
          return navigate("/swim");
        } else if (v.houseManager) {
          return navigate("/houseManager");
        }
      } else {
        Register();
      }
    }
  };

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
    }, {})
  );

  // This function will update the state when passed down to HireStep3
  const updateDaysState = (updatedDaysState) => {
    setDaysState(updatedDaysState);
  };
  const step1Data = [
    {
      name: "Soccer",
    },
    {
      name: "Basketball",
    },
    {
      name: "Tennis",
    },
    {
      name: "Baseball",
    },
    {
      name: "Softball",
    },
    {
      name: "Volleyball",
    },
    {
      name: "Swimming",
    },
    {
      name: "Gymnastics",
    },
    {
      name: "Martial Arts (Karate)",
    },
    {
      name: "Martial Arts (Judo)",
    },
    {
      name: "Martial Arts (Taekwondo)",
    },
    {
      name: "Golf",
    },
    {
      name: "Track and Field (Sprints)",
    },
    {
      name: "Track and Field (Long Distance)",
    },
    {
      name: "Track and Field (Hurdles)",
    },
    {
      name: "Dance (Ballet)",
    },
    {
      name: "Dance (Hip Hop)",
    },
    {
      name: "Dance (Jazz)",
    },
    {
      name: "Cheerleading",
    },
    {
      name: "Rugby",
    },
    {
      name: "Hockey (Ice Hockey)",
    },
    {
      name: "Hockey (Field Hockey)",
    },
  ];
  const step2Data = [
    {
      name: "Beginner",
    },
    {
      name: "Intermediate",
    },
    {
      name: "Advanced",
    },
  ];
  const step3Data = [
    {
      name: "Daily",
    },
    {
      name: "Weekly",
    },
    {
      name: "Bi-weekly",
    },
  ];
  const step4Data = [
    {
      name: "30 minutes",
    },
    {
      name: "1 hour",
    },
    {
      name: "2 hours",
    },
  ];
  const step5Data = [
    {
      name: "Local park",
    },
    {
      name: "School gym",
    },
    {
      name: "Coach's facility",
    },
    {
      name: "Home",
    },
  ];
  const step6Data = [
    {
      name: "Improve skills",
    },
    {
      name: "Prepare for competition",
    },
    {
      name: "General fitness",
    },
  ];
  const step7Data = [
    {
      name: "Structured",
    },
    {
      name: "Flexible",
    },
    {
      name: "Team-oriented",
    },
  ];

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <HireStep4
            formRef={hireStepFormRef}
            head={"Which sport do you want your child to learn or improve in?"}
            data={step1Data}
            checkBox={true}
            subHead1={
              "Which sport do you want your child to learn or improve in?"
            }
            inputName={"Type here..."}
            textAreaHead={"Other Preferences"}
          />
        );
      case 2:
        return (
          <HireStep4
            formRef={hireStepFormRef}
            head={"What is the current skill level of your child?"}
            data={step2Data}
            checkBox={true}
            inputNot={true}
            subHead1={"What is the current skill level of your child?"}
          />
        );
      case 3:
        return (
          <HireStep4
            formRef={hireStepFormRef}
            head={"How often do you require coaching sessions?"}
            data={step3Data}
            checkBox={true}
            inputNot={true}
            subHead1={"How often do you require coaching sessions?"}
          />
        );
      case 4:
        return (
          <HireStep4
            formRef={hireStepFormRef}
            head={"How long do you want each coaching session to be?"}
            data={step4Data}
            checkBox={true}
            subHead1={"How long do you want each coaching session to be?"}
            inputNot={true}
          />
        );
      case 5:
        return (
          <HireStep4
            formRef={hireStepFormRef}
            head={"Do you prefer sessions at a specific location?"}
            data={step5Data}
            checkBox={true}
            subHead1={"Do you prefer sessions at a specific location?"}
            inputNot={true}
          />
        );
      case 6:
        return (
          <HireStep4
            formRef={hireStepFormRef}
            head={"What are your specific goals for the coaching sessions?"}
            data={step6Data}
            checkBox={true}
            subHead1={"What are your specific goals for the coaching sessions?"}
            inputNot={true}
          />
        );
      case 7:
        return (
          <HireStep4
            formRef={hireStepFormRef}
            head={"Do you have a preference for the coach's style?"}
            data={step7Data}
            checkBox={true}
            subHead1={"Do you have a preference for the coach's style?"}
            inputNot={true}
          />
        );
      case 8:
        return (
          <HireStep3
            head={"Sports Coach"}
            daysState={daysState}
            setDaysState={updateDaysState}
            subHead={
              "What days and times are you available for coaching sessions?"
            }
          />
        );
      case 9:
        return (
          <>
            <p className="font-normal Livvic uppercase px-3 offer-font text-center mb-5 width-form">
              Sports Coach
            </p>
            <Form
              className="flex justify-center"
              form={form}
              name="validateOnly"
              autoComplete="off"
            >
              <div>
                <p className="Livvic text-xl mb-2 input-text line1-20">
                  Do you have any special requirements or preferences for the
                  sport coach ?
                </p>
                <Form.Item
                  name={"anySpecialRequirements"}
                  rules={[
                    {
                      required: false,
                      message: "",
                    },
                  ]}
                >
                  <Input.TextArea
                    placeholder={"Type here..."}
                    rows={6}
                    value={textAreaValue} // Bind the text area value to the state
                    onChange={(e) => setTextAreaValue(e.target.value)}
                    className="input-width py-4 rounded-3xl border-none no-resize"
                  />
                </Form.Item>
              </div>
            </Form>
          </>
        );
    }
  };
  return (
    <>
      <div className="padd-res">
        <div className="rounded-3xl py-4 px-4">
          <div className="flex justify-end">
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
                  <Button
                    btnText={"Back"}
                    action={() => handleBack()}
                    className="border border-[#EEEEEE]"
                  />
                )}
                {step < 10 && (
                  // <button
                  //   style={{ background: "#85D1F1" }}
                  //   className="py-2 rounded-full my-0 mx-auto px-6 text-base font-normal transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-700 "
                  //   onClick={handleNext}
                  // >
                  //   Continue
                  // </button>
                  <Button
                    btnText={"Continue"}
                    action={() => handleNext()}
                    className="bg-blue-300"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
