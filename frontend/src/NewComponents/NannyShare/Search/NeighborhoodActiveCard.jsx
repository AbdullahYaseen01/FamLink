import { ArrowRight } from "lucide-react";
import StatusPill from "../../StatusPill";

export default function NeighborhoodActiveCard({
  name,
  status = "active",
  onJoin,
  showAction = true,
}) {
  const pillStatus = status === "activeGrowing" ? "activeGrowing" : "active";

  return (
    <div
      className="flex flex-col border border-[#E8E8E8] rounded-2xl bg-white px-[18px] py-4"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="Livvic-Bold text-[#001243] text-[15px] leading-snug min-w-0 flex-1 break-words">
          {name}
        </p>
        <StatusPill status={pillStatus} className="!py-1 shrink-0" />
      </div>
      {showAction && (
        <button
          type="button"
          onClick={onJoin}
          className="pt-4 inline-flex items-center gap-1 Livvic-SemiBold text-[13px] text-[#3B6DFF] hover:opacity-70 transition-opacity self-start"
        >
          Join now
          <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
        </button>
      )}
    </div>
  );
}
