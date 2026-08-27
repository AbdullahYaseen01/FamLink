import React from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../Button';
import { renderFindAMatchCard, isCompletedShare } from './LandingMatchesCarousel';

const JoinNowMatchesScreen = ({ matches, onJoin, isMismatched, onMismatchClick, isSubmitting }) => {
  const navigate = useNavigate();
  const complete = (matches || []).filter(isCompletedShare).slice(0, 4);

  if (complete.length === 0) return null;

  return (
    <div className="w-full max-w-[850px] mx-auto mt-8 animate-[fadeIn_0.5s_ease-in-out] relative">
      {isMismatched && (
        <div
          className="absolute inset-0 z-[40] bg-white/50 backdrop-blur-[2px] cursor-not-allowed rounded-2xl"
          onClick={onMismatchClick}
        />
      )}
      <div className={isMismatched ? 'opacity-40 pointer-events-none' : ''}>
        <div className="flex items-center gap-2 mb-6 px-2">
          <span className="text-[#AEC4FF] text-xl">✦</span>
          <h2 className="text-[#001243] font-black Livvic-Bold text-lg">Potential Matches Preview</h2>
          <span className="text-[#6b7280] text-sm ml-2">Complete your profile to unlock personalized matches.</span>
        </div>

      <div className="flex flex-col gap-4 px-2 pb-6">
        {complete.map((match, index) => {
          const keyId = match.props ? match.props.id : (match._id || match.userId?._id);
          const isFourthCard = index === 3;

          return (
            <div key={`${keyId}-${index}`} className="relative w-full">
              {isFourthCard ? (
                <>
                  <div className="blur-[5px] opacity-60 select-none pointer-events-none">
                    {renderFindAMatchCard(match)}
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center px-4">
                    <div className="bg-[#EEF3FF] border border-[#C8D8FF] w-[95%] max-w-[420px] py-5 px-6 rounded-2xl shadow-sm flex flex-col items-center">
                      <h3 className="text-lg sm:text-xl font-black Livvic-Bold text-[#001243] mb-4 leading-snug">
                        Unlock your personalized matches.
                      </h3>
                      <CustomButton
                        btnText={<span>Create free Account &rarr;</span>}
                        action={() => onJoin ? onJoin() : navigate('/login')}
                        className="bg-[#001243] text-white !rounded-full px-6 py-2.5 !h-10 text-[15px] Livvic-Bold font-black w-fit"
                        isLoading={isSubmitting}
                      />
                    </div>
                  </div>
                </>
              ) : (
                renderFindAMatchCard(match)
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
};

export default JoinNowMatchesScreen;
