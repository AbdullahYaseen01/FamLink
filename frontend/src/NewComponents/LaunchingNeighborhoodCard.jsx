import { useNavigate } from "react-router-dom";
import { Hourglass, MapPin, Send } from "lucide-react";

export default function LaunchingNeighborhoodCard({ onShare, launch }) {
  const navigate = useNavigate();
  const neighborhood = launch?.neighborhood || "Your neighborhood";
  const city = launch?.city || "";
  const families = launch?.families ?? 0;
  const nannies = launch?.nannies ?? 0;
  const familyNeed = launch?.familyNeed ?? 8;
  const nannyNeed = launch?.nannyNeed ?? 3;
  const familiesLeft = Math.max(0, familyNeed - families);
  const nanniesLeft = Math.max(0, nannyNeed - nannies);
  const place = [neighborhood, city].filter(Boolean).join(", ");
  const placeCaps = place.toUpperCase();
  const hoodShort = neighborhood.split(",")[0].trim() || "your neighborhood";

  const bars = [
    {
      title: "Families",
      of: `${families} of ${familyNeed}`,
      pct: Math.min(100, (families / familyNeed) * 100),
      note: `${familiesLeft} more ${familiesLeft === 1 ? "family" : "families"} to unlock your neighborhood`,
    },
    {
      title: "Nannies",
      of: `${nannies} of ${nannyNeed}`,
      pct: Math.min(100, (nannies / nannyNeed) * 100),
      note: `${nanniesLeft} more ${nanniesLeft === 1 ? "nanny" : "nannies"} to unlock your neighborhood`,
    },
  ];

  return (
    <div className="relative mb-5">
      <div className="pointer-events-none absolute -top-10 right-0 h-40 w-56 rounded-full bg-[#B7C8FF] opacity-50 blur-3xl" />
      <div className="relative rounded-[22px] border border-[#E8ECF4] bg-white px-5 py-5 shadow-[0_8px_28px_rgba(16,40,90,0.06)] sm:px-6 sm:py-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-2 flex items-center gap-1 Livvic-Bold text-[11px] tracking-[0.14em] text-[#001243]">
              <MapPin size={13} strokeWidth={2.4} className="shrink-0 text-[#E8A03A]" />
              {placeCaps || "YOUR NEIGHBORHOOD"}
            </p>
            <h2 className="Livvic-Bold text-[28px] leading-tight text-[#001243] sm:text-[32px]">
              You’re on the waitlist
            </h2>
            <p className="mt-1.5 max-w-[36rem] Livvic text-[14px] leading-snug text-[#8B93A7]">
              We’re building enough local coverage to open matching in your neighborhood.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#F3D5A8] bg-[#FFF6E8] px-3 py-1 Livvic-Bold text-[11px] tracking-[0.08em] text-[#E07A2F]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E07A2F]" />
            LAUNCHING
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 min-[640px]:grid-cols-2">
          {bars.map((b) => (
            <div key={b.title} className="rounded-[14px] border border-[#E8ECF4] bg-white px-4 py-3.5">
              <div className="mb-2.5 flex items-center justify-between Livvic-Bold text-[14px] text-[#001243]">
                <span>{b.title}</span>
                <span>{b.of}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#EEF1F6]">
                <div className="h-full rounded-full bg-[#AEC4FF]" style={{ width: `${b.pct}%` }} />
              </div>
              <p className="mt-2.5 Livvic text-[12px] text-[#8B93A7]">{b.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-4 min-[720px]:flex-row min-[720px]:items-center min-[720px]:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#EEF1F6]">
              <Hourglass size={18} strokeWidth={2} className="text-[#001243]" />
            </span>
            <div>
              <p className="Livvic-Bold text-[14px] text-[#001243]">We’ll notify you when matching opens</p>
              <p className="mt-0.5 Livvic text-[13px] text-[#8B93A7]">
                You’ll get an update as soon as matching is ready in your area.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#C5D4FF] px-5 Livvic-Bold text-[14px] text-[#001243]"
          >
            <Send size={16} strokeWidth={2.2} />
            Help {hoodShort} launch
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 px-1">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="Livvic-Medium text-[14px] text-[#001243]"
        >
          Explore Matches →
        </button>
        <span className="text-[#C5CAD6]">·</span>
        <button
          type="button"
          onClick={() => navigate("/nanny-share/oakland-ca")}
          className="Livvic-Medium text-[14px] text-[#001243]"
        >
          Explore other neighborhoods →
        </button>
      </div>
    </div>
  );
}
