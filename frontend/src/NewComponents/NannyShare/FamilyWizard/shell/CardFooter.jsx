import { ArrowLeft, Check, ChevronRight, Loader2 } from "lucide-react";

/*
 * Back | Step X of N | Continue. Mirrors `.card-footer` in
 * docs/onboarding-family-mockup.html.
 *
 * Plain buttons rather than NewComponents/Button.jsx: CustomButton bakes in
 * `rounded-full px-6 py-2 Livvic-SemiBold` and has no icon slot, so every one of
 * those would have to be overridden here anyway.
 *
 * The step count reads "of {total}" on every step. The mockup hardcodes it per
 * panel and disagrees with itself -- panels 1-4 say "of 5" while panels 5-6 and
 * its own progress rail say "of 6".
 */
export default function CardFooter({
  onBack,
  backDisabled = false,
  currentStep,
  totalSteps,
  isFinalStep = false,
  onContinue,
  isSubmitting = false,
}) {
  return (
    <div className="mt-8 pt-6 border-t border-[#E8ECF4] flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        disabled={backDisabled}
        className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[#E8ECF4] px-[22px] py-[11px] text-[13px] Livvic-SemiBold text-[#6B7280] transition-colors hover:border-[#001243] hover:text-[#001243] disabled:opacity-35 disabled:pointer-events-none focus:outline-none focus-visible:border-[#AEC4FF] focus-visible:shadow-[0_0_0_3px_rgba(174,196,255,0.20)]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <span className="text-[12px] Livvic-SemiBold text-[#9CA3AF] max-[600px]:hidden">
        Step {currentStep} of {totalSteps}
      </span>

      <button
        type="button"
        onClick={onContinue}
        disabled={isSubmitting}
        className="inline-flex items-center gap-1.5 rounded-full bg-[#001243] px-7 py-3 text-[13.5px] Livvic-Bold text-white transition-all hover:opacity-[0.88] hover:-translate-y-px disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(174,196,255,0.20)]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving
          </>
        ) : isFinalStep ? (
          <>
            Complete Profile
            <Check className="w-4 h-4" strokeWidth={2.5} />
          </>
        ) : (
          <>
            Continue
            <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
          </>
        )}
      </button>
    </div>
  );
}
