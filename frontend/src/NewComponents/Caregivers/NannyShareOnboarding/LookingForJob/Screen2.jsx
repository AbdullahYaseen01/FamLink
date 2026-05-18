import { MapPin } from "lucide-react";
import React, { useEffect, useState } from "react";

const matches = [
  {
    id: 1,
    familyName: "The Johnson Family",
    children: "1 child",
    childAge: "Age 2",
    goal: "Looking for a Share",
    careType: "Full-time",
    schedule: "Mon–Fri, 8:30am – 5:30pm",
    location: { neighborhood: "Rockridge", city: "Oakland", distance: "0.7 miles away" },
    hosting: "Willing to host at our home",
    start: "June 2025",
    sharedRate: "$35–40/hr total",
    perFamily: "$17–20 per family",
    imgBg: "bg-gradient-to-br from-[#c9d6e3] to-[#7a98b0]",
    delay: "delay-[0ms]",
    imgSrc: "https://images.unsplash.com/photo-1641064496126-cf64a61c6fae?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8ZmFtaWx5JTIwcG9ydGFyaXR8ZW58MHx8MHx8fDI%3D"
  },
  {
    id: 2,
    familyName: "The Martinez Family",
    children: "2 children",
    childAge: "Ages 4 & 7",
    goal: "Looking for a Share",
    careType: "After-school",
    schedule: "Mon–Fri, 3:00pm – 6:00pm",
    location: { neighborhood: "Temescal", city: "Oakland", distance: "1.2 miles away" },
    hosting: "Willing to host at our home",
    start: "May 2025",
    sharedRate: "$40–45/hr total",
    perFamily: "$20–22 per family",
    imgBg: "bg-gradient-to-br from-[#d4b896] to-[#a07850]",
    delay: "delay-[80ms]",
     imgSrc: "https://images.unsplash.com/photo-1685580388390-576100ae9ce3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGZhbWlseSUyMHBvcnRhcml0fGVufDB8fDB8fHwy"
  },
  {
    id: 3,
    familyName: "The Chen Family",
    children: "1 child",
    childAge: "Age 3",
    goal: "Looking for a Share",
    careType: "Full-time",
    schedule: "Mon–Fri, 8:00am – 4:30pm",
    location: { neighborhood: "Piedmont", city: "Oakland", distance: "2.1 miles away" },
    hosting: "Open to hosting or traveling",
    start: "July 2025",
    sharedRate: "$38–42/hr total",
    perFamily: "$19–21 per family",
    imgBg: "bg-gradient-to-br from-[#a8c4a0] to-[#607850]",
    delay: "delay-[160ms]",
     imgSrc: "https://images.unsplash.com/photo-1560066432-efb83eb5f272?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGFzaWFuJTIwZmFtaWx5fGVufDB8fDB8fHwy"
  },
];

/* ── Icons ── */
const ClockIcon = ({ className = "" }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`flex-shrink-0 ${className}`}>
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const MapPinIcon = ({ className = "" }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`flex-shrink-0 ${className}`}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const HomeIcon = ({ className = "" }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`flex-shrink-0 ${className}`}>
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const CalendarIcon = ({ className = "" }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`flex-shrink-0 ${className}`}>
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const DollarIcon = ({ className = "" }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`flex-shrink-0 ${className}`}>
    <circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 010 4H8" /><line x1="12" y1="6" x2="12" y2="8" /><line x1="12" y1="16" x2="12" y2="18" />
  </svg>
);
const UsersIcon = ({ color = "#C4621A", size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);
const HeartIcon = ({ filled }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "#EF4444" : "none"} stroke={filled ? "#EF4444" : "#0D134C"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const LockIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);
const PinSmallIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

/* ── MetaItem ── */
function MetaItem({ icon, line1, line2 }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      {icon}
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-sm sm:text-base Livvic-Medium text-[#202020] truncate">{line1}</span>
        {line2 && <span className="text-xs sm:text-sm Livvic-Medium text-[#888] truncate">{line2}</span>}
      </div>
    </div>
  );
}

function MatchCard({ match, visible }) {
  const [favorited, setFavorited] = useState(false);

  const toggleFav = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setFavorited(f => !f);
  };

  /* Meta items — reused in both desktop (inline) and mobile (grid) */
  const metaItems = (
    <>
      <MetaItem
        icon={<ClockIcon />}
        line1={match.careType}
        line2={match.schedule}
      />
      <MetaItem
        icon={<MapPinIcon />}
        line1={`${match.location.neighborhood},`}
        line2={match.location.city}
      />
      <MetaItem
        icon={<HomeIcon />}
        line1={match.hosting}
        line2={match.location.distance}
      />
      <MetaItem
        icon={<CalendarIcon />}
        line1="Starting"
        line2={match.start}
      />
      <MetaItem
        icon={<DollarIcon />}
        line1={match.sharedRate}
        line2={match.perFamily}
      />
    </>
  );

  return (
    <div className={`
      bg-white border border-[#ECECEC] rounded-3xl overflow-hidden
      transition-all duration-500 w-[1300px] ${match.delay}
      ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
    `}>
      {/* ── CARD INNER ── */}
      <div className="flex flex-col md:flex-row md:items-stretch">

        {/* ── LEFT ── */}
        <div className="flex flex-col flex-1 px-4 py-4 sm:px-6 sm:py-5 md:px-7 md:py-6 min-w-0">

          {/* Avatar + top content row */}
          <div className="flex gap-3 sm:gap-5">

            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className={`
                w-24 h-24 sm:w-24 sm:h-24 md:w-36 md:h-36 lg:w-48 lg:h-48
                rounded-2xl ${match.imgBg}
                flex items-center justify-center text-4xl lg:text-6xl
              `}>
                <img src={match.imgSrc} alt="family" className="object-cover h-full w-full rounded-2xl"/>
              </div>
            </div>

            {/* Content beside avatar */}
            <div className="flex flex-col flex-1 min-w-0">

              {/* Badge row + Heart (mobile only) */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 Livvic-Medium bg-[#d9f0ff] text-[#5fbfff] rounded-full px-3 py-1 text-xs sm:text-sm flex-shrink-0">
                  <UsersIcon color="#5fbfff" size={12} className="sm:hidden" />
                  Family
                  <span className="opacity-30">•</span>
                  <span className="Livvic-Medium">{match.goal}</span>
                </span>

                {/* Heart — mobile only */}
                <button
                  onClick={toggleFav}
                  className="md:hidden bg-transparent border-none cursor-pointer p-1 flex-shrink-0"
                >
                  <HeartIcon filled={favorited} />
                </button>
              </div>

              {/* Family name */}
              <h2 className="text-lg sm:text-xl md:text-2xl Livvic-SemiBold text-[#0D134C] mb-1 truncate">
                {match.familyName}
              </h2>

              {/* Children info */}
              <p className="text-sm text-[#5D5D5D] mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="Livvic-Medium text-sm sm:text-base text-[#202020]">{match.children}</span>
                <span>•</span>
                <span className="Livvic-Medium text-sm sm:text-base text-[#202020]">{match.childAge}</span>
              </p>

              {/* Meta items — desktop inline (md+), hidden on mobile */}
              <div className="hidden md:flex flex-wrap gap-x-6 gap-y-3 mt-1">
                {metaItems}
              </div>

            </div>
          </div>

          {/* Meta items — mobile 2-col grid below avatar row */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-3 md:hidden">
            {metaItems}
          </div>

        </div>

        {/* ── VERTICAL DIVIDER (desktop only) ── */}
        <div className="hidden md:block w-px bg-[#E9E9E9] my-4 flex-shrink-0" />

        {/* ── HORIZONTAL DIVIDER (mobile only) ── */}
        <div className="block md:hidden h-px bg-[#E9E9E9] mx-4 sm:mx-5" />

        {/* ── RIGHT PANEL ── */}
        {/* Mobile: horizontal row. Desktop: vertical column */}
        <div className="
          flex items-center justify-between gap-2 px-4 py-3
          md:flex-col md:justify-start md:items-stretch md:p-4
          md:w-[260px] lg:w-[300px] md:gap-3
          flex-shrink-0
        ">

          {/* Heart — desktop only (top-right, self-end) */}
          <button
            onClick={toggleFav}
            className="hidden md:block bg-transparent border-none cursor-pointer p-1 self-end mb-1"
          >
            <HeartIcon filled={favorited} />
          </button>

          {/* View Details */}
          <button className="
            flex items-center mx-auto gap-1 bg-transparent border-none cursor-pointer
            text-[#0D134C] Livvic-SemiBold text-sm whitespace-nowrap
            md:mb-2
          ">
            View Details
            <ChevronRightIcon />
          </button>

          {/* Request a Match button */}
          <button className="
            flex items-center gap-1.5 sm:gap-2 justify-center
            bg-[#38AEE3] hover:bg-[#2a9fd4] text-white border-none
            px-3 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-4
            rounded-xl cursor-pointer transition-colors duration-200
            flex-shrink-0 md:w-full
          ">
            <UsersIcon color="#fff" size={16} />
            <span className="Livvic-SemiBold text-sm sm:text-base whitespace-nowrap text-white">
              Request a Match
            </span>
            <LockIcon size={16} color="#fff" />
          </button>

        </div>
      </div>
    </div>
  );
}

const Screen2 = ({ onCreateAccount, location, distance }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen pb-24">

      {/* HEADER */}
      <div className={`
        max-w-[1100px] mx-auto px-4 sm:px-7 pt-8 pb-5
        transition-all duration-500
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}
      `}>
        <div className="flex items-start gap-3 mb-2">
          <h1 className="Livvic-Bold text-2xl sm:text-[28px] text-[#1E1B4B] leading-snug flex-1">
            Great news! We found compatible nanny share matches near you.
          </h1>
          <span className="text-2xl sm:text-[28px] text-[#818CF8] flex-shrink-0 mt-1">✦✦</span>
        </div>

        <p className="Livvic-Medium text-lg text-[#6B7280] leading-relaxed mb-4">
          Create your account to view full details, send requests, and start connecting.
        </p>

        <div className="flex items-center gap-6">
          <span className="Livvic-Bold text-lg text-[#1E1B4B]">Matches near you</span>
          <span className="flex items-center gap-1 text-lg Livvic-Medium text-[#6B7280]">
            <MapPin />
            {location.neighborhood ? `${location.neighborhood}, ${location.city}` : `${location.city}`} (within {distance})
          </span>
        </div>
      </div>

      {/* CARDS */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-7 flex flex-col gap-4">
        {matches.map(match => (
          <MatchCard key={match.id} match={match} visible={visible} />
        ))}
      </div>

      {/* STICKY BOTTOM BANNER */}
      <div className={`
        fixed bottom-0 left-0 right-0 z-50
        bg-[#3730A3] px-4 sm:px-7 py-3.5
        flex items-center justify-between gap-3 sm:gap-4
        transition-opacity duration-500 delay-[400ms]
        ${visible ? "opacity-100" : "opacity-0"}
      `}>
        <div className="flex items-center gap-2">
          <LockIcon size={18} color="#fff" />
          <span className="Livvic-Bold text-sm sm:text-[15px] text-white leading-tight">
            Create account to unlock matches
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <span className="hidden sm:block Livvic text-sm text-[#C7D2FE]">
            Join Famlink to message, connect, and build your nanny share.
          </span>
          <button
            onClick={onCreateAccount}
            className="bg-white text-[#3730A3] Livvic-Bold text-sm border-none rounded-lg px-4 sm:px-5 py-2.5 cursor-pointer whitespace-nowrap flex-shrink-0 hover:bg-gray-100 transition-colors"
          >
            Create Account
          </button>
        </div>
      </div>

    </div>
  );
};

export default Screen2;