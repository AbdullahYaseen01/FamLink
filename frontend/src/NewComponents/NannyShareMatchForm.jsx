import React, { useState } from "react";
import Form from "antd/es/form/Form";
import { useNavigate, NavLink } from "react-router-dom";
import { InputDa } from "../Components/subComponents/input";
import OnboardingOptionSelector from "./Caregivers/Onboarding/OnboardingOptionSelector";
import FormItem from "antd/es/form/FormItem";
import Button from "./Button";
import { Input, Select } from "antd";
import { fireToastMessage } from "../toastContainer";
import { Plus, X } from "lucide-react";

/* ─────────────────────────────────────────
   Loading Modal
───────────────────────────────────────── */
const LoadingModal = () => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center"
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
            stroke="#FFADE1"
            strokeWidth="6"
            strokeOpacity="0.25"
          />
          <path
            d="M32 6 a26 26 0 0 1 26 26"
            stroke="#FFADE1"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-1">
        Processing your responses…
      </h2>
      <p className="text-gray-400 text-sm leading-relaxed">
        We're searching families near you. Just a moment!
      </p>

      <div className="flex gap-1.5 mt-5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block rounded-full bg-[#FFADE1]"
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

/* ─────────────────────────────────────────
   Maybe Later Modal
───────────────────────────────────────── */
const MaybeLaterModal = ({ onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center"
    style={{
      backdropFilter: "blur(8px)",
      backgroundColor: "rgba(0,0,0,0.35)",
    }}
  >
    <div
      className="relative bg-white rounded-3xl shadow-2xl px-8 py-10 flex flex-col items-center text-center max-w-sm w-full mx-4"
      style={{
        animation: "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
      }}
    >
      <div
        className="flex items-center justify-center rounded-full mb-5"
        style={{
          width: 68,
          height: 68,
          background: "#FFADE1",
        }}
      >
        <svg
          width="50%"
          height="50%"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-snug">
        We'll be in touch! 💌
      </h2>
      <p className="text-gray-600 text-sm mb-6 leading-relaxed">
        Create a free account to browse compatible families and nanny shares in
        your area right now.
      </p>

      <NavLink
        to="/joinNow"
        className="w-full block text-center bg-[#FFADE1] hover:bg-[#f99dd5] transition-colors rounded-full py-3 text-base font-bold text-black mb-3"
        style={{ textDecoration: "none" }}
      >
        Create account to see families now
      </NavLink>

      <button
        type="button"
        onClick={onClose}
        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        No thanks
      </button>
    </div>

    <style>{`
      @keyframes popIn {
        0%   { opacity: 0; transform: scale(0.85); }
        100% { opacity: 1; transform: scale(1); }
      }
    `}</style>
  </div>
);

/* ─────────────────────────────────────────
   Success Modal
───────────────────────────────────────── */
const SuccessModal = ({ onClose, recordId }) => {
  const [showMaybeLater, setShowMaybeLater] = useState(false);
  const navigate = useNavigate();

  if (showMaybeLater) {
    return <MaybeLaterModal onClose={onClose} />;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(0,0,0,0.35)",
      }}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl px-8 py-10 flex flex-col items-center text-center max-w-sm w-full mx-4"
        style={{
          animation: "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        <div
          className="flex items-center justify-center rounded-full mb-5"
          style={{
            width: 68,
            height: 68,
            background: "#FFADE1",
            animation: "scaleIn 0.4s 0.1s cubic-bezier(0.34,1.56,0.64,1) both",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path
              d="M7 16.5L13 22.5L25 10"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 30,
                strokeDashoffset: 0,
                animation: "drawCheck 0.4s 0.3s ease both",
              }}
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-snug">
          You're on the list! 🎉
        </h2>
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
          Thanks for submitting! We'll start looking for compatible nanny-share
          options in your area and email you with an update within 24 hours. <br/>
          <span className="Livvic-Bold">To accurately match you with a nanny share, answer a few more quick
          questions now.</span>
        </p>

        <button
          type="button"
          onClick={() =>
            navigate(`/find-nanny-share/nanny-share-questionnaire/${recordId}`)
          }
          className="w-full block text-center bg-[#FFADE1] hover:bg-[#f99dd5] transition-colors rounded-full py-3 text-base font-bold text-black mb-3"
        >
          Continue – unlock my match
        </button>

        <button
          type="button"
          onClick={() => setShowMaybeLater(true)}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Maybe later
        </button>
      </div>

      <style>{`
        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes scaleIn {
          0%   { transform: scale(0); }
          100% { transform: scale(1); }
        }
        @keyframes drawCheck {
          from { stroke-dashoffset: 30; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};

/* ─────────────────────────────────────────
   Main Form
───────────────────────────────────────── */
const NannyShareMatchForm = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [recordId, setRecordId] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const defaultChild = () => ({
    id: Date.now() + Math.random(),
    age: "",
    unit: "years",
  });

  const [children, setChildren] = useState([defaultChild()]);
  const [childrenError, setChildrenError] = useState(false);

  const addChild = () => {
    setChildren((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), age: "", unit: "years" },
    ]);
  };

  const removeChild = (id) => {
    if (children.length === 1) return;
    setChildren((prev) => prev.filter((c) => c.id !== id));
  };

  const updateChild = (id, field, value) => {
    setChildren((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
    setChildrenError(false);
  };

  const resetForm = () => {
    form.resetFields();
    setChildren([defaultChild()]);
    setChildrenError(false);
  };

  const onFinish = async (values) => {
    const hasEmptyAge = children.some((c) => c.age === "" || c.age === null);
    if (hasEmptyAge) {
      setChildrenError(true);
      return;
    }

    const careNeededArr = Array.isArray(values.careNeeded)
      ? values.careNeeded
      : [];

    if (
      !values.email ||
      !values.alreadyHaveNanny ||
      !values.careNeeded ||
      !values.location
    ) {
      fireToastMessage({
        type: "error",
        message: "Please fill out all the fields",
      });
      return;
    }

    setLoading(true);

    const childAges = children.map((c) => `${c.age} ${c.unit}`);
    const newRecordId = crypto.randomUUID();

    const data = {
      action: "create",
      Timestamp: new Date().toISOString(),
      Id: newRecordId,
      Name: values.name || "",
      Email: values.email || "",
      "Already have nanny": values.alreadyHaveNanny || "",
      "Child age(s)": childAges.join(", "),
      "Care needed": careNeededArr.join(", "),
      "Number of children": children.length,
      Location: values.location || "",
      Details: "",
    };

    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

    if (!scriptUrl) {
      console.warn("VITE_GOOGLE_SCRIPT_URL is not set. Data:", data);
      await new Promise((r) => setTimeout(r, 1400));
      setLoading(false);
      resetForm();
      setRecordId(newRecordId);
      setShowSuccess(true);
      return;
    }

    try {
      const formData = new URLSearchParams(data).toString();

      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      const result = await response.text();
      console.log("Google Script response:", result);

      setResetKey((prev) => prev + 1);
      setRecordId(newRecordId);
    } catch (error) {
      console.error("Submission error:", error);
      fireToastMessage({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
      return;
    } finally {
      setLoading(false);
      resetForm();
      setShowSuccess(true);
    }
  };

  const onFinishFailed = () => {
    const hasEmptyAge = children.some((c) => c.age === "" || c.age === null);
    if (hasEmptyAge) setChildrenError(true);
  };

  return (
    <>
      {loading && <LoadingModal />}

      {!loading && showSuccess && recordId && (
        <SuccessModal
          onClose={() => setShowSuccess(false)}
          recordId={recordId}
        />
      )}

      <div className="mb-6 container mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-primary Livvic-Bold text-center text-2xl sm:text-2xl md:text-3xl lg:text-4xl px-4 mb-6 leading-tight">
          Takes 30 seconds → Fill out form &
          <br className="hidden md:block" /> get matched with families
        </p>

        <div className="flex justify-center mt-6 py-4">
          <Form
            form={form}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            name="nannyMatchForm"
            autoComplete="off"
            layout="vertical"
            className="w-full max-w-2xl space-y-6 bg-white/5 p-6 rounded-2xl"
          >
            {/* Name */}
            <InputDa
              type="text"
              name="name"
              placeholder="Enter your name"
              labelText="Name"
            />

            {/* Email */}
            <InputDa
              name="email"
              placeholder="Enter your email"
              labelText="Email"
              type="email"
              required={true}
            />

            {/* Children's ages */}
            <div>
              <p className="text-lg Livvic-SemiBold text-primary mb-4">
                Children's ages <span className="text-red-400">*</span>
              </p>

              <div className="flex flex-col gap-3">
                {children.map((child, index) => (
                  <div key={child.id} className="flex items-center gap-2">
                    <span className="text-primary Livvic-Medium w-20 shrink-0">
                      Child {index + 1}
                    </span>

                    <Input
                      type="number"
                      min={0}
                      placeholder="Age"
                      value={child.age}
                      onChange={(e) =>
                        updateChild(child.id, "age", e.target.value)
                      }
                      status={childrenError && child.age === "" ? "error" : ""}
                      style={{ width: 80 }}
                      className="peer border text-primary border-[#EEEEEE] rounded-[10px] px-4 py-1 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                    />

                    <Select
                      value={child.unit}
                      onChange={(val) => updateChild(child.id, "unit", val)}
                      style={{ width: 100 }}
                    >
                      <Select.Option value="months">Months</Select.Option>
                      <Select.Option value="years">Years</Select.Option>
                    </Select>

                    {children.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChild(child.id)}
                        className="text-red-400 hover:text-red-600 text-xl font-bold leading-none"
                        aria-label="Remove child"
                      >
                        <X />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {childrenError && (
                <p className="text-red-400 text-xs mt-2">
                  Please enter an age for each child.
                </p>
              )}

              <button
                type="button"
                onClick={addChild}
                className="mt-4 flex items-center gap-2 text-primary Livvic-SemiBold hover:opacity-70 transition-opacity"
              >
                <span className="text-2xl leading-none">
                  <Plus />
                </span>
                <span className="text-sm">Add another child</span>
              </button>
            </div>

            {/* Already have a nanny */}
            <div>
              <p className="text-lg Livvic-SemiBold text-primary mb-4">
                Already have a nanny? <span className="text-red-400">*</span>
              </p>
              <OnboardingOptionSelector
                form={form}
                options={["Yes", "No"]}
                name="alreadyHaveNanny"
                resetKey={resetKey}
                rules={[
                  { required: true, message: "Please select an option." },
                ]}
              />
            </div>

            {/* Care needed */}
            <div>
              <p className="text-lg Livvic-SemiBold text-primary mb-4">
                Care Needed <span className="text-red-400">*</span>
              </p>
              <OnboardingOptionSelector
                form={form}
                options={[
                  "Full-time care",
                  "Part-time care",
                  "After-school care",
                  "Summer/Seasonal",
                ]}
                name="careNeeded"
                multi={true}
                resetKey={resetKey}
                rules={[
                  { required: true, message: "Please select a care type." },
                ]}
              />
            </div>

            {/* Location */}
            <div>
              <p className="text-lg Livvic-SemiBold text-primary mb-4">
                Where are you located? <span className="text-red-400">*</span>
              </p>
              <InputDa
                name="location"
                placeholder="Please include city and neighborhood (example: Oakland - Rockridge)"
                type="text"
                labelText="Location"
                required={true}
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-4 pt-6 w-full max-w-lg mx-auto">
              <Button
                btnText="Go Back"
                action={() => navigate("/")}
                className="w-full sm:w-auto py-3 sm:py-4 flex items-center justify-center rounded-full text-lg Livvic-Bold text-primary hover:bg-white/5 transition-all"
              />

              <FormItem className="mb-0 w-full sm:w-auto">
                <Button
                  btnText="Get Matched"
                  htmlType="submit"
                  className="bg-[#FFADE1] w-full py-3 sm:py-4 flex items-center justify-center rounded-full text-lg Livvic-Bold text-black"
                  disabled={loading}
                />
              </FormItem>
            </div>
          </Form>
        </div>
      </div>
    </>
  );
};

export default NannyShareMatchForm;