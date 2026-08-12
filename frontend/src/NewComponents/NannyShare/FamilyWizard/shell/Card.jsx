/*
 * The white card and its heading block. Mirrors `.onboard-card` and
 * `.card-header` in docs/onboarding-family-mockup.html.
 *
 * The caller keys this element on the step number so React remounts it on every
 * step change. That is what makes famwiz-fade-up replay: a persistent node keeps
 * the class from the first render and the animation never fires again.
 */
export default function Card({ heading, sub, children }) {
  return (
    <section className="bg-white border border-[#E8ECF4] rounded-[20px] shadow-[0_2px_16px_rgba(0,18,67,0.06)] px-10 py-9 max-[600px]:px-5 max-[600px]:py-6 famwiz-fade-up">
      {(heading || sub) && (
        <header className="mb-7">
          {heading && (
            <h1 className="text-[22px] max-[600px]:text-[18px] leading-[1.25] tracking-[-0.3px] Livvic-Black text-[#001243]">
              {heading}
            </h1>
          )}
          {sub && (
            <p className="mt-1.5 text-sm Livvic text-[#6B7280] leading-[1.55]">
              {sub}
            </p>
          )}
        </header>
      )}

      {children}
    </section>
  );
}
