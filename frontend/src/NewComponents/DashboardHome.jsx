import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "react-avatar";
import { Bell, ChevronRight, Clock, Heart, Inbox, MapPin, MessageCircle, Send, Smile } from "lucide-react";
import { viewCurrentUserProfileThunk, viewNannyShareProfileThunk } from "../Components/Redux/nannyShareSlice";
import { getIncomingRequestsThunk, getOutgoingRequestsThunk } from "../Components/Redux/matchSlice";
import { getChatsThunk } from "../Components/Redux/chatSlice";
import { getVariantTheme, ShareTypeBadge } from "../Config/shareTypeTheme";
import { variantFromProfile } from "../Config/shareTypeGoals";
import { CARE_TYPE_LABELS, formatScheduleDays } from "../Config/scheduleFormat";
import { formatCardAge, formatPlacedNannySharedRate, formatPlacedNannySoloRate, formatSharedRate, formatSoloRate } from "../Config/helpFunction";
import { formatDisplayName } from "./matchesHelpers";
import { ReferAFriendModal } from "./ReferAFriendModal";
import { ShareProfileModal } from "./ShareProfile/ShareProfileModal";
import { isCompletedShare } from "./ChatOnboarding/LandingMatchesCarousel";
import { FamilyProfile, NannyProfile } from "../Components/subComponents/profileCard";
import MatchCard, { convertRealProfileToMatchCardProps } from "./NannyShare/Onboarding/MatchCard";
import LaunchingNeighborhoodCard from "./LaunchingNeighborhoodCard";
import WaitlistShareModal from "./MatchDashboard/WaitlistShareModal";
import { fetchLaunchStatus } from "../Config/neighborhoodLaunch";
import "../Components/subComponents/profileCardUpgraded.css";

const sectionCta =
  "Livvic-SemiBold text-[12.5px] text-[#0A1A4B] bg-[#B9CFFD] rounded-full min-w-[182px] min-h-[36px] px-5 flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 hover:bg-[#A8C3F8]";

function locationLabel(loc) {
  if (!loc) return "";
  const n = loc.neighborhood;
  const c = loc.city;
  if (n && c && n !== c) return `${n}, ${c}`;
  return n || c || loc.format_location?.split(",")[0] || "";
}

function careLabel(profile) {
  const raw = String(profile?.nannyShareType || profile?.careType || "").toLowerCase();
  if (CARE_TYPE_LABELS[raw]) return CARE_TYPE_LABELS[raw];
  if (raw.includes("full")) return "Full-time";
  if (raw.includes("part")) return "Part-time";
  return formatScheduleDays(profile?.specificDays) || "Flexible";
}

function childrenLabel(profile) {
  const list = Array.isArray(profile?.childrenAges) ? profile.childrenAges : [];
  const count = list.length || Number(profile?.numberOfChildren) || 0;
  if (!count) return "Family";
  const ageStr = list.map(formatCardAge).filter((s) => s && s !== "[object Object]").join(" • ");
  const kids = `${count} child${count > 1 ? "ren" : ""}`;
  return ageStr ? `${kids} • ${ageStr}` : kids;
}

function childrenCountOf(profile) {
  if (profile?.numberOfChildren !== undefined) return profile.numberOfChildren;
  let childrenObj = profile?.userId?.noOfChildren;
  if (typeof childrenObj === "string") {
    try { childrenObj = JSON.parse(childrenObj); } catch (e) { /* ignore */ }
  }
  return childrenObj?.length || 0;
}

function renderHomeProfileCard(profile) {
  const user = profile.userId && typeof profile.userId === "object" ? profile.userId : profile;
  const isFamily = (profile.userType || user.type) === "Parents";
  const id = user._id || profile._id;
  const sharedProps = {
    id,
    userId: user._id,
    name: user.name,
    img: user.imageUrl || profile.imageFile,
    location: user.location,
    schedule: profile.specificDays,
    start: profile.nannyshareStart || profile.startAvailability,
    isHomeCard: true,
  };

  if (isFamily) {
    return (
      <FamilyProfile
        {...sharedProps}
        hasNanny={profile.hasNanny}
        careType={profile.nannyShareType}
        hosting={profile.hostingPreference}
        sharedRate={formatSharedRate(profile.hourlyBudget) || "N/A"}
        soloRate={formatSoloRate(profile.hourlyBudget) || "N/A"}
        ages={profile.childrenAges?.length > 0 ? profile.childrenAges.map((age) => age.label) : []}
        childrenCount={childrenCountOf(profile)}
      />
    );
  }

  return (
    <NannyProfile
      {...sharedProps}
      hasFamily={profile.hasFamily}
      careType={profile.careType || profile.currentSchedule}
      experience={profile.careExperience}
      whereCare={profile.whereCare}
      preferredAges={profile.preferredAges}
      sharedRate={profile.hasFamily ? formatPlacedNannySharedRate(profile) : profile.sharedRate}
      soloRate={profile.hasFamily ? formatPlacedNannySoloRate(profile) : profile.soloRate}
      ages={!profile.hasFamily
        ? (profile.preferredAges?.length > 0 ? profile.preferredAges.map((age) => age.label) : [])
        : (profile.childrenAges?.length > 0 ? profile.childrenAges.map((age) => age.label) : [])}
      childrenCount={childrenCountOf(profile)}
    />
  );
}

function StatRow({ to, icon, label, count }) {
  return (
    <NavLink
      to={to}
      className="flex items-center gap-3 bg-white border border-[#E5E7EB] rounded-xl px-4 py-3.5 min-h-[66px] min-w-0 hover:shadow-md hover:-translate-y-px hover:border-[#d5d8e0] transition-all"
    >
      <span className="w-9 h-9 rounded-[10px] bg-[#EEF3FF] text-[#001243] flex items-center justify-center shrink-0">
        {icon}
      </span>
      <span className="Livvic-SemiBold text-[14px] text-[#001243] flex-1 truncate">{label}</span>
      <span className="w-6 h-6 rounded-[8px] bg-[#EEF3FF] Livvic-SemiBold text-[12px] text-[#001243] flex items-center justify-center shrink-0">
        {count}
      </span>
    </NavLink>
  );
}

export default function DashboardHome() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { currentProfile, data } = useSelector((s) => s.postNannyShare);
  const { incomingMatches, outgoingMatches } = useSelector((s) => s.matchRequest);
  const chatList = useSelector((s) => s.chat?.chatList) || [];
  const [inviteOpen, setInviteOpen] = useState(false);
  const [showWaitlistShareModal, setShowWaitlistShareModal] = useState(false);
  const [launch, setLaunch] = useState(null);
  const isNanny = user?.type === "Nanny";
  const profile = currentProfile || (Array.isArray(data) ? data.find((p) => (p.userId?._id || p.userId) === user?._id) : null) || (user ? { userId: user, userType: user.type } : null);
  const profileComplete = Boolean(user?.nannyProfileCompleted && profile);
  const viewerLoc = user?.location || profile?.userId?.location;
  const viewerVariant = variantFromProfile(isNanny ? "Nanny" : "Family", {
    hasNanny: profile?.hasNanny ?? user?.hasNanny,
    hasFamily: profile?.hasFamily ?? user?.hasFamily,
  });
  const viewerTheme = getVariantTheme(viewerVariant) || { bg: "#AEC4FF", text: "#0D134C" };
  const displayName = formatDisplayName(user?.name) || "You";
  const completeHref = isNanny
    ? "/dashboard/complete-profile"
    : `/dashboard/post-a-nannyShare${user?.sheetId ? `?recordId=${encodeURIComponent(user.sheetId)}` : ""}`;
  const shortlist = useMemo(() => {
    const uid = user?._id;
    return (Array.isArray(data) ? data : [])
      .filter((p) => p && isCompletedShare(p) && (p.userId?._id || p.userId) !== uid)
      .slice(0, 3)
      .map((p, i) => {
        const u = p.userId && typeof p.userId === "object" ? p.userId : {};
        const isFamily = (p.userType || u.type) === "Parents";
        const type = isFamily ? "Family" : "Nanny";
        const profileId = u._id || (typeof p.userId === "string" ? p.userId : p._id);
        const ages = p.childrenAges || p.preferredAges || [];
        const card = convertRealProfileToMatchCardProps({
          ...p,
          name: u.name,
          location: u.location,
          profilePicture: u.imageUrl || p.imageFile,
          additionalInfo: [
            { key: "haveNanny", value: p.hasNanny ? "Yes" : "No" },
            { key: "alreadyHaveFamily", value: p.hasFamily ? "Yes" : "No" },
            { key: "NoOfChildren", value: p.numberOfChildren || p.childrenAges?.length || 1 },
            { key: "careType", value: p.nannyShareType || p.careType },
            { key: "experience", value: p.careExperience },
            { key: "avaiForWorking", value: p.careType || p.nannyShareType },
            { key: "ageGroupsExp", value: ages },
            { key: "schedule", value: p.specificDays },
          ],
        }, type, i);
        return {
          ...card,
          href: isFamily ? `/dashboard/family-profile-view/${profileId}` : `/dashboard/nanny-profile-view/${profileId}`,
        };
      });
  }, [data, user?._id]);
  const incoming = incomingMatches?.length || 0;
  const outgoing = outgoingMatches?.length || 0;
  const unread = chatList.reduce((n, c) => n + (c?.unReadMessages > 0 ? 1 : 0), 0);
  const notifications = incoming + unread;
  const isLaunching = launch?.status === "launching";

  useEffect(() => {
    dispatch(viewCurrentUserProfileThunk());
    dispatch(viewNannyShareProfileThunk({ page: 1, limit: 10 }));
    dispatch(getIncomingRequestsThunk({ page: 1, limit: 10, status: "pending" }));
    dispatch(getOutgoingRequestsThunk({ page: 1, limit: 10 }));
    dispatch(getChatsThunk());
    fetchLaunchStatus().then(setLaunch).catch(() => {});
  }, [dispatch]);

  const toolkit = [
    { bg: "#FEE2E2", color: "#F87171", hover: "hover:bg-[#FEF2F2]", icon: <Heart size={18} strokeWidth={2.2} color="#F87171" />, title: "How matching works", sub: "See how Fam finds and evaluates matches.", href: "/dashboard/how-matching-works" },
    { bg: "#DCFCE7", color: "#34D399", hover: "hover:bg-[#F0FDF4]", icon: <Smile size={18} strokeWidth={2.2} color="#34D399" />, title: "Ways a nanny share can come together", sub: "See which family and nanny profiles can connect.", href: "/dashboard/ways-a-share-comes-together" },
    { bg: "#FFEDD5", color: "#FB923C", hover: "hover:bg-[#FFF7ED]", icon: <Bell size={18} strokeWidth={2.2} color="#FB923C" />, title: "Get personalized help", sub: "Meet FamLink Concierge." },
  ];

  return (
    <div className="-my-8 min-h-screen bg-[#F7F9FA]">
      {inviteOpen && (
        isNanny ? (
          <ReferAFriendModal onClose={() => setInviteOpen(false)} />
        ) : (
          <ShareProfileModal onClose={() => setInviteOpen(false)} />
        )
      )}
      {showWaitlistShareModal && (
        <WaitlistShareModal onClose={() => setShowWaitlistShareModal(false)} launchData={launch} />
      )}

      <div className="padding-navbar1 max-w-[1280px] mx-auto px-4 sm:px-6 pt-9 pb-[72px]">
        <h1 className="Livvic-Bold text-[36px] sm:text-[46px] leading-tight tracking-tight text-[#001243]">
          Let&apos;s find your <span className="text-[#AEC4FF] font-[750]">Share!</span>
        </h1>
        <p className="Livvic text-[15px] text-[#6B7280] mt-1 mb-5">
          Meet the people, possibilities, and support that make shared care work.
        </p>

        <div className="grid grid-cols-1 min-[950px]:grid-cols-[minmax(0,1fr)_306px] gap-x-6 gap-y-5 items-stretch">
          <div className="min-w-0 flex flex-col gap-[25px]">
            <div className="flex flex-col min-[681px]:flex-row gap-[18px] items-start">
              <div className="fl-card min-h-[136px] flex flex-col min-[681px]:w-[280px] shrink-0 self-stretch hover:shadow-[0_4px_16px_rgba(0,18,67,0.09)] transition-shadow duration-150">
                <div className="flex items-center gap-2 mb-2.5">
                  <img src="/logo3.png" alt="" className="w-4 h-4 object-contain" />
                  <span className="Livvic-Bold text-[13px] text-[#001243]">Fam</span>
                  <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
                  <span className="Livvic-Bold text-[13px] text-[#001243]">AI Match Assistant</span>
                </div>
                <p className="Livvic-Bold text-[16px] text-[#071646] mb-1 leading-snug">One more step to complete your profile</p>
                <p className="Livvic text-[13px] text-[#465269] leading-[1.38]">
                  Finish your profile so I can begin finding compatible matches for you.
                </p>
              </div>

              {profileComplete ? (
                <div className="min-w-0 flex-1 self-stretch [&_.fl-card]:h-full [&_.fl-card-inner]:h-full">
                  {profile ? renderHomeProfileCard(profile) : null}
                </div>
              ) : (
                <div className="fl-card min-w-0 flex-1 min-h-[136px] grid grid-cols-1 sm:grid-cols-2 sm:items-center gap-3 sm:gap-0 hover:shadow-[0_4px_16px_rgba(0,18,67,0.09)] transition-shadow duration-150 overflow-hidden">
                  <div className="flex items-center gap-4 min-w-0 sm:pr-4">
                    <div className="w-[72px] h-[72px] rounded-[12px] overflow-hidden shrink-0" style={{ backgroundColor: viewerTheme.bg }}>
                      {user?.imageUrl ? (
                        <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Avatar name={user?.name || "You"} size="72" color={viewerTheme.bg} fgColor={viewerTheme.text} className="Livvic-Bold" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <ShareTypeBadge variant={viewerVariant} className="!text-[11px] !px-2.5 !py-1 mb-1.5" />
                      <p className="Livvic-Bold text-[20px] leading-tight text-[#001243] truncate">
                        {displayName}
                      </p>
                      <p className="Livvic text-[14px] text-[#6B7280] truncate mt-0.5">
                        {isNanny ? (profile?.careExperience || "Nanny") : childrenLabel(profile)}
                      </p>
                      <div className="flex flex-wrap gap-x-4 mt-1.5 text-[14px] text-[#8B7355] Livvic">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={15} className="text-[#6466e9]" />
                          {careLabel(profile)}
                        </span>
                        {locationLabel(viewerLoc) ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin size={15} className="text-[#eaa541]" />
                            {locationLabel(viewerLoc)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center min-w-0 sm:pl-5 sm:border-l sm:border-[#E6E8EE] h-full">
                    <div className="flex flex-col justify-center w-full">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <p className="Livvic text-[12px] leading-none text-[#9AA3B2]">Profile complete</p>
                        <span className="Livvic-Bold text-[13px] leading-none text-[#001243]">60%</span>
                      </div>
                      <div className="h-[6px] rounded-full bg-[#ECEFF3] overflow-hidden">
                        <div className="h-full rounded-full bg-[#B9CFFD]" style={{ width: "60%" }} />
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(completeHref)}
                        className="Livvic-Bold text-[16px] text-[#001243] mt-3 text-left whitespace-nowrap"
                      >
                        Complete profile →
                      </button>
                    </div>
                  </div>
                  <div className="sm:hidden w-full pt-3 mt-1 border-t border-[#E6E8EE]">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="Livvic text-[11px] leading-none text-[#9AA3B2]">Profile complete</p>
                      <span className="Livvic-Bold text-[11px] leading-none text-[#001243]">60%</span>
                    </div>
                    <div className="h-1 rounded-full bg-[#ECEFF3] overflow-hidden">
                      <div className="h-full rounded-full bg-[#B9CFFD]" style={{ width: "60%" }} />
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(completeHref)}
                      className="Livvic-Bold text-[14px] text-[#001243] mt-2.5"
                    >
                      Complete profile →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {isLaunching ? (
              <LaunchingNeighborhoodCard
                launch={launch}
                onShare={() => setShowWaitlistShareModal(true)}
                onBrowse={() => navigate("/dashboard")}
              />
            ) : (
            <>
            <section>
              <div className="flex items-start justify-between gap-3 mb-1">
                <h2 className="Livvic-Bold text-[20px] text-[#001243]">Your Match Shortlist</h2>
                <NavLink
                  to="/dashboard"
                  className={sectionCta}
                >
                  Explore all matches →
                </NavLink>
              </div>
              <p className="-mt-1.5 mb-2.5 Livvic-Medium text-[13px] text-[#374151]">
                <span className="text-[#AEC4FF] mr-1">✦</span>
                {shortlist.length} potential matches
              </p>
              <div className="grid grid-cols-1 min-[681px]:grid-cols-3 gap-4">
                {shortlist.length ? shortlist.map((card) => (
                  <NavLink key={card.id} to={card.href} className="block min-w-0">
                    <MatchCard match={card} compact isInteractive={false} />
                  </NavLink>
                )) : (
                  <p className="Livvic text-[13px] text-[#465269] px-1 py-4 sm:col-span-3">
                    Matches will appear here once Fam has profiles that fit yours.
                  </p>
                )}
              </div>
            </section>

            <section className="pt-0">
              <div className="flex items-center justify-between gap-3 mb-1">
                <h2 className="Livvic-Bold text-[20px] text-[#001243]">Matches</h2>
                <NavLink
                  to="/dashboard/requests"
                  className={sectionCta}
                >
                  View match requests →
                </NavLink>
              </div>
              <p className="Livvic text-[13px] text-[#6B7280] -mt-0.5">
                See and manage the connections you&apos;ve already made.
              </p>
              <p className="Livvic-SemiBold text-[13px] text-[#001243] mb-2">
                {notifications} new notification{notifications === 1 ? "" : "s"}
              </p>
              <div className="grid grid-cols-1 min-[681px]:grid-cols-3 gap-3">
                <StatRow to="/dashboard/requests" icon={<Inbox size={16} strokeWidth={2} />} label="Match requests" count={incoming} />
                <StatRow to="/dashboard/message?tab=messages" icon={<MessageCircle size={16} strokeWidth={2} />} label="Messages" count={unread} />
                <StatRow to="/dashboard/requests?tab=sent" icon={<Send size={16} strokeWidth={2} />} label="Pending requests" count={outgoing} />
              </div>
            </section>
            </>
            )}

          </div>

          <aside className="grid grid-cols-1 max-[949px]:min-[681px]:grid-cols-2 min-[950px]:flex min-[950px]:flex-col gap-4 min-[950px]:-mt-[35px] min-[950px]:h-full">
            <div className="bg-gradient-to-b from-white to-[#fff9ec] border border-[#f3ead8] rounded-[20px] p-[19px] shrink-0 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <h3 className="Livvic-Bold text-[17px] leading-snug text-[#071646] mb-2">Invite someone to FamLink</h3>
              <p className="Livvic text-[13px] text-[#475368] mb-5 leading-relaxed">
                Know another family or nanny who could benefit from sharing care?
              </p>
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="w-full flex items-center justify-center gap-2 Livvic-Bold text-[12px] text-white rounded-full px-5 py-3 bg-[#071646]"
              >
                <Send size={13} strokeWidth={2.2} />
                Invite to FamLink
              </button>
            </div>

            <div className="bg-white rounded-[20px] p-[25px] pb-5 min-h-[410px] flex-1 shadow-[0_14px_27px_rgba(30,43,81,0.09)]">
              <div className="flex items-center gap-2 mb-1.5">
                <img src="/logo3.png" alt="" className="w-4 h-4 object-contain" />
                <p className="text-[11px] tracking-[0.08em] text-[#000B33] Livvic-Bold">FAMLINK TOOLKIT</p>
              </div>
              <h3 className="Livvic-Bold text-[22px] leading-snug text-[#000B33] tracking-tight">Learn &amp; Get Help</h3>
              <p className="Livvic text-[13px] text-[#465269] mt-1 mb-3">A little more clarity for every step of your share.</p>
              <div>
                {toolkit.map((item) => {
                  const className = `group flex items-center gap-3 py-3.5 px-2 -mx-2 min-h-[72px] rounded-xl text-[#000B33] no-underline transition-all duration-150 hover:translate-x-[2px] ${item.hover} ${item.href ? "cursor-pointer" : ""}`;
                  const inner = (
                    <>
                    <span
                      className="w-10 h-10 rounded-[9px] flex items-center justify-center shrink-0"
                      style={{ backgroundColor: item.bg, color: item.color }}
                    >
                      {item.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="Livvic-Bold text-[15px] text-[#000B33] leading-snug">{item.title}</p>
                      <p className="Livvic text-[12px] text-[#465269] leading-snug mt-0.5">{item.sub}</p>
                    </div>
                    <ChevronRight size={18} strokeWidth={2.5} className="text-[#5B8CFF] shrink-0 transition-transform duration-150 group-hover:translate-x-[2px]" />
                    </>
                  );
                  return item.href ? (
                    <NavLink key={item.title} to={item.href} className={className}>{inner}</NavLink>
                  ) : (
                    <div key={item.title} className={className}>{inner}</div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
