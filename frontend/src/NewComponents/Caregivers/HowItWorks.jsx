import React from "react";
import CustomButton from "../Button";
import { NavLink } from "react-router-dom";

function HowItWorks() {
  const steps = [
    {
      title: "Create Your Profile",
      description: "Share your experience, availability, location, and nanny share preferences.",
    },
    {
      title: "Browse Compatible Families",
      description:
        "Explore families and nanny share arrangements that fit your schedule and childcare style.",
    },
    {
      title: "Request a Match",
      description:
        "Send match requests to families you’re interested in working with.",
    },
    {
      title: "Connect After a Mutual Match",
      description: "Once there’s mutual interest, connect directly to discuss schedules, care needs, and next steps.",
    },
  ];

  return (
    <section className="Livvic px-4 sm:px-6 lg:px-8 container pb-16 sm:pb-24">
      <div className="flex flex-col-reverse lg:flex-row items-stretch gap-12 lg:gap-16">
        {/* LEFT: Image */}
        {/* LEFT: Image */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <img
            src="howitworks_caregiver.png"
            alt="How nanny sharing works"
            className="w-full max-w-sm lg:max-w-md h-auto object-cover rounded-2xl"
          />
        </div>

        {/* RIGHT: Text content */}
        <div className="flex-1 max-w-lg">
          <h2 className="Livvic-Bold text-2xl sm:text-3xl lg:text-4xl xl:text-5xl leading-tight mb-6">
            How Famlink works
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
          <NavLink to="/caregiver/nannyshare" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <CustomButton
              className="bg-[#AEC4FF] text-primary w-full sm:w-auto text-lg Livvic-SemiBold"
              btnText={"Get Matched"}
            />
          </NavLink>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
