import { Check } from "lucide-react";
import { Link } from "react-router-dom";

/*
 * Post-submit confirmation, rendered inside the card in place of the step panel.
 * Mirrors `.complete-screen` in every one of the three mockups — they carry
 * identical title and sub copy, which is why those are defaults rather than
 * required props.
 *
 * No redirect, per the specs. But the mockups have no CTA at all, and shipping
 * that verbatim would strip the one link that turns a Google-Sheet visitor into
 * an account: the retired FinalSuccessModal's "Set up my FamLink profile now" ->
 * /hire?recordId=. So the caller supplies exactly one button. The nanny wizards
 * are logged-in only and take the defaults; the family wizard passes the signup
 * CTA when there is no session, and losing that step would be a funnel
 * regression, not a design simplification.
 */
const DEFAULT_SUB = [
  "FAM will automatically send match requests to all compatible profiles.",
  "You can now see families and nannies in your area and explore other possible matches.",
];

export default function CompleteScreen({
  title = "Your profile is complete.",
  sub = DEFAULT_SUB,
  ctaLabel = "Explore matches →",
  ctaTo = "/dashboard",
}) {
  const paragraphs = Array.isArray(sub) ? sub : [sub];

  return (
    <div className="text-center px-8 py-[60px] max-[600px]:px-2 max-[600px]:py-10">
      <div className="w-16 h-16 rounded-full bg-white border-2 border-[#AEC4FF] flex items-center justify-center mx-auto mb-5">
        <Check className="w-7 h-7 text-[#AEC4FF]" strokeWidth={2.5} />
      </div>

      <h1 className="text-[22px] Livvic-Bold text-[#001243] mb-2.5">{title}</h1>

      <div className="text-[13.5px] Livvic-Medium text-[#6B7280] max-w-[360px] mx-auto leading-[1.6] space-y-3">
        {paragraphs.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      <div className="mt-7">
        <Link
          to={ctaTo}
          className="inline-flex items-center justify-center rounded-full bg-[#001243] px-7 py-3 text-[13.5px] Livvic-Bold text-white no-underline transition-all hover:opacity-[0.88] hover:-translate-y-px focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(174,196,255,0.20)]"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
