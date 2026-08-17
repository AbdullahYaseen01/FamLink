import React, { useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import SEOMetaData from "../../NewComponents/SEOMetaData";
import ChatContainer from "../../NewComponents/ChatOnboarding/ChatContainer";

export default function JoinNow() {
  const navigate = useNavigate();
  const { isComplete, answers } = useSelector((state) => state.chatOnboarding);

  // Removed auto-redirect. The ChatContainer will render the PotentialMatches if isComplete is true.

  // Handle completion when the user finishes the chat ON the JoinNow page
  const handleChatComplete = (finalAnswers) => {
    if (finalAnswers.role === 'Nanny') {
      navigate('/caregiver/nannyshare');
    } else {
      navigate('/find-nanny-share');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SEOMetaData
        title="Join Famlink | Find Caregivers or Jobs"
        description="Sign up on Famlink to connect as a parent seeking childcare or a caregiver looking for job opportunities in your area."
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
          <div className="text-sm font-medium text-gray-600">
            Already have an account?{" "}
            <NavLink to="/login" className="text-blue-600 font-bold hover:underline">
              Log in
            </NavLink>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col items-center pt-[90px] px-4">
        {/* We no longer pass onFinalSubmit because completing the flow shows PotentialMatches */}
        <ChatContainer isFullScreen={true} />
      </main>


    </div>
  );
}
