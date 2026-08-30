export function ProgressRow({ label, current, total, remaining }) {
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  const statusText = remaining === 0 ? "Ready to launch" : `${remaining} more to launch`;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <span className="Livvic-Bold text-[13px] leading-none text-[#001243]">{label}</span>
        <span className="Livvic-Bold text-[13px] leading-none text-gray-500 whitespace-nowrap">{statusText}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#E5E7F5] overflow-hidden">
        <div className="h-full rounded-full bg-[#ABB4ED]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function LaunchProgressSection({ neighborhood, families, nannies, familyNeed, nannyNeed }) {
  const shortNeighborhood =
    neighborhood && neighborhood !== "Your neighborhood" ? neighborhood : "your neighborhood";
  const familiesLeft = Math.max(0, familyNeed - families);
  const nanniesLeft = Math.max(0, nannyNeed - nannies);

  return (
    <div className="max-w-md">
      <p className="text-[12px] leading-none text-[#7D8090] uppercase mb-3 Livvic-Bold">
        {String(shortNeighborhood).toUpperCase()} launch progress
      </p>
      <div className="space-y-4">
        <ProgressRow label="Families" current={3} total={familyNeed} remaining={familiesLeft} />
        <ProgressRow label="Nannies" current={nannies} total={nannyNeed} remaining={nanniesLeft} />
      </div>
    </div>
  );
}
