import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "react-avatar";
import { Bell, ChevronRight, Clock, Heart, Inbox, MapPin, MessageCircle, Send, Smile, Users } from "lucide-react";
import { viewCurrentUserProfileThunk, viewNannyShareProfileThunk } from "../Components/Redux/nannyShareSlice";
import { getIncomingRequestsThunk, getOutgoingRequestsThunk } from "../Components/Redux/matchSlice";
import { getChatsThunk } from "../Components/Redux/chatSlice";
import { getVariantTheme } from "../Config/shareTypeTheme";
import { SHARE_TYPE_GOALS, variantFromProfile } from "../Config/shareTypeGoals";
import { CARE_TYPE_LABELS, formatScheduleDays } from "../Config/scheduleFormat";
import { formatDisplayName } from "./matchesHelpers";
import { formatCardAge, isBrowseReadyProfile } from "../Config/helpFunction";
import { ReferAFriendModal } from "./ReferAFriendModal";
import { ShareProfileModal } from "./ShareProfile/ShareProfileModal";

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

function formatAge(a) {
  return formatCardAge(a);
}

function childrenLabel(profile) {
  const ages = profile?.childrenAges;
  const list = Array.isArray(ages) ? ages : [];
  const count = list.length || Number(profile?.numberOfChildren) || 0;
  if (!count) return "Family";
  const ageStr = list.map(formatAge).filter((s) => s && s !== "[object Object]").join(" · ");
  const kids = `${count} Child${count > 1 ? "ren" : ""}`;
  return ageStr ? `${kids} · ${ageStr}` : kids;
}

function HomeShareTypeBadge({ variant, className = "" }) {
  const g = SHARE_TYPE_GOALS[variant];
  if (!g) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 Livvic-Bold rounded-full px-2.5 py-1 text-[11px] whitespace-nowrap shrink-0 ${className}`}
      style={{ backgroundColor: g.theme.bg, color: g.theme.text }}
    >
      <Users size={12} strokeWidth={2.2} className="shrink-0" />
      <span className="whitespace-nowrap">
        {g.role}
        <span className="opacity-40 mx-1">·</span>
        {g.goal}
      </span>
    </span>
  );
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
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
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
    userId: u._id,
    href: isFamily
      ? `/dashboard/family-profile-view/${u._id}`
      : `/dashboard/nanny-profile-view/${u._id}`,
    name: isFamily && /family/i.test(u.name || "") ? u.name : formatDisplayName(u.name),
    img: u.imageUrl || profile.imageFile,
    variant,
    details: isFamily ? childrenLabel(profile) : (profile.careExperience || "Nanny"),
    schedule: careLabel(profile),
    scheduleDays: formatScheduleDays(profile?.specificDays) || "",
    neighborhood: (u.location || {}).neighborhood || "",
    city: (u.location || {}).city || locationLabel(u.location),
  };
}

function ShortlistRow({ card }) {
  const theme = getVariantTheme(card.variant) || { bg: "#AEC4FF", text: "#0D134C" };
  return (
    <NavLink to={card.href} className="bg-white border border-[#ECECEC] rounded-2xl p-3.5 h-full block hover:shadow-[0_4px_16px_rgba(0,18,67,0.08)] transition-shadow">
      <HomeShareTypeBadge variant={card.variant} className="mb-2.5" />
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full overflow-hidden shrink-0" style={{ backgroundColor: theme.bg }}>
          {card.img ? (
            <img src={card.img} alt="" className="w-full h-full object-cover" />
          ) : (
            <Avatar name={card.name} size="44" color={theme.bg} fgColor={theme.text} className="Livvic-Bold" />
          )}
        </div>
        <div className="min-w-0">
          <p className="Livvic-Bold text-[15px] text-[#001243] truncate leading-tight">{card.name}</p>
          <p className="Livvic text-[12px] text-[#6B7280] truncate mt-0.5">{card.details}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
            <span className="inline-flex items-center gap-1 min-w-0">
              <Clock size={13} className="text-[#6366F1] shrink-0" />
              <span className="Livvic text-[12px] text-[#001243] truncate">{card.schedule}</span>
            </span>
            {card.city || card.neighborhood ? (
              <span className="inline-flex items-center gap-1 min-w-0">
                <MapPin size={13} className="text-[#F59E0B] shrink-0" />
                <span className="Livvic text-[12px] text-[#001243] truncate">{card.neighborhood || card.city}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </NavLink>
  );
}

function StatRow({ to, icon, label, count }) {
  return (
    <NavLink
      to={to}
      className="flex items-center gap-3 bg-white border border-[#E5E7EB] rounded-xl px-4 py-3.5 min-w-0"
    >
      <span className="w-9 h-9 rounded-[10px] bg-[#AEC4FF] text-[#001243] flex items-center justify-center shrink-0">
        {icon}
      </span>
      <span className="Livvic-SemiBold text-[14px] text-[#001243] flex-1 truncate">{label}</span>
      <span className="w-6 h-6 rounded-full bg-[#EFEFEF] Livvic-SemiBold text-[12px] text-[#6B7280] flex items-center justify-center shrink-0">
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
  const isNanny = user?.type === "Nanny";
  const profile = currentProfile;
  const viewerLoc = user?.location || profile?.userId?.location;
  const percent = completenessPercent(user, profile);
  const viewerVariant = variantFromProfile(isNanny ? "Nanny" : "Family", {
    hasNanny: profile?.hasNanny ?? user?.hasNanny,
    hasFamily: profile?.hasFamily ?? user?.hasFamily,
  });
  const firstName = String(user?.name || "").trim().split(/\s+/)[0] || "You";
  const shortlist = useMemo(
    () => (Array.isArray(data) ? data : []).filter(isBrowseReadyProfile).slice(0, 3).map(compactFromBrowse),
    [data]
  );
  const incoming = incomingMatches?.length || 0;
  const outgoing = outgoingMatches?.length || 0;
  const unread = chatList.reduce((n, c) => n + (c?.unReadMessages > 0 ? 1 : 0), 0);
  const notifications = incoming + unread;
  const viewerTheme = getVariantTheme(viewerVariant) || { bg: "#AEC4FF", text: "#0D134C" };

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
    { color: "#E11D48", bg: "#FFE4E8", icon: <Heart size={18} strokeWidth={2} />, title: "How matching works", sub: "See how Fam finds and evaluates matches." },
    { color: "#16A34A", bg: "#DCFCE7", icon: <Smile size={18} strokeWidth={2} />, title: "Ways a nanny share can come together", sub: "See which family and nanny profiles can connect." },
    { color: "#EA580C", bg: "#FFEDD5", icon: <Bell size={18} strokeWidth={2} />, title: "Get personalized help", sub: "Meet FamLink Concierge." },
  ];

  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      {inviteOpen && (isNanny ? (
        <ReferAFriendModal onClose={() => setInviteOpen(false)} />
      ) : (
        <ShareProfileModal onClose={() => setInviteOpen(false)} />
      ))}

      <div className="padding-navbar1 max-w-[1180px] mx-auto px-4 sm:px-6 py-10">
        <h1 className="Livvic-Bold text-[34px] sm:text-[42px] text-[#001243] leading-tight tracking-tight">
          Let&apos;s find your <span className="text-[#AEC4FF]">Share!</span>
        </h1>
        <p className="Livvic text-[15px] text-[#6B7280] mt-2 mb-8">
          Meet the people, possibilities, and support that make shared care work.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
          <div className="min-w-0 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(200px,0.85fr)_minmax(0,1.7fr)] gap-4 items-stretch">
              <div className="bg-[#E8EEF9] rounded-2xl p-4 shadow-sm flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <img src="/logo3.png" alt="" className="w-5 h-5 object-contain" />
                  <span className="Livvic-Bold text-[14px] text-[#001243]">Fam</span>
                  <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                </div>
                <p className="Livvic-Bold text-[16px] text-[#001243] mb-1 leading-snug">One more step to complete your profile</p>
                <p className="Livvic text-[13px] text-[#6B7280] leading-relaxed">
                  Finish your profile so I can begin finding compatible matches for you.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex gap-4 items-center">
                  <div className="w-[72px] h-[72px] rounded-[12px] overflow-hidden shrink-0" style={{ backgroundColor: viewerTheme.bg }}>
                    {user?.imageUrl ? (
                      <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Avatar name={user?.name || "You"} size="72" color={viewerTheme.bg} fgColor={viewerTheme.text} className="Livvic-Bold" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <HomeShareTypeBadge variant={viewerVariant} className="mb-1.5" />
                    <p className="Livvic-Bold text-[16px] text-[#001243] truncate">
                      {isNanny ? firstName : `${firstName}'s family`}
                    </p>
                    <p className="Livvic text-[13px] text-[#6B7280] truncate">
                      {isNanny ? (profile?.careExperience || "Nanny") : childrenLabel(profile)}
                    </p>
                    <div className="flex flex-wrap gap-x-4 mt-1.5 text-[13px] text-[#6B7280] Livvic">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={14} className="text-[#6366F1]" />
                        {careLabel(profile)}
                      </span>
                      {locationLabel(viewerLoc) ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={14} className="text-[#F59E0B]" />
                          {locationLabel(viewerLoc)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col justify-center shrink-0 w-[140px] pl-4 border-l border-[#E8E8E8]">
                    <p className="Livvic-SemiBold text-[12px] text-[#6B7280] mb-1.5">Profile complete</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
                        <div className="h-full rounded-full bg-[#7DD3FC]" style={{ width: `${Math.min(percent, 100)}%` }} />
                      </div>
                      <span className="Livvic-Bold text-[12px] text-[#001243]">{percent}%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(completeHref)}
                      className="Livvic-SemiBold text-[12px] text-[#6B7280] mt-2 text-left hover:text-[#001243]"
                    >
                      Complete profile →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <section>
              <div className="flex items-start justify-between gap-3 mb-1">
                <h2 className="Livvic-Bold text-[20px] text-[#001243]">Your match shortlist</h2>
                <NavLink
                  to="/dashboard"
                  className="Livvic-SemiBold text-[13px] text-[#001243] bg-[#AEC4FF] rounded-full px-4 py-2 whitespace-nowrap shrink-0 hover:bg-[#9db4f7]"
                >
                  Explore all matches →
                </NavLink>
              </div>
              <p className="Livvic-Medium text-[13px] text-[#6B8AFF] mb-3">★ {shortlist.length} potential matches</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {shortlist.length ? shortlist.map((card) => (
                  <ShortlistRow key={card.id} card={card} />
                )) : (
                  <p className="Livvic text-[13px] text-[#6B7280] sm:col-span-3 px-1 py-4">
                    Matches will appear here once Fam has profiles that fit yours.
                  </p>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between gap-3 mb-1">
                <h2 className="Livvic-Bold text-[20px] text-[#001243]">Matches</h2>
                <NavLink
                  to="/dashboard/message"
                  className="Livvic-SemiBold text-[13px] text-[#001243] bg-[#AEC4FF] rounded-full px-4 py-2 whitespace-nowrap shrink-0 hover:bg-[#9db4f7]"
                >
                  View matches →
                </NavLink>
              </div>
              <p className="Livvic text-[13px] text-[#6B7280]">
                See and manage the connections you&apos;ve already made.
              </p>
              <p className="Livvic-SemiBold text-[13px] text-[#6B7280] mb-3">
                {notifications} new notification{notifications === 1 ? "" : "s"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatRow to="/dashboard/message" icon={<Inbox size={16} strokeWidth={2} />} label="Match requests" count={incoming} />
                <StatRow to="/dashboard/message" icon={<MessageCircle size={16} strokeWidth={2} />} label="Messages" count={unread} />
                <StatRow to="/dashboard/message" icon={<Send size={16} strokeWidth={2} />} label="Pending requests" count={outgoing} />
              </div>
            </section>

          </div>

          <aside className="flex flex-col gap-5">
            <div className="bg-white rounded-[22px] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <h3 className="Livvic-Bold text-[22px] leading-snug text-[#000B33] mb-2">Invite someone to FamLink</h3>
              <p className="Livvic text-[15px] text-[#667085] mb-5 leading-relaxed">
                Know another family or nanny who could benefit from sharing care?
              </p>
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="w-full flex items-center justify-between Livvic-SemiBold text-[15px] text-white rounded-full px-5 py-3.5 bg-[#000B33]"
              >
                <span>Invite to FamLink</span>
                <span className="text-[16px]">→</span>
              </button>
            </div>

            <div className="bg-white rounded-[22px] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-2 mb-1.5">
                <img src="/logo3.png" alt="" className="w-4 h-4 object-contain" />
                <p className="text-[11px] tracking-[0.08em] text-[#000B33] Livvic-Bold">FAMLINK TOOLKIT</p>
              </div>
              <h3 className="Livvic-Bold text-[22px] leading-snug text-[#000B33]">Learn &amp; Get Help</h3>
              <p className="Livvic text-[14px] text-[#667085] mt-1 mb-2">A little more clarity for every step of your share.</p>
              <div>
                {toolkit.map((item, i) => (
                  <div
                    key={item.title}
                    className={`flex items-center gap-3 py-3.5 ${i ? "border-t border-[#E6E8EE]" : ""}`}
                  >
                    <span
                      className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                      style={{ backgroundColor: item.bg, color: item.color }}
                    >
                      {item.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="Livvic-Bold text-[14px] text-[#000B33] leading-snug">{item.title}</p>
                      <p className="Livvic text-[12px] text-[#667085] leading-snug mt-0.5">{item.sub}</p>
                    </div>
                    <ChevronRight size={18} strokeWidth={2.5} className="text-[#5B8CFF] shrink-0" />
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
