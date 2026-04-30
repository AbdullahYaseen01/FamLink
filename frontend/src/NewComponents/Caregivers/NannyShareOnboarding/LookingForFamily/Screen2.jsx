import React, { useEffect } from "react";
import { Form, Input } from "antd";
import { User, Mail, Lock, Shield } from "lucide-react";

function Screen2({ formRef }) {
    const [form] = Form.useForm();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    useEffect(() => {
        if (formRef) formRef.current = form;
    }, [formRef, form]);

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="text-center mb-12">
                <h1 className="text-primary Livvic-Bold text-4xl lg:text-5xl mb-4">
                    Create your account
                </h1>
                <p className="text-gray-500 text-lg max-w-xl mx-auto">
                    Save your progress and see full profiles of families near you.
                </p>
            </div>

            <Form form={form} layout="vertical" className="max-w-md mx-auto space-y-6">
                <Form.Item
                    name="firstName"
                    label={<span className="text-gray-700 font-semibold">First Name</span>}
                    rules={[{ required: true, message: "Please enter your first name" }]}
                >
                    <Input
                        prefix={<User className="w-5 h-5 text-gray-400 mr-2" />}
                        className="rounded-2xl px-4 py-3.5 border border-gray-200 focus:ring-primary focus:border-primary transition-all text-gray-700 shadow-sm"
                        placeholder="e.g. Sarah"
                    />
                </Form.Item>

                <Form.Item
                    name="email"
                    label={<span className="text-gray-700 font-semibold">Email Address</span>}
                    rules={[
                        { required: true, message: "Please enter your email" },
                        { type: "email", message: "Please enter a valid email" }
                    ]}
                >
                    <Input
                        prefix={<Mail className="w-5 h-5 text-gray-400 mr-2" />}
                        className="rounded-2xl px-4 py-3.5 border border-gray-200 focus:ring-primary focus:border-primary transition-all text-gray-700 shadow-sm"
                        placeholder="sarah@example.com"
                    />
                </Form.Item>

                <Form.Item
                    name="password"
                    label={<span className="text-gray-700 font-semibold">Create Password</span>}
                    rules={[
                        { required: true, message: "Please create a password" },
                        { min: 6, message: "Password must be at least 6 characters" }
                    ]}
                >
                    <Input.Password
                        prefix={<Lock className="w-5 h-5 text-gray-400 mr-2" />}
                        className="rounded-2xl px-4 py-3.5 border border-gray-200 focus:ring-primary focus:border-primary transition-all text-gray-700 shadow-sm"
                        placeholder="Min. 6 characters"
                    />
                </Form.Item>

                <div className="bg-blue-50 rounded-2xl p-6 mt-8 flex items-center gap-4">
                    <div className="bg-white p-2 rounded-md shadow-sm text-blue-500"><Shield size={20} /></div>

                    <p className="text-sm text-blue-800 leading-relaxed">
                        Your privacy is our priority. We never share your personal information without your explicit permission.
                    </p>
                </div>
            </Form>
        </div>
    );
}

export default Screen2;
