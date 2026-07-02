import { MapPin } from "lucide-react";
import React, { useEffect, useState } from "react";

const mockMatches = [
    {
        id: 1,
        familyName: "The Miller Family",
        children: "2 children",
        childAge: "Toddler & Infant",
        goal: "Looking for a Share",
        careType: "Full-time",
        schedule: "Mon–Fri, 8:00am – 5:00pm",
        location: { neighborhood: "Brooklyn Heights", city: "New York", distance: "0.5 miles away" },
        hosting: "Willing to host at our home",
        start: "June 2025",
        sharedRate: "$35–40/hr total",
        perFamily: "$17–20 per family",
        imgBg: "bg-gradient-to-br from-[#c9d6e3] to-[#7a98b0]",
        imgSrc: "https://images.unsplash.com/photo-1641064496126-cf64a61c6fae?w=600&auto=format&fit=crop&q=60",
        badgeColor: "#d9f0ff",
        badgeText: "#5fbfff",
        delay: "delay-[0ms]",
        type: "Family",
    },
    {
        id: 2,
        familyName: "Sarah",
        children: "1 child",
        childAge: "Preschool (3-5 years)",
        experience: "3-5 years of experience",
        goal: "Looking for a Share",
        careType: "Part-time",
        schedule: "Mon–Fri, 9:00am – 1:00pm",
        location: { neighborhood: "Park Slope", city: "Brooklyn", distance: "1.2 miles away" },
        hosting: "Happy to travel or co-host",
        start: "May 2025",
        sharedRate: "$32–36/hr total",
        perFamily: "$16–18 per family",
        imgBg: "bg-gradient-to-br from-[#d4b896] to-[#a07850]",
        imgSrc: "https://images.unsplash.com/photo-1685580388390-576100ae9ce3?w=600&auto=format&fit=crop&q=60",
        badgeColor: "#FFF3EA",
        badgeText: "#C4621A",
        delay: "delay-[80ms]",
        type: "Nanny",
    },
    {
        id: 3,
        familyName: "The Garcias Family",
        children: "1 child",
        childAge: "Age 1 (Infant)",
        goal: "Looking for a Share",
        careType: "Flexible",
        schedule: "Mon–Fri, 8:00am – 4:30pm",
        location: { neighborhood: "Williamsburg", city: "Brooklyn", distance: "2.1 miles away" },
        hosting: "Open to hosting or sharing",
        start: "July 2025",
        sharedRate: "$38–42/hr total",
        perFamily: "$19–21 per family",
        imgBg: "bg-gradient-to-br from-[#a8c4a0] to-[#607850]",
        imgSrc: "https://images.unsplash.com/photo-1560066432-efb83eb5f272?w=600&auto=format&fit=crop&q=60",
        badgeColor: "#D9F0FF",
        badgeText: "#5fbfff",
        delay: "delay-[160ms]",
        type: "Family",
    },
];

/* ── Icons ── */
const ClockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
);
const MapPinIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
);
const HomeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);
const CalendarIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);
const DollarIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 010 4H8" /><line x1="12" y1="6" x2="12" y2="8" /><line x1="12" y1="16" x2="12" y2="18" />
    </svg>
);
const UsersIcon = ({ color = "#5fbfff", size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
);
const HeartIcon = ({ filled }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "#EF4444" : "none"} stroke={filled ? "#EF4444" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
);
const ChevronRightIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);
const LockIcon = ({ size = 15, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
);

function MetaItem({ icon, line1, line2 }) {
    return (
        <div className="flex items-center gap-1.5 min-w-0">
            {icon}
            <div className="flex flex-col leading-tight min-w-0">
                <span className="text-xs Livvic-SemiBold text-[#202020] truncate">{line1}</span>
                {line2 && <span className="text-xs text-[#888] truncate">{line2}</span>}
            </div>
        </div>
    );
}

function MatchCard({ match, visible }) {
    const [favorited, setFavorited] = useState(false);

    const metaItems = (
        <>
            <MetaItem icon={<ClockIcon />} line1={match.careType} line2={match.schedule} />
            <MetaItem icon={<MapPinIcon />} line1={`${match.location.neighborhood},`} line2={match.location.city} />
            <MetaItem icon={<HomeIcon />} line1={match.hosting} line2={match.location.distance} />
            <MetaItem icon={<CalendarIcon />} line1="Starting" line2={match.start} />
            <MetaItem icon={<DollarIcon />} line1={match.sharedRate} line2={match.perFamily} />
        </>
    );

    return (
        <div className={`
            bg-white border border-[#ECECEC] rounded-2xl overflow-hidden
            transition-all duration-500 ${match.delay}
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
        `}>
            <div className="flex flex-col sm:flex-row sm:items-stretch">

                {/* LEFT */}
                <div className="flex flex-col flex-1 px-4 py-4 sm:px-5 sm:py-5 min-w-0">
                    <div className="flex gap-3 sm:gap-4">

                        {/* Photo */}
                        <div className="flex-shrink-0">
                            <div className={`
                                w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32
                                rounded-xl ${match.imgBg} overflow-hidden
                            `}>
                                <img
                                    src={match.imgSrc}
                                    alt={match.familyName}
                                    className="object-cover h-full w-full"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col flex-1 min-w-0">

                            {/* Badge + Heart (mobile only) */}
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span
                                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs Livvic-SemiBold flex-shrink-0"
                                    style={{ backgroundColor: match.badgeColor, color: match.badgeText }}
                                >
                                    <UsersIcon color={match.badgeText} size={11} />
                                    {match.type}
                                    <span className="opacity-40">•</span>
                                    {match.goal}
                                </span>

                                {/* Heart — mobile only */}
                                <button
                                    onClick={() => setFavorited(f => !f)}
                                    className="sm:hidden bg-transparent border-none cursor-pointer p-0.5 flex-shrink-0"
                                >
                                    <HeartIcon filled={favorited} />
                                </button>
                            </div>

                            {/* Name */}
                            <h2 className="text-base sm:text-lg Livvic-Bold text-[#0D134C] mb-0.5 truncate">
                                {match.familyName}
                            </h2>

                            {/* Children */}
                            <p className="text-sm text-[#5D5D5D] flex flex-wrap items-center gap-x-1.5 mb-3">
                                <span className="Livvic-SemiBold text-[#202020]">{match.experience ?? match.children}</span>
                                <span>•</span>
                                <span className="Livvic-SemiBold text-[#202020]">{match.childAge}</span>
                            </p>

                            {/* Meta — desktop */}
                            <div className="hidden sm:flex flex-wrap gap-x-5 gap-y-2">
                                {metaItems}
                            </div>
                        </div>
                    </div>

                    {/* Meta — mobile grid */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-3 sm:hidden">
                        {metaItems}
                    </div>
                </div>

                {/* VERTICAL DIVIDER — desktop */}
                <div className="hidden sm:block w-px bg-[#ECECEC] my-4 flex-shrink-0" />
                {/* HORIZONTAL DIVIDER — mobile */}
                <div className="block sm:hidden h-px bg-[#ECECEC] mx-4" />

                {/* RIGHT PANEL */}
                <div className="
                    flex items-center justify-between gap-2 px-4 py-3
                    sm:flex-col sm:justify-start sm:p-4
                    sm:w-[200px] flex-shrink-0 sm:gap-3
                ">
                    {/* Heart — desktop only (top-right) */}
                    <button
                        onClick={() => setFavorited(f => !f)}
                        className="hidden sm:block bg-transparent border-none cursor-pointer p-1 sm:self-end sm:mb-4"
                    >
                        <HeartIcon filled={favorited} />
                    </button>

                    {/* View Details */}
                    <button className="
                        flex items-center gap-1 bg-transparent border-none cursor-pointer
                        text-[#0D134C] Livvic-SemiBold text-sm whitespace-nowrap mb-2
                    ">
                        View Details
                        <ChevronRightIcon />
                    </button>

                    {/* Request Match */}
                    <button className="
                        flex items-center gap-1.5 justify-center
                        bg-[#38AEE3] hover:bg-[#2a9fd4] text-white border-none
                        px-3 sm:px-5 py-2.5 sm:py-3 md:py-4
                        rounded-xl cursor-pointer transition-colors duration-200
                        flex-shrink-0 sm:w-full text-sm Livvic-SemiBold whitespace-nowrap
                    ">
                        <span className="flex shrink-0"><UsersIcon color="#fff" size={14} /></span>
                        <span className="Livvic-Medium">Request Match</span>
                        <span className="flex shrink-0"><LockIcon size={14} color="#fff" /></span>
                    </button>
                </div>

            </div>
        </div>
    );
}

const Screen2 = ({ onCreateAccount, location = { neighborhood: "Brooklyn Heights", city: "New York" }, distance = "10 miles" }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        const t = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="min-h-screen pb-24 bg-white">

            {/* HEADER */}
            <div className={`
                max-w-3xl mx-auto px-4 sm:px-6 pb-5
                transition-all duration-500
                ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}
            `}>
                <div className="flex items-start gap-3 mb-2">
                    <h1 className="Livvic-Bold text-2xl sm:text-3xl text-[#1E1B4B] leading-snug flex-1">
                        Great news! We found compatible nanny share matches.
                    </h1>
                    <span className="text-2xl text-[#818CF8] flex-shrink-0 mt-1">✦✦</span>
                </div>
                <p className="text-base text-[#6B7280] leading-relaxed mb-4">
                    Create your account to view full details, send requests, and start connecting.
                </p>
                <div className="flex items-center gap-5">
                    <span className="Livvic-Bold text-base text-[#1E1B4B]">Matches near you</span>
                    <span className="flex items-center gap-1 text-sm text-[#6B7280]">
                        <MapPin size={14} />
                        {location.neighborhood ? `${location.neighborhood}, ${location.city}` : location.city} (within {distance})
                    </span>
                </div>
            </div>

            {/* CARDS */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col gap-4">
                {mockMatches.map(match => (
                    <MatchCard key={match.id} match={match} visible={visible} />
                ))}
            </div>

            {/* STICKY BOTTOM BANNER */}
            <div className={`
                fixed bottom-0 left-0 right-0 z-50
                bg-[#3730A3] px-4 sm:px-7 py-3.5
                flex items-center justify-between gap-3
                transition-opacity duration-500 delay-[400ms]
                ${visible ? "opacity-100" : "opacity-0"}
            `}>
                <div className="flex items-center gap-2">
                    <LockIcon size={16} color="#fff" />
                    <span className="Livvic-Bold text-sm text-white leading-tight">
                        Create account to unlock matches
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="hidden sm:block text-sm text-[#C7D2FE]">
                        Join Famlink to message, connect, and build your nanny share.
                    </span>
                    <button
                        onClick={onCreateAccount}
                        className="bg-white text-[#3730A3] Livvic-Bold text-sm border-none rounded-lg px-4 py-2.5 cursor-pointer whitespace-nowrap hover:bg-gray-100 transition-colors"
                    >
                        Create Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Screen2;