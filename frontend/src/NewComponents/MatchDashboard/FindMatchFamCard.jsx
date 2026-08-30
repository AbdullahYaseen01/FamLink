import { MapPin, Send } from "lucide-react";
import StatusPill from "../StatusPill";
import { LaunchProgressSection } from "../LaunchProgressRows";

const WAITLIST_MESSAGE =
  "We'll notify you the moment matching opens — I'm also on the lookout for nearby matches in the meantime.";

export default function FindMatchFamCard({
  launchStatus,
  famMessage,
  onSeeOtherNeighborhoods,
  onHelpLaunch,
}) {
  if (!launchStatus) return null;

  const isLaunching = launchStatus.status === "launching";
  const neighborhood = launchStatus.neighborhood || "Your neighborhood";
  const city = launchStatus.city || "";
  const families = launchStatus.families ?? 0;
  const nannies = launchStatus.nannies ?? 0;
  const familyNeed = launchStatus.familyNeed ?? 8;
  const nannyNeed = launchStatus.nannyNeed ?? 3;
  const locationLabel =
    city && neighborhood && neighborhood !== city ? `${neighborhood}, ${city}` : neighborhood || city;
  const shortNeighborhood =
    neighborhood && neighborhood !== city ? neighborhood : neighborhood || "your neighborhood";
  const message = isLaunching
    ? WAITLIST_MESSAGE
    : famMessage || launchStatus.activityMessage || "Matching is now active in your neighborhood";

  return (
    <div className="bg-[#F1F3FC] rounded-2xl border border-[#E8ECF4] px-6 py-5 mb-6 shadow-[0_2px_8px_rgba(0,18,67,0.04)]">
      <div className="flex items-center gap-1.5 mb-2">
        <img src="/logo3.png" alt="" className="h-[14px] w-auto shrink-0" />
        <span className="Livvic-Bold text-[14px] text-[#001243]">Fam</span>
        <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" aria-hidden="true" />
      </div>

      <p className="Livvic-SemiBold text-[14px] leading-[1.45] text-[#465269] mb-4 line-clamp-2">{message}</p>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 min-w-0">
          <h2 className="Livvic-Bold text-[18px] leading-tight text-[#001243] inline-flex items-center gap-2">
            <MapPin size={18} className="text-[#F97316] shrink-0" strokeWidth={2.25} />
            {locationLabel}
          </h2>
          <StatusPill status={isLaunching ? "launching" : "active"} />
        </div>
        <button
          type="button"
          onClick={onSeeOtherNeighborhoods}
          className="Livvic-SemiBold text-[13px] text-blue-600 hover:underline shrink-0"
        >
          See other neighborhoods →
        </button>
      </div>

      {isLaunching ? (
        <div className="flex flex-col min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <LaunchProgressSection
              neighborhood={shortNeighborhood}
              families={families}
              nannies={nannies}
              familyNeed={familyNeed}
              nannyNeed={nannyNeed}
            />
          </div>
          <button
            type="button"
            onClick={onHelpLaunch}
            className="w-full min-[900px]:w-auto shrink-0 inline-flex items-center justify-center gap-2 Livvic-Bold text-[13px] text-[#001243] bg-[#C5CAF4] rounded-xl px-5 py-3 transition-colors whitespace-nowrap"
          >
            <Send size={14} className="shrink-0" strokeWidth={2.25} />
            Help {shortNeighborhood} launch faster
          </button>
        </div>
      ) : null}
    </div>
  );
}
