import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FamilyProfile, NannyProfile } from '../../Components/subComponents/profileCard';
import CustomButton from '../Button';

const PotentialMatches = ({ matches, isJoinNowPage = false, onJoin }) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const cardRefs = useRef([]);
  const [scrollIndex, setScrollIndex] = useState(0);

  useEffect(() => {
    if (isJoinNowPage || !matches || matches.length === 0) return;

    // Sequence: Wait 2.5s -> Scroll to 2nd card -> Wait 2.5s -> Scroll to 3rd card
    const timer1 = setTimeout(() => setScrollIndex(1), 2500);
    const timer2 = setTimeout(() => setScrollIndex(2), 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isJoinNowPage, matches]);

  useEffect(() => {
    if (isJoinNowPage) return;
    
    // Smooth scroll the container to align the target card at the top
    if (scrollContainerRef.current && cardRefs.current[scrollIndex]) {
      const container = scrollContainerRef.current;
      const targetCard = cardRefs.current[scrollIndex];
      
      const scrollPosition = targetCard.offsetTop - container.offsetTop;
      container.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [scrollIndex, isJoinNowPage]);

  if (!matches || matches.length === 0) return null;

  return (
    <div className="w-full max-w-[720px] mx-auto mt-8 animate-[fadeIn_0.5s_ease-in-out]">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[#AEC4FF] text-xl">✦</span>
        <h2 className="text-[#001243] font-black Livvic-Bold text-lg">Potential Matches Preview</h2>
        <span className="text-[#6b7280] text-sm ml-2">Complete your profile to unlock personalized matches.</span>
      </div>

      <div 
        ref={scrollContainerRef}
        className={`flex flex-col gap-6 ${!isJoinNowPage ? 'max-h-[600px] overflow-hidden' : ''} px-2 pb-6`}
      >
        {matches.map((match, index) => {
          const isFourthCard = index === 3;
          const showBlurOverlay = isJoinNowPage && isFourthCard;

          const renderProfile = () => {
            if (match.type === 'Family') {
              return <FamilyProfile {...match.props} />;
            }
            return <NannyProfile {...match.props} />;
          };

          return (
            <div 
              key={match.props.id} 
              ref={el => cardRefs.current[index] = el}
              className="relative"
            >
              {showBlurOverlay ? (
                <>
                  <div className="blur-md opacity-40 select-none pointer-events-none">
                    {renderProfile()}
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white/30 rounded-3xl p-6 text-center">
                    <div className="bg-[#EEF3FF] border border-[#C8D8FF] w-full max-w-md py-8 px-6 rounded-2xl shadow-sm flex flex-col items-center">
                      <h3 className="text-xl font-black Livvic-Bold text-[#001243] mb-6">
                        Unlock your personalized matches.
                      </h3>
                      <CustomButton 
                        btnText="Create Free Account" 
                        action={() => onJoin ? onJoin() : navigate('/login')} 
                        className="bg-[#001243] text-white !rounded-full px-8 py-3 !h-12 w-fit" 
                      />
                    </div>
                  </div>
                </>
              ) : (
                renderProfile()
              )}
            </div>
          );
        })}

        {!isJoinNowPage && (
          <div className="bg-[#EEF3FF] mt-2 rounded-3xl p-8 flex flex-col items-center text-center shadow-sm border border-[#C8D8FF]">
            <h3 className="text-xl font-black Livvic-Bold text-[#001243] mb-6">
              Unlock your personalized matches.
            </h3>
            <CustomButton 
              btnText="Create Free Account" 
              action={() => onJoin ? onJoin() : navigate('/login')} 
              className="bg-[#001243] text-white !rounded-full px-8 py-3 !h-12 w-fit" 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PotentialMatches;
