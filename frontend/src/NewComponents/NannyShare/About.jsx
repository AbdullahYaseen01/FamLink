import React from "react";
import Button from "../Button";
import { NavLink } from "react-router-dom";

function About() {
  return (
    <div className="container Livvic px-4 sm:px-6 lg:px-8 min-h-[550px] mx-auto max-w-7xl">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-8 lg:gap-12 py-8 lg:py-12">
        <div className="space-y-4 lg:space-y-6 max-w-2xl w-full lg:w-1/2">
          <h1 className="Livvic-Bold text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-tight">
            What is Nanny Share?
          </h1>
          <h3 className="Livvic-SemiBold text-xl sm:text-2xl text-[#1a2e1a] mb-1">
            Nanny sharing is when two families share one nanny.
          </h3>
          <p className="text-base sm:text-lg lg:text-xl text-[#00000099] Livvic-Medium leading-relaxed">
            It’s a simple way to lower childcare costs while giving your child personalized, in-home care with
            a built-in playmate.
          </p>
          <div className="pt-2 lg:pt-4">
            <NavLink to="/joinNow" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <Button
                btnText={"Join Now"}
                className="bg-[#FFADE1] text-[#3B0025] w-full sm:w-auto text-lg Livvic-SemiBold"
              />
            </NavLink>
          </div>
        </div>

        <div className="w-full lg:w-1/2 p-6 rounded-2xl">
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