import React from "react";
import Header from "../Header";
import { NavLink } from "react-router-dom";
import CustomButton from "../Button";

function Hero() {
  return (
    <div className="Livvic container min-h-screen px-4 sm:px-6 lg:px-8">
      <Header />

      <div className="mt-20 sm:mt-32">
        <h1 className="Livvic-Bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white leading-tight sm:leading-[50px] md:leading-[60px] lg:leading-[80px]">
          Expand Your Reach
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          with Famlink
        </h1>
        <h2 className="Livvic text-[#FFFFFF99] text-base sm:text-lg md:text-xl mt-4 sm:mt-6 max-w-2xl">
          List your business and connect with families seeking quality services
        </h2>
        <div className="mt-4 space-y-2">
          <NavLink
            to="/joinNow"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <CustomButton
              btnText={"Get Started Today"}
              className="bg-[#f5ff62] w-full sm:w-auto px-6 py-3 sm:py-4"
            />
          </NavLink>

          <p className="font-normal text-base already-acc">
            <NavLink
              className="text-white transition-colors duration-300 cursor-pointer"
              to="/login"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Already have a business account? <span className="hover:underline hover:text-blue-600 text-white">Log in</span>
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Hero;
