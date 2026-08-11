import React from "react";
import Button from "../Button";
import { NavLink } from "react-router-dom";

const benefits = [
  "Background-checked providers",
  "18-month average match duration",
  "Save $18,000–$26,000 annually",
  "Built-in support network of like-minded families",
];

function NannyShare() {
  return (
    <div className="container my-16 sm:my-32 Livvic px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-8 sm:gap-0">
        <div className="w-full sm:w-auto">
          <h2 className="Livvic-Bold text-4xl sm:text-6xl mt-6 sm:mt-12 leading-tight sm:leading-[80px]">
            Nanny Share & Shared
            <br /> Care—More Affordable
            <br /> Than You Think
          </h2>
          <p className="text-base sm:text-lg Livvic-Medium mt-6 sm:mt-9 leading-relaxed sm:leading-[30px] text-[#00000099]">
            Famlink helps families connect with nearby families to share
            caregivers—
            <br className="hidden sm:block" />
            whether that's a nanny, tutor, or coach. Save money, split
            schedules, and
            <br className="hidden sm:block" /> build consistency with our
            compatibility-based matching system.
          </p>
          <NavLink to={"/joinNow"}>
            <Button
              btnText={"Learn more about Nanny Share"}
              className="bg-[#D6FB9A] mt-6 w-full sm:w-auto"
            />
          </NavLink>
        </div>
        <div className="border-2 border-[#EEEEEE] rounded-[20px] flex flex-col gap-4 sm:gap-6 p-6 sm:p-12 w-full sm:w-auto">
          <h2 className="text-[#001243] Livvic-SemiBold text-lg sm:text-xl">
            Benefits Box:
          </h2>
          {benefits.map((benefit, i) => (
            <div key={i} className="flex gap-3 sm:gap-4 items-center">
              <img
                src="/icons/Check.svg"
                alt="check"
                className="flex-shrink-0 mt-1"
              />
              <p className="Livvic text-[#025738] text-sm sm:text-base">
                {benefit}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NannyShare;
