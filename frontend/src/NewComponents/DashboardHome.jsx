import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Bell, ChevronRight, Heart, Inbox, MessageCircle, Send, Smile } from "lucide-react";
import { viewCurrentUserProfileThunk, viewNannyShareProfileThunk } from "../Components/Redux/nannyShareSlice";
import { getIncomingRequestsThunk, getOutgoingRequestsThunk } from "../Components/Redux/matchSlice";
import { getChatsThunk } from "../Components/Redux/chatSlice";
import { ReferAFriendModal } from "./ReferAFriendModal";
import { ShareProfileModal } from "./ShareProfile/ShareProfileModal";
import { isCompletedShare, renderFindAMatchCard } from "./ChatOnboarding/LandingMatchesCarousel";
import MatchCard, { convertRealProfileToMatchCardProps } from "./NannyShare/Onboarding/MatchCard";
import LaunchingNeighborhoodCard from "./LaunchingNeighborhoodCard";
import { ALLOWED_ZIPCODES, extractZipFromLocation } from "../Config/serviceArea";

const sectionCta =
  "Livvic-SemiBold text-[12.5px] text-[#0A1A4B] bg-[#B9CFFD] rounded-full min-w-[182px] min-h-[36px] px-5 flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 hover:bg-[#A8C3F8]";

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
  const { user } = useSelector((s) => s.auth);
  const { currentProfile, data } = useSelector((s) => s.postNannyShare);
  const { incomingMatches, outgoingMatches } = useSelector((s) => s.matchRequest);
  const chatList = useSelector((s) => s.chat?.chatList) || [];
  const [inviteOpen, setInviteOpen] = useState(false);
  const isNanny = user?.type === "Nanny";
  const profile = currentProfile || (Array.isArray(data) ? data.find((p) => (p.userId?._id || p.userId) === user?._id) : null) || (user ? { userId: user, userType: user.type } : null);
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
        const ages = (p.childrenAges || p.preferredAges || [])
          .map((a) => (typeof a === "string" ? a : a?.label))
          .filter(Boolean);
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
            { key: "avaiForWorking", value: p.careType },
            { key: "ageGroupsExp", value: ages },
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
  const loc = user?.location || profile?.userId?.location;
  const zip = extractZipFromLocation(loc);
  const isWaitlisted = Boolean(zip && !ALLOWED_ZIPCODES.has(String(zip).slice(0, 5)));

  useEffect(() => {
    dispatch(viewCurrentUserProfileThunk());
    dispatch(viewNannyShareProfileThunk({ page: 1, limit: 10 }));
    dispatch(getIncomingRequestsThunk({ page: 1, limit: 10, status: "pending" }));
    dispatch(getOutgoingRequestsThunk({ page: 1, limit: 10 }));
    dispatch(getChatsThunk());
  }, [dispatch]);

  const toolkit = [
    { bg: "#FEE2E2", color: "#F87171", hover: "hover:bg-[#FEF2F2]", icon: <Heart size={18} strokeWidth={2.2} color="#F87171" />, title: "How matching works", sub: "See how Fam finds and evaluates matches.", href: "/dashboard/how-matching-works" },
    { bg: "#DCFCE7", color: "#34D399", hover: "hover:bg-[#F0FDF4]", icon: <Smile size={18} strokeWidth={2.2} color="#34D399" />, title: "Ways a nanny share can come together", sub: "See which family and nanny profiles can connect.", href: "/dashboard/ways-a-share-comes-together" },
    { bg: "#FFEDD5", color: "#FB923C", hover: "hover:bg-[#FFF7ED]", icon: <Bell size={18} strokeWidth={2.2} color="#FB923C" />, title: "Get personalized help", sub: "Meet FamLink Concierge." },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      {inviteOpen && (isNanny ? (
        <ReferAFriendModal onClose={() => setInviteOpen(false)} />
      ) : (
        <ShareProfileModal onClose={() => setInviteOpen(false)} />
      ))}

      <div className="padding-navbar1 max-w-[1280px] mx-auto px-4 sm:px-6 pt-9 pb-[72px]">
        <h1 className="Livvic-Bold text-[36px] sm:text-[46px] leading-tight tracking-tight text-[#001243]">
          Let&apos;s find your <span className="text-[#AEC4FF]">Share!</span>
        </h1>
        <p className="Livvic text-[15px] text-[#6B7280] mt-1 mb-5">
          Meet the people, possibilities, and support that make shared care work.
        </p>

        <div className="grid grid-cols-1 min-[950px]:grid-cols-[minmax(0,1fr)_306px] gap-x-6 gap-y-5 items-start">
          <div className="min-w-0 flex flex-col gap-[25px]">
            <div className="flex flex-col min-[681px]:flex-row gap-[18px] items-stretch">
              <div className="bg-gradient-to-b from-white to-[#f8fcfe] border border-[#e2eef4] rounded-[15px] p-[15px] min-h-[136px] flex flex-col min-[681px]:w-[280px] shrink-0 self-stretch shadow-[0_5px_14px_rgba(23,58,82,0.018)]">
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

              <div className="min-w-0 flex-1 self-stretch [&_.fl-card]:h-full [&_.fl-card-inner]:h-full">
                {profile ? renderFindAMatchCard(profile, { displayOnly: true }) : null}
              </div>
            </div>

            {isWaitlisted ? (
              <LaunchingNeighborhoodCard onShare={() => setInviteOpen(true)} />
            ) : (
            <>
            <section>
              <div className="flex items-start justify-between gap-3 mb-1">
                <h2 className="Livvic-Bold text-[20px] text-[#001243]">Your match shortlist</h2>
                <NavLink
                  to="/dashboard"
                  className={sectionCta}
                >
                  Explore all matches →
                </NavLink>
              </div>
              <p className="Livvic-Bold text-[14px] text-[#001243] mb-3">
                <span className="text-[#AEC4FF] mr-1">✦</span>
                {shortlist.length} potential matches
              </p>
              <div className="grid grid-cols-1 min-[681px]:grid-cols-3 gap-4">
                {shortlist.length ? shortlist.map((card) => (
                  <NavLink key={card.id} to={card.href} className="block min-w-0">
                    <MatchCard match={card} compact isInteractive={false} className="h-full" />
                  </NavLink>
                )) : (
                  <p className="Livvic text-[13px] text-[#465269] px-1 py-4 sm:col-span-3">
                    Matches will appear here once Fam has profiles that fit yours.
                  </p>
                )}
              </div>
            </section>

            <section className="pt-1.5">
              <div className="flex items-center justify-between gap-3 mb-1">
                <h2 className="Livvic-Bold text-[20px] text-[#001243]">Matches</h2>
                <NavLink
                  to="/dashboard/requests"
                  className={sectionCta}
                >
                  View match requests →
                </NavLink>
              </div>
              <p className="Livvic text-[13px] text-[#6B7280]">
                See and manage the connections you&apos;ve already made.
              </p>
              <p className="Livvic-SemiBold text-[13px] text-[#001243] mb-3">
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

          <aside className="grid grid-cols-1 max-[949px]:min-[681px]:grid-cols-2 min-[950px]:flex min-[950px]:flex-col gap-4 min-[950px]:-mt-[35px]">
            <div className="bg-gradient-to-b from-[#fffefd] via-[#fffdf5] to-[#fff7e0] border border-[#eee1c6] rounded-[20px] p-[19px] min-h-[152px] shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
              <h3 className="Livvic-Bold text-[17px] leading-snug text-[#071646] mb-2">Invite someone to FamLink</h3>
              <p className="Livvic text-[13px] text-[#475368] mb-5 leading-relaxed">
                Know another family or nanny who could benefit from sharing care?
              </p>
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="w-full flex items-center justify-between Livvic-Bold text-[12px] text-white rounded-full px-5 py-3 bg-[#071646]"
              >
                <span>Invite to FamLink</span>
                <span className="text-[16px]">→</span>
              </button>
            </div>

            <div className="bg-white/97 rounded-[20px] p-[25px] pb-5 min-h-[410px] shadow-[0_14px_27px_rgba(30,43,81,0.09)]">
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
