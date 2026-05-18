import React from "react";

// ── SVG Illustrations ──────────────────────────────────────────────────────────

const EarnMoreIllustration = () => (
  <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <line x1="8" y1="78" x2="112" y2="78" stroke="#f9a8c9" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="12" y="62" width="16" height="16" rx="3" fill="#f9a8c9" />
    <rect x="34" y="52" width="16" height="26" rx="3" fill="#f9a8c9" />
    <rect x="56" y="40" width="16" height="38" rx="3" fill="#f472b6" />
    <rect x="78" y="26" width="16" height="52" rx="3" fill="#d63f78" />
    <path d="M20 58 Q48 35 86 22" stroke="#d63f78" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <path d="M80 18 L88 21 L84 28" stroke="#d63f78" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const TwoFamiliesIllustration = () => (
  <svg viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <polygon points="16,48 48,48 32,28" fill="#f9a8c9" />
    <rect x="16" y="48" width="32" height="30" rx="2" fill="#fce7f3" stroke="#f9a8c9" strokeWidth="1.5" />
    <rect x="26" y="62" width="12" height="16" rx="2" fill="#f472b6" />
    <rect x="18" y="52" width="9" height="8" rx="1.5" fill="#f9a8c9" />
    <path d="M74 32 C74 27 68 25 66 29 C64 25 58 27 58 32 C58 39 66 46 66 46 C66 46 74 39 74 32Z" fill="#f472b6" />
    <polygon points="90,48 126,48 108,26" fill="#d63f78" />
    <rect x="90" y="48" width="36" height="30" rx="2" fill="#fce7f3" stroke="#f9a8c9" strokeWidth="1.5" />
    <rect x="101" y="62" width="13" height="16" rx="2" fill="#f472b6" />
    <rect x="92" y="52" width="9" height="8" rx="1.5" fill="#f9a8c9" />
    <line x1="10" y1="78" x2="130" y2="78" stroke="#f9a8c9" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M48 76 Q70 85 90 76" stroke="#d63f78" strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
  </svg>
);

const MapIllustration = () => (
  <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="5" y="10" width="110" height="75" rx="8" fill="#fdf2f8" opacity="0.9" />
    <line x1="5" y1="50" x2="115" y2="50" stroke="#f9a8c9" strokeWidth="6" />
    <line x1="60" y1="10" x2="60" y2="85" stroke="#f9a8c9" strokeWidth="6" />
    <line x1="5" y1="30" x2="115" y2="70" stroke="#f9a8c9" strokeWidth="4" opacity="0.5" />
    <rect x="15" y="15" width="35" height="28" rx="4" fill="#f472b6" opacity="0.2" />
    <rect x="70" y="55" width="35" height="24" rx="4" fill="#f472b6" opacity="0.2" />
    <path d="M60 8 C53 8 47 14 47 21 C47 31 60 45 60 45 C60 45 73 31 73 21 C73 14 67 8 60 8Z" fill="#d63f78" />
    <circle cx="60" cy="21" r="6" fill="white" />
  </svg>
);

const CalendarIllustration = () => (
  <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="10" y="18" width="85" height="72" rx="8" fill="#fce7f3" stroke="#f9a8c9" strokeWidth="2" />
    <rect x="10" y="18" width="85" height="22" rx="8" fill="#f472b6" />
    <rect x="10" y="30" width="85" height="10" fill="#f472b6" />
    <rect x="30" y="10" width="6" height="16" rx="3" fill="#d63f78" />
    <rect x="69" y="10" width="6" height="16" rx="3" fill="#d63f78" />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <rect key={`r1-${i}`} x={16 + i * 11} y="46" width="8" height="6" rx="1.5" fill="#f9a8c9" opacity="0.7" />
    ))}
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <rect key={`r2-${i}`} x={16 + i * 11} y="57" width="8" height="6" rx="1.5" fill="#f9a8c9" opacity="0.7" />
    ))}
    {[0, 1, 2, 3].map((i) => (
      <rect key={`r3-${i}`} x={16 + i * 11} y="68" width="8" height="6" rx="1.5" fill="#f9a8c9" opacity="0.7" />
    ))}
    <circle cx="90" cy="82" r="14" fill="#d63f78" />
    <path d="M83 82 L88 87 L97 76" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Icons (inline SVG to avoid lucide dependency issues) ───────────────────────

const WalletIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d63f78" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2Z" />
    <circle cx="16" cy="14" r="1.5" fill="#d63f78" stroke="none" />
  </svg>
);

const UsersIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d63f78" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d63f78" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d63f78" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d63f78" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
  </svg>
);

// ── Feature data ───────────────────────────────────────────────────────────────

const features = [
  {
    icon: <WalletIcon />,
    title: "Earn more",
    description: "Nanny share caregivers typically earn 20–30% more than single-family positions.",
    illustration: "icon_growth.png",
  },
  {
    icon: <UsersIcon />,
    title: "One job, two families",
    description: "Work with two families on a consistent schedule instead of juggling multiple jobs.",
    illustration: "icon_homes.png",
  },
  {
    icon: <MapPinIcon />,
    title: "Real matches nearby",
    description: "Connect with families already looking for a nanny share in your area.",
    illustration: "icon_map.png",
  },
  {
    icon: <CalendarIcon />,
    title: "Consistent work",
    description: "Many nanny shares are structured for long-term, reliable care with stable hours.",
    illustration: "icon_calendar.png",
  },
];

// ── Feature Card ───────────────────────────────────────────────────────────────
function FeatureCard({ title, description, illustration }) {
  return (
    <div className="flex flex-col bg-white rounded-2xl p-4 sm:p-5">

      {/* Fixed-height container with padding so no icon touches the edges */}
      <div className="w-full h-32 sm:h-48 flex items-center justify-center p-4 mb-4 flex-shrink-0">
        <img
          src={illustration}
          alt="icon"
          className="max-h-full max-w-full object-contain object-center block"
        />
      </div>

      <h3 className="text-[#1a1a2e] font-semibold text-base sm:text-lg leading-snug mb-1.5">
        {title}
      </h3>

      <p className="text-[#6b7280] text-sm sm:text-base leading-relaxed flex-grow">
        {description}
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function WhyJoinFamLink() {
  return (
    <section className="container w-full pt-12 sm:pt-16 px-4 sm:px-6">
      <div className="">

        {/* Header */}
        <div className="mb-7 sm:mb-9">
          <h2 className="Livvic-Bold text-2xl sm:text-3xl lg:text-4xl xl:text-5xl leading-tight mb-3 sm:mb-4">
            Why join Famlink?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-[#00000099] Livvic-Medium">
            We make it easier to earn more, find great families, and build
            long-term nanny share relationships.
          </p>
        </div>

        {/* Feature grid — 2 cols on mobile, 4 on md+ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 mb-8 sm:mb-10">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>

      </div>
    </section>
  );
}