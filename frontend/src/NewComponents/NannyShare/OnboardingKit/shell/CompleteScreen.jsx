import { useEffect, useRef } from "react";
import { Send, Users } from "lucide-react";
import { Link } from "react-router-dom";

/*
 * Post-submit confirmation, rendered inside the card in place of the step panel.
 *
 * No redirect, per the specs. But the mockups have no CTA at all, and shipping
 * that verbatim would strip the one link that turns a Google-Sheet visitor into
 * an account: the retired FinalSuccessModal's "Set up my FamLink profile now" ->
 * /hire?recordId=. So the caller supplies exactly one button. The nanny wizards
 * are logged-in only and take the defaults; the family wizard passes the signup
 * CTA when there is no session, and losing that step would be a funnel
 * regression, not a design simplification.
 */
const DEFAULT_POINTS = [
  {
    icon: Send,
    text: "FAM will automatically send match requests to all compatible profiles.",
  },
  {
    icon: Users,
    text: "You can now see families and nannies in your area and explore other possible matches.",
  },
];

export default function CompleteScreen({
  title = "Your profile is complete!",
  eyebrow = "Profile ready for matching",
  points = DEFAULT_POINTS,
  ctaLabel = "Explore matches →",
  ctaTo = "/dashboard",
}) {
  return (
    <div className="px-4 py-10 max-[600px]:px-1 max-[600px]:py-8">
      <div className="flex justify-center mb-6">
        <CompleteCheck />
      </div>

      <p className="text-center text-[11px] Livvic-Bold uppercase tracking-[1.4px] text-[#9CA3AF] mb-2">
        {eyebrow}
      </p>
      <h1 className="text-center text-[26px] max-[600px]:text-[22px] Livvic-Bold text-[#001243] mb-7">
        {title}
      </h1>

      <div className="max-w-[420px] mx-auto">
        {points.map((point, index) => {
          const Icon = point.icon;
          return (
            <div key={point.text}>
              {index > 0 && <div className="h-px bg-[#E8ECF4] my-4" />}
              <div className="flex items-start gap-3.5">
                <span className="w-10 h-10 shrink-0 rounded-full bg-[#EEF3FF] flex items-center justify-center">
                  <Icon className="w-[18px] h-[18px] text-[#001243]" strokeWidth={2} />
                </span>
                <p className="pt-2 text-[13.5px] Livvic-Medium text-[#6B7280] leading-[1.55]">
                  {point.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
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

const BURST_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function CompleteCheck() {
  const ringRef = useRef(null);
  const checkRef = useRef(null);
  const raysRef = useRef([]);

  useEffect(() => {
    const ring = ringRef.current;
    const check = checkRef.current;
    if (!ring || !check) return;

    const bounce = ring.animate(
      [
        { opacity: 0, transform: "scale(0.2)" },
        { opacity: 1, transform: "scale(1.1)", offset: 0.72 },
        { opacity: 1, transform: "scale(1)" },
      ],
      {
        duration: 550,
        easing: "cubic-bezier(0.22, 1.45, 0.36, 1)",
        fill: "forwards",
      },
    );

    const pop = check.animate(
      [
        { opacity: 0, transform: "scale(0.35) translateY(6px)" },
        { opacity: 1, transform: "scale(1) translateY(0)" },
      ],
      {
        duration: 400,
        delay: 220,
        easing: "cubic-bezier(0.34, 1.5, 0.64, 1)",
        fill: "forwards",
      },
    );

    const bursts = raysRef.current.filter(Boolean).map((ray, index) => {
      const deg = BURST_ANGLES[index];
      return ray.animate(
        [
          { opacity: 0, transform: `rotate(${deg}deg) translateY(-26px) scaleY(0.35)` },
          { opacity: 1, transform: `rotate(${deg}deg) translateY(-38px) scaleY(0.8)`, offset: 0.4 },
          { opacity: 0, transform: `rotate(${deg}deg) translateY(-50px) scaleY(1)` },
        ],
        { duration: 500, delay: 500, easing: "ease-out", fill: "forwards" },
      );
    });

    return () => {
      bounce.cancel();
      pop.cancel();
      bursts.forEach((anim) => anim.cancel());
    };
  }, []);

  return (
    <div className="relative mx-auto h-[88px] w-[88px]" aria-hidden="true">
      {BURST_ANGLES.map((deg, index) => (
        <span
          key={deg}
          ref={(node) => {
            raysRef.current[index] = node;
          }}
          className="absolute left-1/2 top-1/2 w-[2.5px] h-3 -ml-[1.25px] -mt-1.5 rounded-[2px] bg-[#AEC4FF] pointer-events-none"
          style={{ opacity: 0 }}
        />
      ))}
      <div ref={ringRef} className="absolute inset-0" style={{ opacity: 0 }}>
        <svg viewBox="0 0 88 88" className="h-full w-full">
          <circle
            cx="44"
            cy="44"
            r="34"
            fill="none"
            stroke="#AEC4FF"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="26 9.605"
          />
        </svg>
      </div>
      <div ref={checkRef} className="absolute inset-0" style={{ opacity: 0 }}>
        <svg viewBox="0 0 88 88" className="h-full w-full">
          <path
            d="M30 45.5 L40 55.5 L60 33"
            fill="none"
            stroke="#001243"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
