import MatchCard, { convertChatMatchToMatchCardProps, convertRealProfileToMatchCardProps } from '../NannyShare/Onboarding/MatchCard';
import CustomButton from '../Button';

const LandingMatchesCarousel = ({
  matches = [],
  onJoin,
  isSubmitting,
  isComplete,
  cityStatus,
}) => {
  if (!isComplete) return null;

  const isWaitlist = cityStatus === "waitlist";
  const visible = (matches || []).slice(0, 3);

  const renderProfile = (match, idx) => {
    const matchProps = match.props
      ? convertChatMatchToMatchCardProps(match, idx)
      : convertRealProfileToMatchCardProps(match, match.type || match.userType, idx);
    return <MatchCard match={matchProps} isInteractive={false} compact />;
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {visible.map((match, idx) => (
          <div key={match._id || match.userId?._id || idx}>{renderProfile(match, idx)}</div>
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
