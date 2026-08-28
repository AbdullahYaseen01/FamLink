import React, { useState } from "react";
import { Calendar, Clock, DollarSign, Home, MapPin } from "lucide-react";
import Avatar from "react-avatar";
import { ShareTypeBadge } from "../../../Config/shareTypeTheme";
import { formatCardAge } from "../../../Config/helpFunction";
import { formatDisplayName } from "../../matchesHelpers";
import { formatScheduleDays } from "../../../Config/scheduleFormat";
import "../../../Components/subComponents/profileCardUpgraded.css";

/* ── Icons ── */
export const ClockIcon = () => (
  <Clock className="text-[#6366F1] w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0"/>
);
export const MapPinIcon = () => (
  <MapPin className="text-[#F59E0B] w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0"/>
);
export const HomeIcon = () => (
  <Home className="text-[#F97316] w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0"/>
);
export const CalendarIcon = () => (
  <Calendar className="text-[#3B82F6] w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0"/>
);
export const DollarIcon = () => (
  <DollarSign className="text-[#10B981] w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0"/>
);
export const BabyIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d="M9 12h.01" /><path d="M15 12h.01" /><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" /><path d="M17.4 15A6.8 6.8 0 0 0 19 11a7 7 0 0 0-14 0 6.8 6.8 0 0 0 1.6 4" /><path d="M12 4v.01" />
    </svg>
);
export const UsersIcon = ({ color = "#5fbfff", size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
);
export const HeartIcon = ({ filled }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "#EF4444" : "none"} stroke={filled ? "#EF4444" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
);
export const ChevronRightIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);
export const LockIcon = ({ size = 15, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
);

export function MetaItem({ icon, line1, line2 }) {
    return (
        <div className="flex items-start gap-1.5 min-w-0">
            {icon}
            <div className="flex flex-col justify-start leading-tight min-w-0">
                <span className="text-xs Livvic-Medium text-[#202020] truncate">{line1}</span>
                {line2 && <span className="text-[10px] text-[#888] Livvic-Medium truncate">{line2}</span>}
            </div>
        </div>
    );
}

function compactCareLabel(raw) {
    const s = String(raw || "").toLowerCase();
    if (s.includes("full")) return "Full-time";
    if (s.includes("part")) return "Part-Time";
    return raw || "Flexible";
}

function compactDays(schedule) {
    if (!schedule) return "Mon-Fri";
    if (typeof schedule === "string") {
        const t = schedule.toLowerCase();
        if (!t.includes("sat") && !t.includes("sun")) return "Mon-Fri";
        return schedule.replace(/Mon–Fri/gi, "Mon-Fri");
    }
    const checked = Object.entries(schedule)
        .filter(([, v]) => v === true || v?.checked)
        .map(([k]) => k.toLowerCase());
    if (!checked.length) return "Mon-Fri";
    if (!checked.includes("saturday") && !checked.includes("sunday")) return "Mon-Fri";
    return formatScheduleDays(schedule) || "Mon-Fri";
}

function compactLocation(loc) {
    if (!loc) return "";
    if (typeof loc === "string") return loc;
    const n = String(loc.neighborhood || "").trim();
    const c = String(loc.city || "").trim();
    return n || c || "";
}

// Converter function to map from Chat's dynamic match format to MatchCard format
export const convertChatMatchToMatchCardProps = (chatMatch, delayIndex = 0) => {
    const { type, props } = chatMatch;
    let variant = "familyLooking";
    if (type === "Family") {
        variant = props.hasNanny ? "familyHasNanny" : "familyLooking";
    } else {
        variant = props.hasFamily ? "nannyHasFamily" : "nannyLooking";
    }

    const headingParts = [];
    if (type === "Family") {
        headingParts.push(`${props.childrenCount} Child${props.childrenCount === 1 ? "" : "ren"}`);
    } else {
        if (props.experience) headingParts.push(props.experience);
        if (props.ages && props.ages.length > 0) headingParts.push(props.ages.map(formatCardAge).filter(Boolean).join(" · "));
    }

    let scheduleDetail = "";
    if (props.schedule) {
        const days = Object.entries(props.schedule).filter(([_, v]) => v).map(([k, _]) => k.slice(0, 3).charAt(0).toUpperCase() + k.slice(1, 3));
        if (days.length === 5 && !props.schedule.saturday && !props.schedule.sunday) {
            scheduleDetail = "Mon–Fri";
        } else {
            scheduleDetail = days.join(", ");
        }
    }

    let schedule = "Part-Time";
    if (props.careType) {
        schedule = props.careType.includes("full-time") ? "Full-Time" : "Part-Time";
    }

    return {
        id: props.id,
        name: props.name,
        variant,
        headingParts,
        schedule,
        scheduleDetail,
        location: { neighborhood: "", city: props.location?.city || props.zipCode || "" },
        hosting: props.hosting || null,
        start: props.start || "Flexible",
        rate: { total: props.soloRate, perFamily: props.sharedRate },
        delay: `delay-[${delayIndex * 80}ms]`,
    };
};

// Converter function to map from backend API profiles to MatchCard format
export const convertRealProfileToMatchCardProps = (profile, type, delayIndex = 0) => {
    // Helper to safely extract from additionalInfo
    const getInfo = (key) => {
        if (profile[key]) return profile[key];
        const info = profile.additionalInfo?.find(i => i.key === key);
        return info ? (info.value?.option || info.value) : null;
    };

    const childN =
      Number(profile.numberOfChildren) ||
      Number(profile.childrenCount) ||
      (Array.isArray(profile.childrenAges) ? profile.childrenAges.length : 0) ||
      Number(getInfo("NoOfChildren")) ||
      1;
    const experience = getInfo("experience");
    const ageGroupsExp = getInfo("ageGroupsExp");
    const haveNanny = getInfo("haveNanny");
    const alreadyHaveFamily = getInfo("alreadyHaveFamily");
    const avaiForWorking = getInfo("avaiForWorking");
    const rawSchedule = getInfo("schedule");

    let variant = "familyLooking";
    if (type === "Parents" || type === "Family") {
        variant = haveNanny === "Yes" || haveNanny === true || profile.hasNanny ? "familyHasNanny" : "familyLooking";
    } else {
        variant = alreadyHaveFamily === "Yes" || alreadyHaveFamily === true || profile.hasFamily ? "nannyHasFamily" : "nannyLooking";
    }

    const headingParts = [];
    if (type === "Parents" || type === "Family") {
        headingParts.push(`${childN} Child${childN === 1 ? "" : "ren"}`);
    } else {
        if (experience) headingParts.push(experience);
        if (Array.isArray(ageGroupsExp) && ageGroupsExp.length > 0) headingParts.push(ageGroupsExp.map(formatCardAge).filter(Boolean).join(" · "));
    }

    const careRaw = type === "Nanny"
        ? (Array.isArray(avaiForWorking) ? avaiForWorking.join(", ") : avaiForWorking)
        : getInfo("careType");
    const schedule = compactCareLabel(careRaw);
    const scheduleDetail = compactDays(profile.specificDays || rawSchedule);

    // Default rate values from DB
    const salaryRange = getInfo("salaryRange") || getInfo("salaryExp");
    
    let rateString = "Flexible";
    if (salaryRange && typeof salaryRange === 'object') {
        const rates = Object.values(salaryRange).map(Number).filter(n => !isNaN(n));
        if (rates.length > 0) rateString = `$${Math.min(...rates)} - $${Math.max(...rates)}/hr`;
    } else if (typeof salaryRange === 'string') {
        rateString = salaryRange;
    }

    // Handle backend returning full 'name' or separate 'firstName'/'lastName'
    let formattedName = formatDisplayName(profile.name) || "Unknown";
    if (!profile.name && profile.firstName) {
        formattedName = formatDisplayName(`${profile.firstName} ${profile.lastName || ""}`) || profile.firstName;
    }

    return {
        id: profile._id,
        name: formattedName,
        variant,
        headingParts,
        schedule,
        scheduleDetail,
        location: {
            neighborhood: typeof profile.location === "object" ? (profile.location?.neighborhood || "") : "",
            city:
                (typeof profile.location === "string" ? profile.location : profile.location?.city) ||
                profile.zipCode ||
                "",
        },
        hosting: profile.nannyShareLocation || null,
        start: profile.start || "Flexible",
        rate: { total: rateString, perFamily: "Negotiable" }, // Adjust perFamily based on what backend provides
        delay: `delay-[${delayIndex * 80}ms]`,
        img: profile.profilePicture || "",
    };
};

export function MatchCard({ match, visible = true, className = "", isInteractive = true, compact = false }) {
    const [favorited, setFavorited] = useState(false);
    const locLine = compactLocation(match.location);
    const isFamily = String(match.variant || "").startsWith("family");
    const detailLine = isFamily
        ? (match.headingParts || []).find((p) => /child/i.test(String(p))) || "1 Child"
        : (match.headingParts || []).map(formatCardAge).filter(Boolean).join(" • ");
    const daysLine = match.scheduleDetail || "Mon-Fri";

    if (compact) {
        return (
            <div className={`
                fl-card !p-3 overflow-hidden
                hover:shadow-[0_4px_16px_rgba(0,18,67,0.09)] transition-shadow duration-150
                ${visible ? "opacity-100" : "opacity-0"}
                ${className}
            `}>
                <ShareTypeBadge variant={match.variant} className="!text-[10px] !px-2 !py-0.5 mb-2 max-w-full" />
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-[62px] h-[62px] rounded-[12px] overflow-hidden shrink-0 bg-[#C8D8FF]">
                        {match.img ? (
                            <img src={match.img} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <Avatar
                                name={match.name}
                                color="#C8D8FF"
                                fgColor="#0D134C"
                                size="62"
                                style={{ borderRadius: "12px", fontWeight: "800", fontFamily: "Livvic" }}
                            />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="Livvic-Bold text-[16px] text-[#0D134C] leading-tight truncate">{match.name}</h3>
                        {detailLine ? (
                            <p className="Livvic text-[13px] text-[#6B7280] leading-snug mt-0.5">{detailLine}</p>
                        ) : null}
                    </div>
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-[#e8ecf4] grid grid-cols-2 gap-3">
                    {match.schedule ? (
                        <span className="inline-flex items-start gap-1.5 min-w-0">
                            <Clock className="text-[#6466e9] w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span className="flex flex-col leading-tight min-w-0">
                                <span className="Livvic-Bold text-[12.5px] text-[#001243] truncate">{match.schedule}</span>
                                <span className="Livvic text-[11px] text-[#6B7280] truncate">{daysLine}</span>
                            </span>
                        </span>
                    ) : null}
                    {locLine ? (
                        <span className="inline-flex items-start gap-1.5 min-w-0">
                            <MapPin className="text-[#eaa541] w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span className="flex flex-col leading-tight min-w-0">
                                <span className="Livvic-Bold text-[12.5px] text-[#001243] truncate">{locLine}</span>
                                <span className="Livvic text-[11px] text-[#6B7280] truncate">{locLine}</span>
                            </span>
                        </span>
                    ) : null}
                </div>
            </div>
        );
    }

    /* Meta items — rendered fields depend on the match variant */
    const metaItems = (
        <>
            <MetaItem icon={<ClockIcon />} line1={match.schedule} line2={match.scheduleDetail} />
            <MetaItem icon={<MapPinIcon />} line1={match.location.neighborhood || match.location.city} line2={match.location.neighborhood ? match.location.city : ""} />
        </>
    );

    return (
        <div className={`
            bg-white border border-[#ECECEC] rounded-2xl overflow-hidden
            transition-all duration-500 ${match.delay || ''}
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
            ${className}
        `}>
            <div className={`flex h-full ${compact ? "flex-col" : "flex-col sm:flex-row sm:items-stretch"}`}>

                {/* LEFT */}
                <div className="flex flex-col flex-1 px-4 py-4 sm:px-5 sm:py-4 md:px-5 md:py-4 min-w-0">
                    <div className="flex gap-4 sm:gap-6">

                        {/* Avatar (initials) */}
                        <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden">
                            <div className="block md:hidden"><Avatar name={match.name} color="#AEC4FF" fgColor="#0D134C" size="80" style={{ borderRadius: '1rem', fontWeight: '900', fontFamily: 'Livvic' }} /></div>
                            <div className="hidden md:block"><Avatar name={match.name} color="#AEC4FF" fgColor="#0D134C" size="96" style={{ borderRadius: '1rem', fontWeight: '900', fontFamily: 'Livvic' }} /></div>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col flex-1 min-w-0">

                            {/* Badge + Heart (mobile only) */}
                            <div className="flex items-start justify-between gap-2 mb-2 md:mb-0.5">
                                <ShareTypeBadge variant={match.variant} className="min-w-0" />

                                {/* Heart — mobile only */}
                                {!compact && (
                                <button
                                    onClick={() => setFavorited(f => !f)}
                                    className="sm:hidden bg-transparent border-none cursor-pointer p-0.5 flex-shrink-0"
                                >
                                    <HeartIcon filled={favorited} />
                                </button>
                                )}
                            </div>

                            {/* Name */}
                            <h2 className="text-base md:text-[17px] font-black Livvic-Bold text-[#0D134C] mb-0 truncate">
                                {match.name}
                            </h2>

                            {/* Heading line — child ages or experience */}
                            <p className="text-[13px] text-[#5D5D5D] flex flex-wrap items-center gap-x-1.5 mb-1.5 md:mb-1">
                                {match.headingParts.map((part, i) => (
                                    <React.Fragment key={i}>
                                        {i > 0 && <span>•</span>}
                                        <span className="Livvic text-[#5D5D5D]">{formatCardAge(part) || part}</span>
                                    </React.Fragment>
                                ))}
                            </p>

                            {/* Meta — desktop */}
                            <div className="hidden sm:flex flex-wrap gap-x-5 gap-y-2">
                                {metaItems}
                            </div>
                        </div>
                    </div>

                    {/* Meta — mobile grid */}
                    <div className="grid grid-cols-1 min-[375px]:grid-cols-2 gap-x-3 gap-y-2 mt-3 sm:hidden">
                        {metaItems}
                    </div>
                </div>



                {!compact && (
                <div className="
                    flex flex-col items-stretch gap-2 px-4 py-3 border-t border-[#ECECEC]
                    sm:border-t-0 sm:flex-col sm:flex-nowrap sm:justify-start sm:px-4 sm:py-4 md:px-5 md:py-4
                    sm:w-[200px] lg:w-[220px] flex-shrink-0 sm:gap-3
                ">
                    {/* Heart — desktop only (top-right) */}
                    <button
                        onClick={() => { if (isInteractive) setFavorited(f => !f); }}
                        className={`hidden sm:block bg-transparent border-none p-1 sm:self-end sm:mb-4 ${isInteractive ? 'cursor-pointer' : 'cursor-default pointer-events-none'}`}
                    >
                        <HeartIcon filled={favorited} />
                    </button>

                    {/* Request Match */}
                    <button className={`
                        flex items-center gap-1.5 justify-center
                        bg-[#AEC4FF] text-[#0D134C] border-none
                        h-10 rounded-xl transition-colors duration-200
                        flex-shrink-0 w-full px-3 text-sm font-bold Livvic-Bold whitespace-nowrap
                        ${isInteractive ? 'cursor-pointer hover:opacity-90' : 'cursor-default pointer-events-none'}
                    `}>
                        <span className="flex shrink-0"><UsersIcon color="#0D134C" size={14} /></span>
                        <span className="Livvic-Bold font-bold">Request a Match</span>
                        <span className="flex shrink-0"><LockIcon size={14} color="#0D134C" /></span>
                    </button>
                </div>
                )}

            </div>
        </div>
    );
}

export default MatchCard;
