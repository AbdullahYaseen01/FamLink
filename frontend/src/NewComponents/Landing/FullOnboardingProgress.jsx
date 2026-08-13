/**
 * Progress-only signal for full onboarding (no FAM chat on these screens).
 */
export default function FullOnboardingProgress({ current, total }) {
  const safeTotal = Math.max(1, Number(total) || 1);
  const safeCurrent = Math.min(safeTotal, Math.max(1, Number(current) || 1));
  const remaining = Math.max(0, safeTotal - safeCurrent);

  return (
    <p
      className="text-center text-sm Livvic-Medium text-[#4F46E5] mb-3"
      data-full-onboarding-progress="true"
      data-chat-enabled="false"
    >
      Question {safeCurrent} of {safeTotal}
      {remaining > 0 ? ` · ${remaining} left` : ""}
    </p>
  );
}
