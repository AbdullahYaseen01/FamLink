import React, { useEffect, useState, useRef } from 'react';
import CompactMatchCard from '../NannyShare/Onboarding/CompactMatchCard';
import CustomButton from '../Button';
import { api } from '../../Config/api';
import { convertChatMatchToMatchCardProps, convertRealProfileToMatchCardProps } from '../NannyShare/Onboarding/MatchCard';
import { FamilyProfile, NannyProfile } from '../../Components/subComponents/profileCard';

const STATIC_PROFILES = [
    {
        _id: "static_1",
        isStaticCard: true,
        type: "Family",
        name: "Sarah M.",
        hasNanny: false,
        childrenCount: 2,
        ages: ["2 Years", "4 Years"],
        scheduleDetail: "Mon-Fri",
        schedule: "Full-Time",
        location: { city: "Rockridge" },
        hosting: "Your home",
        start: "September 1, 2026",
        sharedRate: "~$18 - $22/hr per family",
        soloRate: "~$18 - $22/hr per family"
    },
    {
        _id: "static_2",
        isStaticCard: true,
        type: "Family",
        name: "Alex W.",
        hasNanny: true,
        childrenCount: 1,
        ages: ["1 Years"],
        scheduleDetail: "Mon-Fri",
        schedule: "Full-Time",
        location: { city: "San Francisco" },
        hosting: "Flexible",
        start: "October 1, 2026",
        sharedRate: "~$19 - $23/hr per family",
        soloRate: "~$19 - $23/hr per family"
    },
    {
        _id: "static_3",
        isStaticCard: true,
        type: "Nanny",
        name: "Erin H.",
        hasFamily: false,
        experience: "Over 5 years experience",
        scheduleDetail: "Flexible",
        schedule: "Full-Time",
        location: { city: "Oakland" },
        hosting: "N/A",
        start: "Flexible",
        sharedRate: "$35 - $40/hr",
        soloRate: "$35 - $40/hr"
    },
    {
        _id: "static_4",
        isStaticCard: true,
        type: "Nanny",
        name: "Bailey D.",
        hasFamily: true,
        experience: "3 years experience",
        scheduleDetail: "Tue, Thu",
        schedule: "Part-Time",
        location: { city: "Berkeley" },
        hosting: "N/A",
        start: "August 15, 2026",
        sharedRate: "$30 - $35/hr",
        soloRate: "$30 - $35/hr"
    }
];

function PreviewMatchesTeaser({ variant = 'family', isComplete = false, matches = [], onJoin, isSubmitting }) {
    const [previewMatches, setPreviewMatches] = useState([]);

    // For the vertical ticker animation
    const [tickerCards, setTickerCards] = useState([]);
    const [isAnimating, setIsAnimating] = useState(false);
    // Adjusted card height for full detailed cards (not slim).
    const CARD_HEIGHT = 150;
    const CARD_GAP = 16;
    const slideDistance = CARD_HEIGHT + CARD_GAP;

    useEffect(() => {
        if (!isComplete) {
            // Instead of an API call, we use the hardcoded static profiles.
            setPreviewMatches(STATIC_PROFILES);
            setTickerCards(STATIC_PROFILES);
        }
    }, [isComplete, variant]);

    // Setup Ticker Interval
    useEffect(() => {
        if (isComplete || tickerCards.length < 2) return;

        const interval = setInterval(() => {
            setIsAnimating(true);

            setTimeout(() => {
                setIsAnimating(false);
                setTickerCards(prev => {
                    const next = [...prev];
                    const first = next.shift();
                    next.push(first);
                    return next;
                });
            }, 600); // Wait for transition to complete
        }, 5000);

        return () => clearInterval(interval);
    }, [isComplete, tickerCards.length]);

    const displayMatches = isComplete ? matches : previewMatches;
    const visibleCards = (displayMatches || []).slice(0, 3);

    const renderCompactProfile = (match, idx) => {
        if (!match) return renderEmptyPlaceholder(idx);

        // Safety check for static cards falling into this path
        if (match.isStaticCard) return renderEmptyPlaceholder(idx);

        const matchProps = match.props
            ? convertChatMatchToMatchCardProps(match, idx)
            : convertRealProfileToMatchCardProps(match, match.type || match.userType, idx);
        return <CompactMatchCard key={matchProps.id || idx} match={matchProps} />;
    };

    const renderDetailedProfile = (match, idx) => {
        if (!match) return renderEmptyPlaceholder(idx);

        // Map static props directly if it's our hardcoded array
        if (match.isStaticCard) {
            const commonProps = {
                key: match._id,
                id: match._id,
                name: match.name,
                careType: match.schedule,
                schedule: match.scheduleDetail,
                location: match.location,
                hosting: match.hosting,
                whereCare: match.hosting,
                start: match.start,
                sharedRate: match.sharedRate,
                soloRate: match.soloRate,
                isSlim: false, // Must be FALSE to show full details!
                isTeaser: true
            };

            if (match.type === "Family") {
                return (
                    <div className="h-[150px] w-full">
                        <FamilyProfile
                            {...commonProps}
                            childrenCount={match.childrenCount}
                            ages={match.ages}
                            hasNanny={match.hasNanny}
                        />
                    </div>
                );
            } else {
                return (
                    <div className="h-[150px] w-full">
                        <NannyProfile
                            {...commonProps}
                            experience={match.experience}
                            hasFamily={match.hasFamily}
                        />
                    </div>
                );
            }
        }

        // Fallback for non-static if needed (though it shouldn't happen here)
        return renderEmptyPlaceholder(idx);
    };

    const renderEmptyPlaceholder = (idx) => (
        <div key={`empty-${idx}`} className="bg-white border border-[#ECECEC] rounded-2xl flex items-center gap-4 px-4 py-3 min-w-[280px] w-full max-w-[320px] shadow-sm opacity-50 blur-[2px]">
            <div className="w-[60px] h-[60px] bg-[#E8EFFF] rounded-[14px]"></div>
            <div className="flex flex-col gap-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
        </div>
    );

    // ==========================================
    // isComplete = TRUE ("Potential Matches Preview")
    // ==========================================
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
                                            {renderCompactProfile(match, idx)}
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

    // ==========================================
    // isComplete = FALSE ("See who's on FamLink")
    // ==========================================
    return (
        <div className="w-full max-w-[700px] mx-auto mt-4 px-2 flex flex-col items-center pointer-events-none">
            <h2 className="text-[#001243] text-[16px] sm:text-[18px] font-black Livvic-Bold mb-5 text-center">
                ⭐ See who's on FamLink
                <span className="block text-[14px] font-medium text-gray-500 mt-1">
                    Complete questions above to unlock potential matches
                </span>
            </h2>

            {tickerCards.length > 0 ? (
                <div
                    className="w-full overflow-hidden"
                    style={{ height: `${(CARD_HEIGHT * 2) + CARD_GAP}px` }}
                >
                    <div
                        className={`flex flex-col gap-4 w-full transform ${isAnimating ? 'transition-transform duration-500 ease-in-out' : ''}`}
                        style={{ transform: isAnimating ? `translateY(-${slideDistance}px)` : 'translateY(0)' }}
                    >
                        {tickerCards.map((match, idx) => (
                            <div key={`${match._id}-${idx}`} className="w-full shrink-0">
                                {renderDetailedProfile(match, idx)}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4 w-full">
                    {renderEmptyPlaceholder(0)}
                    {renderEmptyPlaceholder(1)}
                </div>
            )}

            <div className="h-[40px]" /> {/* Spacer at the bottom */}
        </div>
    );
}

export default PreviewMatchesTeaser;

