import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Activity, Baby, BookOpen, Calendar, CheckSquare, ChevronLeft, Clock, Cloud, DollarSign, Dog, FileText, Heart, HeartPulse, Home, Image, Info, List, MapPin, MessageSquare, Phone, Sun, User, Users } from "lucide-react";
import CustomButton from "../../NewComponents/Button";
import { fetchNannyByIdThunk } from "../../Components/Redux/nannyData";
import { addOrRemoveFavouriteThunk } from "../../Components/Redux/favouriteSlice";
import { refreshTokenThunk } from "../../Components/Redux/authSlice";
import { CompleteProfileModal } from "../CompleteProfileModal";
import { MatchRequestFormModal } from "../MatchRequestFormModal";
import { RequestMatchDenied } from "../RequestMatchDenied";
import { ReferAFriendModal } from "../ReferAFriendModal";
import { viewCurrentUserProfileThunk } from "../../Components/Redux/nannyShareSlice";
import { getMatchGate, MATCH_GATE, hasUpgradedCardAccess } from "../../Config/matchGate";
import { formatStartDate, formatSharedRate, formatSoloRate } from "../../Config/helpFunction";
import {
  flatAdditionalInfo,
  formatProfileValue,
  makeGetFallbackValue,
} from "../../Config/profileFields/formatProfileValue";
import { CONTROL, FAMILY_FIELDS, FAMILY_LEGACY_FIELDS, groupFields } from "../../Config/profileFields";
import AnswerValue from "./AnswerValue";
import ProfileNotFound from "./ProfileNotFound";

/* Fields kept per decision 7 belong to no wizard step, so they need a heading
   of their own. The only title on this page not taken from a wizard step. */
const LEGACY_GROUP = "Additional details";
import { getFamilyTheme, getFamilyGoal, ShareTypeLabel } from "../../Config/shareTypeTheme";
import { getMyReferralThunk } from "../../Components/Redux/referralSlice";

export default function FamilyProfileView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedNanny, isLoading } = useSelector((s) => s.nannyData);
  const { user, accessToken } = useSelector((state) => state.auth);
  const subscription = useSelector((state) => state.cardData?.subscriptionStatus);
  const referral = useSelector((state) => state.referral);
  const canViewDetails = hasUpgradedCardAccess(user, subscription, referral);

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

  useEffect(() => {
    if (user && !canViewDetails) navigate("/dashboard", { replace: true });
  }, [user, canViewDetails, navigate]);

  if (user && !canViewDetails) {
    return null;
  }

  if (isLoading || !selectedNanny) {
    return <div className="min-h-screen flex items-center justify-center">Loading Profile...</div>;
  }

  /* The mirror of the check in NannyProfileView — see the comment there. */
  if (selectedNanny.type === "Nanny") return <ProfileNotFound expected="family" />;

  // Map backend data to our premium layout
  const profile = selectedNanny?.nannyProfile || {};

  const formatLocation = () => {
    const parts = selectedNanny?.location?.format_location?.split(",") || [];
    const city = parts.at(-3)?.trim();
    const state = parts.at(-2)?.trim().split(" ")[0];
    return city && state ? `${city}, ${state}` : selectedNanny?.location?.format_location || "Location not specified";
  };

  // Prefer the per-family split — it's the number a reader is deciding on — and
  // fall back to the combined rate. Both go through the shared formatter, which
  // is what keeps a legacy "$20 - $undefined per hour" record from printing
  // here verbatim; this used to hand any string straight through.
  const budgetStr =
    formatSharedRate(profile.hourlyBudget) ||
    formatSoloRate(profile.hourlyBudget) ||
    "Budget not specified";

  const childrenCount = profile.numberOfChildren !== undefined && profile.numberOfChildren !== null
    ? profile.numberOfChildren
    : selectedNanny?.noOfChildren?.length;

  const childrenStr = childrenCount !== undefined && childrenCount !== null
    ? `${childrenCount} Child${childrenCount === 1 ? '' : 'ren'}`
    : "Children count not specified";

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
   * Keys the manifest asks for that sheet-imported profiles filed under an
   * intake name in additionalInfo.
   *
   * The direction is the reverse of what this page used to carry. It asked for
   * "flexible" and "hosting" and mapped those onto the profile fields; the rows
   * now come from the manifest, which uses the schema names, so what is left to
   * translate is the legacy additionalInfo key.
   */
  const INFO_ALIASES = {
    flexibility: "flexible",
    hostingPreference: "hosting",
    communicationPreference: "prefferedCommunication",
    backupCare: "backupAvailable",
    specificDays: "specificDaysAndTime",
  };

  /* Which question's "Other" free text belongs to which answer. AnswerValue
     gives it its own labelled line; the hero summary below still appends it. */
  const SPECIFY_KEYS = {
    parentingStyle: "parentingStyleSpecify",
    houseRules: "houseRulesSpecify",
    pets: "petsSpecify",
    allergiesHealth: "allergiesHealthSpecify",
    communicationPreference: "communicationSpecify",
    backupCare: "backupCareSpecify",
    childResponsibilities: "childResponsibilitiesSpecify",
  };

  const getFallbackValue = makeGetFallbackValue({
    profile,
    additionalInfo: flatAdditionalInfo(selectedNanny?.additionalInfo),
    infoAliases: INFO_ALIASES,
  });

  /* Still used by the hero summary, which reads answers into sentences rather
     than rows. The rows themselves go through AnswerValue. */
  const formatValue = (key, val) =>
    formatProfileValue(key, val, {
      getFallbackValue,
      specifyFor: (k) => SPECIFY_KEYS[k] || null,
    });

  const flexVal = formatValue('flexibility', getFallbackValue('flexibility'));
  const urgVal = formatValue('urgency', getFallbackValue('urgency'));
  const commVal = formatValue('communicationPreference', getFallbackValue('communicationPreference'));

  const family = {
    name: formatName(selectedNanny.name),
    goal: selectedNanny.goal || "Looking for a nanny share",
    children: childrenStr,
    schedule: profile.nannyShareType || "Schedule not specified",
    location: formatLocation(),
    budget: budgetStr,
    startDate: formatStartDate(profile.nannyshareStart) || "Flexible",
    bio: selectedNanny.aboutMe || profile.careDescription || profile.openNotes || "No bio provided.",
    img: selectedNanny.imageUrl || profile.imageFile,
    preferences: [
      profile.hasNanny ? "Already have a nanny" : "Looking for a nanny",
      flexVal || "Schedule flexibility not specified",
      urgVal || "Urgency not specified",
      commVal || "Communication preference not specified"
    ].filter(Boolean)
  };

  /*
   * The rows, and their order, come from FAMILY_FIELDS — one entry per question
   * the family wizard asks, grouped by the step it is asked on.
   *
   * The six hand-written group titles this replaces ("Family & Care Needs",
   * "Share Preferences", "Schedule & Timing", "Care Expectations", "Household &
   * Environment", "Communication & Backup") each spanned two to four wizard
   * steps, so none survived the rule of keeping a title that already covers
   * exactly one step. Reading a profile now walks the same five sections in the
   * same order as filling the questionnaire in, which is the point.
   *
   * Three rows changed rather than moved:
   *   - numberOfChildren and childrenAges were two rows for what the wizard asks
   *     as one question, and are now one row: the count with its per-child ages.
   *   - preferredNannyLanguages gains a row at last. A family answers it, can
   *     edit it, and it appeared on no profile page.
   *   - involvementLevel is gone outright. Its only writer is EditNannyShare,
   *     which updates the nannyshares collection, so the row on a PROFILE could
   *     never fill.
   */

  /* Per-question icons, mirroring the ones each QuestionBlock uses in the
     wizard's own steps/ files, so the two screens read as one design. Keyed by
     the schema field, because that is what a manifest entry carries. */
  const ROW_ICONS = {
    nannyShareType: Users, hasNanny: User, nannyshareStart: Calendar, urgency: Clock,
    numberOfChildren: CheckSquare, childrenSchools: BookOpen, allergiesHealth: HeartPulse,
    specificDays: Calendar, flexibility: Activity, childResponsibilities: Baby,
    dailyRoutine: Sun, householdHelpFor: Home, householdAddOns: Home,
    hostingPreference: Home, pets: Dog, okayWithPets: Dog,
    preferredNannyLanguages: MessageSquare, routinesPreferences: FileText,
    shareLocation: MapPin, hourlyBudget: DollarSign, communicationPreference: Phone,
    backupCare: Cloud, openNotes: FileText, imageFile: Image,
    careDescription: FileText,
  };

  const GROUP_ICONS = {
    "Share Needs": Users,
    "Children": Baby,
    "Schedule & Care": Calendar,
    "Preferences": Home,
    "Location & Notes": MapPin,
    [LEGACY_GROUP]: Info,
  };

  /* Photo lives on the hero; the wizard question is not repeated as a row. */
  const groupedDetails = [
    ...groupFields(FAMILY_FIELDS.filter((f) => f.control !== CONTROL.PHOTO)),
    /* Kept per decision 7: no wizard writes careDescription, but real data
       exists and dropping the row would hide answers people gave. It belongs to
       no wizard step, so it gets its own section at the end rather than being
       filed under a step that never asked it. */
    ...(FAMILY_LEGACY_FIELDS.length
      ? [{ title: LEGACY_GROUP, items: FAMILY_LEGACY_FIELDS }]
      : []),
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
                {family.img ? (
                  <img
                    src={family.img}
                    alt={family.name}
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover shadow-sm shrink-0"
                  />
                ) : (
                  <div className="shrink-0">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl shadow-sm bg-[#AEC4FF] flex items-center justify-center text-[#0D134C] Livvic-SemiBold text-5xl">
                      {family.name ? family.name.charAt(0).toUpperCase() : ""}
                    </div>
                  </div>
                )}
                <div className="flex-1">
                  {/* Same themed "Role • Goal" pill as the profile card — colors
                      and wording come from the shared shareTypeTheme, keyed off
                      hasNanny, so the details page reads identically to the card
                      (indigo "Has a nanny, Looking to share" when they already
                      have a nanny, blue "Looking for a share" otherwise) instead
                      of the raw backend goal string in a fixed blue. */}
                  <div
                    style={{ backgroundColor: getFamilyTheme(profile.hasNanny).bg, color: getFamilyTheme(profile.hasNanny).text }}
                    className="inline-flex items-center gap-1.5 font-bold Livvic-Bold rounded-full px-3 py-1 text-xs sm:text-sm mb-3"
                  >
                    <Users size={14} />
                    <ShareTypeLabel role="Family" goal={getFamilyGoal(profile.hasNanny)} />
                  </div>
                  <h1 className="text-3xl sm:text-4xl Livvic-Bold text-[#0D134C] mb-2">
                    {family.name}
                  </h1>
                  <p className="text-[#555555] text-lg Livvic-Medium flex items-center gap-2">
                    <MapPin size={18} /> {family.location}
                  </p>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#EAEAEA] shadow-sm">
              <h2 className="text-2xl Livvic-SemiBold text-[#0D134C] mb-4">About the Family</h2>
              <p className="text-[#555555] leading-relaxed text-base sm:text-lg">
                {family.bio}
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
