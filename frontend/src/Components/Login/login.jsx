import { CloseOutlined } from "@ant-design/icons";
import { Input, Button, Form } from "antd";
import CustomButton from "../../NewComponents/Button";
import { useNavigate, NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginThunk } from "../Redux/authSlice";
import { fireToastMessage } from "../../toastContainer";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import SEOMetaData from "../../NewComponents/SEOMetaData";
import { Description } from "@headlessui/react";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.auth);
  const handleGoBack = () => {
    navigate(-1); // Navigate back in history
  };
  function LoginPage() {
    const onSuccess = async (credentialResponse) => {
      const decoded = jwtDecode(credentialResponse.credential);
      try {
        const result = await dispatch(loginThunk({ email: decoded.email }));

        if (loginThunk.fulfilled.match(result)) {
          const { user, status } = result.payload;

          if (status == 200) {
            if (user.type === "Nanny") {
              navigate("/nanny");
            } else if (user.type === "Parents") {
              navigate("/family");
            } else {
              fireToastMessage({
                type: "error",
                message: "This is not for admin",
              });
            }
          }
        } else if (loginThunk.rejected.match(result)) {
          const { message } = result.payload || {};
          fireToastMessage({
            type: "error",
            message: message || "Login failed",
          });
        }
      } catch (err) {
        console.error("Google signup callback error:", err);
      }
    };

    const onError = () => {
      console.error("Login Failed");
    };

    return <GoogleLogin onSuccess={onSuccess} onError={onError} />;
  }
  const handleSubmit = async (values) => {
    try {
      const { user, status } = await dispatch(loginThunk(values)).unwrap();
      if (status == 200) {
        if (user.type == "Nanny") {
          navigate("/nanny");
        } else if (user.type == "Parents") {
          navigate("/family");
        } else {
          fireToastMessage({ type: "error", message: "This is not for admin" });
        }
      }
    } catch (error) {
      fireToastMessage({ type: "error", message: error.message });
    }
  };

  return (
    <div className="padd-res bg-[#F6F3EE] w-sceen min-h-screen overflow-x-hidden flex justify-center items-center">
      <SEOMetaData
        title={"Login | Famlink"}
        description={`Access your Famlink account to manage your nanny share, view schedules, and connect with families.
`}
      />
      <div className="px-4 py-4">
        <div className="flex justify-end">
          <button onClick={handleGoBack}>
            <CloseOutlined style={{ fontSize: "24px" }} />
          </button>
        </div>
        <div className="flex justify-center">
          <div>
            <div className="top-0 z-50 sticky flex items-center justify-center mb-3 w-full h-20">
              <NavLink
                to="/"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <div className="flex gap-1 items-center">
                  <img
                    src="/logo3.png"
                    alt="logo"
                    className="w-6 h-6 sm:w-8 sm:h-8"
                  />
                  <p className="font-bold text-lg sm:text-xl Livvic-Bold">
                    Famlink
                  </p>
                </div>
              </NavLink>
            </div>
            <p className="px-3 width-form text-center Livvic-Bold text-3xl text-[#08428D]">
              Log in to your Account
            </p>
            <div className="flex flex-col items-center mt-10">
              <LoginPage />
              <div className="flex items-center my-3 w-96">
                <div className="flex-grow h-px bg-gray-300" />
                <span className="mx-4 text-sm text-gray-500">or</span>
                <div className="flex-grow h-px bg-gray-300" />
              </div>

              <Form name="loginForm" layout="vertical" onFinish={handleSubmit}>
                <div>
                  <p className="mb-1 text-sm Livvic-SemiBold text-[#555555]">
                    Your email
                  </p>
                  <Form.Item
                    name="email"
                    rules={[{ required: true, message: "" }]}
                  >
                    <Input
                      type={"email"}
                      placeholder={"Enter email"}
                      className="py-4 border-none rounded-[6px] w-96"
                    />
                  </Form.Item>
                </div>

                <div>
                  <p className="mb-1 text-sm Livvic-SemiBold text-[#555555]">
                    Password
                  </p>
                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: "" }]}
                    style={{ margin: 0 }}
                  >
                    <Input.Password
                      placeholder="Enter password"
                      className="py-4 border-none rounded-[6px]"
                    />
                  </Form.Item>
                  <p className="font-normal text-end mr-2 mt-2">
                    <NavLink
                      to="/forgetPass"
                      onClick={() =>
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }
                    >
                      <span className="hover:text-blue-600 underline transition-colors duration-300 cursor-pointer">
                        Forgot password?
                      </span>
                    </NavLink>
                  </p>
                </div>

                <div className="my-5 text-center">
                  {/* <Button
                    type="primary"
                    htmlType="submit"
                    loading={isLoading}
                    className="mx-auto my-0 px-6 py-2 rounded-full w-48 font-normal text-base text-white transition hover:-translate-y-1 duration-700 delay-150 ease-in-out hover:scale-110"
                    style={{ background: "#38AEE3", border: "none" }}
                  >
                    Login
                  </Button> */}
                  <CustomButton
                    btnText={"Sign In"}
                    htmlType="submit"
                    isLoading={isLoading}
                    loadingBtnText="Signing In..."
                    className="bg-[#AEC4FF] w-full !py-3"
                  />
                  <p className="mt-2 mb-10 font-normal text-base already-acc">
                    New to Famlink?{" "}
                    <NavLink
                      to="/joinNow"
                      onClick={() =>
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }
                    >
                      <span className="hover:text-blue-600 underline transition-colors duration-300 cursor-pointer">
                        Sign Up
                      </span>
                    </NavLink>
                  </p>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
