import { Link } from "react-router-dom";

/* Legal consent line shown under the sign-up forms and the subscription CTAs.
   The link opens in a new tab on purpose: every place this renders sits on top
   of state we don't want to throw away — a half-filled onboarding form, an open
   upgrade modal — and an in-app navigation to /terms-and-conditions would
   unmount all of it. */
export default function TermsNotice({ action = "signing up", className = "" }) {
  return (
    <p className={`Livvic text-xs text-gray-400 text-center ${className}`}>
      By {action}, you agree to Famlink&apos;s{" "}
      <Link
        to="/terms-and-conditions"
        target="_blank"
        rel="noopener noreferrer"
        className="Livvic-SemiBold underline hover:text-[#001243] transition-colors"
      >
        Terms &amp; Conditions
      </Link>
      .
    </p>
  );
}
