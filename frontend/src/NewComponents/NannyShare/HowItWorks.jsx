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
        "Send match requests to families you’re interested in working with.  ",
    },
    {
      title: "Connect After a Mutual Match",
      description: "Once there’s mutual interest, connect directly to discuss schedules, care needs, and next steps.",
    },
  ];

  return (
    <section className="container Livvic px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24  min-h-[550px]">
      <div className="flex flex-col-reverse lg:flex-row  justify-between gap-12 lg:gap-16">
        {/* LEFT: Image */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <img
            src="NannyShareAboutSection.png"
            alt="How nanny sharing works"
            className="w-full max-w-sm sm:max-w-md lg:max-w-full h-auto object-contain rounded-3xl"
          />
        </div>

        {/* RIGHT: Text content */}
        <div className="flex-1 max-w-lg">
          <h2 className="Livvic-Bold text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-tight mb-4">
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
