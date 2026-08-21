import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MatchCard, { convertChatMatchToMatchCardProps, convertRealProfileToMatchCardProps } from '../NannyShare/Onboarding/MatchCard';
import CustomButton from '../Button';

const LandingMatchesCarousel = ({ matches, onJoin, variant = 'family', isMismatched, onMismatchClick, isSubmitting, isComplete }) => {
  const navigate = useNavigate();

  if (!matches || matches.length === 0) return null;

  // Duplicate matches for seamless infinite scroll
  const displayMatches = [...matches, ...matches];

  const renderProfile = (match, idx) => {
    let matchProps;
    if (match.props) {
      matchProps = convertChatMatchToMatchCardProps(match, idx);
    } else {
      matchProps = convertRealProfileToMatchCardProps(match, match.userType, idx);
    }
    return <MatchCard match={matchProps} isInteractive={false} />;
  };

  return (
    <div className="w-full max-w-[850px] mx-auto mt-4 animate-[fadeIn_0.5s_ease-in-out] relative">
      <div className="relative">
        {isMismatched && (
          <div 
            className="absolute inset-0 z-[40] bg-white/50 backdrop-blur-[2px] cursor-not-allowed rounded-2xl"
            onClick={onMismatchClick}
          />
        )}
        <div className={isMismatched ? 'opacity-40 pointer-events-none' : ''}>
          <div className="flex items-center gap-2 mb-6 px-2">
            {isComplete ? (
              <>
                <span className="text-[#AEC4FF] text-xl">✦</span>
                <h2 className="text-[#001243] font-black Livvic-Bold text-lg">Potential Matches Preview</h2>
                <span className="text-[#6b7280] text-sm ml-2">Complete your profile to unlock personalized matches.</span>
              </>
            ) : (
              <>
                <span className="text-[#AEC4FF] text-xl">⭐</span>
                <h2 className="text-[#001243] font-black Livvic-Bold text-lg">See who's on FamLink</h2>
                <span className="text-[#6b7280] text-sm ml-2">Complete questions above to unlock potential matches</span>
              </>
            )}
          </div>

      <style>
        {`
          @keyframes verticalMarquee {
            0% { transform: translateY(0); }
            100% { transform: translateY(calc(-50% - 0.5rem)); }
          }
          .animate-vertical-marquee {
            animation: verticalMarquee 15s linear infinite;
          }
          .animate-vertical-marquee:hover {
            animation-play-state: paused;
          }
        `}
      </style>

      {/* The Carousel Container */}
      <div 
        className="relative w-full h-[400px] overflow-hidden px-2 py-2"
        style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)' }}
      >
        <div className="flex flex-col gap-4 w-full animate-vertical-marquee">
          {displayMatches.map((match, idx) => {
            const keyId = match.props ? match.props.id : match._id;
            return (
              <div
                key={`${keyId}-${idx}`}
                className="w-full shrink-0"
              >
                {renderProfile(match, idx)}
              </div>
            );
          })}
        </div>
      </div>

      {/* The Unlock CTA Card (Outside overflow:hidden so it's never cut off) */}
      <div className="mt-8 flex flex-col items-center text-center w-full">
        <div className="bg-[#EEF3FF] border border-[#C8D8FF] w-full py-8 px-6 rounded-2xl shadow-sm flex flex-col items-center">
          <h3 className="text-lg sm:text-xl font-black Livvic-Bold text-[#001243] mb-4 leading-snug">
            Unlock your personalized matches.
          </h3>
          <CustomButton
            btnText={<span>Create Free Account &rarr;</span>}
            action={() => onJoin ? onJoin() : navigate('/login')}
            className="bg-[#001243] text-white !rounded-full px-6 py-2.5 !h-10 text-[15px] Livvic-Bold font-black w-fit"
            isLoading={isSubmitting}
          />
        </div>
      </div>
      </div>
      </div>

      {/* Trust Badges (Explicitly excluded from blur) */}
        <div className="flex justify-center items-center gap-4 sm:gap-8 mt-16 flex-wrap relative z-[50]">
          {variant === 'caregiver' ? (
            <>
              <div className="flex items-center text-[15px] text-[#001243] font-medium">
                <div className="flex items-center justify-center w-[28px] h-[28px] rounded-full bg-[#EEF3FF] mr-2 text-[15px]">
                  💰
                </div>
                Earn 20-30% more
              </div>
              <div className="flex items-center text-[15px] text-[#001243] font-medium">
                <div className="flex items-center justify-center w-[28px] h-[28px] rounded-full bg-[#EEF3FF] mr-2 text-[15px]">
                  📍
                </div>
                Matches near you
              </div>
              <div className="flex items-center text-[15px] text-[#001243] font-medium">
                <div className="flex items-center justify-center w-[28px] h-[28px] rounded-full bg-[#EEF3FF] mr-2 text-[15px]">
                  <svg className="w-[14px] h-[14px] text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                Free to browse
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center text-[13.5px] text-gray-500 font-medium">
                <div className="flex items-center justify-center w-[18px] h-[18px] rounded-full bg-[#EEF3FF] mr-2">
                  <svg className="w-[10px] h-[10px] text-[#5582FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                Free to start
              </div>
              <div className="flex items-center text-[13.5px] text-gray-500 font-medium">
                <span className="text-[16px] mr-2 leading-none">🤝</span>
                Compatibility based matching
              </div>
              <div className="flex items-center text-[13.5px] text-gray-500 font-medium">
                <span className="text-[16px] mr-2 leading-none">⚡</span>
                Results in 60 seconds
              </div>
            </>
          )}
        </div>
    </div>
  );
};

export default LandingMatchesCarousel;
