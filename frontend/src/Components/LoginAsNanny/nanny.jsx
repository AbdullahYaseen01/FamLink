import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import FilterSlidersJobPost from "./Profile/filterSlide";
import ProfileList from "./Profile/profileList";
import { getSubscriptionStatusThunk } from "../Redux/cardSlice";
import { getMyReferralThunk, ackReferralRewardsThunk } from "../Redux/referralSlice";
import VerifyEmailPrompt from "../../NewComponents/VerifyEmailDialogBox";
import CustomButton from "../../NewComponents/Button";
import PostCheckoutDialog from "../../NewComponents/PostCheckoutDialog";
import { ReferralRewardModal } from "../../NewComponents/ReferralRewardModal";
import { ReferAFriendModal } from "../../NewComponents/ReferAFriendModal";
import { Gift, CalendarClock, X } from "lucide-react";

// ── Nanny Component ───────────────────────────────────────────────
export default function Nanny() {
  const { user } = useSelector((s) => s.auth);
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [location, setLocation] = useState(5);
  const [priceRange, setPriceRange] = useState([5, 50]);
  const [availability, setAvailability] = useState([]);
  const [careOptions, setCareOptions] = useState([]);
  const [services, setServices] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleBackdropClick = () => setIsFilterOpen(false);
  const [maxChildren, setMaxChildren] = useState(null);

  const subscription = useSelector(
    (state) => state.cardData.subscriptionStatus,
  );
  const isSubscribed = subscription?.active;

  // Caregiver referral status — drives the free-month banner and the one-time
  // reward popup.
  const {
    isReferralGated,
    hasActiveMatching,
    matchingUntil,
    daysLeft,
    unseenReferralRewards,
  } = useSelector((s) => s.referral);
  const [rewardInfo, setRewardInfo] = useState(null);
  const [showReferModal, setShowReferModal] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    dispatch(getSubscriptionStatusThunk());
  }, [dispatch]);

  useEffect(() => {
    if (user?.type === "Nanny") dispatch(getMyReferralThunk());
  }, [dispatch, user?.type]);

  // Show the "you earned a free month" popup exactly once: when the server
  // reports an unseen reward, capture it, then immediately acknowledge it
  // (which also zeroes the count optimistically) so it can't fire again.
  useEffect(() => {
    if (unseenReferralRewards > 0) {
      setRewardInfo({ count: unseenReferralRewards, matchingUntil });
      dispatch(ackReferralRewardsThunk());
    }
  }, [unseenReferralRewards, matchingUntil, dispatch]);

  const untilLabel = matchingUntil
    ? new Date(matchingUntil).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const handleLocationChange = (value) => setLocation(value);
  const handlePriceChange = (value) => setPriceRange(value);
  const handleAvailabilityChange = (value) => setAvailability(value);
  const handleMaxAgeChange = (value) => setMaxChildren(value);
  const handleCareChange = (value) => setCareOptions(value);
  const handleServicesChange = (value) => setServices(value);

  const isChildRoute = pathname.includes("/dashboard/") || pathname.includes("/nanny/");

  return (
    <div className="h-full">

      <PostCheckoutDialog />

      {/* One-time celebration when a referral pays out a free month. */}
      {rewardInfo && (
        <ReferralRewardModal
          matchingUntil={rewardInfo.matchingUntil}
          rewardsCount={rewardInfo.count}
          onClose={() => setRewardInfo(null)}
        />
      )}

      {/* Refer-a-friend share sheet, opened from the status banner's CTA. */}
      {showReferModal && (
        <ReferAFriendModal onClose={() => setShowReferModal(false)} />
      )}

      {!isChildRoute && (
        <div className="-my-8 min-h-screen bg-[#F7F9FA] Quicksand relative">
          <div className="padding-navbar1 max-w-[1280px] mx-auto py-6">

          {/* Referral free-matching status — only for caregivers on the referral
              model. Says plainly whether the earned month is active or not, and
              its CTA opens the share sheet right here rather than bouncing to
              Settings. Dismissable for the session. */}
          {isReferralGated && !bannerDismissed && (
            <div className={`relative rounded-2xl px-5 sm:px-6 py-4 pr-12 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border ${
              hasActiveMatching ? "bg-[#F0FBE2] border-[#D6FB9A]" : "bg-white border-gray-200"
            }`}>
              {/* Close — pinned to the very top-right corner edge */}
              <button
                onClick={() => setBannerDismissed(true)}
                aria-label="Dismiss"
                className="absolute top-2.5 right-2.5 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/70 hover:bg-white border border-[#EAEAEA] text-gray-500 transition-colors"
              >
                <X size={15} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-[#EAEAEA]">
                  {hasActiveMatching ? <CalendarClock size={20} className="text-[#075B49]" /> : <Gift size={20} className="text-[#075B49]" />}
                </div>
                <div>
                  <p className="text-sm sm:text-base Livvic-SemiBold text-gray-800">
                    {hasActiveMatching ? "Free matching is active" : "Free matching is inactive"}
                  </p>
                  <p className="text-xs sm:text-sm Livvic-Medium text-secondary">
                    {hasActiveMatching && untilLabel
                      ? `Unlimited matches until ${untilLabel}${daysLeft > 0 ? ` · ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left` : ""}`
                      : "Refer a friend to unlock a free month of unlimited matching"}
                  </p>
                </div>
              </div>

              {/* Refer CTA — sits below the close button, on the right */}
              <button
                onClick={() => setShowReferModal(true)}
                className="w-full sm:w-auto sm:mt-6 bg-[#D6FB9A] text-[#075B49] Livvic-SemiBold text-sm rounded-full px-5 py-2.5 whitespace-nowrap transition-colors hover:brightness-95"
              >
                {hasActiveMatching ? "Refer again" : "Refer a friend"}
              </button>
            </div>
          )}

          {!user.nannyProfileCompleted && (
            <div className="bg-white border border-gray-200 rounded-2xl px-5 sm:px-8 py-4 sm:py-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left: Progress circle + text */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Circular progress */}
              <div className="relative w-14 h-14 flex-shrink-0">
                <svg viewBox="0 0 52 52" width="56" height="56">
                  <circle
                    cx="26" cy="26" r="22"
                    fill="none" stroke="#ffffff" strokeWidth="5"
                  />
                  <circle
                    cx="26" cy="26" r="22"
                    fill="none" stroke="#AEC4FF" strokeWidth="5"
                    strokeDasharray="138.23"
                    strokeDashoffset="34.56"
                    strokeLinecap="round"
                    transform="rotate(-90 26 26)"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm Livvic-SemiBold text-gray-800">
                  75%
                </span>
              </div>

              {/* Text */}
              <p className="text-sm sm:text-base Livvic-Medium text-secondary">
                <span className="Livvic-SemiBold text-base sm:text-lg text-gray-800">You're 75% set up.</span>{" "}
                Finish your profile to start matching
              </p>
            </div>

            {/* Right: Button */}
            <CustomButton btnText={"Complete your profile"} action={() => user.type === "Nanny" ? navigate("/dashboard/complete-profile") : navigate(`/dashboard/post-a-nannyShare?recordId=${encodeURIComponent(user.sheetId)}`)} className="w-full sm:w-auto bg-[#AEC4FF] text-[#0D134C] text-sm !Livvic-Medium rounded-xl px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 shadow-sm whitespace-nowrap transition-colors" />
            </div>
          )}

          {/* Example button to open dialog — replace/move as needed */}
          <div className="flex justify-end my-3 gap-2">
            {/* <button
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2 bg-primary text-white Livvic-SemiBold py-2 px-4 rounded-full shadow-sm transition hover:opacity-90"
            >
              Open Dialog
            </button> */}

            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 bg-white border border-[#AEC4FF] text-primary Livvic-SemiBold py-2 px-4 rounded-full shadow-sm transition hover:bg-[#AEC4FF]/20"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="11" y1="18" x2="13" y2="18" />
              </svg>
              Filters
            </button>
          </div>

          {/* Mobile Filter Drawer Backdrop */}
          {isFilterOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-30 lg:hidden"
              onClick={handleBackdropClick}
            />
          )}

          <div className="flex items-start max-lg:flex-col gap-y-4 lg:gap-x-8">
            {/* Filter Drawer */}
            <div
              className={`
                fixed top-0 left-0 h-full z-40 bg-[#F7F9FA] shadow-xl overflow-y-auto
                transition-transform duration-300 ease-in-out w-[85vw] max-w-xs p-4
                lg:static lg:h-auto lg:shadow-none lg:z-auto lg:bg-transparent lg:overflow-visible
                lg:w-auto lg:max-w-none lg:p-0 lg:translate-x-0
                ${isFilterOpen ? "translate-x-0" : "-translate-x-full"}
              `}
            >
              {/* Drawer Header (mobile only) */}
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <span className="Livvic-Bold text-lg Livvic-SemiBold text-primary">
                  Filters
                </span>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 transition"
                  aria-label="Close filters"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-gray-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <FilterSlidersJobPost
                onLocationChange={handleLocationChange}
                onPriceChange={handlePriceChange}
                onAvailabilityChange={handleAvailabilityChange}
                onCareChange={handleCareChange}
                onServicesChange={handleServicesChange}
                maxChildrenChange={handleMaxAgeChange}
              />
            </div>

            <div className="relative min-h-[600px] w-full">
              <ProfileList
                location={location}
                priceRange={priceRange}
                availability={availability}
                services={services}
                careOptions={careOptions}
                maxChildren={maxChildren}
              />
            </div>
          </div>
          {/* <VerifyEmailPrompt user={user} /> */}
          </div>
        </div>
      )}
      <Outlet />
    </div>
  );
}