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
    <div className="mb-5 w-full">
      <div
        className="relative w-full overflow-hidden rounded-[22px] border border-[#E8ECF4] px-6 py-6 shadow-[0_8px_28px_rgba(16,40,90,0.06)] sm:px-8 sm:py-7"
        style={{ background: "linear-gradient(180deg, #F7F8FF 0%, #FFFFFF 58%)" }}
      >
        <div
          className="pointer-events-none absolute -top-4 right-0 h-[200px] w-[220px]"
          style={{ background: "radial-gradient(ellipse at 80% 0%, rgba(214, 223, 255, 0.9) 0%, rgba(247, 248, 255, 0) 72%)" }}
        />
        <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-2 flex items-center gap-1 Livvic-Bold text-[11px] tracking-[0.14em] text-[#001243]">
              <MapPin size={13} strokeWidth={2.4} className="shrink-0 text-[#E8A03A]" />
              {placeCaps || "YOUR NEIGHBORHOOD"}
            </p>
            <h2 className="Livvic-Bold text-[22px] leading-tight text-[#001243] sm:text-[24px]">
              You’re on the waitlist
            </h2>
            <p className="mt-1.5 max-w-[36rem] Livvic text-[14px] leading-snug text-[#6B7280]">
              We’re building enough local coverage to open matching in your neighborhood.
            </p>
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-[5px] Livvic-Bold text-[10px] tracking-[0.1em] uppercase"
            style={{
              background: "#FFF9E6",
              borderColor: "#E8D7A8",
              color: "#8B6E30",
            }}
          >
            <span className="h-[7px] w-[7px] rounded-full bg-[#8B6E30]" />
            LAUNCHING
          </span>
        </div>

        <div className="mt-5 grid w-full grid-cols-2 items-stretch gap-3">
          {bars.map((b) => (
            <div key={b.title} className="flex h-full min-w-0 w-full flex-col rounded-[14px] border border-[#E8ECF4] bg-white px-4 py-3.5">
              <div className="mb-2.5 flex items-center justify-between Livvic-Bold text-[14px] text-[#001243]">
                <span>{b.title}</span>
                <span>{b.of}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#EEF1F6]">
                <div className="h-full rounded-full bg-[#AEC4FF]" style={{ width: `${b.pct}%` }} />
              </div>
              <p className="mt-2.5 Livvic text-[11px] text-[#6B7280]">{b.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex w-full flex-col gap-4 min-[720px]:flex-row min-[720px]:items-center min-[720px]:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[#E4E8F4] bg-[#F3F5FB]">
              <Hourglass size={18} strokeWidth={2} className="text-[#001243]" />
            </span>
            <div>
              <p className="Livvic-Bold text-[14px] text-[#001243]">We’ll notify you when matching opens</p>
              <p className="mt-0.5 Livvic text-[13px] text-[#6B7280]">
                You’ll get an update as soon as matching is ready in your area.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#DDE6FF] px-5 Livvic-Bold text-[14px] text-[#001243]"
          >
            <Send size={16} strokeWidth={2.2} />
            Help {hoodShort} launch
          </button>
        </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 px-0.5">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="Livvic-Bold text-[14px] text-[#001243]"
        >
          Explore Matches →
        </button>
        <span className="text-[14px] text-[#9AA3B5]">·</span>
        <button
          type="button"
          onClick={() => navigate("/nanny-share/oakland-ca")}
          className="Livvic-Bold text-[14px] text-[#001243]"
        >
          Explore other neighborhoods →
        </button>
      </div>
    </div>
  );
}
