import React from "react";
import Button from "../Button";
import { NavLink } from "react-router-dom";

function About() {
  return (
    <div className="container Livvic px-4 sm:px-6 lg:px-8 min-h-[550px] mx-auto max-w-7xl">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-8 lg:gap-12 py-8 lg:py-12">
        <div className="space-y-4 lg:space-y-6 max-w-2xl w-full lg:w-1/2">
          <h1 className="Livvic-Bold text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-tight">
            What Is Nanny Sharing?
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-[#00000099] Livvic-Medium mt-4 sm:mt-6 leading-relaxed">
            Nanny sharing is a childcare setup where two or more families hire a
            single nanny to care for their children together. It's a great way
            to access high-quality, personalized care at a lower cost—while
            giving kids the benefit of social interaction in a home-based
            setting.
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

        <div className="w-full lg:w-1/2">
          <img
            src="NannyShareAboutSection.png"
            alt="nanny"
            className="w-full h-auto object-cover rounded-2xl"
          />
        </div>
      </div>
    </div>
  );
}

export default About;