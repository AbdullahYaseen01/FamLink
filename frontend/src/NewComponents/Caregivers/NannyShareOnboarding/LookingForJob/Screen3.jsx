import React, { useEffect, useState } from "react";
import { Form, Input } from "antd";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import { InputDa, InputPassword } from "../../../../Components/subComponents/input";
import { GoogleLogin } from "@react-oauth/google";

const Screen3 = ({ formRef, onSubmit }) => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

    function LoginPage() {
    const onSuccess = async (credentialResponse) => {
      // const decoded = jwtDecode(credentialResponse.credential);
      // try {
        // const res = await dispatch(
        //   userCheckThunk({ email: decoded.email })
        // ).unwrap();

        // if (res.message === "Email already exists") {
        //   fireToastMessage({ message: res.message, type: "error" });
        //   return;
        // }

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
        //     location: JSON.stringify(loc),
        //     zipCode,
        //   })
        // );

        // if (initialData) {
        //   try {

            // parse children ages if needed
    //         const parsedChildAges = parseChildAgesToYears(initialData["Child age(s)"]);

    //         const signupPayload = {
    //           registeredVia: "google",
    //           name: decoded.name,
    //           email: decoded.email,
    //           imageUrl: decoded.picture,
    //           type: "Parents",
    //           sheetId: recordId,
    //           services: [
    //             "Nanny"
    //           ],
    //           noOfChildren: parsedChildAges || "",
    //           location: JSON.stringify(loc),
    //           zipCode,
    //         };

    //         const { data } = await dispatch(
    //           registerThunk(signupPayload)
    //         ).unwrap();

    //         fireToastMessage({
    //           success: true,
    //           message: data?.message || "Account created successfully",
    //         });

    //         navigate(`/login?recordId=${recordId}&email=${encodeURIComponent(decoded.email)}`);
    //         window.location.reload();
    //         return;
    //       } catch (err) {
    //         console.error("Register from recordId error:", err);
    //         fireToastMessage({
    //           type: "error",
    //           message: "We couldn’t complete your signup. Please make sure your ZIP code and address are added, then try again.",
    //         });
    //         setLoading(false);
    //         return;
    //       }
    //     }

    //     handleNext();
    //   } catch (err) {
    //     fireToastMessage({
    //       message: err.message || "Something went wrong",
    //       type: "error",
    //     });
    //   }
      console.log("Google response:", credentialResponse);
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

  return (
    <div className="flex flex-col items-center px-4">
      {/* Lock icon + heading */}
      <div className="flex flex-col items-center">
        {/* <div
          className="flex gap-2 cursor-pointer bg-gray-100 justify-center Livvic-SemiBold text-sm text-primary w-96 py-4 mb-4 rounded-[6px]"
          onClick={handleGoogleSignup}
        >
          <img src="/google-icon.svg" alt="google" /> Continue with Google
        </div> */}
        <LoginPage />
        <div className="flex items-center my-3 w-96">
          <div className="flex-grow h-px bg-gray-300" />
          <span className="mx-4 text-sm text-gray-500">or</span>
          <div className="flex-grow h-px bg-gray-300" />
        </div>
      </div>
      <p className="px-3 w-full text-center text-primary Livvic-Bold text-4xl mb-12 mt-4">
        <p className="px-3 w-full text-center text-primary Livvic-Bold text-4xl">
          Welcome, Let’s create <br/>your account
        </p>
      </p>

      {/* Form */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.5s ease 120ms, transform 0.5s ease 120ms",
        }}
        className="w-full max-w-sm"
      >
        <Form form={form} name="screen4" autoComplete="off">
          {/* Email */}
          <div className="w-full">
            <InputDa type={"email"}
              name={"email"}
              emailVer={true}
              form={form}
              placeholder={"Enter your email"}
              labelText={"Your email"} />

            {/* Hidden field to store verified email */}
            <Form.Item name="verifiedEmail" hidden>
              <Input type="hidden" />
            </Form.Item>
          </div>

          {/* Password */}
          <div className="w-full">
            {" "}
            <InputPassword />
          </div>

          {/* Submit */}

        </Form>

        {/* Divider + login link */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.5s ease 300ms",
          }}
          className="text-center mt-2"
        >
          <p className="Livvic text-gray-400 text-sm">
            Already have an account?{" "}
            <span
              className="text-primary Livvic-SemiBold underline cursor-pointer"
              onClick={() => window.location.href = "/login"}
            >
              Log in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Screen3;