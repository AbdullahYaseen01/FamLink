import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "react-avatar";
import { ChevronRight, Clock, Heart, Inbox, MapPin, MessageCircle, Send, Smile, Star, User } from "lucide-react";
import { viewCurrentUserProfileThunk, viewNannyShareProfileThunk } from "../Components/Redux/nannyShareSlice";
import { getIncomingRequestsThunk, getOutgoingRequestsThunk } from "../Components/Redux/matchSlice";
import { getChatsThunk } from "../Components/Redux/chatSlice";
import { ShareTypeBadge } from "../Config/shareTypeTheme";
import { variantFromProfile } from "../Config/shareTypeGoals";
import { CARE_TYPE_LABELS, formatScheduleDays } from "../Config/scheduleFormat";
import { formatDisplayName } from "./matchesHelpers";
import { ReferAFriendModal } from "./ReferAFriendModal";
import { ShareProfileModal } from "./ShareProfile/ShareProfileModal";

const PURPLE = "#6D5AE6";

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "FL";
  return ((parts[0][0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

function locationLabel(loc) {
  if (!loc) return "";
  return loc.neighborhood || loc.city || loc.format_location?.split(",")[0] || "";
}

function careLabel(profile) {
  const raw = String(profile?.nannyShareType || profile?.careType || "").toLowerCase();
  if (CARE_TYPE_LABELS[raw]) return CARE_TYPE_LABELS[raw];
  if (raw.includes("full")) return "Full-Time";
  if (raw.includes("part")) return "Part-Time";
  const days = formatScheduleDays(profile?.specificDays);
  return days || "Flexible";
}

function childrenLabel(profile) {
  const ages = profile?.childrenAges;
  const count = Array.isArray(ages) ? ages.length : Number(profile?.numberOfChildren) || 0;
  if (count > 0) return `${count} Child${count > 1 ? "ren" : ""}`;
  return "Family";
}

function completenessPercent(user, profile) {
  const checks = [
    Boolean(user?.name),
    Boolean(user?.imageUrl || profile?.imageFile || profile?.profilePhoto),
    Boolean(locationLabel(user?.location || profile?.userId?.location)),
    Boolean(profile?.nannyShareType || profile?.careType || profile?.careExperience),
    Boolean(profile?.specificDays || profile?.startAvailability),
    Boolean(profile?.childrenAges || profile?.preferredAges || profile?.bio || profile?.openNotes),
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

function compactFromBrowse(profile) {
  const u = profile?.userId || {};
  const isFamily = u.type === "Parents";
  const variant = variantFromProfile(isFamily ? "Family" : "Nanny", {
    hasNanny: profile.hasNanny,
    hasFamily: profile.hasFamily,
  });
  return {
    id: profile._id,
    href: isFamily
      ? `/dashboard/family-profile-view/${profile._id}`
      : `/dashboard/nanny-profile-view/${profile._id}`,
    name: formatDisplayName(u.name),
    img: u.imageUrl || profile.imageFile,
    variant,
    details: isFamily ? childrenLabel(profile) : (profile.careExperience || "Nanny"),
    schedule: careLabel(profile),
    city: locationLabel(u.location),
  };
}

function CompactMatchCard({ card }) {
  return (
    <NavLink
      to={card.href}
      className="flex gap-3 bg-white border border-[#ECECEC] rounded-2xl p-3 min-w-0 hover:border-[#C8D8FF] transition-colors"
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[#AEC4FF]">
        {card.img ? (
          <img src={card.img} alt="" className="w-full h-full object-cover" />
        ) : (
          <Avatar name={card.name} size="56" color="#AEC4FF" fgColor="#0D134C" className="Livvic-Bold" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <ShareTypeBadge variant={card.variant} className="mb-1" />
        <p className="Livvic-Bold text-[14px] text-[#001243] truncate">{card.name}</p>
        <p className="Livvic text-[12px] text-[#6B7280] truncate mb-1.5">{card.details}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#4B5563] Livvic-Medium">
          <span className="inline-flex items-center gap-1 min-w-0">
            <Clock size={12} className="text-[#6366F1] shrink-0" />
            <span className="truncate">{card.schedule}</span>
          </span>
          {card.city ? (
            <span className="inline-flex items-center gap-1 min-w-0">
              <MapPin size={12} className="text-[#F59E0B] shrink-0" />
              <span className="truncate">{card.city}</span>
            </span>
          ) : null}
        </div>
      </div>
    </NavLink>
  );
}

function StatRow({ to, icon, label, count }) {
  return (
    <NavLink
      to={to}
      className="flex items-center gap-3 bg-white border border-[#ECECEC] rounded-2xl px-4 py-3 min-w-0 hover:border-[#C8D8FF] transition-colors"
    >
      <span className="text-[#6D5AE6] shrink-0">{icon}</span>
      <span className="Livvic-SemiBold text-[13px] text-[#001243] flex-1 truncate">{label}</span>
      <span className="Livvic-Bold text-[13px] text-[#6B7280]">{count}</span>
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
  const isNanny = user?.type === "Nanny";
  const profile = currentProfile?.userId ? currentProfile : currentProfile;
  const viewerLoc = user?.location || profile?.userId?.location;
  const percent = completenessPercent(user, profile);
  const profileDone = percent >= 100 || Boolean(user?.nannyProfileCompleted && percent >= 80);
  const viewerVariant = variantFromProfile(isNanny ? "Nanny" : "Family", {
    hasNanny: profile?.hasNanny ?? user?.hasNanny,
    hasFamily: profile?.hasFamily ?? user?.hasFamily,
  });
  const firstName = String(user?.name || "").trim().split(/\s+/)[0] || "You";
  const shortlist = useMemo(
    () => (Array.isArray(data) ? data : []).slice(0, 3).map(compactFromBrowse),
    [data]
  );
  const incoming = incomingMatches?.length || 0;
  const outgoing = outgoingMatches?.length || 0;
  const unread = chatList.reduce((n, c) => n + (c?.unReadMessages > 0 ? 1 : 0), 0);
  const notifications = incoming + unread;

  useEffect(() => {
    dispatch(viewCurrentUserProfileThunk());
    dispatch(viewNannyShareProfileThunk({ page: 1, limit: 3 }));
    dispatch(getIncomingRequestsThunk({ page: 1, limit: 10, status: "pending" }));
    dispatch(getOutgoingRequestsThunk({ page: 1, limit: 10 }));
    dispatch(getChatsThunk());
  }, [dispatch]);

  const completeHref = isNanny
    ? "/dashboard/complete-profile"
    : `/dashboard/post-a-nannyShare${user?.sheetId ? `?recordId=${encodeURIComponent(user.sheetId)}` : ""}`;

  const toolkit = [
    { icon: <Heart size={16} />, title: "How matching works", sub: "See how Fam finds and evaluates matches." },
    { icon: <Smile size={16} />, title: "Ways a nanny share can come together", sub: "See which family and nanny profiles can connect." },
    { icon: <User size={16} />, title: "Get personalized help", sub: "Meet FamLink Concierge." },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FA]">
      {inviteOpen && (isNanny ? (
        <ReferAFriendModal onClose={() => setInviteOpen(false)} />
      ) : (
        <ShareProfileModal onClose={() => setInviteOpen(false)} />
      ))}

      <div className="padding-navbar1 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="Livvic-Bold text-[32px] sm:text-[40px] text-[#001243] leading-tight">
          Let&apos;s find your <span style={{ color: "#AEC4FF" }}>Share!</span>
        </h1>
        <p className="Livvic text-[15px] text-[#6B7280] mt-2 mb-8">
          Meet the people, possibilities, and support that make shared care work.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-6 items-start">
          <div className="min-w-0 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#F3F4F6] border border-[#E8ECF4] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <img src="/logo3.png" alt="" className="w-5 h-5 object-contain" />
                  <span className="Livvic-Bold text-[14px] text-[#001243]">Fam</span>
                  <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                </div>
                {profileDone ? (
                  <>
                    <p className="Livvic-Bold text-[16px] text-[#001243] mb-1">I&apos;m looking for compatible matches</p>
                    <p className="Livvic text-[13px] text-[#6B7280] leading-relaxed">
                      Fam is reviewing profiles that fit your share. New matches will show up in your shortlist.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="Livvic-Bold text-[16px] text-[#001243] mb-1">One more step to complete your profile</p>
                    <p className="Livvic text-[13px] text-[#6B7280] leading-relaxed">
                      Finish your profile so I can begin finding compatible matches for you.
                    </p>
                  </>
                )}
              </div>

              <div className="bg-white border border-[#ECECEC] rounded-2xl p-4 flex gap-4 items-center">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-[#AEC4FF]">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Avatar name={user?.name || "You"} size="64" color="#AEC4FF" fgColor="#0D134C" className="Livvic-Bold" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <ShareTypeBadge variant={viewerVariant} className="mb-1" />
                  <p className="Livvic-Bold text-[15px] text-[#001243] truncate">
                    {isNanny ? firstName : `${firstName}'s family`}
                  </p>
                  <p className="Livvic text-[12px] text-[#6B7280] truncate">
                    {isNanny ? (profile?.careExperience || "Nanny") : childrenLabel(profile)}
                  </p>
                  <div className="flex flex-wrap gap-x-3 mt-1 text-[11px] text-[#4B5563] Livvic-Medium">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} className="text-[#6366F1]" />
                      {careLabel(profile)}
                    </span>
                    {locationLabel(viewerLoc) ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} className="text-[#F59E0B]" />
                        {locationLabel(viewerLoc)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="hidden sm:flex flex-col items-end shrink-0 w-[110px]">
                  <p className="Livvic-SemiBold text-[11px] text-[#6B7280] mb-1">
                    {profileDone ? "Profile complete" : `${percent}% complete`}
                  </p>
                  <div className="w-full h-1.5 rounded-full bg-[#E8ECF4] overflow-hidden">
                    <div className="h-full rounded-full bg-[#AEC4FF]" style={{ width: `${Math.min(percent, 100)}%` }} />
                  </div>
                  {!profileDone && (
                    <button
                      type="button"
                      onClick={() => navigate(completeHref)}
                      className="Livvic-SemiBold text-[12px] mt-2"
                      style={{ color: PURPLE }}
                    >
                      Complete profile →
                    </button>
                  )}
                </div>
              </div>
            </div>

            <section className="bg-white border border-[#ECECEC] rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div>
                  <h2 className="Livvic-Bold text-[22px] text-[#001243]">Your match shortlist</h2>
                  <p className="Livvic-Medium text-[13px] text-[#6B7280] mt-1 inline-flex items-center gap-1.5">
                    <Star size={12} fill={PURPLE} color={PURPLE} />
                    {shortlist.length} potential match{shortlist.length === 1 ? "" : "es"}
                  </p>
                </div>
                <NavLink
                  to="/dashboard"
                  className="shrink-0 Livvic-SemiBold text-[13px] text-white rounded-full px-4 py-2"
                  style={{ background: PURPLE }}
                >
                  Explore all matches →
                </NavLink>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                {shortlist.length ? shortlist.map((card) => (
                  <CompactMatchCard key={card.id} card={card} />
                )) : (
                  <p className="Livvic text-[13px] text-[#6B7280] md:col-span-3">
                    Matches will appear here once Fam has profiles that fit yours.
                  </p>
                )}
              </div>
            </section>

            <section className="bg-white border border-[#ECECEC] rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="Livvic-Bold text-[22px] text-[#001243]">Matches</h2>
                <NavLink to="/dashboard/message" className="Livvic-SemiBold text-[13px]" style={{ color: PURPLE }}>
                  View matches →
                </NavLink>
              </div>
              <p className="Livvic text-[13px] text-[#6B7280] mt-1">
                See and manage the connections you&apos;ve already made.
              </p>
              <p className="Livvic-Bold text-[13px] text-[#001243] mt-2 mb-4">
                {notifications} new notification{notifications === 1 ? "" : "s"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatRow to="/dashboard/message" icon={<Inbox size={16} />} label="Match requests" count={incoming} />
                <StatRow to="/dashboard/message" icon={<MessageCircle size={16} />} label="Messages" count={unread} />
                <StatRow to="/dashboard/message" icon={<Send size={16} />} label="Pending requests" count={outgoing} />
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="bg-white border border-[#ECECEC] rounded-2xl p-5">
              <h3 className="Livvic-Bold text-[16px] text-[#001243] mb-2">Invite someone to FamLink</h3>
              <p className="Livvic text-[13px] text-[#6B7280] mb-4 leading-relaxed">
                Know another family or nanny who could benefit from sharing care?
              </p>
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="w-full Livvic-SemiBold text-[14px] text-white rounded-xl py-3 bg-[#001243]"
              >
                Invite to FamLink →
              </button>
            </div>

            <div className="bg-white border border-[#ECECEC] rounded-2xl p-5">
              <p className="text-[11px] tracking-wide text-[#9CA3AF] Livvic-SemiBold mb-1">FAMLINK TOOLKIT</p>
              <h3 className="Livvic-Bold text-[16px] text-[#001243] mb-1">Learn & Get Help</h3>
              <p className="Livvic text-[13px] text-[#6B7280] mb-3">A little more clarity for every step of your share.</p>
              <div className="divide-y divide-[#F3F4F6]">
                {toolkit.map((item) => (
                  <div key={item.title} className="flex items-start gap-3 py-3">
                    <span className="text-[#6D5AE6] mt-0.5">{item.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="Livvic-SemiBold text-[13px] text-[#001243]">{item.title}</p>
                      <p className="Livvic text-[12px] text-[#6B7280]">{item.sub}</p>
                    </div>
                    <ChevronRight size={16} className="text-[#C4C4C4] shrink-0 mt-1" />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
