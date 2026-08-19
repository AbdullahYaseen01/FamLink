import { Check } from "lucide-react";
import { opacityForDistance } from "../tokens";

/*
 * The labelled step rail. Mirrors `.progress-wrap` and the class assignment in
 * the mockup's updateProgressBar().
 *
 * Not built on postSteps.jsx (CustomStepper): that is a bare two-div fill bar
 * with no labels, no numbered circles and no per-step state, and it renders
 * totalSteps + 1 dots. It stays untouched for its other callers.
 *
 * `steps` are 1-indexed {n, label}. `completedSteps` is a Set of step numbers.
 * `done` is the post-submit state, where every step reads complete and the count
 * reads "Complete!".
 */
export default function ProgressRail({
  steps = [],
  currentStep = 1,
  completedSteps,
  done = false,
  onStepClick,
}) {
  const total = steps.length;
  if (!total) return null;

  return (
    <div className="bg-white border-b border-[#E8ECF4] px-7 pt-[18px] pb-3 max-[600px]:px-4">
      <ol className="flex items-center max-w-[640px] mx-auto">
        {steps.map((step, index) => {
          const isDone = done || completedSteps?.has(step.n);
          const isActive = !done && step.n === currentStep;

          /* Upcoming steps fade by distance from the active step, matching the
             mockup's .upcoming-1..4 classes. Inline style rather than a class
             because the value is genuinely computed — and interpolating it into
             a Tailwind arbitrary value would emit no CSS at all. */
          const distance = step.n - currentStep;
          const opacity =
            isDone || isActive ? 1 : opacityForDistance(distance);

          const circleClass = isDone
            ? "bg-[#D1FAE5] border-[#6EE7B7] text-[#065F46]"
            : isActive
              ? "bg-[#AEC4FF] border-[#AEC4FF] text-[#001243] shadow-[0_0_0_3px_rgba(174,196,255,0.3)]"
              : "bg-white border-[#E8ECF4] text-[#6B7280]";

          const labelClass = isDone
            ? "text-[#065F46] Livvic-SemiBold"
            : isActive
              ? "text-[#001243] Livvic-Bold"
              : "text-[#9CA3AF] Livvic-SemiBold";

          return (
            /* Every step but the last grows, so its trailing connector takes up
               the slack; the last one hugs its label. */
            <li
              key={step.n}
              className={`flex items-center ${
                index < total - 1 ? "flex-1" : "shrink-0"
              }`}
            >
              <button
                type="button"
                onClick={() => onStepClick?.(step.n)}
                className="flex items-center gap-2 shrink-0 focus:outline-none focus-visible:rounded-full focus-visible:shadow-[0_0_0_3px_rgba(174,196,255,0.20)]"
                style={{ opacity }}
                aria-current={isActive ? "step" : undefined}
              >
                <span
                  className={`w-[30px] h-[30px] rounded-full border-2 flex items-center justify-center text-[12px] Livvic-Bold shrink-0 transition-all duration-300 ${circleClass}`}
                >
                  {isDone ? (
                    <Check className="w-3 h-3" strokeWidth={3} />
                  ) : (
                    step.n
                  )}
                </span>
                {/* Hidden below 600px per the mockup — the current step's name is
                    already the card's own heading, so nothing is lost. */}
                <span
                  className={`text-[12px] whitespace-nowrap max-[600px]:hidden ${labelClass}`}
                >
                  {step.label}
                </span>
              </button>

              {index < total - 1 && (
                <span
                  aria-hidden="true"
                  className={`h-0.5 flex-1 min-w-4 mx-2 transition-colors duration-300 ${
                    isDone ? "bg-[#6EE7B7]" : "bg-[#E8ECF4]"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>

      <p className="max-w-[640px] mx-auto mt-2.5 pb-2 text-right text-[12px] Livvic-Bold text-[#6B7280]">
        {done ? "Complete!" : `Step ${currentStep} of ${total}`}
      </p>
    </div>
  );
}
