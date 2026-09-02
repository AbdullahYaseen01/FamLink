import { Bell, MapPin, Search, Send } from "lucide-react";
import StatusPill from "./StatusPill";
import { LaunchProgressSection } from "./LaunchProgressRows";

export default function LaunchingNeighborhoodCard({ onShare, onBrowse, launch }) {
  const neighborhood = launch?.neighborhood || "Your neighborhood";
  const city = launch?.city || "";
  const families = launch?.families ?? 0;
  const nannies = launch?.nannies ?? 0;
  const familyNeed = launch?.familyNeed ?? 8;
  const nannyNeed = launch?.nannyNeed ?? 3;
  const locationLabel =
    city && neighborhood && neighborhood !== city ? `${neighborhood}, ${city}` : neighborhood || city;
  const shortNeighborhood =
    neighborhood && neighborhood !== city ? neighborhood : neighborhood || "your neighborhood";

  return (
    <div className="bg-[#F1F3FC] border border-[#E8ECF4] rounded-3xl shadow-[0_4px_20px_rgba(0,18,67,0.08)] px-5 sm:px-8 py-5 sm:py-7 mb-4">
      <div className="flex flex-col min-[900px]:flex-row min-[900px]:items-stretch min-[900px]:justify-between gap-6 min-[900px]:gap-10">
        <div className="flex-1 min-w-0 max-w-[420px]">
          <p className="Livvic-Bold text-[14px] leading-none text-[#001243] mb-3">
            You&apos;re on the waitlist
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
            <h2 className="Livvic-Bold text-[26px] sm:text-[28px] leading-[1.15] tracking-[-0.01em] text-[#001243] inline-flex items-center gap-2.5">
              <MapPin size={16} className="text-[#F97316] shrink-0 -mt-0.5" strokeWidth={2.25} />
              {locationLabel}
            </h2>
            <StatusPill status="launching" />
          </div>

          <p className="Livvic-SemiBold text-[14px] leading-[1.5] text-[#7D8090] mb-6 max-w-[520px] whitespace-nowrap">
            We&apos;re building enough local coverage to open nanny share matching in your neighborhood.
          </p>

          <LaunchProgressSection
            neighborhood={shortNeighborhood}
            families={families}
            nannies={nannies}
            familyNeed={familyNeed}
            nannyNeed={nannyNeed}
          />

          <p className="Livvic-Bold text-[14px] leading-none text-[#001243] inline-flex items-center gap-2 mt-5">
            <Bell size={14} className="text-[#001243] shrink-0" strokeWidth={2.25} />
            We&apos;ll notify you the moment matching opens
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full min-[900px]:w-auto shrink-0 min-[900px]:justify-end min-[900px]:mb-8">
          <button
            type="button"
            onClick={onShare}
            className="w-full inline-flex items-center justify-center gap-2 Livvic-Bold text-[13px] leading-tight text-[#001243] bg-[#C5CAF4] border border-[#ABB4ED] rounded-xl px-5 py-3.5 transition-colors"
          >
            <Send size={14} className="shrink-0" strokeWidth={2.25} />
            Help {shortNeighborhood} launch faster
          </button>
          {onBrowse ? (
            <button
              type="button"
              onClick={onBrowse}
              className="w-full inline-flex items-center justify-center gap-2 Livvic-Bold text-[13px] leading-tight text-[#001243] bg-white border border-[#ABB4ED] rounded-xl px-5 py-3.5 transition-colors"
            >
              <Search size={14} className="shrink-0" strokeWidth={2.25} />
              Browse matches while you wait
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
