import React, { useEffect, useState } from "react";
import { Form, Input } from "antd";
import { GoogleLogin } from "@react-oauth/google";
import { fireToastMessage } from "../../../../toastContainer";
import { useDispatch } from "react-redux";
import { userCheckThunk } from "../../../../Components/Redux/authSlice";
import { jwtDecode } from "jwt-decode";
import { updateForm } from "../../../../Components/Redux/formValue";
import { registerThunk } from "../../../../Components/Redux/authSlice";
import { useNavigate } from "react-router-dom";
import { InputDa, InputPassword } from "../../../../Components/subComponents/input";

function Screen3({ formRef }) {
    const [form] = Form.useForm();
    const [visible, setVisible] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        const t = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (formRef) formRef.current = form;
    }, [formRef, form]);

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

            dispatch(
                updateForm({
                    name: decoded.name,
                    email: decoded.email,
                    imageUrl: decoded.picture,
                    registeredVia: "google",
                })
            );

            // Set form values so they can be used in HandleNext
            form.setFieldsValue({
                firstName: decoded.given_name || decoded.name,
                email: decoded.email,
                registeredVia: "google",
            });

            fireToastMessage({
                success: true,
                message: "Google account linked. Please continue to complete your profile.",
            });

        } catch (err) {
            fireToastMessage({
                message: err.message || "Something went wrong",
                type: "error",
            });
        }
    };

    return (
        <div className="flex flex-col items-center px-4">
            {/* Header */}
            <div
                style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(-16px)",
                    transition: "opacity 0.4s ease, transform 0.4s ease",
                }}
                className="text-center mb-6 mt-4"
            >
                <p className="text-primary Livvic-Bold text-4xl mb-2">
                    Welcome, Let's create <br />your account
                </p>
                <p className="text-gray-400 Livvic text-sm">
                    Save your progress and see full profiles
                </p>
            </div>

            <div className="flex flex-col items-center w-full max-w-sm">
                <GoogleLogin onSuccess={onSuccess} onError={() => { }} />

                <div className="flex items-center my-6 w-full">
                    <div className="flex-grow h-px bg-gray-200" />
                    <span className="mx-4 text-sm text-gray-400">or</span>
                    <div className="flex-grow h-px bg-gray-200" />
                </div>

                <div
                    style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? "translateY(0)" : "translateY(20px)",
                        transition: "opacity 0.5s ease 120ms, transform 0.5s ease 120ms",
                    }}
                    className="w-full"
                >
                    <Form form={form} name="screen3" autoComplete="off" layout="vertical">
                        <div className="w-full mb-4">
                            <InputDa
                                type={"email"}
                                name={"email"}
                                emailVer={true}
                                form={form}
                                placeholder={"Enter your email"}
                                labelText={"Your email"}
                            />
                        </div>

                        <div className="w-full mb-6">
                            <InputPassword />
                        </div>
                    </Form>

                    <div className="text-center mt-2">
                        <p className="Livvic text-gray-400 text-sm">
                            Already have an account?{" "}
                            <span
                                className="text-primary Livvic-SemiBold underline cursor-pointer"
                                onClick={() => navigate("/login")}
                            >
                                Log in
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Screen3;
