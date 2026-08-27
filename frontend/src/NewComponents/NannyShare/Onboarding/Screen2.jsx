import React, { useEffect, useState } from "react";
import { Form, Input, Checkbox } from "antd";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import { InputDa, InputPassword } from "../../../Components/subComponents/input";
import TermsNotice from "../../TermsNotice";
import { GoogleLogin } from "@react-oauth/google";
import { fireToastMessage } from "../../../toastContainer";
import { useDispatch } from "react-redux";
import { userCheckThunk } from "../../../Components/Redux/authSlice";
import { jwtDecode } from "jwt-decode";
import { registerThunk } from "../../../Components/Redux/authSlice";
import { useNavigate, Link } from "react-router-dom";

const Screen2 = ({ formRef, recordId, location, email, hasNanny, setIsTermsChecked, isTermsChecked, handleNext, isLoading }) => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false)

  function LoginPage() {
    const onSuccess = async (credentialResponse) => {
      const decoded = jwtDecode(credentialResponse.credential);
      try {
        const res = await dispatch(
          userCheckThunk({ email: decoded.email })
        ).unwrap();

        if (res.message === "Email already exists") {
          fireToastMessage({ message: res.message, type: "error" });
          return;
        }

        // const loc = {
        //   type: "Point",
        //   coordinates: [coordinates?.lng, coordinates?.lat],
        //   format_location: coordinates?.formatted,
        // };

        // form.setFieldsValue({
        //   location: JSON.stringify(loc),
        //   zipCode,
        // });
        // if (coordinates || zipCode) {
        //   fireToastMessage({
        //     message: "Address and Zip Code is required!",
        //     type: "error",
        //   });
        //   return;
        // }
        // dispatch(
        //   updateForm({
        //     name: decoded.name,
        //     email: decoded.email,
        //     imageUrl: decoded.picture,
        //     registeredVia: "google",
        //     // location: JSON.stringify(loc),
        //     // zipCode,
        //   })
        // );
        setLoading(true)
        try {

          // parse children ages if needed

          const signupPayload = {
            registeredVia: "google",
            name: decoded.name,
            email: decoded.email,
            imageUrl: decoded.picture,
            type: "Parents",
            sheetId: recordId,
            goal: hasNanny === "no" ? "Looking for a share" : "Looking to share nanny",
            location: location,
          };

          const { data } = await dispatch(
            registerThunk(signupPayload)
          ).unwrap();

          fireToastMessage({
            success: true,
            message: data?.message || "Account created successfully",
          });

          // const { response, status } = await dispatch(nannyshareProfileThunk({
          //   careType: careType,
          //   careDistance: distance,
          //   careExperience: careExperience
          // })).unwrap();

          // if (status === 200) console.log("Created Profile", response)

          if (!recordId) {
            console.error("No record ID found in URL");
            setLoading(false);
            return;
          }
          const payload = {
            action: "update",
            Id: recordId,
            Location: location?.format_location,
            Email: decoded.email,
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

          await fetch(scriptUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData,
          });

          setLoading(false);

          navigate(`/login?recordId=${recordId}&email=${encodeURIComponent(decoded.email)}`);
          window.location.reload();
          return;
        } catch (err) {
          console.error("Register from recordId error:", err);
          fireToastMessage({
            type: "error",
            message: "We couldn’t complete your signup. Please make sure your ZIP code and address are added, then try again.",
          });
          setLoading(false);
          return;
        } finally {
          setLoading(false);
        }

      } catch (err) {
        fireToastMessage({
          message: err.message || "Something went wrong",
          type: "error",
        });
      }
    };

    return <GoogleLogin onSuccess={onSuccess} onError={() => { }} />;
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (formRef) formRef.current = form;
  }, [formRef, form]);

  if (loading) return <LoadingModal />

  return (
    <div className="flex flex-col items-center px-4 w-full">
      {/* The White Card */}
      <div className="bg-white rounded-xl p-4 sm:px-10 sm:py-4 w-full max-w-[860px]" style={{ boxShadow: "0px 12px 48px rgba(0, 0, 0, 0.08)" }}>

        {/* Subheader & Header */}
        <div className="text-center mb-4">
          <p className="text-[11px] font-bold tracking-[0.15em] text-gray-500 uppercase mb-1.5 Livvic-Bold">
            You're all set
          </p>
          <h2 className="text-[20px] sm:text-[22px] leading-[1.2] text-[#001243] font-black Livvic-Bold">
            Create your account
          </h2>
        </div>

        {/* Google SSO */}
        <div className="flex justify-center mb-3">
          <div className="w-full flex justify-center [&>div]:!w-full [&>div>div]:!w-full [&_iframe]:!w-full">
            <LoginPage />
          </div>
        </div>

        {/* OR Divider */}
        <div className="flex items-center my-3">
          <div className="flex-grow h-px bg-[#E5E7EB]" />
          <span className="mx-4 text-sm text-[#9CA3AF] Livvic">or</span>
          <div className="flex-grow h-px bg-[#E5E7EB]" />
        </div>

        {/* Form */}
        <Form
          form={form}
          name="screen4"
          autoComplete="off"
          onValuesChange={(changed) => {
            if ('terms' in changed) {
              setIsTermsChecked?.(changed.terms);
            }
          }}
          className="flex flex-col gap-2.5"
        >
          {/* Email */}
          <div className="w-full">
            <InputDa type={"email"}
              name={"email"}
              defaultValue={email}
              emailVer={true}
              form={form}
              placeholder={"Email address"}
              labelText={""} />
            <Form.Item name="verifiedEmail" hidden><Input type="hidden" /></Form.Item>
          </div>

          {/* Password */}
          <div className="w-full">
            <InputPassword />
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleNext}
            disabled={isLoading || !isTermsChecked}
            className="bg-[#001243] text-white !rounded-full px-8 py-3 !h-auto text-[16px] Livvic-Bold w-fit mx-auto mt-4 shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating..." : "Create a Free Account"}
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full bg-transparent hover:bg-gray-50 text-[#5D5D5D] hover:text-[#001243] font-bold Livvic-Bold text-[15px] py-[12px] rounded-xl transition-colors mt-2"
          >
            Cancel
          </button>

          {/* Terms Checkbox */}
          <Form.Item
            name="terms"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value ? Promise.resolve() : Promise.reject(new Error("Please agree to the Terms & Conditions and Privacy Policy")),
              },
            ]}
            className="mb-0 mt-1"
          >
            <Checkbox
              className="text-center w-full text-[13px] text-gray-500 flex justify-center items-start leading-relaxed Livvic"
              onChange={(e) => setIsTermsChecked?.(e.target.checked)}
            >
              By creating an account you agree to FamLink's{" "}
              <Link
                to="/terms-and-conditions"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#001243] transition-colors cursor-pointer font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                Terms of Service
              </Link>
              {" "}and{" "}
              <a
                href="#"
                className="underline hover:text-[#001243] transition-colors cursor-pointer font-medium"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                Privacy Policy
              </a>.
            </Checkbox>
          </Form.Item>
        </Form>
      </div>

      {/* Footer Logo */}
      <Link to="/" className="mt-3 mb-4 flex items-center justify-center gap-1.5 text-[#6B7280] text-[13px] Livvic hover:text-[#001243]">
        <img src="/logo3.png" alt="" className="h-4" />
        <span className="Livvic-Bold text-[#001243]">Famlink</span>
        <span className="mx-0.5">·</span>
        <span>Nanny share made simple.</span>
      </Link>
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

export default Screen2;