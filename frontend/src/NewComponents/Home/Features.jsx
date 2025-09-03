import React from "react";

function Features() {
  return (
    <div className="container my-24">
      <h1 className="Livvic-Bold text-4xl sm:text-5xl mt-12">
        Take the Stress Out of Hiring
      </h1>
      <p className="text-lg Livvic-Medium mt-6 sm:mt-8 lg:mt-9 leading-[30px] text-[#00000099]">
        Hiring someone for your home is a big decision. We provide the tools to
        help you do it right.
      </p>
      <div className="flex gap-6 flex-wrap mt-9">
        <div className="p-6  w-[25rem] rounded-[20px] shadow-soft">
          <img src="/coins-hand.svg" alt="coins-hand" />
          <h2
            className="text-[#001243] Livvic-SemiBold text-2xl mt-4"
          >
            Payroll Management
          </h2>
          <p className="text-[#8A8E99] text-md Livvic-Medium mt-4">
            Easily manage payments and stay tax-compliant
          </p>
        </div>
        <div className="p-6  w-[25rem] rounded-[20px] shadow-soft">
          <img src="/shield-tick.svg" alt="coins-hand" />
          <h2
            className="text-[#001243] Livvic-SemiBold text-2xl mt-4"
          >
            Background Checks
          </h2>
          <p
            className="text-[#8A8E99] text-md Livvic-Medium mt-4"
          >
            Ensure your caregivers meet safety and trust standards
          </p>
        </div>
        <div className="p-6  w-[25rem] rounded-[20px] shadow-soft">
          <img src="/certificate-01.svg" alt="coins-hand" />
          <h2
            className="text-[#001243] Livvic-SemiBold text-2xl mt-4"
          >
            Job Contract Templates
          </h2>
          <p
            className="text-[#8A8E99] text-md Livvic-Medium mt-4"
          >
            Create clear expectations with customizable contracts
          </p>
        </div>
      </div>
    </div>
  );
}

export default Features;
