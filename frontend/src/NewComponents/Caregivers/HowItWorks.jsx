import React, { useState, useEffect } from "react";
import CustomButton from "../Button";
import { NavLink } from "react-router-dom";
import createAccountImg from "../../assets/images/createAccount.png";
import browseFamImg from "../../assets/images/browseFam.png";
import requestImg from "../../assets/images/request.png";
import connectImg from "../../assets/images/connect.png";

function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: "Create Your Profile",
      description: "Share your experience, availability, location, and nanny share preferences.",
      img: createAccountImg,
    },
    {
      title: "Browse Compatible Families",
      description:
        "Explore families and nanny share arrangements that fit your schedule and childcare style.",
      img: browseFamImg,
    },
    {
      title: "Request a Match",
      description:
        "Send match requests to families you're interested in working with.",
      img: requestImg,
    },
    {
      title: "Connect After a Mutual Match",
      description: "Once there's mutual interest, connect directly to discuss schedules, care needs, and next steps.",
      img: connectImg,
    },
  ];

  // Auto-play the steps every 3.2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <section className="w-full bg-white py-16 sm:py-24 Livvic">
      <div className="container px-4 sm:px-6 lg:px-8 min-h-[550px] mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <span className="text-[#888] uppercase tracking-widest text-[12px] font-bold mb-4 block Livvic">
            HOW IT WORKS
          </span>
          <h2 className="Livvic-Bold text-[40px] sm:text-[48px] lg:text-[56px] text-[#001243] leading-[1.1] tracking-tight">
            How Famlink works
          </h2>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* LEFT: Steps */}
          <div className="flex flex-col gap-2">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-start gap-5 p-5 rounded-[16px] cursor-pointer transition-all duration-300 ${
                  activeStep === i
                    ? "bg-[#F0F5FF] shadow-sm"
                    : "bg-transparent hover:bg-[#F6F3EE]"
                }`}
                onClick={() => setActiveStep(i)}
              >
                <div
                  className={`w-[36px] h-[36px] min-w-[36px] rounded-full flex items-center justify-center shrink-0 text-[15px] font-bold ${
                    activeStep === i
                      ? "bg-[#AEC4FF] text-[#001243]"
                      : "bg-[#E5E7EB] text-[#6B7280]"
                  }`}
                >
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#001243] mb-1.5 Livvic-Bold">
                    {step.title}
                  </h3>
                  <p className="text-[14px] text-[#666] leading-[1.5] Livvic-Medium">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}

            <div className="mt-6 pl-[50px]">
              <NavLink to="/caregiver/nannyshare" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                <CustomButton
                  className="bg-[#AEC4FF] hover:bg-[#92b0ff] text-[#001243] w-full sm:w-auto px-8 py-3 text-[15px] Livvic-Bold rounded-full transition-colors"
                  btnText={"Get Matched"}
                />
              </NavLink>
            </div>
          </div>

          {/* RIGHT: Screen Preview */}
          <div className="w-full flex justify-center lg:justify-end">
            <div className="bg-[#f8fafc] rounded-2xl border border-gray-200 overflow-hidden relative w-full max-w-[600px]">
              {/* Screen Bar */}
              <div className="bg-[#2d3a4a] px-4 py-2.5 flex items-center gap-[7px]">
                <div className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]"></div>
                <div className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]"></div>
                <div className="w-[10px] h-[10px] rounded-full bg-[#28C840]"></div>
                <div className="flex-1 text-center text-[11px] text-white/40 mx-3 tracking-wide">
                  Step {activeStep + 1} — {steps[activeStep].title}
                </div>
              </div>

              {/* Screen Body */}
              <div className="p-0 sm:p-5 bg-white h-full">
                <img
                  key={activeStep}
                  src={steps[activeStep].img}
                  alt={steps[activeStep].title}
                  className="w-full aspect-[905/490] block object-cover object-center rounded-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
