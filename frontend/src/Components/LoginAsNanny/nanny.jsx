import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import FilterSlidersJobPost from "./Profile/filterSlide";
import ProfileList from "./Profile/profileList";
import { getSubscriptionStatusThunk } from "../Redux/cardSlice";
import { getMyReferralThunk, ackReferralRewardsThunk } from "../Redux/referralSlice";
import PostCheckoutDialog from "../../NewComponents/PostCheckoutDialog";
import { ReferralRewardModal } from "../../NewComponents/ReferralRewardModal";
import { ReferAFriendModal } from "../../NewComponents/ReferAFriendModal";
import SharedProfileReturn from "../../NewComponents/ShareProfile/SharedProfileReturn";
import { Gift, CalendarClock, X } from "lucide-react";
import { ShareProfileModal } from "../../NewComponents/ShareProfile/ShareProfileModal";
import { fetchLaunchStatus } from "../../Config/neighborhoodLaunch";
import FindMatchTabs from "../../NewComponents/MatchDashboard/FindMatchTabs";
import FindMatchFamCard from "../../NewComponents/MatchDashboard/FindMatchFamCard";
import OtherNeighborhoodsModal from "../../NewComponents/MatchDashboard/OtherNeighborhoodsModal";
import WaitlistShareModal from "../../NewComponents/MatchDashboard/WaitlistShareModal";

// ── Nanny Component ───────────────────────────────────────────────
export default function Nanny() {
  const { user } = useSelector((s) => s.auth);
  const { pathname } = useLocation();
  const dispatch = useDispatch();

  const [location, setLocation] = useState(5);
  const [priceRange, setPriceRange] = useState([5, 50]);
  const [availability, setAvailability] = useState([]);
  const [careOptions, setCareOptions] = useState([]);
  const [services, setServices] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleBackdropClick = () => setIsFilterOpen(false);
  const [maxChildren, setMaxChildren] = useState(null);
  const [launch, setLaunch] = useState(null);

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [showWaitlistShareModal, setShowWaitlistShareModal] = useState(false);
  const [shareNeighborhoodData, setShareNeighborhoodData] = useState(null);
  const [showOtherNeighborhoodsModal, setShowOtherNeighborhoodsModal] = useState(false);
  const [activeTab, setActiveTab] = useState("neighborhood");
  const [famActivity, setFamActivity] = useState("");

  useEffect(() => {
    dispatch(getSubscriptionStatusThunk());
  }, [dispatch]);

  useEffect(() => {
    fetchLaunchStatus().then(setLaunch).catch(() => { });
  }, []);

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
      {showShareModal && (
        <ShareProfileModal onClose={() => setShowShareModal(false)} />
      )}
      {showWaitlistShareModal && (
        <WaitlistShareModal 
          onClose={() => {
            setShowWaitlistShareModal(false);
            setShareNeighborhoodData(null);
          }} 
          launchData={shareNeighborhoodData || launch} 
        />
      )}
      {showOtherNeighborhoodsModal && (
            <OtherNeighborhoodsModal 
              onClose={() => setShowOtherNeighborhoodsModal(false)}
            />
          )}

      {!isChildRoute && (
        <div className="-my-8 min-h-screen bg-[#F7F9FA] Quicksand relative">
          {/* Sends a member who arrived from a shared link back to that profile
              once their own is complete, instead of stranding them here. */}
          <SharedProfileReturn />

          <div className="padding-navbar1 max-w-[1280px] mx-auto py-6">

            {/* Referral free-matching status — only for caregivers on the referral
              model. Says plainly whether the earned month is active or not, and
              its CTA opens the share sheet right here rather than bouncing to
              Settings. Dismissable for the session. */}
            {isReferralGated && !bannerDismissed && (
              <div className="relative rounded-2xl px-5 sm:px-6 sm:pr-12 py-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-[#ECECEC] bg-white">
                <div className="flex items-center gap-3 pr-8 sm:pr-0">
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

                {/* Close pinned to the top-right corner, above the CTA. */}
                <button
                  onClick={() => setBannerDismissed(true)}
                  aria-label="Dismiss"
                  className="absolute top-2.5 right-2.5 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/70 hover:bg-white border border-[#EAEAEA] text-gray-500 transition-colors"
                >
                  <X size={15} />
                </button>

                {/* Refer CTA — vertically level with the status text. */}
                <button
                  onClick={() => setShowReferModal(true)}
                  className="w-full sm:w-auto bg-[#D6FB9A] text-[#075B49] Livvic-SemiBold text-sm rounded-full px-5 py-2.5 whitespace-nowrap transition-colors hover:brightness-95"
                >
                  {hasActiveMatching ? "Refer again" : "Refer a friend"}
                </button>
              </div>
            )}

            <FindMatchTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === 'neighborhood' ? (
              <>
                <FindMatchFamCard
                  launchStatus={launch}
                  famMessage={famActivity}
                  onSeeOtherNeighborhoods={() => setShowOtherNeighborhoodsModal(true)}
                  onHelpLaunch={() => setShowWaitlistShareModal(true)}
                />

                {/* The mobile Filters button used to live here, in a right-aligned row
                  of its own above the two-column layout — floating away from the
                  list it filters. It now sits beside the "Available Profiles"
                  heading inside ProfileList, mirroring "Share Profile" beside "Your
                  Profile". Only the button moved; the drawer below is unchanged. */}

                {launch?.status !== 'launching' && (
                  <>
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
                          onOpenFilters={() => setIsFilterOpen(true)}
                          launchStatus={launch}
                          onFamActivity={setFamActivity}
                        />
                      </div>
                      </div>
                    </>
                )}
              </>
            ) : (
              <div className="bg-white border border-[#E8ECF4] rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-[#EEF3FF] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#AEC4FF] text-2xl Livvic-Bold">F</span>
                </div>
                <h3 className="Livvic-Bold text-[#001243] text-xl mb-2">Share Groups</h3>
                <p className="text-[#6B7280] max-w-sm mx-auto text-sm">
                  Connect with other families and nannies in your neighborhood to form a share group. This feature is coming soon!
                </p>
              </div>
            )}
            {/* <VerifyEmailPrompt user={user} /> */}
          </div>
        </div>
      )}
      <Outlet />
    </div>
  );
}