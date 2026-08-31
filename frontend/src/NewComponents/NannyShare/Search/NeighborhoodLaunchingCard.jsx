import { ArrowRight } from "lucide-react";
import StatusPill from "../../StatusPill";
import { ProgressRow } from "../../LaunchProgressRows";

export default function NeighborhoodLaunchingCard({
  name,
  families = 0,
  nannies = 0,
  familyNeed = 8,
  nannyNeed = 3,
  actionLabel = "Join now",
  onAction,
  showArrow = true,
}) {
  const familiesLeft = Math.max(0, familyNeed - families);
  const nanniesLeft = Math.max(0, nannyNeed - nannies);

  return (
    <div className="flex flex-col border border-[#E8E8E8] rounded-2xl bg-white px-[18px] py-4">
      <div className="flex items-start justify-between gap-2">
        <p className="Livvic-Bold text-[#001243] text-[15px] leading-snug min-w-0 flex-1 break-words">
          {name}
        </p>
        <StatusPill status="launching" className="!py-1 shrink-0" />
      </div>

      <div className="mt-4">
        <p className="text-[11px] leading-none text-[#9CA3AF] uppercase mb-3 Livvic-Bold tracking-[0.1em]">
          Launch progress
        </p>
        <div className="space-y-3">
          <ProgressRow
            label="Families"
            current={families}
            total={familyNeed}
            remaining={familiesLeft}
          />
          <ProgressRow
            label="Nannies"
            current={nannies}
            total={nannyNeed}
            remaining={nanniesLeft}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onAction}
        className="mt-4 inline-flex items-center gap-1 Livvic-SemiBold text-[13px] text-[#3B6DFF] hover:opacity-70 transition-opacity self-start"
      >
        {actionLabel}
        {showArrow && <ArrowRight size={14} strokeWidth={2.5} aria-hidden />}
      </button>
    </div>
  );
}
