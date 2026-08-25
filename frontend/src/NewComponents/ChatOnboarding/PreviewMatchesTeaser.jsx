import React, { useEffect, useState } from 'react';
import CompactMatchCard from '../NannyShare/Onboarding/CompactMatchCard';
import CustomButton from '../Button';
import { api } from '../../Config/api';
import { convertChatMatchToMatchCardProps, convertRealProfileToMatchCardProps } from '../NannyShare/Onboarding/MatchCard';

function PreviewMatchesTeaser({ variant = 'family', isComplete = false, matches = [], onJoin, isSubmitting }) {
    const [previewMatches, setPreviewMatches] = useState([]);

    useEffect(() => {
        if (!isComplete) {
            // Fetch generic preview using a proxy set of answers
            const genericAnswers = {
                role: variant === 'caregiver' ? 'Nanny' : 'Family',
                fullName: 'Preview User',
                email: 'preview@famlink.com',
                location: { city: 'Oakland', state: 'CA', lat: 37.8044, lng: -122.2712 },
                alreadyHaveNanny: 'No',
                childAges: '1',
                careNeeded: 'Full-time',
                nannySituation: "I'm looking for a nanny share position"
            };

            api.post("/landing/matches", { answers: genericAnswers })
                .then(({ data }) => {
                    setPreviewMatches(data.profiles || []);
                })
                .catch(err => console.error("Error fetching generic previews:", err));
        }
    }, [isComplete, variant]);

    const displayMatches = isComplete ? matches : previewMatches;
    const visibleCards = (displayMatches || []).slice(0, 3);

    const renderProfile = (match, idx) => {
        if (!match) {
            return (
                <div key={`empty-${idx}`} className="bg-white border border-[#ECECEC] rounded-2xl flex items-center gap-4 px-4 py-3 min-w-[280px] w-full max-w-[320px] shadow-sm opacity-50 blur-[2px]">
                    <div className="w-[60px] h-[60px] bg-[#E8EFFF] rounded-[14px]"></div>
                    <div className="flex flex-col gap-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                </div>
            );
        }

        const matchProps = match.props
            ? convertChatMatchToMatchCardProps(match, idx)
            : convertRealProfileToMatchCardProps(match, match.type || match.userType, idx);
        return <CompactMatchCard key={matchProps.id || idx} match={matchProps} />;
    };

    if (isComplete) {
        return (
            <div className="mx-4 md:mx-8 lg:mx-12 bg-[#E8EFFF] py-10 px-4 rounded-[30px] md:rounded-[40px] mt-4 mb-8 flex flex-col items-center">
                <div className="max-w-[1050px] w-full mx-auto flex flex-col items-center text-center">
                    <p className="text-[#001243] text-[16px] font-medium leading-[1.5] Livvic-Medium mb-6 max-w-[500px]">
                        Your answers are saved. Create an account to learn more about nanny share.
                    </p>

                    {visibleCards.length > 0 && (
                        <>
                            <h2 className="text-[#001243] text-[18px] sm:text-[20px] font-black Livvic-Bold mb-6">
                                ⭐ Potential Matches Preview
                            </h2>

                            <div className="w-full overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                <div className="flex flex-row gap-4 [justify-content:safe_center] w-full px-4 sm:px-0">
                                    {visibleCards.map((match, idx) => (
                                        <div key={idx} className="snap-center sm:snap-align-none shrink-0 w-[300px] sm:w-[320px]">
                                            {renderProfile(match, idx)}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <p className="text-[#001243] text-[16px] font-medium leading-[1.5] Livvic-Medium mt-2 mb-6">
                                Unlock your personalized matches.
                            </p>
                        </>
                    )}

                    <CustomButton
                        btnText="Create a Free Account"
                        action={() => onJoin?.()}
                        className="bg-[#001243] text-white !rounded-full px-8 py-3 !h-auto text-[16px] Livvic-Bold w-fit shadow-md hover:shadow-lg transition-shadow"
                        isLoading={isSubmitting}
                    />
                </div>
            </div>
        );
    }

    // !isComplete State
    return (
        <div className="w-full max-w-[1050px] mx-auto mt-4 px-2 flex flex-col items-center">
            <h2 className="text-[#001243] text-[16px] sm:text-[18px] font-black Livvic-Bold mb-5 text-center">
                ⭐ See who's on FamLink
                <span className="block text-[14px] font-medium text-gray-500 mt-1">
                    Complete questions above to unlock potential matches
                </span>
            </h2>

            <div className="w-full overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 pointer-events-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="flex flex-row gap-4 [justify-content:safe_center] w-full px-4 sm:px-0">
                    {visibleCards.map((match, idx) => (
                        <div key={idx} className="snap-center sm:snap-align-none shrink-0 w-[300px] sm:w-[320px]">
                            {renderProfile(match, idx)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default PreviewMatchesTeaser;
