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
import { useDispatch } from "react-redux";
import { sendQuestionnaireFormEmail } from "../Components/Redux/nannyShareSlice";
import { Spin } from "antd";
import Autocomplete from "react-google-autocomplete";

/* ─────────────────────────────────────────
   Modal state machine
   "idle" | "loading" | "success" | "waitlist"
───────────────────────────────────────── */

/* ─────────────────────────────────────────
   Loading Modal
───────────────────────────────────────── */
const LoadingModal = () => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center"
    style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.35)" }}
  >
    <div
      className="relative bg-white rounded-3xl shadow-2xl px-10 py-10 flex flex-col items-center text-center max-w-xs w-full mx-4"
      style={{ animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}
    >
      <div className="mb-5" style={{ width: 64, height: 64 }}>
        <svg viewBox="0 0 64 64" fill="none" style={{ animation: "spin 1s linear infinite", width: 64, height: 64 }}>
          <circle cx="32" cy="32" r="26" stroke="#FFADE1" strokeWidth="6" strokeOpacity="0.25" />
          <path d="M32 6 a26 26 0 0 1 26 26" stroke="#FFADE1" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Processing your responses…</h2>
      <p className="text-gray-400 text-sm leading-relaxed">We're searching families near you. Just a moment!</p>
      <div className="flex gap-1.5 mt-5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block rounded-full bg-[#FFADE1]"
            style={{ width: 8, height: 8, animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }}
          />
        ))}
      </div>
    </div>
    <style>{`
      @keyframes popIn { 0% { opacity:0; transform:scale(0.85); } 100% { opacity:1; transform:scale(1); } }
      @keyframes spin   { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      @keyframes bounce { 0%,80%,100% { transform:translateY(0); opacity:0.4; } 40% { transform:translateY(-6px); opacity:1; } }
    `}</style>
  </div>
);

/* ─────────────────────────────────────────
   Maybe Later Modal
───────────────────────────────────────── */
const MaybeLaterModal = ({ onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center"
    style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.35)" }}
  >
    <div
      className="relative bg-white rounded-3xl shadow-2xl px-8 py-10 flex flex-col items-center text-center max-w-sm w-full mx-4"
      style={{ animation: "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both" }}
    >
      <div
        className="flex items-center justify-center rounded-full mb-5"
        style={{ width: 68, height: 68, background: "#FFADE1" }}
      >
        <svg width="50%" height="50%" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
            stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-snug">We'll be in touch! 💌</h2>
      <p className="text-gray-600 text-sm mb-6 leading-relaxed">
        Create a free account to browse compatible families and nanny shares in your area right now.
      </p>
      <NavLink
        to="/joinNow"
        className="w-full block text-center bg-[#FFADE1] hover:bg-[#f99dd5] transition-colors rounded-full py-3 text-base font-bold text-black mb-3"
        style={{ textDecoration: "none" }}
      >
        Create account to see families now
      </NavLink>
      <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
        No thanks
      </button>
    </div>
    <style>{`@keyframes popIn { 0% { opacity:0; transform:scale(0.85); } 100% { opacity:1; transform:scale(1); } }`}</style>
  </div>
);

/* ─────────────────────────────────────────
   Success Modal
───────────────────────────────────────── */
const SuccessModal = ({ onClose, recordId, email, name, sendQuestionnaireEmail }) => {
  const [showMaybeLater, setShowMaybeLater] = useState(false);
  const navigate = useNavigate();

  if (showMaybeLater) return <MaybeLaterModal onClose={onClose} />;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.35)" }}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl px-8 py-10 flex flex-col items-center text-center max-w-sm w-full mx-4"
        style={{ animation: "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <div
          className="flex items-center justify-center rounded-full mb-5"
          style={{ width: 68, height: 68, background: "#FFADE1", animation: "scaleIn 0.4s 0.1s cubic-bezier(0.34,1.56,0.64,1) both" }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path
              d="M7 16.5L13 22.5L25 10"
              stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              style={{ strokeDasharray: 30, strokeDashoffset: 0, animation: "drawCheck 0.4s 0.3s ease both" }}
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-snug">You're on the list! 🎉</h2>
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
          Thanks for submitting! We'll start looking for compatible nanny-share options in your area and email you
          within 24 hours.{" "}
          <span className="Livvic-Bold">
            To accurately match you with a nanny share, answer a few more quick questions now.
          </span>
        </p>
        <button
          type="button"
          onClick={() => navigate(`/hire?recordId=${recordId || ""}`)}
          className="w-full block text-center bg-[#FFADE1] hover:bg-[#f99dd5] transition-colors rounded-full py-3 text-base font-bold text-black mb-3"
        >
          Continue – unlock my match
        </button>
        <button type="button" onClick={() => setShowMaybeLater(true)} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
          Maybe later
        </button>
      </div>
      <style>{`
        @keyframes popIn    { 0% { opacity:0; transform:scale(0.85); } 100% { opacity:1; transform:scale(1); } }
        @keyframes scaleIn  { 0% { transform:scale(0); } 100% { transform:scale(1); } }
        @keyframes drawCheck { from { stroke-dashoffset:30; } to { stroke-dashoffset:0; } }
      `}</style>
    </div>
  );
};

/* ─────────────────────────────────────────
   Waitlist Success Modal  ← NEW
───────────────────────────────────────── */
const WaitlistSuccessModal = ({ onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center"
    style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.35)" }}
  >
    <div
      className="relative bg-white rounded-3xl shadow-2xl px-8 py-10 flex flex-col items-center text-center max-w-sm w-full mx-4"
      style={{ animation: "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both" }}
    >
      {/* Animated check icon */}
      <div
        className="flex items-center justify-center rounded-full mb-5"
        style={{
          width: 72,
          height: 72,
          background: "linear-gradient(135deg, #AEC4FF 0%, #AEC4FF 100%)",
          animation: "scaleIn 0.4s 0.1s cubic-bezier(0.34,1.56,0.64,1) both",
          boxShadow: "0 8px 24px rgba(255,173,225,0.45)",
        }}
      >
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
          <path
            d="M8 17.5L14 23.5L26 11"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ strokeDasharray: 32, strokeDashoffset: 0, animation: "drawCheck 0.45s 0.35s ease both" }}
          />
        </svg>
      </div>

      {/* Confetti dots */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full pointer-events-none" aria-hidden="true">
        {[
          { left: "20%", top: "0px", color: "#AEC4FF", size: 7, delay: "0.3s" },
          { left: "35%", top: "-8px", color: "#AEC4FF", size: 5, delay: "0.4s" },
          { left: "50%", top: "-4px", color: "#AEC4FF", size: 6, delay: "0.25s" },
          { left: "65%", top: "-10px", color: "#AEC4FF", size: 5, delay: "0.45s" },
          { left: "78%", top: "0px", color: "#AEC4FF", size: 7, delay: "0.35s" },
        ].map((dot, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: dot.left,
              top: dot.top,
              width: dot.size,
              height: dot.size,
              background: dot.color,
              animation: `confettiFall 0.6s ${dot.delay} cubic-bezier(0.22,1,0.36,1) both`,
            }}
          />
        ))}
      </div>

      {/* Status pill */}
      <div
        className="flex items-center gap-1.5 rounded-full px-3 py-1 mb-2"
        style={{ background: "#f0f4ff", border: "0.5px solid #d8e2ff" }}
      >
        <span className="inline-block rounded-full" style={{ width: 7, height: 7, background: "#AEC4FF" }} />
        <span className="text-xs font-semibold" style={{ color: "#AEC4FF" }}>Coming soon to your area</span>
      </div>

      <h2 className="text-3xl Livvic-Bold text-primary mb-2 leading-snug">Famlink is <br /> <span className="text-[#7499ff] Livvic-Bold">expanding near you</span></h2>
      <p className="text-gray-500 text-base Livvic-Medium mb-2 leading-relaxed">
        We're actively expanding into new areas and <span className="text-[#7499ff] Livvic-Medium">you've been added to the waitlist.</span> We'll reach out as soon as Famlink becomes available near you{" "}
      </p>

      {/* CTA */}
      <NavLink
        to="/"
        className="w-full block text-center bg-[#AEC4FF] hover:bg-[#AEC4FF] transition-colors rounded-full py-3 text-base font-bold text-black mb-3"
        style={{ textDecoration: "none" }}
      >
        Back to Homepage
      </NavLink>
    </div>
    <style>{`
      @keyframes popIn     { 0% { opacity:0; transform:scale(0.85); } 100% { opacity:1; transform:scale(1); } }
      @keyframes scaleIn   { 0% { transform:scale(0); } 100% { transform:scale(1); } }
      @keyframes drawCheck { from { stroke-dashoffset:32; } to { stroke-dashoffset:0; } }
      @keyframes confettiFall {
        0%   { opacity:0; transform:translateY(-12px) scale(0); }
        60%  { opacity:1; transform:translateY(4px) scale(1.2); }
        100% { opacity:0.7; transform:translateY(0px) scale(1); }
      }
    `}</style>
  </div>
);

/* ─────────────────────────────────────────
   Waitlist Modal  (updated with loading + success states)
───────────────────────────────────────── */
const WaitlistModal = ({ onClose, email, name, location, goal, onSuccess, setModalState, careNeeded, hasNanny }) => {
  const [showMaybeLater, setShowMaybeLater] = useState(false);
  // "idle" | "loading" | "success"
  const [submitState, setSubmitState] = useState("idle");

  if (showMaybeLater) return <MaybeLaterModal onClose={onClose} />;
  if (submitState === "success") return <WaitlistSuccessModal onClose={onSuccess} />;

  const handleWaitlistAdd = async () => {
    setSubmitState("loading");

    const waitlistData = {
      action: "create",
      Timestamp: new Date().toISOString(),
      Id: crypto.randomUUID(),
      Name: name || "",
      Email: email || "",
      Location: location || "",
      "Already have nanny": hasNanny || "",
      "Care needed": careNeeded,
    };

    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_WAITLIST_URL;

    if (scriptUrl) {
      try {
        const response = await fetch(scriptUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(waitlistData).toString(),
        });
        console.log("Waitlist submission response:", await response.text());
      } catch (error) {
        console.error("Waitlist submission error:", error);
        // Still proceed to success even if sheet write fails
      }
    } else {
      console.warn("VITE_GOOGLE_SCRIPT_WAITLIST_URL is not set. Data:", waitlistData);
      await new Promise((r) => setTimeout(r, 900));
    }

    setSubmitState("success");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.35)" }}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl px-8 py-10 flex flex-col items-center text-center max-w-sm w-full mx-4"
        style={{ animation: "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        {/* Hourglass icon */}
        <div
          className="flex items-center justify-center rounded-full mb-5"
          style={{ width: 72, height: 72, background: "#f0f4ff", animation: "scaleIn 0.4s 0.1s cubic-bezier(0.34,1.56,0.64,1) both" }}
        >
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
            <path d="M10 5 H28 L19 18 L28 31 H10 L19 18 Z" fill="#AEC4FF" fillOpacity="0.18" stroke="#AEC4FF" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M12 7.5 H26 L19 16 Z" fill="#AEC4FF" fillOpacity="0.7" />
            <path d="M14 28.5 H24 L19 22 Z" fill="#AEC4FF" />
            <line x1="19" y1="17" x2="19" y2="21" stroke="#AEC4FF" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1.5 2" />
            <rect x="9" y="4" width="20" height="2.5" rx="1.25" fill="#AEC4FF" />
            <rect x="9" y="31.5" width="20" height="2.5" rx="1.25" fill="#AEC4FF" />
            <circle cx="30" cy="8" r="1.2" fill="#AEC4FF" fillOpacity="0.6" />
            <circle cx="33" cy="13" r="0.8" fill="#AEC4FF" fillOpacity="0.4" />
            <circle cx="8" cy="30" r="1" fill="#AEC4FF" fillOpacity="0.5" />
          </svg>
        </div>

        {/* Status pill */}
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1 mb-4"
          style={{ background: "#f0f4ff", border: "0.5px solid #d8e2ff" }}
        >
          <span className="inline-block rounded-full" style={{ width: 7, height: 7, background: "#AEC4FF" }} />
          <span className="text-xs font-semibold" style={{ color: "#AEC4FF" }}>Coming soon to your area</span>
        </div>

        <h2 className="text-2xl Livvic-SemiBold text-primary mb-2 leading-snug">Good things take time ⏳</h2>
        <p className="text-gray-500 Livvic text-lg mb-6 leading-relaxed">
          We're not quite in your area yet — but we're growing fast.  <span className="font-semibold text-gray-700">Join the waitlist</span> and we'll reach out{" "}
          <span className="font-semibold text-gray-700">the moment we're available near you.</span>
        </p>

        <button
          type="button"
          onClick={handleWaitlistAdd}
          disabled={submitState === "loading"}
          className="w-full flex items-center justify-center gap-2 text-center bg-[#AEC4FF] disabled:opacity-70 disabled:cursor-not-allowed transition-colors rounded-full py-3 text-base font-bold text-black mb-3"
        >
          {submitState === "loading" ? (
            <>
              {/* Inline spinner */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                style={{ animation: "spinBtn 0.8s linear infinite", flexShrink: 0 }}
              >
                <circle cx="9" cy="9" r="7" stroke="rgba(0,0,0,0.2)" strokeWidth="2.5" />
                <path d="M9 2 a7 7 0 0 1 7 7" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              Joining waitlist…
            </>
          ) : (
            "Notify me when you're here"
          )}
        </button>

        {submitState !== "loading" && <button
          type="button"
          onClick={() => setModalState("idle")}
          disabled={submitState === "loading"}
          className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
        >
          Maybe later
        </button>}
      </div>
      <style>{`
        @keyframes popIn   { 0% { opacity:0; transform:scale(0.85); } 100% { opacity:1; transform:scale(1); } }
        @keyframes scaleIn { 0% { transform:scale(0); } 100% { transform:scale(1); } }
        @keyframes spinBtn { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
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
  const dispatch = useDispatch();

  // Single modal state machine — only one modal shows at a time
  // "idle" | "loading" | "success" | "waitlist"
  const [modalState, setModalState] = useState("idle");

  const [location, setLocation] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [recordId, setRecordId] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [hasNanny, setHasNanny] = useState("");
  const [careNeeded, setCareNeeded] = useState("")
  const [resetKey, setResetKey] = useState(0);

  const defaultChild = () => ({ id: Date.now() + Math.random(), age: "", unit: "years" });
  const [children, setChildren] = useState([defaultChild()]);
  const [childrenError, setChildrenError] = useState(false);

  const addChild = () => setChildren((prev) => [...prev, { id: Date.now() + Math.random(), age: "", unit: "years" }]);
  const removeChild = (id) => { if (children.length > 1) setChildren((prev) => prev.filter((c) => c.id !== id)); };
  const updateChild = (id, field, value) => {
    setChildren((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
    setChildrenError(false);
  };

  const sendQuestionnaireEmail = async (email, name, id) => {
    if (!email || !name || !id) return;
    try {
      await dispatch(sendQuestionnaireFormEmail({ email, name, id }));
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    form.resetFields();
    setChildren([defaultChild()]);
    setChildrenError(false);
    setLocation("");
    setResetKey((prev) => prev + 1);
  };

  const onFinish = async (values) => {
    // Validate children ages
    if (children.some((c) => c.age === "" || c.age === null)) {
      setChildrenError(true);
      return;
    }

    // ── OUT-OF-AREA: show waitlist modal ──
    if (values.location.city !== "Oakland") {
      setEmail(values.email);
      setName(values.name || "");
      setCareNeeded(values.careNeeded)
      setHasNanny(values.alreadyHaveNanny)
      setModalState("waitlist");
      return;
    }

    // ── IN-AREA (Oakland): normal submit flow ──
    setModalState("loading");

    const newRecordId = crypto.randomUUID();
    const childAges = children.map((c) => `${c.age} ${c.unit}`);

    const data = {
      action: "create",
      Timestamp: new Date().toISOString(),
      Id: newRecordId,
      Name: values.name || "",
      Email: values.email || "",
      "Already have nanny": values.alreadyHaveNanny || "",
      "Child age(s)": childAges.join(", "),
      "Care needed": values.careNeeded,
      Type: values.careNeeded,
      "Number of children": children.length,
      Location: JSON.stringify(values.location) || "",
      Details: "",
    };

    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

    // Dev fallback (no script URL)
    if (!scriptUrl) {
      console.warn("VITE_GOOGLE_SCRIPT_URL is not set. Data:", data);
      await new Promise((r) => setTimeout(r, 1400));
      setRecordId(newRecordId);
      setEmail(values.email);
      setName(values.name || "");
      resetForm();
      setModalState("success");
      return;
    }

    try {
      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data).toString(),
      });
      console.log("Google Script response:", await response.text());

      setRecordId(newRecordId);
      setEmail(values.email);
      setName(values.name || "");
      resetForm();
      navigate(`family/${newRecordId}`);
    } catch (error) {
      console.error("Submission error:", error);
      fireToastMessage({ type: "error", message: "Something went wrong. Please try again." });
      setModalState("idle");
    }
  };

  const onFinishFailed = () => {
    if (children.some((c) => c.age === "" || c.age === null)) setChildrenError(true);
  };

  return (
    <>
      {/* Single modal rendered based on state machine */}
      {modalState === "loading" && <LoadingModal />}

      {modalState === "success" && (
        <SuccessModal
          onClose={() => setModalState("idle")}
          recordId={recordId}
          email={email}
          name={name}
          sendQuestionnaireEmail={sendQuestionnaireEmail}
        />
      )}

      {modalState === "waitlist" && (
        <WaitlistModal
          onClose={() => setModalState("idle")}
          email={email}
          name={name}
          location={location}
          goal={goal}
          careNeeded={careNeeded}
          setModalState={setModalState}
          hasNanny={hasNanny}
          onSuccess={() => {
            resetForm();
            setModalState("idle");
          }}
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
            <InputDa type="text" name="name" placeholder="Enter your name" labelText="Name" />
            <InputDa name="email" placeholder="Enter your email" labelText="Email" type="email" required={true} />

            {/* Children's ages */}
            <div>
              <p className="text-lg Livvic-SemiBold text-primary mb-4">
                Children's ages <span className="text-red-400">*</span>
              </p>
              <div className="flex flex-col gap-3">
                {children.map((child, index) => (
                  <div key={child.id} className="flex items-center gap-2">
                    <span className="text-primary Livvic-Medium w-20 shrink-0">Child {index + 1}</span>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Age"
                      value={child.age}
                      onChange={(e) => updateChild(child.id, "age", e.target.value)}
                      status={childrenError && child.age === "" ? "error" : ""}
                      style={{ width: 80 }}
                      className="peer border text-primary border-[#EEEEEE] rounded-[10px] px-4 py-1 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Select value={child.unit} onChange={(val) => updateChild(child.id, "unit", val)} style={{ width: 100 }}>
                      <Select.Option value="months">Months</Select.Option>
                      <Select.Option value="years">Years</Select.Option>
                    </Select>
                    {children.length > 1 && (
                      <button type="button" onClick={() => removeChild(child.id)} className="text-red-400 hover:text-red-600 text-xl font-bold leading-none" aria-label="Remove child">
                        <X />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {childrenError && <p className="text-red-400 text-xs mt-2">Please enter an age for each child.</p>}
              <button type="button" onClick={addChild} className="mt-4 flex items-center gap-2 text-primary Livvic-SemiBold hover:opacity-70 transition-opacity">
                <span className="text-2xl leading-none"><Plus /></span>
                <span className="text-sm">Add another child</span>
              </button>
            </div>

            {/* Already have a nanny */}
            <div>
              <p className="text-lg Livvic-SemiBold text-primary mb-4">
                Already have a nanny? <span className="text-red-400">*</span>
              </p>
              <OnboardingOptionSelector form={form} options={["Yes", "No"]} name="alreadyHaveNanny" resetKey={resetKey} rules={[{ required: true, message: "Please select an option." }]} />
            </div>

            {/* Care needed */}
            <div>
              <p className="text-lg Livvic-SemiBold text-primary mb-4">
                Care Needed <span className="text-red-400">*</span>
              </p>
              <OnboardingOptionSelector form={form} options={["Full-time care", "Part-time care", "After-school care", "Summer/Seasonal"]} name="careNeeded" resetKey={resetKey} rules={[{ required: true, message: "Please select a care type." }]} />
            </div>

            {/* Location */}
            <div>
              <p className="text-lg Livvic-SemiBold text-primary mb-4">
                Where are you located? <span className="text-red-400">*</span>
              </p>
              <div className="relative">
                <Form.Item name="location" rules={[{ required: true, message: "Address is required" }]}>
                  <Spin spinning={locationLoading} size="small">
                    <Autocomplete
                      apiKey={import.meta.env.VITE_GOOGLE_KEY}
                      style={{ width: "55%", borderRadius: "10px", padding: "0.75rem", border: "1px solid #D6DDEB" }}
                      value={location}
                      onPlaceSelected={async (place) => {
                        const address = place.formatted_address;
                        const components = place?.address_components || [];
                        const get = (type) => components.find((c) => c.types.includes(type))?.long_name || "";
                        const extractedCity = get("locality") || get("administrative_area_level_2");
                        const extractedNeighborhood = get("neighborhood") || get("sublocality_level_1") || get("sublocality") || extractedCity || "";
                        const lat = place?.geometry?.location?.lat();
                        const lng = place?.geometry?.location?.lng();
                        const locationObj = { type: "Point", coordinates: [lng, lat], format_location: address, city: extractedCity, neighborhood: extractedNeighborhood };
                        setLocation(extractedNeighborhood !== extractedCity ? `${extractedNeighborhood} , ${extractedCity}` : `${extractedCity}`);
                        form.setFieldsValue({ location: locationObj });
                        setLocationLoading(false);
                      }}
                      onChange={(e) => { setLocation(e.target.value); setLocationLoading(e.target.value.length > 0); }}
                      onBlur={() => setLocationLoading(false)}
                      options={{ types: ["geocode"], componentRestrictions: { country: "us" } }}
                    />
                  </Spin>
                </Form.Item>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-4 pt-6 w-full max-w-lg mx-auto">
              <Button btnText="Go Back" action={() => navigate("/")} className="w-full sm:w-auto py-3 sm:py-4 flex items-center justify-center rounded-full text-lg Livvic-Bold text-primary hover:bg-white/5 transition-all" />
              <FormItem className="mb-0 w-full sm:w-auto">
                <Button btnText="Get Matched" htmlType="submit" className="bg-[#FFADE1] w-full py-3 sm:py-4 flex items-center justify-center rounded-full text-lg Livvic-Bold text-black" disabled={modalState === "loading"} />
              </FormItem>
            </div>
          </Form>
        </div>
      </div>
    </>
  );
};

export default NannyShareMatchForm;