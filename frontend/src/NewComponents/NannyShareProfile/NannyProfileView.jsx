import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Baby, Bell, Briefcase, Cake, Calendar, ChevronLeft, Clock, Cloud, DollarSign, FileText, Heart, Home, Info, List, MapPin, Phone, ShieldCheck, Users } from "lucide-react";
import CustomButton from "../../NewComponents/Button";
import { fetchNannyByIdThunk } from "../../Components/Redux/nannyData";
import { addOrRemoveFavouriteThunk } from "../../Components/Redux/favouriteSlice";
import { refreshTokenThunk } from "../../Components/Redux/authSlice";
import { CompleteProfileModal } from "../CompleteProfileModal";
import { MatchRequestFormModal } from "../MatchRequestFormModal";
import { RequestMatchDenied } from "../RequestMatchDenied";
import { ReferAFriendModal } from "../ReferAFriendModal";
import { viewCurrentUserProfileThunk } from "../../Components/Redux/nannyShareSlice";
import { getMatchGate, MATCH_GATE } from "../../Config/matchGate";
import {
  flatAdditionalInfo,
  formatProfileValue,
  makeGetFallbackValue,
} from "../../Config/profileFields/formatProfileValue";
import { CONTROL, fieldsFor, groupFields, legacyFieldsFor } from "../../Config/profileFields";
import AnswerValue from "./AnswerValue";
import ProfileNotFound from "./ProfileNotFound";
import { getNannyTheme, getNannyGoal, ShareTypeLabel } from "../../Config/shareTypeTheme";
import { getMyReferralThunk } from "../../Components/Redux/referralSlice";

/* Fields kept per decision 7 belong to no wizard step, so they need a heading of
   their own. The only title on this page not taken from a wizard step. */
const LEGACY_GROUP = "Additional details";

export default function NannyProfileView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedNanny, isLoading, error } = useSelector((s) => s.nannyData);
  const { user, accessToken } = useSelector((state) => state.auth);

  // The viewer's own profile — hasFamily lives there, and it decides whether
  // this user is on the referral model or the subscription one.
  const { currentProfile } = useSelector((s) => s.postNannyShare);

  const [isMatchRequestDenied, setIsMatchRequestDenied] = React.useState(false);
  const [isReferModal, setIsReferModal] = React.useState(false);
  const [isFavorited, setIsFavorited] = React.useState(false);

  React.useEffect(() => {
    if (user?.favourite && id) {
      setIsFavorited(user.favourite.includes(id));
    }
  }, [user, id]);

  const favourite = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!id) return;
    dispatch(addOrRemoveFavouriteThunk({ favouriteUserId: id, accessToken }));
    dispatch(refreshTokenThunk());
    setIsFavorited((prev) => !prev);
  };
  const [isProfileComplete, setIsProfileComplete] = React.useState(false);
  const [senderId, setSenderId] = React.useState(null);
  const [receiverId, setReceiverId] = React.useState(null);
  const [isRequestSubmitModal, setIsRequestSubmitModal] = React.useState(false);

  const handleMatchRequest = () => {
    if (!user.nannyProfileCompleted) {
      setIsProfileComplete(true);
      return;
    }
    // Caregivers looking for a share job refer a friend instead of subscribing.
    const gate = getMatchGate(user, currentProfile);
    if (gate === MATCH_GATE.REFER) {
      setIsReferModal(true);
      return;
    }
    if (gate === MATCH_GATE.SUBSCRIBE) {
      setIsMatchRequestDenied(true);
      return;
    }
    setSenderId(user._id);
    const targetId = selectedNanny.userId?._id || selectedNanny.userId || selectedNanny._id;
    setReceiverId(targetId);
    setIsRequestSubmitModal(true);
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchNannyByIdThunk(id));
    }
  }, [dispatch, id]);

  // Both feed the match gate above. This page can be opened straight from a
  // link or an email, so currentProfile isn't guaranteed to be in the store —
  // and the referral fetch refreshes referralMatchingUntil, which otherwise
  // only updates when the access token does.
  useEffect(() => {
    dispatch(viewCurrentUserProfileThunk());
    if (user?.type === "Nanny") dispatch(getMyReferralThunk());
  }, [dispatch, user?.type]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Profile...</div>;
  }

  if (error || !selectedNanny) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg Livvic-SemiBold text-gray-800">
          {error || "We couldn't load this profile."}
        </p>
        <div className="flex gap-3">
          <CustomButton
            btnText="Try again"
            action={() => id && dispatch(fetchNannyByIdThunk(id))}
            className="bg-primary"
          />
          <CustomButton
            btnText="Go back"
            action={() => navigate(-1)}
            className="bg-white border"
          />
        </div>
      </div>
    );
  }

  /*
   * Refuse to render a family's data through a nanny's sections.
   *
   * Nothing upstream validates that the id in the URL belongs to the role this
   * page renders — both view pages read the same slice, and the caller's choice
   * of link is the only thing that decides which one loads. Four callers build
   * those links, and a single wrong one used to render every row empty with the
   * hero badge asserting the wrong role.
   *
   * Only a type that is definitely the other role is rejected, so a document
   * without one behaves exactly as before.
   */
  if (selectedNanny.type === "Parents") return <ProfileNotFound expected="nanny" />;

  // Map backend data to layout
  const profile = selectedNanny?.nannyProfile || {};

  const formatLocation = () => {
    const parts = selectedNanny?.location?.format_location?.split(",") || [];
    const city = parts.at(-3)?.trim();
    const state = parts.at(-2)?.trim().split(" ")[0];
    return city && state ? `${city}, ${state}` : selectedNanny?.location?.format_location || "Location not specified";
  };

  const additionalInfoBio = selectedNanny?.additionalInfo?.find(info => info.key === "jobDescription")?.value;
  const bioSource = [profile.bio, additionalInfoBio, selectedNanny.aboutMe].find(
    (v) => typeof v === "string" && v.trim(),
  );

  const rateLabel = profile.rateType === "hourly" ? "hr" : profile.rateType || "hr";

  const formattedSharedRate = profile.sharedRate
    ? `$${profile.sharedRate}/${rateLabel}`
    : "Rate not specified";

  const formattedSoloRate = profile.soloRate
    ? `~$${profile.soloRate}/${rateLabel} per family`
    : "";

  const formatName = (fullName) => {
    if (!fullName) return "";
    const parts = fullName.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "";

    const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();

    if (parts.length > 1) {
      const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
      return `${firstName} ${lastInitial}.`;
    }
    return firstName;
  };

  /*
   * Keys this page asks for that older documents filed under an intake name in
   * additionalInfo. Read by the shared resolver as its last lookup.
   */
  const INFO_ALIASES = {
    careType: "avaiForWorking",
    startAvailability: "availability",
    careExperience: "experience",
    languages: "language",
  };

  const infoList = flatAdditionalInfo(selectedNanny?.additionalInfo);

  const resolve = makeGetFallbackValue({
    profile,
    additionalInfo: infoList,
    infoAliases: INFO_ALIASES,
  });

  /*
   * Certifications are read, not inferred.
   *
   * Four rows here used to be DERIVED by substring-scanning the stored list
   * and additionalDetails for a phrase, and rendering Yes or No. That is worse
   * than a blank row: the mirror questionnaire's certification question
   * deliberately offers neither ECE nor TrustLine, so every nanny who took it
   * was shown asserting "No" to two questions nobody had asked her — a wrong
   * answer attributed to her, in front of the families reading her profile.
   * The free-text answer, meanwhile, displayed nowhere at all.
   *
   * The row now shows what she actually selected, with her own free text on its
   * own line beneath it, and each path offers only its own list.
   */
  const getFallbackValue = resolve;

  const formatValue = (key, val) => formatProfileValue(key, val, { getFallbackValue });

  const hasShareExp = formatValue('shareExperience', getFallbackValue('shareExperience'));
  const hasMultiExp = formatValue('multiFamilyComfort', getFallbackValue('multiFamilyComfort'));
  const hasTransp = formatValue('hasTransport', getFallbackValue('hasTransport'));
  const hasBgCheck = formatValue('backgroundCheck', getFallbackValue('backgroundCheck'));
  const workSetupVal = formatValue('workSetup', getFallbackValue('workSetup'));
  const childrenCap = formatValue('childrenCapacity', getFallbackValue('childrenCapacity'));

  const nanny = {
    name: formatName(selectedNanny.name),
    goal: selectedNanny.goal || "Looking for a family",
    experience: formatValue('careExperience', getFallbackValue('careExperience')) || "Experience not specified",
    /* The children already in her care for one path, the age bands she prefers
       for the other — the same distinction the two questionnaires draw. */
    ages: (profile.hasFamily
      ? formatValue('childrenAges', getFallbackValue('childrenAges'))
      : formatValue('preferredAges', getFallbackValue('preferredAges'))) || "Ages not specified",
    schedule: formatValue('careType', getFallbackValue('careType')) || "Schedule not specified",
    location: formatLocation(),
    sharedRate: formattedSharedRate,
    soloRate: formattedSoloRate,
    availability: formatValue('startAvailability', getFallbackValue('startAvailability')) || "Availability not specified",
    bio: bioSource || "No bio provided.",
    img: selectedNanny.imageUrl || profile.imageFile,
    certifications: profile.certifications || [],
    compatibility: [
      hasShareExp === "Yes" ? "Has Share Experience" : null,
      hasMultiExp === "Yes" ? "Comfortable with Multiple Families" : null,
      hasTransp === "Yes" ? "Has Transportation" : null,
      hasBgCheck === "Yes" ? "Background Checked" : null,
      workSetupVal ? `Work Setup: ${workSetupVal}` : null,
      childrenCap ? `Capacity: ${childrenCap}` : null
    ].filter(Boolean)
  };

  /*
   * hasFamily is the schema-required Boolean the card badge, the browse filter
   * and the shared theme all key off, so the sections shown here are driven by
   * the same source rather than by a match on the free-text goal string — that
   * way the "With a family" tag and the sections under it can never disagree.
   */
  const isFamilyNanny = !!profile?.hasFamily;

  /*
   * The rows, and their order, come from whichever questionnaire this nanny
   * actually took, grouped by the step each question is asked on.
   *
   * This replaces six hand-written groups that showed Flow 1's questions to
   * everyone and then filtered a few of them back out per role. The filtering
   * was the tell: a nanny already working with a family had blank job-seeker
   * rows on her profile while fifteen answers she had actually given were
   * nowhere on the page.
   *
   * The old JOB_SEEKER_SCHEDULE_KEYS filter is gone because it is no longer
   * needed, not because its intent changed: shareExperience,
   * multiFamilyComfort and workSetup are simply not in the other flow's
   * manifest. Same for specificDays, which only one questionnaire collects.
   */
  const fields = fieldsFor({ isNanny: true, hasFamily: isFamilyNanny });
  const legacyFields = legacyFieldsFor({ isNanny: true, hasFamily: isFamilyNanny });

  /* Per-question icons, mirroring the ones each QuestionBlock uses in the
     wizard's own steps/ files, so the two screens read as one design. */
  const ROW_ICONS = {
    shareExperience: Users, multiFamilyComfort: Home, careExperience: Briefcase,
    childrenCapacity: Baby, preferredAges: Cake, workSetup: Home,
    specificDays: Clock, startAvailability: Calendar,
    responsibilities: Briefcase, householdHelp: Home,
    hasTransport: MapPin, backgroundCheck: ShieldCheck,
    sharedRate: DollarSign, languages: Users, certifications: ShieldCheck,
    customCertifications: ShieldCheck, skills: FileText,
    bio: FileText, imageFile: Info,

    forWho: Users, numberOfChildren: Baby, agesCare: Cake,
    currentSchedule: Clock, joinTiming: Calendar, together: Home,
    openToChildren: Baby, whereCare: Home, flexibility: Clock,
    matchDistance: MapPin, matchFit: Cake, schoolDaycare: Bell,
    allergies: Info, typicalDay: Clock, routinesPreferences: FileText,
    expectations: FileText, communicationPreference: Phone,
    matchMattersMost: Heart, hasPets: Home, okayWithPets: Home,
    openNotes: FileText,

    careType: Clock, careDistance: MapPin, ageGroupsExp: Users,
    salaryExp: Briefcase,
  };

  const GROUP_ICONS = {
    "Share Fit": Users,
    Availability: Calendar,
    "Role Details": Briefcase,
    "Rate & Skills": DollarSign,
    Profile: FileText,

    "Current Setup": Users,
    "Share Details": Home,
    "Children & Routine": Baby,
    Expectations: Cloud,
    "Home & Profile": Home,

    [LEGACY_GROUP]: Info,
  };

  /* Photo lives on the hero; the wizard question is not repeated as a row. */
  const groupedDetails = [
    ...groupFields(fields.filter((f) => f.control !== CONTROL.PHOTO)),
    /* Kept per decision 7: no questionnaire writes these any more, but real
       profiles hold them and dropping the rows would hide answers people gave.
       careType is the one that matters most here — this flow never writes it,
       but the chat intake and the caregiver funnel both do. */
    ...(legacyFields.length ? [{ title: LEGACY_GROUP, items: legacyFields }] : []),
  ];

  const renderGroups = groupedDetails.map((group, gIndex) => {
    const GroupIcon = GROUP_ICONS[group.title] || Info;

    return (
      <div key={gIndex} className="bg-white rounded-[16px] border border-[#EAEAEA] shadow-sm mb-4 overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-[#EAEAEA] bg-[#FAFCFF]">
          <div className="w-9 h-9 rounded-full bg-[#F3F5FC] flex items-center justify-center shrink-0">
            <GroupIcon className="w-5 h-5 text-[#304B9E]" />
          </div>
          <h4 className="text-[17px] Livvic-Bold text-[#0D134C]">{group.title}</h4>
        </div>
        <div className="flex flex-col px-5">
          {group.items.map((field, iIndex) => {
            const RowIcon = ROW_ICONS[field.dbKey] || Info;

            return (
              <div key={field.dbKey} className={`flex flex-col sm:flex-row sm:items-start py-4 ${iIndex !== group.items.length - 1 ? 'border-b border-[#F4F4F5]' : ''}`}>
                <div className="flex items-start gap-3 w-full sm:w-[280px] shrink-0 mb-2 sm:mb-0">
                  <div className="w-8 h-8 rounded-full bg-transparent border border-[#EAEAEA] flex items-center justify-center shrink-0">
                    <RowIcon className="w-4 h-4 text-[#6B7CC3]" />
                  </div>
                  <span className="text-[14px] Livvic-Medium text-[#64748B] pt-1.5">{field.label}</span>
                </div>
                <div className="Livvic-SemiBold text-[#1E293B] text-[15px] sm:ml-4 min-w-0 flex-1">
                  <AnswerValue
                    field={field}
                    value={getFallbackValue(field.dbKey)}
                    resolve={getFallbackValue}
                    empty={<span className="text-[#A1A1AA] italic font-normal text-[14px]">No details provided</span>}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  });

  return (
    <div className="min-h-screen pb-20">
      {isRequestSubmitModal && (
        <MatchRequestFormModal
          setIsRequestSubmitModal={setIsRequestSubmitModal}
          senderId={senderId}
          receiverId={receiverId}
          onReferralRequired={() => setIsReferModal(true)}
        />
      )}
      {isProfileComplete && <CompleteProfileModal setIsProfileComplete={setIsProfileComplete} />}
      {isMatchRequestDenied && <RequestMatchDenied setIsMatchRequestDenied={setIsMatchRequestDenied} />}
      {isReferModal && <ReferAFriendModal onClose={() => setIsReferModal(false)} />}

      {/* Header */}
      <div className="bg-white border-b border-[#EAEAEA] sticky top-0 z-10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#555555] hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
          >
            <ChevronLeft size={20} />
            <span className="Livvic-SemiBold text-sm sm:text-base">Back to Search</span>
          </button>
          <div className="flex gap-3">
            <button onClick={favourite} className="p-2 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-colors border-none cursor-pointer">
              <Heart size={20} className={isFavorited ? "text-red-500 fill-red-500" : "text-[#555555]"} />
            </button>
            <button onClick={handleMatchRequest} className="bg-[#AEC4FF] text-[#0D134C] px-6 py-2 rounded-xl Livvic-SemiBold text-sm sm:text-base hover:bg-[#C1D6FF] transition-colors border-none cursor-pointer">
              Request a Match
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left Column - Main Info */}
          <div className="flex-1 space-y-6">

            {/* Hero Card */}
            <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#EAEAEA] shadow-sm">
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                {nanny.img ? (
                  <img
                    src={nanny.img}
                    alt={nanny.name}
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover shadow-sm shrink-0"
                  />
                ) : (
                  <div className="shrink-0">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl shadow-sm bg-[#AEC4FF] flex items-center justify-center text-[#0D134C] Livvic-SemiBold text-5xl">
                      {nanny.name ? nanny.name.charAt(0).toUpperCase() : ""}
                    </div>
                  </div>
                )}
                <div className="flex-1">
                  {/* Same themed "Role • Goal" pill as the profile card — colors
                      and wording come from the shared shareTypeTheme, keyed off
                      hasFamily, so the details page reads identically to the card
                      (green "With a family, Looking to share" for a family-nanny,
                      orange "Looking for a share position" otherwise) instead of
                      the raw backend goal string in a fixed orange. */}
                  <div
                    style={{ backgroundColor: getNannyTheme(profile.hasFamily).bg, color: getNannyTheme(profile.hasFamily).text }}
                    className="inline-flex items-center gap-1.5 font-bold Livvic-Bold rounded-full px-3 py-1 text-xs sm:text-sm mb-3"
                  >
                    <Users size={14} />
                    <ShareTypeLabel role="Nanny" goal={getNannyGoal(profile.hasFamily)} />
                  </div>
                  <h1 className="text-3xl sm:text-4xl Livvic-Bold text-[#0D134C] mb-2">
                    {nanny.name}
                  </h1>
                  <p className="text-[#555555] text-lg Livvic-Medium flex items-center gap-2">
                    <MapPin size={18} /> {nanny.location}
                  </p>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#EAEAEA] shadow-sm">
              <h2 className="text-2xl Livvic-SemiBold text-[#0D134C] mb-4">About the Nanny</h2>
              <p className="text-[#555555] leading-relaxed text-base sm:text-lg">
                {nanny.bio}
              </p>

            </div>

            {/* Profile Details Section */}
            <div className="mt-12">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-[#F3F5FC] flex items-center justify-center shrink-0">
                    <List className="w-6 h-6 text-[#304B9E]" />
                  </div>
                  <h3 className="text-[24px] Livvic-Bold text-[#0D134C]">Profile Details</h3>
                </div>
                <p className="text-[#64748B] text-[15px] Livvic-Regular sm:ml-[60px]">Review the information you've provided for matching and share compatibility.</p>
              </div>

              {renderGroups}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
