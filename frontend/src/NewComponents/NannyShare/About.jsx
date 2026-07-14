import React from "react";
import Button from "../Button";
import { NavLink } from "react-router-dom";

function About() {
  return (
    <div className="container Livvic px-4 sm:px-6 lg:px-8 min-h-[550px] py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[72px] items-center">
        {/* Left Content */}
        <div className="w-full">
          <h2 className="Livvic-Bold text-4xl lg:text-[60px] text-black leading-tight mb-[12px]">
            What is Nanny Share?
          </h2>
          <h3 className="Livvic-SemiBold text-[24px] font-semibold text-[#1A2E1A] mb-[14px] leading-[1.5]">
            Nanny sharing is when two families share one nanny.
          </h3>
          <p className="Livvic-Medium text-[16px] text-[#666] leading-[1.75] mb-[28px]">
            It's a simple way to lower childcare costs while giving your child
            personalized, in-home care with a built-in playmate.
          </p>
          <div>
            <NavLink
              to="/joinNow"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <Button
                btnText={"Join Now"}
                className="bg-[#FFADE1] text-[#3B0025] w-full sm:w-auto px-8 py-3 text-lg Livvic-SemiBold"
              />
            </NavLink>
          </div>
        </div>

        {/* Right Image */}
        <div className="w-full rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.1)]">
          <img
            src="nanny_share.png"
            alt="nanny"
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>
      </div>
    </div>
  );
}

export default About;