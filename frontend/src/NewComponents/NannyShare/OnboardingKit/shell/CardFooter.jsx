import { ArrowLeft, ChevronRight, Loader2, Sparkle } from "lucide-react";

/*
 * Back | Step X of N | Continue. Mirrors `.card-footer` in
 * docs/onboarding-family-mockup.html.
 *
 * Plain buttons rather than NewComponents/Button.jsx: CustomButton bakes in
 * `rounded-full px-6 py-2 Livvic-SemiBold` and has no icon slot, so every one of
 * those would have to be overridden here anyway.
 *
 * The step count reads "of {total}" on every step. The family mockup hardcodes
 * it per panel and disagrees with itself -- panels 1-4 say "of 5" while panels
 * 5-6 and its own progress rail say "of 6". (The nanny mockups are consistent,
 * but deriving it is right either way.)
 *
 * Every flow ends on the same CTA, so it is spelled out here rather than passed
 * in. That is a deliberate override of both nanny specs, which ask for
 * "Complete Profile" with a checkmark: a checkmark says the form is done, and
 * what the button actually starts is the matching. One wording across all three
 * questionnaires also means a member who fills in more than one is promised the
 * same thing each time.
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

      {/* The final step's CTA is the one moment the flow asks for something other
          than "next", so it gets its own treatment: the brand blue rather than
          navy, larger, and named for what it does rather than for the form. */}
      <button
        type="button"
        onClick={onContinue}
        disabled={isSubmitting}
        className={`inline-flex items-center gap-2 rounded-full Livvic-Bold transition-all hover:-translate-y-px disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(174,196,255,0.45)] ${
          isFinalStep
            ? "bg-[#AEC4FF] px-8 py-3.5 text-[15px] text-[#001243] shadow-[0_4px_14px_rgba(174,196,255,0.55)] hover:bg-[#9FB9FF]"
            : "bg-[#001243] px-7 py-3 text-[13.5px] text-white hover:opacity-[0.88]"
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving
          </>
        ) : isFinalStep ? (
          <>
            Get Matched by Fam
            <Sparkle className="w-4 h-4" fill="currentColor" strokeWidth={1.5} />
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
