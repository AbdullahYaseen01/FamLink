import React from "react";
import CustomButton from "../Button";
import { NavLink } from "react-router-dom";

function HowItWorks() {
  const steps = [
    {
      title: "Tell us what you’re looking for",
      description: "Share your location, schedule, and childcare needs.",
    },
    {
      title: "See matches near you",
      description:
        "We show you families and caregivers that fit. ",
    },
    {
      title: "Connect when it’s a match",
      description: "Start chatting once both sides are interested.",
    },
  ];

  return (
    <section className="Livvic px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl py-16 sm:py-24">
      <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-16">
        {/* LEFT: Image */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <img
            src="HowItWorks.png"
            alt="How nanny sharing works"
            className="w-full max-w-sm sm:max-w-md lg:max-w-full h-auto object-contain rounded-3xl"
          />
        </div>

        {/* RIGHT: Text content */}
        <div className="flex-1 max-w-lg">
          <h2 className="Livvic-Bold text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-tight mb-10">
            How nanny sharing works
          </h2>

          <div className="flex flex-col gap-6 mb-10">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div>
                  <h3 className="Livvic-SemiBold text-xl sm:text-2xl text-[#1a2e1a] mb-1">
                    {step.title}
                  </h3>
                  <p className="text-base sm:text-lg lg:text-xl text-[#00000099] Livvic-Medium leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <NavLink to="/find-nanny-share">
          <CustomButton
            className="bg-[#FFADE1] text-[#3B0025] w-full sm:w-auto text-lg Livvic-SemiBold"
            btnText={"Get Matched"}
          />
          </NavLink>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
