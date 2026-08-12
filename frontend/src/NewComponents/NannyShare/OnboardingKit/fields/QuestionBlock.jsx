import { QuestionInvalidContext, questionDomId } from "./questionState";

/*
 * One question in the wizard: icon square, label, the control, and the error
 * state. Mirrors `.q-block` / `.q-label` / `.q-icon` / `.error-msg` in
 * docs/onboarding-family-mockup.html.
 *
 * The `error` string drives everything — there is no separate `invalid` flag to
 * keep in sync. Non-empty means the block reddens and the message shows.
 */
export default function QuestionBlock({
  qKey,
  icon: Icon,
  label,
  required = false,
  optional = false,
  error = "",
  children,
  divider = true,
}) {
  const invalid = Boolean(error);

  return (
    <>
      {/* The id is what scrollToFirstError() targets, so it sits on the
          outermost node — scrolling to the control alone would leave the label
          and the error message off-screen above it. scroll-mt keeps the label
          clear of the sticky top bar. */}
      <div id={questionDomId(qKey)} className="scroll-mt-28">
        <div className="flex items-center gap-2 mb-3">
          {Icon && (
            <span
              className={`w-7 h-7 shrink-0 rounded-[8px] border flex items-center justify-center transition-colors ${
                invalid
                  ? "bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]"
                  : "bg-[#EEF3FF] border-[#C8D8FF] text-[#001243]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={2} />
            </span>
          )}

          <span
            className={`flex-1 text-[13px] Livvic-Bold ${
              invalid ? "text-[#DC2626]" : "text-[#001243]"
            }`}
          >
            {label}
            {required && <span className="ml-0.5 text-[#DC2626]">*</span>}
            {optional && (
              <span className="ml-2 align-middle inline-block rounded-full border border-[#E8ECF4] bg-[#F4F6FB] px-2 py-px text-[11px] Livvic-Medium text-[#9CA3AF]">
                Optional
              </span>
            )}
          </span>
        </div>

        <QuestionInvalidContext.Provider value={invalid}>
          {children}
        </QuestionInvalidContext.Provider>

        {invalid && (
          <p role="alert" className="mt-2 text-[11px] Livvic-SemiBold text-[#DC2626]">
            {error}
          </p>
        )}
      </div>

      {divider && <div className="h-px bg-[#E8ECF4] my-6" aria-hidden="true" />}
    </>
  );
}
