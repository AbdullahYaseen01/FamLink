import { Link } from "react-router-dom";

/*
 * The wizard's own header. Mirrors `.topbar` in
 * docs/onboarding-family-mockup.html.
 *
 * The mockup's logo is a dead `href="#"`; point it home instead so it behaves
 * like a header. Whether this renders at all when the wizard is embedded in the
 * dashboard is the container's call, not this component's — the dashboard
 * already supplies its own chrome.
 */
export default function TopBar() {
  return (
    <header className="bg-white border-b border-[#E8ECF4] px-7 py-[14px] max-[600px]:px-4">
      <Link to="/" className="inline-flex items-center gap-2 no-underline">
        <img src="/logo3.png" alt="" className="h-[18px] w-auto" />
        <span className="text-[15px] Livvic-Bold text-[#001243]">FamLink</span>
      </Link>
    </header>
  );
}
