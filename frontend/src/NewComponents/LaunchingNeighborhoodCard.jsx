import { useNavigate } from "react-router-dom";
import { Bell, MapPin, Send } from "lucide-react";

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
  const place = [neighborhood, city].filter((p, i, a) => p && a.indexOf(p) === i).join(", ");
  const placeCaps = place.toUpperCase();
  const hoodShort = neighborhood.split(",")[0].trim() || "your neighborhood";

  return (
    <div className="mb-5 w-full">
      <div
        className="relative w-full overflow-hidden rounded-[20px] border border-[#E8ECF4] px-6 py-6 sm:px-8 sm:py-7"
        style={{ background: "linear-gradient(180deg, #F7F8FF 0%, #FFFFFF 55%)" }}
      >
        <div
          className="pointer-events-none absolute -top-6 right-0 h-[180px] w-[200px]"
          style={{ background: "radial-gradient(ellipse at 80% 0%, rgba(214, 223, 255, 0.85) 0%, rgba(247, 248, 255, 0) 72%)" }}
        />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-center gap-1 Livvic-Bold text-[11px] tracking-[0.14em] text-[#001243]">
              <MapPin size={13} strokeWidth={2.4} className="shrink-0 text-[#E8A03A]" />
              {placeCaps || "YOUR NEIGHBORHOOD"}
            </p>
            <span
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-[5px] Livvic-Bold text-[10px] tracking-[0.1em] uppercase"
              style={{ background: "#FFF4E6", color: "#C2410C" }}
            >
              <span className="h-[7px] w-[7px] rounded-full bg-[#EA580C]" />
              LAUNCHING
            </span>
          </div>

          <div className="mt-3 flex items-start justify-between gap-3">
            <h2 className="Livvic-Bold text-[22px] leading-tight text-[#001243] sm:text-[24px]">
              You’re on the waitlist
            </h2>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="shrink-0 Livvic text-[13px] text-[#6B7280] whitespace-nowrap"
            >
              Browse matches while you wait →
            </button>
          </div>
          <p className="mt-1.5 Livvic text-[14px] leading-snug text-[#6B7280]">
            We’re building enough local coverage to open nanny share matching in your neighborhood.
          </p>

          <div className="mt-5 flex w-full items-stretch gap-2.5">
            <div className="flex min-w-0 flex-1 flex-col rounded-[12px] bg-[#EEF2FF] px-4 py-3.5">
              <p className="Livvic text-[14px] text-[#001243]">
                <span className="Livvic-Bold">{families}</span>
                {` of ${familyNeed} Families joined`}
              </p>
              <p className="mt-0.5 Livvic text-[12px] text-[#6B7280]">{familiesLeft} more needed</p>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#E5E9F2]">
                <div className="h-full rounded-full bg-[#C7D2FE]" style={{ width: `${Math.min(100, (families / familyNeed) * 100)}%` }} />
              </div>
            </div>
            <span className="self-center Livvic-Bold text-[20px] text-[#6B7280]">+</span>
            <div className="flex min-w-0 flex-1 flex-col rounded-[12px] bg-[#EEF2FF] px-4 py-3.5">
              <p className="Livvic text-[14px] text-[#001243]">
                <span className="Livvic-Bold">{nannies}</span>
                {` of ${nannyNeed} Nannies joined`}
              </p>
              <p className="mt-0.5 Livvic text-[12px] text-[#6B7280]">{nanniesLeft} more needed</p>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#E5E9F2]">
                <div className="h-full rounded-full bg-[#C7D2FE]" style={{ width: `${Math.min(100, (nannies / nannyNeed) * 100)}%` }} />
              </div>
            </div>
          </div>

          <p className="mt-5 text-center Livvic-Medium text-[14px] text-[#001243]">
            {familiesLeft} more {familiesLeft === 1 ? "family" : "families"} & {nanniesLeft} more{" "}
            {nanniesLeft === 1 ? "nanny" : "nannies"} unlock your neighborhood
          </p>
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={onShare}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#DDE6FF] px-5 Livvic-Bold text-[14px] text-[#001243]"
            >
              <Send size={15} strokeWidth={2.2} />
              Help {hoodShort} launch faster
            </button>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#E8ECF4] pt-4">
            <p className="flex min-w-0 items-center gap-2 Livvic text-[13px] text-[#001243]">
              <Bell size={16} strokeWidth={2} className="shrink-0 text-[#001243]" />
              We’ll notify you the moment matching opens
            </p>
            <button
              type="button"
              onClick={() => navigate("/nanny-share/oakland-ca")}
              className="shrink-0 Livvic-Bold text-[13px] text-[#001243] whitespace-nowrap"
            >
              Explore other neighborhoods →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
