import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../Button";

const ACTIVE_BADGE = "bg-[#D6FB9A] text-[#075B49]";
const LAUNCHING_BADGE = "bg-[#FFF1E0] text-[#C2410C]";

// Hero for the programmatic city/neighborhood pages. Deliberately the same
// design as the Resource Center hero (../../ResourceCenter/ResourceCenter.jsx)
// — navy band, pill eyebrow, centred stack — so the two top-of-funnel page
// types read as one family. Copy and CTAs switch on market status.
//
// Header is fixed (z-50), so the generous top padding here is what keeps the
// eyebrow clear of the nav rather than any spacer element.
export default function CityHero({ city, status = "active" }) {
  const navigate = useNavigate();
  const isLaunching = status === "launching";

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="bg-[#001243] text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 text-[#AEC4FF] text-xs Livvic-Bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-6">
          <MapPin size={14} /> Nanny Share in {city}
        </div>
        <h1 className="Livvic-Bold text-3xl sm:text-5xl lg:text-6xl leading-tight max-w-3xl mx-auto">
          Find a nanny share near you in {city}
        </h1>
        <p className="text-white/60 text-base sm:text-lg mt-5 max-w-2xl mx-auto leading-relaxed">
          {isLaunching
            ? `FamLink is launching in ${city}. Create a free profile to help bring nanny share matching to your area.`
            : `FamLink matching is active across ${city}. Create a free profile to connect with families and caregivers nearby.`}
        </p>
        <div
          className={`mt-6 inline-flex items-center gap-2 rounded-full Livvic-Bold text-[11px] tracking-wide uppercase px-3 py-1.5 ${
            isLaunching ? LAUNCHING_BADGE : ACTIVE_BADGE
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isLaunching ? "bg-[#C2410C]" : "bg-[#075B49]"
            }`}
          />
          {isLaunching ? "Launching" : "Active"}
        </div>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Button
            btnText="Join now"
            className="bg-[#AEC4FF] text-[#001243] px-7 py-3.5"
            action={() => navigate("/joinNow")}
          />
          <Button
            btnText={isLaunching ? `Help launch ${city}` : "See all neighborhoods"}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-7 py-3.5 transition-colors"
            action={() =>
              scrollTo(isLaunching ? "launching-city" : "active-neighborhoods")
            }
          />
        </div>
      </div>
    </section>
  );
}
