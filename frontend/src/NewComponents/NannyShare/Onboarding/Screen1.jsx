import { Calendar, Clock, DollarSign, Home, MapPin } from "lucide-react";
import React, { useEffect, useState } from "react";
import Avatar from "react-avatar";
import { ShareTypeBadge } from "../../../Config/shareTypeTheme";

/* ── Mock matches ──
   variant drives the badge (color + label, from the shared theme) and which
   fields render:
   - familyLooking / familyHasNanny → child ages, schedule, location, hosting, start date, rate (total + per family)
   - nannyLooking                   → experience, preferred ages, schedule, location, availability date, share rate only
   - nannyHasFamily                 → child ages, schedule, location, hosting, start date, per-family rate
*/
const mockMatches = [
    {
        id: 1,
        name: "Miller",
        variant: "familyLooking",
        headingParts: ["2 Children", "8 Months, 3 Years"],
        schedule: "Full-Time",
        scheduleDetail: "Mon–Fri",
        location: { neighborhood: "Rockridge", city: "Oakland" },
        hosting: "rotating between homes",
        start: "June 15, 2026",
        rate: { total: "~$40–50/hr", perFamily: "~$20–25/hr per family" },
        delay: "delay-[0ms]",
    },
    {
        id: 2,
        name: "Sarah M.",
        variant: "nannyLooking",
        headingParts: ["3–5 Years Experience", "Infant (1–3 years), Preschool (3–5 years)"],
        preferredAges: "Infants, Toddlers, Preschool",
        schedule: "Part-Time",
        scheduleDetail: "Mon–Fri",
        location: { neighborhood: "Grand Lake", city: "Oakland" },
        start: "July 1, 2026",
        rate: { perFamily: "$35–40/hr" },
        delay: "delay-[80ms]",
    },
    {
        id: 3,
        name: "Garcia",
        variant: "familyHasNanny",
        headingParts: ["1 Child", "2 Years"],
        schedule: "Flexible",
        // scheduleDetail: "Weekdays, flexible hours",
        location: { neighborhood: "Temescal", city: "Oakland" },
        hosting: "Rotating Between Homes",
        start: "June 1, 2026",
        rate: { total: "~$45–55/hr", perFamily: "~$22–27/hr per family" },
        delay: "delay-[160ms]",
    },
    {
        id: 4,
        name: "Maria G.",
        variant: "nannyHasFamily",
        headingParts: ["1 Child", "2 Years"],
        schedule: "Full-Time",
        scheduleDetail: "Mon–Fri",
        location: { neighborhood: "Downtown Oakland", city: "Oakland" },
        hosting: "Current Family's Home",
        start: "August 1, 2026",
        rate: { perFamily: "$25–30/hr" },
        delay: "delay-[240ms]",
    },
];

import MatchCard, { LockIcon } from "./MatchCard";

const Screen2 = ({ onCreateAccount, location = { neighborhood: "Rockridge", city: "Oakland" }, distance = "10 miles" }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        const t = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="min-h-screen pb-24 bg-white -mx-10 lg:mx-0">

            {/* HEADER */}
            <div className={`
                max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-5
                transition-all duration-500
                ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}
            `}>
                <div className="flex items-start gap-3 mb-2">
                    <h1 className="Livvic-Bold text-2xl sm:text-3xl lg:text-4xl text-[#1E1B4B] leading-snug flex-1">
                        Great news! We found compatible nanny share matches.
                    </h1>
                    <span className="text-2xl text-[#818CF8] flex-shrink-0 mt-1">✦✦</span>
                </div>
                <p className="Livvic-Medium text-[#6B7280] leading-relaxed mb-4">
                    Create your account to view full details, send requests, and start connecting.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-5">
                    <span className="Livvic-SemiBold text-base text-[#1E1B4B]">Matches near you</span>
                    <span className="flex items-center gap-1 text-sm Livvic-Medium text-[#6B7280]">
                        <MapPin size={14} />
                        {location.neighborhood ? `${location.neighborhood}, ${location.city}` : location.city} (within {distance})
                    </span>
                </div>
            </div>

            {/* CARDS */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-3 sm:gap-4 lg:gap-5">
                {mockMatches.map(match => (
                    <MatchCard key={match.id} match={match} visible={visible} />
                ))}
            </div>

            {/* STICKY BOTTOM BANNER */}
            <div className={`
                fixed bottom-0 left-0 right-0 z-50
                bg-[#3730A3] px-4 sm:px-7 py-3 sm:py-3.5
                flex items-center justify-between gap-2 sm:gap-3
                transition-opacity duration-500 delay-[400ms]
                ${visible ? "opacity-100" : "opacity-0"}
            `}>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <LockIcon size={16} color="#fff" />
                    <span className="Livvic-Bold text-xs sm:text-sm text-white leading-tight truncate">
                        Create account to unlock matches
                    </span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                    <span className="hidden sm:block text-sm text-[#C7D2FE] whitespace-nowrap">
                        Join Famlink to message, connect, and build your nanny share.
                    </span>
                    <button
                        onClick={onCreateAccount}
                        className="bg-white text-[#3730A3] Livvic-Bold text-xs sm:text-sm border-none rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 cursor-pointer whitespace-nowrap hover:bg-gray-100 transition-colors flex-shrink-0"
                    >
                        Create Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Screen2;
