import { FamilyProfile, NannyProfile } from '../../Components/subComponents/profileCard';
import CustomButton from '../Button';
import {
  formatPlacedNannySharedRate,
  formatPlacedNannySoloRate,
  formatSharedRate,
  formatSoloRate,
  isBrowseReadyProfile,
} from '../../Config/helpFunction';

const childrenCountOf = (profile) => {
  if (profile.numberOfChildren !== undefined) return profile.numberOfChildren;
  let childrenObj = profile.userId?.noOfChildren;
  if (typeof childrenObj === 'string') {
    try { childrenObj = JSON.parse(childrenObj); } catch (e) { /* ignore */ }
  }
  return childrenObj?.length || 0;
};

export const isCompletedShare = (match) => match?.props || isBrowseReadyProfile(match);

export const renderFindAMatchCard = (match, { teaser = true, isSlim = false, displayOnly = false } = {}) => {
  if (match?.props) {
    return match.type === 'Family'
      ? <FamilyProfile {...match.props} isTeaser={displayOnly ? false : teaser} isSlim={displayOnly ? false : isSlim} isDisplayOnly={displayOnly} />
      : <NannyProfile {...match.props} isTeaser={displayOnly ? false : teaser} isSlim={displayOnly ? false : isSlim} isDisplayOnly={displayOnly} />;
  }

  const user = match.userId && typeof match.userId === 'object' ? match.userId : match;
  const isFamily = (match.userType || user.type) === 'Parents' || match.type === 'Family';
  const id = user._id || match._id;
  const sharedProps = {
    id,
    userId: user._id,
    name: user.name,
    img: user.imageUrl || match.imageFile,
    location: user.location,
    schedule: match.specificDays,
    start: match.nannyshareStart || match.startAvailability,
    isTeaser: displayOnly ? false : teaser,
    isSlim: displayOnly ? false : isSlim,
    isDisplayOnly: displayOnly,
  };

  if (isFamily) {
    return (
      <FamilyProfile
        {...sharedProps}
        hasNanny={match.hasNanny}
        careType={match.nannyShareType}
        hosting={match.hostingPreference}
        sharedRate={formatSharedRate(match.hourlyBudget) || 'N/A'}
        soloRate={formatSoloRate(match.hourlyBudget) || 'N/A'}
        ages={match.childrenAges?.length > 0 ? match.childrenAges.map((age) => age.label) : []}
        childrenCount={childrenCountOf(match)}
      />
    );
  }

  return (
    <NannyProfile
      {...sharedProps}
      hasFamily={match.hasFamily}
      careType={match.careType || match.currentSchedule}
      experience={match.careExperience}
      whereCare={match.whereCare}
      preferredAges={match.preferredAges}
      sharedRate={match.hasFamily ? formatPlacedNannySharedRate(match) : match.sharedRate}
      soloRate={match.hasFamily ? formatPlacedNannySoloRate(match) : match.soloRate}
      ages={!match.hasFamily
        ? (match.preferredAges?.length > 0 ? match.preferredAges.map((age) => age.label) : [])
        : (match.childrenAges?.length > 0 ? match.childrenAges.map((age) => age.label) : [])}
      childrenCount={childrenCountOf(match)}
    />
  );
};

const LandingMatchesCarousel = ({
  matches = [],
  onJoin,
  isSubmitting,
  isComplete,
  cityStatus,
}) => {
  if (!isComplete) return null;

  const isWaitlist = cityStatus === 'waitlist';
  const visible = (matches || []).filter(isCompletedShare).slice(0, 3);

  if (isWaitlist || visible.length === 0) {
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
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className="text-[#AEC4FF] text-xl">✦</span>
        <h2 className="text-[#001243] font-black Livvic-Bold text-lg">Potential Matches Preview</h2>
      </div>
      <div className="flex flex-col gap-4">
        {visible.map((match, idx) => (
          <div key={match._id || match.userId?._id || idx}>
            {renderFindAMatchCard(match)}
          </div>
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
