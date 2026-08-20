import React from "react";
import Button from "../Button";
import { NavLink } from "react-router-dom";

function About() {
  return (
    <div className="w-full bg-[#F6F3EE] relative pt-4 sm:pt-8 lg:pt-1 mt-16 sm:mt-24 lg:mt-10">
      <div className="absolute bottom-[100%] left-0 w-full overflow-hidden leading-none z-10 -mb-[1px]">
        <svg
          className="w-full block h-[60px] sm:h-[80px] lg:h-[120px]"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path fill="#F6F3EE" d="M0,0 C360,120 1080,120 1440,0 L1440,120 L0,120 Z" />
        </svg>
      </div>

      <div className="py-[80px] px-4 sm:px-[72px]">
        <div className="container mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-[64px] items-center">
        {/* Left Content */}
        <div className="w-full">
          <span className="text-[#888] uppercase tracking-widest text-[12px] font-bold mb-4 block Livvic">
            WHAT IS NANNY SHARE?
          </span>
          <h2 className="Livvic-Bold text-[44px] text-[#001243] leading-[1.1] mb-[20px] tracking-tight">
            What Is a Nanny Share Arrangement?
          </h2>
          <p className="Livvic-Medium text-[16px] lg:text-[18px] text-[#666] leading-[1.6] mb-[28px]">
            A nanny share is when one nanny cares for children from two different families in one shared arrangement. Caregivers can earn more while working with compatible families on a consistent schedule.
          </p>

          <div className="flex flex-col gap-[14px] mb-[32px]">
            {/* Box 1 */}
            <div className="border-[1.5px] border-[#DDE5FF] rounded-[14px] px-[20px] py-[18px] flex items-start gap-[14px] bg-[#F8F9FF]">
              <div className="w-[38px] h-[38px] min-w-[38px] rounded-[10px] bg-[#AEC4FF] flex items-center justify-center text-[18px]">
                👨‍👩‍👧‍👦
              </div>
              <div>
                <h4 className="Livvic-Bold text-[#001243] text-[14px] font-[700] mb-[4px]">Already work with a family?</h4>
                <p className="text-[#666] text-[13px] leading-[1.5]">Add a second family to your current setup and turn your role into a nanny share.</p>
              </div>
            </div>

            {/* Box 2 */}
            <div className="border-[1.5px] border-[#DDE5FF] rounded-[14px] px-[20px] py-[18px] flex items-start gap-[14px] bg-[#F8F9FF]">
              <div className="w-[38px] h-[38px] min-w-[38px] rounded-[10px] bg-[#AEC4FF] flex items-center justify-center text-[18px]">
                🔍
              </div>
              <div>
                <h4 className="Livvic-Bold text-[#001243] text-[14px] font-[700] mb-[4px]">Looking for a nanny share job?</h4>
                <p className="text-[#666] text-[13px] leading-[1.5]">Connect with families searching for nanny share caregivers nearby.</p>
              </div>
            </div>
          </div>

          <div>
            <NavLink
              to="/caregiver/nannyshare"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <Button
                btnText={"Get Started"}
                className="bg-[#AEC4FF] hover:bg-[#92b0ff] text-[#001243] w-full sm:w-auto px-10 py-4 flex items-center justify-center rounded-full Livvic-Bold text-[16px] transition-colors"
              />
            </NavLink>
          </div>
        </div>

        {/* Right Image */}
        <div className="w-full flex justify-center items-center mt-12 lg:mt-0">
          <img
            src="nanny_share.png"
            alt="nanny"
            className="w-full max-w-[420px] object-cover rounded-[20px] shadow-[0_0_30px_rgba(0,0,0,0.1)]"
          />
        </div>
      </div>
      </div>
    </div>
  );
}

export default About;