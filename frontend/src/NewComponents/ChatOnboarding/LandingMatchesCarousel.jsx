import MatchCard, { convertChatMatchToMatchCardProps, convertRealProfileToMatchCardProps } from '../NannyShare/Onboarding/MatchCard';
import CustomButton from '../Button';

function LockedCard() {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#E8ECF4] min-h-[120px] bg-[#F4F6FB]">
      <div className="blur-md pointer-events-none select-none p-4 opacity-60" aria-hidden>
        <div className="h-12 w-12 rounded-xl bg-[#C8D8FF] mb-3" />
        <div className="h-4 w-40 bg-[#C8D8FF] rounded mb-2" />
        <div className="h-3 w-56 bg-[#E8ECF4] rounded" />
      </div>
      <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
        <span className="Livvic-Bold text-sm text-[#001243]">Locked</span>
      </div>
    </div>
  );
}

const LandingMatchesCarousel = ({
  matches = [],
  onJoin,
  isSubmitting,
  isComplete,
  cityStatus,
}) => {
  if (!isComplete) return null;

  const isWaitlist = cityStatus === "waitlist";
  const visible = (matches || []).slice(0, 2);
  const lockedCount = 1;

  const renderProfile = (match, idx) => {
    const matchProps = match.props
      ? convertChatMatchToMatchCardProps(match, idx)
      : convertRealProfileToMatchCardProps(match, match.type || match.userType, idx);
    return <MatchCard match={matchProps} isInteractive={false} />;
  };

  if (isWaitlist) {
    return (
      <div className="w-full max-w-[850px] mx-auto mt-6 px-2 flex flex-col items-center text-center">
        <CustomButton
          btnText="Create a Free Account"
          action={() => onJoin?.()}
          className="bg-[#001243] text-white !rounded-full px-6 py-2.5 !h-10 text-[15px] Livvic-Bold w-fit"
          isLoading={isSubmitting}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[850px] mx-auto mt-8 px-2">
      <div className="flex flex-col gap-4">
        {visible.map((match, idx) => (
          <div key={match._id || match.userId?._id || idx}>{renderProfile(match, idx)}</div>
        ))}
        {Array.from({ length: lockedCount }).map((_, i) => (
          <LockedCard key={`locked-${i}`} />
        ))}
      </div>
      <div className="mt-8 flex flex-col items-center text-center">
        <CustomButton
          btnText="Create a Free Account"
          action={() => onJoin?.()}
          className="bg-[#001243] text-white !rounded-full px-6 py-2.5 !h-10 text-[15px] Livvic-Bold w-fit"
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
};

export default LandingMatchesCarousel;
