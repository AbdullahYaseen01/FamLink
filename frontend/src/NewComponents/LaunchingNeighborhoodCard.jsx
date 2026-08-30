import { Bell, MapPin, Search, Send } from "lucide-react";
import StatusPill from "./StatusPill";

function ProgressRow({ label, current, total, remaining }) {
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  const statusText = remaining === 0 ? "Ready to launch" : `${remaining} more to launch`;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <span className="Livvic-Bold text-[14px] leading-none text-[#001243]">{label}</span>
        <span className="Livvic text-[13px] leading-none text-[#6B7280] whitespace-nowrap">{statusText}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#ECEFF3] overflow-hidden">
        <div className="h-full rounded-full bg-[#B9CFFD]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function LaunchingNeighborhoodCard({ onShare, onBrowse, launch }) {
  const neighborhood = launch?.neighborhood || "Your neighborhood";
  const city = launch?.city || "";
  const families = launch?.families ?? 0;
  const nannies = launch?.nannies ?? 0;
  const familyNeed = launch?.familyNeed ?? 8;
  const nannyNeed = launch?.nannyNeed ?? 3;
  const familiesLeft = Math.max(0, familyNeed - families);
  const nanniesLeft = Math.max(0, nannyNeed - nannies);
  const locationLabel =
    city && neighborhood && neighborhood !== city ? `${neighborhood}, ${city}` : neighborhood || city;
  const shortNeighborhood = neighborhood && neighborhood !== city ? neighborhood : neighborhood || "your neighborhood";

  return (
    <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,18,67,0.08)] px-8 py-7 mb-4">
      <div className="flex flex-col min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between gap-8 min-[900px]:gap-10">
        <div className="flex-1 min-w-0 max-w-[640px]">
          <p className="Livvic-SemiBold text-[12px] leading-none text-[#001243] mb-3">
            You&apos;re on the waitlist
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
            <h2 className="Livvic-Bold text-[28px] leading-[1.15] tracking-[-0.01em] text-[#001243] inline-flex items-center gap-2.5">
              <MapPin size={24} className="text-[#F97316] shrink-0 -mt-0.5" strokeWidth={2.25} />
              {locationLabel}
            </h2>
            <StatusPill status="launching" />
          </div>

          <p className="Livvic text-[14px] leading-[1.5] text-[#6B7280] mb-6 max-w-[520px]">
            We&apos;re building enough local coverage to open nanny share matching in your neighborhood.
          </p>

          <p className="text-[10px] leading-none tracking-[0.14em] text-[#9CA3AF] uppercase mb-3 Livvic-Bold">
            {shortNeighborhood.toUpperCase()} launch progress
          </p>

          <div className="space-y-4 mb-5">
            <ProgressRow label="Families" current={families} total={familyNeed} remaining={familiesLeft} />
            <ProgressRow label="Nannies" current={nannies} total={nannyNeed} remaining={nanniesLeft} />
          </div>

          <p className="Livvic-Bold text-[12px] leading-none text-[#001243] inline-flex items-center gap-2">
            <Bell size={13} className="text-[#001243] shrink-0" strokeWidth={2.25} />
            We&apos;ll notify you the moment matching opens
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full min-[900px]:w-[232px] shrink-0 min-[900px]:self-center">
          <button
            type="button"
            onClick={onShare}
            className="w-full inline-flex items-center justify-center gap-2 Livvic-Bold text-[13px] leading-tight text-[#001243] bg-[#B9CFFD] hover:bg-[#AEC4FF] rounded-xl px-5 py-3.5 transition-colors"
          >
            <Send size={14} className="shrink-0" strokeWidth={2.25} />
            Help {shortNeighborhood} launch faster
          </button>
          {onBrowse ? (
            <button
              type="button"
              onClick={onBrowse}
              className="w-full inline-flex items-center justify-center gap-2 Livvic-Bold text-[13px] leading-tight text-[#001243] bg-white border border-[#E5E7EB] hover:bg-[#FAFAFA] rounded-xl px-5 py-3.5 transition-colors"
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
