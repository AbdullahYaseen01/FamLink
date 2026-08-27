import React, { useEffect } from "react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import SEOMetaData from "../../NewComponents/SEOMetaData";
import ChatContainer from "../../NewComponents/ChatOnboarding/ChatContainer";

export default function JoinNow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { family, caregiver } = useSelector((state) => state.chatOnboarding);

  const sourceVariant = location.state?.sourceVariant;

  // Determine active flow based on completion status or where they navigated from
  let activeVariant = 'family';
  if (sourceVariant) {
    activeVariant = sourceVariant;
  } else if (caregiver?.isComplete && !family?.isComplete) {
    activeVariant = 'caregiver';
  } else if (caregiver?.hasStarted && !family?.hasStarted) {
    activeVariant = 'caregiver';
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SEOMetaData
        title="Join Famlink | Find Caregivers or Jobs"
        description="Sign up on Famlink to connect as a parent seeking childcare or a caregiver looking for job opportunities in your area."
        noIndex
      />

      {/* Minimal Top Header */}
      <header className="fixed top-0 left-0 right-0 bg-white z-50">
        <div className="flex justify-between items-center p-6 sm:px-12 w-full max-w-7xl mx-auto">
          <NavLink to="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img src="/logo3.png" alt="Famlink" className="h-7 w-7" />
              <span className="text-[#001243] font-black text-xl tracking-tight Livvic-Bold">
                Famlink
              </span>
            </div>
          </NavLink>
          <div className="flex items-center gap-2">
            <span className="Livvic-SemiBold text-[14px] text-[#001243]">Already have an account?</span>
            <NavLink
              to="/login"
              className="Livvic-SemiBold text-[13px] leading-none text-[#001243] bg-[#AEC4FF] rounded-full px-3 py-[5px] hover:opacity-90"
            >
              Log in
            </NavLink>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col items-center pt-[90px] px-4">
        {/* We no longer pass onFinalSubmit because completing the flow shows PotentialMatches */}
        <ChatContainer isFullScreen={true} variant={activeVariant} />
      </main>


    </div>
  );
}
