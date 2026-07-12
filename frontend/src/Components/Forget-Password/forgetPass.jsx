import { CloseOutlined } from "@ant-design/icons";
import { Input, Button, Form } from "antd";
import { useNavigate, NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fireToastMessage } from "../../toastContainer";
import { useEffect, useState } from "react";
import {
  sendOtpThunk,
  verifyOtpThunk,
  resendOtpThunk,
} from "../Redux/forgetPassword";
import { InputDa } from "../subComponents/input";
import CustomButton from "../../NewComponents/Button";
import SEOMetaData from "../../NewComponents/SEOMetaData";

export default function ForgetPass() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState(null);
  const [timeLeft, setTimeLeft] = useState(120);
  const { isLoading } = useSelector((state) => state.forgetPassSlice);
  const handleGoBack = () => {
    navigate(-1); // Navigate back in history
  };

  useEffect(() => {
    if (timeLeft === 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSubmit = async (values) => {
    try {
      if (step == 0) {
        const { data } = await dispatch(
          sendOtpThunk({ email: values.email }),
        ).unwrap();
        setEmail(values.email);
        setTimeLeft(120);
        setStep((prevStep) => prevStep + 1);
        fireToastMessage({ message: data.message });
        form.resetFields();
      } else if (step == 1) {
        const { data } = await dispatch(
          verifyOtpThunk({ otp: values.otp, newPassword: values.password }),
        ).unwrap();
        setEmail(null);
        setTimeLeft(0);
        form.resetFields();
        navigate("/login");
        fireToastMessage({ message: data.message });
      }
    } catch (error) {
      fireToastMessage({ type: "error", message: error.message });
    }
  };
  const ResendOtp = async () => {
    try {
      const { data } = await dispatch(resendOtpThunk({ email })).unwrap();
      setTimeLeft(120);
      fireToastMessage({ message: data.message });
      form.resetFields();
    } catch (error) {
      fireToastMessage({ type: "error", message: error.message });
    }
  };

  return (
    <div className="padd-res">
      <SEOMetaData
        title="Forget Password"
        description="Reset your password"
        noIndex={true}
      />
      <div className="px-4 py-4 rounded-3xl">
        <div className="flex justify-end">
          <button onClick={handleGoBack}>
            <CloseOutlined style={{ fontSize: "24px" }} />
          </button>
        </div>
        <div className="flex justify-center">
          <div>
            <p className="px-3 width-form  text-center onboarding-head">
              {step == 0 && "Request for OTP"}
              {step == 1 && "Update Password"}
            </p>
            <div className="flex justify-center mt-10">
              <Form name="loginForm" layout="vertical" onFinish={handleSubmit}>
                {step == 0 && (
                  <div>
                    {/* <Form.Item
                      name="email"
                      rules={[{ required: true, message: "" }]}
                      style={{ margin: 0 }}
                    >
                      <Input
                        type={"email"}
                        placeholder={"Enter you email"}
                        className="py-4 border-none rounded-3xl input-width"
                      />
                    </Form.Item> */}
                    <InputDa
                      name={"email"}
                      placeholder={"Enter your email"}
                      labelText="Email"
                      type={"email"}
                      fp={true}
                    />
                    {/* <p className="font-normal text-end mr-2 mt-2">
                      Already have an account?{" "}
                      <NavLink
                        to="/login"
                        onClick={() =>
                          window.scrollTo({ top: 0, behavior: "smooth" })
                        }
                      >
                        <span className="hover:text-blue-600 underline transition-colors duration-300 cursor-pointer">
                          Log in
                        </span>
                      </NavLink>
                    </p> */}
                  </div>
                )}
                {step == 1 && (
                  <>
                    <div>
                      {/* <p className="mb-1 text-xl capitalize Livvic">OTP</p> */}
                      <Form.Item
                        name="otp"
                        rules={[{ required: true, message: "" }]}
                      >
                        <Input
                          type={"number"}
                          placeholder={"Enter 4-digit OTP"}
                          className="py-4 border-none rounded-3xl input-width"
                        />
                      </Form.Item>
                    </div>

                    <div>
                      {/* <p className="mb-1 text-xl capitalize Livvic">
                        New Password
                      </p> */}
                      {/* <Form.Item
                        name="password"
                        rules={[{ required: true, message: "" }]}
                        style={{ margin: 0 }}
                      >
                        <Input.Password
                          placeholder="Enter new password"
                          className="py-4 border-none rounded-3xl input-width"
                        />
                      </Form.Item> */}
                      <InputDa
                        name={"password"}
                        placeholder={"Enter new password"}
                        labelText="New password"
                      />
                      {/* <p className="font-normal text-end mr-2 mt-2">
                        Already have an account?{" "}
                        <NavLink
                          to="/login"
                          onClick={() =>
                            window.scrollTo({ top: 0, behavior: "smooth" })
                          }
                        >
                          <span className="hover:text-blue-600 underline transition-colors duration-300 cursor-pointer">
                            Log in
                          </span>
                        </NavLink>
                      </p> */}
                    </div>
                  </>
                )}

                <div className="my-5 text-center">
                  <div className="my-5 text-center">
                    {/* <Button
                      type="primary"
                      onClick={() => {
                        if (step == 1 && timeLeft == 0) {
                          ResendOtp();
                        }
                      }}
                      loading={isLoading}
                      className="mx-auto my-0 px-6 py-2 rounded-full w-48 font-normal text-base text-white transition hover:-translate-y-1 duration-700 delay-150 ease-in-out hover:scale-110"
                      style={{ background: "#AEC4FF", border: "none" }}
                      htmlType={
                        step == 1 && timeLeft == 0 ? "button" : "submit"
                      }
                    >
                      {step == 0 && "Request"}
                      {step == 1 && timeLeft != 0 && "Submit"}
                      {step == 1 && timeLeft == 0 && "Resend OTP"}
                    </Button> */}
                    <CustomButton
                      isLoading={isLoading}
                      loadingBtnText="Please wait..."
                      htmlType={
                        step == 1 && timeLeft == 0 ? "button" : "submit"
                      }
                      btnText={
                        step === 0
                          ? "Request"
                          : step === 1 && timeLeft !== 0
                            ? "Submit"
                            : "Resend OTP"
                      }
                      className="bg-[#AEC4FF]"
                      action={() => {
                        if (step === 1 && timeLeft === 0) {
                          ResendOtp();
                        }
                      }}
                    />
                  </div>

                  <p className="mt-2 mb-1 font-normal text-base already-acc">
                    New to Famlink?{" "}
                    <NavLink to="/joinNow">
                      <span className="hover:text-blue-600 underline transition-colors duration-300 cursor-pointer">
                        Sign Up
                      </span>
                    </NavLink>
                  </p>
                  {step == 1 && timeLeft != 0 && (
                    <p className="text-gray-600">
                      OTP valid till {formatTime(timeLeft)}
                    </p>
                  )}
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
