import { CloseOutlined } from "@ant-design/icons";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import HireStep1 from "../subComponents/Hire/step1";
import HireStep2 from "../subComponents/Hire/step2";
import { fireToastMessage } from "../../toastContainer";
import NannyNoStep2 from "../subComponents/Hire/NannyShareNo/step2";
import { useDispatch, useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import { api } from "../../Config/api";
import { registerThunk, userCheckThunk } from "../Redux/authSlice";
import Button from "../../NewComponents/Button";
import SEOMetaData from "../../NewComponents/SEOMetaData";

export default function NewHireForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const hireStep1FormRef = useRef(null);
  const hireStep2FormRef = useRef(null);
  const [selectedValue, setSelectedValue] = useState(null);
  const v = useSelector((s) => s.additionalSer);
  const val = useSelector((s) => s.form);

  const handleBack = () => {
    if (step === 1) {
      navigate(-1);
    } else {
      setStep((prevStep) => prevStep - 1);
    }
  };
  const data = [
    {
      name: "Private Educator",
      subHead: "Personalized academic support.",
    },
    {
      name: "Specialized Caregiver",
      subHead: "Doula, night nurse, special needs care.",
    },
    {
      name: "Sports Coaches",
      subHead: "Coaches for soccer, basketball, tennis, and more.",
    },
    {
      name: "Music Instructor",
      subHead: "Lessons for various musical instruments.",
    },
    {
      name: "Swim Instructor",
      subHead: "Swimming lessons and water safety.",
    },
    {
      name: "House Manager",
      subHead: "Help with maintaining an organized home.",
    },
  ];
  const handleNext = async () => {
    setLoading(true); // Start loading when the button is clicked

    if (step === 1 && hireStep1FormRef.current) {
      try {
        const values = await hireStep1FormRef.current.validateFields();
        const dob = `${values.month} ${values.date} ${values.year}`;

        if (!values.zipCode) {
          fireToastMessage({
            type: "error",
            message: "Please properly fill ZIP code field",
          });
          setLoading(false);
          return;
        }

        // if (!values.verifiedEmail) {
        //   fireToastMessage({
        //     type: "error",
        //     message: "Please verify your email before proceeding",
        //   });
        //   setLoading(false);
        //   return;
        // }

        // if (values.verifiedEmail !== values.email) {
        //   fireToastMessage({
        //     type: "error",
        //     message: "Please verify your newly entered email before proceeding",
        //   });
        //   setLoading(false);
        //   return;
        // }

        // if (!values.remember) {
        //   fireToastMessage({
        //     type: "error",
        //     message: "Please check Terms & Condition",
        //   });
        //   setLoading(false);
        //   return;
        // }

        setFormData((prevState) => ({
          ...prevState,
          ...values,
          dob,
        }));

        delete formData.date;
        delete formData.year;
        delete formData.month;
        delete formData.confirm;

        try {
          await dispatch(userCheckThunk({ email: values.email })).unwrap();
          setStep((prevStep) => prevStep + 1);
          setLoading(false);
        } catch (err) {
          setLoading(false);
          fireToastMessage({ type: "error", message: err.message });
        }
      } catch (errorInfo) {
        setLoading(false);
        const fieldName = errorInfo?.errorFields?.[0]?.name?.[0];

        if (fieldName === "remember") {
          fireToastMessage({
            type: "error",
            message: "Please check Terms & Condition",
          });
        } else if (["month", "date", "year"].includes(fieldName)) {
          fireToastMessage({
            type: "error",
            message: `Please set ${fieldName} properly`,
          });
        } else if (fieldName === "zipCode") {
          fireToastMessage({
            type: "error",
            message: "Please fill the ZIP code properly",
          });
        } else {
          fireToastMessage({
            type: "error",
            message: "Please correct all required fields",
          });
        }
      }
    } else if (step === 2 && hireStep2FormRef.current) {
      try {
        const values = await hireStep2FormRef.current.validateFields();
        const services = Object.keys(values).filter((key) => values[key]);
        if (services.length > 0) {
          setFormData((prevState) => ({ ...prevState, services }));
          setStep((prevStep) => prevStep + 1);
        } else {
          fireToastMessage({
            type: "error",
            message: "Select at least one option",
          });
        }
      } catch (errorInfo) {
        fireToastMessage({
          type: "error",
          message:
            errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
        });
      }
    } else if (step === 3) {
      hireStep2FormRef.current
        .validateFields()
        .then(async (values) => {
          const hasAnyChildValue = Object.values(values).some(
            (val) => val !== undefined && val !== ""
          );

          if (hasAnyChildValue) {
            setFormData((prevState) => ({
              ...prevState,
              noOfChildren: {
                length: Object.keys(values).length,
                info: values,
              },
            }));

            try {
              const { data } = await dispatch(
                registerThunk({
                  ...val,
                  ...formData,
                  noOfChildren: {
                    length: Object.keys(values).length,
                    info: values,
                  },
                  type: "Parents",
                })
              ).unwrap();
              // console.log(data)
              fireToastMessage({
                success: true,
                message: data.message,
              });
              navigate("/login");
              window.location.reload();
            } catch (err) {
              fireToastMessage({ type: "error", message: err.message });
            }
          } else {
            fireToastMessage({
              type: "error",
              message: "Select number of children",
            });
          }
        })
        .catch((errorInfo) => {
          const errorMsg =
            errorInfo?.errorFields?.[0]?.errors?.[0] ||
            "Please complete the required fields.";
          fireToastMessage({ type: "error", message: errorMsg });
        });
    }

    setLoading(false); // Stop loading after execution
  };

  return (
    <div className="padd-res">
      <SEOMetaData
        title="Sign Up to Hire Nannies | Famlink"
        description="Create your account to hire caregivers, find nanny shares, and manage childcare with Famlink."
      />

      <div className="px-4 py-4 rounded-3xl">
        <div className="flex justify-center">
          <div>
            {step === 1 && (
              <HireStep1
                formRef={hireStep1FormRef}
                head={"Welcome, Let’s create your account"}
                type="Parents"
                handleNext={() => setStep((prev) => prev + 1)}
              />
            )}
            {step === 2 && (
              <NannyNoStep2
                formRef={hireStep2FormRef}
                data={data}
                defaultValue={"Nanny"}
                defaultSubValue={"Full-time, part-time, or live-in care."}
              />
            )}
            {step === 3 && (
              <HireStep2
                opt={Array.from({ length: 4 }, (_, i) => i + 1)}
                formRef={hireStep2FormRef}
                selectedValue={selectedValue}
                handleSelectChange={setSelectedValue}
              />
            )}

            <div className="my-5 space-x-6 text-center">
              {/* <button
                style={{ border: "1px solid #38AEE3" }}
                className="bg-white mx-6 my-0 mt-2 px-10 py-2 rounded-full font-normal text-base"
                onClick={handleBack}
              >
                Back
              </button> */}
              <Button
                action={() => handleBack()}
                btnText={"Back"}
                className="border border-[#FFFFFF] text-[#555555]"
              />

              {step > 0 && step <= 3 && (
                // <button
                //   style={{ background: "#85D1F1" }}
                //   className="mx-auto my-0 px-6 py-2 rounded-full font-normal text-base transition hover:-translate-y-1 duration-700 delay-150 ease-in-out hover:scale-110"
                //   onClick={handleNext}
                //   disabled={loading}
                // >
                //   {loading ? "Loading..." : "Continue"}
                // </button>
                <Button
                  btnText={"Continue"}
                  action={() => handleNext()}
                  className="bg-[#AEC4FF] text-primary"
                  isLoading={loading}
                  loadingBtnText="Loading..."
                />
              )}

              {step === 0 && (
                <p className="mt-2 mb-10 font-normal text-base cursor-pointer already-acc">
                  Already have an account?{" "}
                  <NavLink
                    to="/login"
                    onClick={() =>
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }
                  >
                    <span className="hover:text-blue-600 underline transition-colors duration-300">
                      Log in
                    </span>
                  </NavLink>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
