import React, { useEffect, useState } from "react";

const mockMatches = [
    {
        id: 1,
        name: "The Miller Family",
        neighborhood: "Brooklyn Heights",
        kids: "2 Children (Toddler & Infant)",
        schedule: "Full-time",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Miller",
        initials: "MF",
        color: "#E8F4F0",
        delay: "0ms",
    },
    {
        id: 2,
        name: "Sarah & Tom",
        neighborhood: "Park Slope",
        kids: "1 Child (Preschool)",
        schedule: "Part-time",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        initials: "ST",
        color: "#F0EEF8",
        delay: "80ms",
    },
    {
        id: 3,
        name: "The Garcia Family",
        neighborhood: "Williamsburg",
        kids: "1 Child (Infant)",
        schedule: "Flexible",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Garcia",
        initials: "GF",
        color: "#FEF4EC",
        delay: "160ms",
    },
];

function MatchCard({ match, index, visible }) {
    return (
        <div
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(24px)",
                transition: `opacity 0.5s ease ${match.delay}, transform 0.5s ease ${match.delay}`,
            }}
            className="relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
        >
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-gray-600 overflow-hidden"
                    style={{ backgroundColor: match.color }}
                >
                    <img src={match.image} alt={match.name} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <p className="Livvic-SemiBold text-primary text-base">{match.name}</p>
                        <div className="flex items-center gap-1 text-gray-400 text-xs Livvic">
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {match.neighborhood}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 Livvic">
                            👶 {match.kids}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 Livvic">
                            🕐 {match.schedule}
                        </span>
                    </div>

                    <button
                        className="w-full py-2.5 rounded-full text-sm Livvic-SemiBold text-primary transition-all duration-200 active:scale-95"
                        style={{ backgroundColor: "var(--color-primary, #AEC4FF)" }}
                    >
                        Request Match
                    </button>
                </div>
            </div>
        </div>
    );
}

const Screen2 = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        const t = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="pb-12">
            {/* Header */}
            <div
                style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(-16px)",
                    transition: "opacity 0.4s ease, transform 0.4s ease",
                }}
                className="text-center px-4 mb-8"
            >
                <p className="text-primary Livvic-Bold text-4xl mb-2">
                    Matches Near You
                </p>
                <p className="text-gray-400 Livvic text-sm">
                    Families looking for the same care you offer
                </p>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-4 px-4 max-w-lg mx-auto">
                {mockMatches.map((match, i) => (
                    <MatchCard key={match.id} match={match} index={i} visible={visible} />
                ))}
            </div>
        </div>
    );
};

export default Screen2;
