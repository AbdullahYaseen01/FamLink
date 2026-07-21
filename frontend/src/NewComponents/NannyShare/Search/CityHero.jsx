import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../Button";

// Hero for the programmatic city/neighborhood pages. Deliberately the same
// design as the Resource Center hero (../../ResourceCenter/ResourceCenter.jsx)
// — navy band, pill eyebrow, centred stack — so the two top-of-funnel page
// types read as one family. Only the copy is local.
//
// Header is fixed (z-50), so the generous top padding here is what keeps the
// eyebrow clear of the nav rather than any spacer element.
export default function CityHero({ city }) {
  const navigate = useNavigate();

  return (
    <section className="bg-[#001243] text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 text-[#AEC4FF] text-xs Livvic-Bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-6">
          <MapPin size={14} /> Nanny Share in {city}
        </div>
        <h1 className="Livvic-Bold text-3xl sm:text-5xl lg:text-6xl leading-tight max-w-3xl mx-auto">
          Share a nanny with a family near you in {city}
        </h1>
        <p className="text-white/60 text-base sm:text-lg mt-5 max-w-2xl mx-auto leading-relaxed">
          See where {city} families and caregivers are looking to share, and cut
          the cost of in-home care by 30–50%. Free to browse, no account needed.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Button
            btnText="Join the waitlist"
            className="bg-[#AEC4FF] text-gray-900 px-7 py-3.5"
            action={() => navigate("/waitlist")}
          />
          <Button
            btnText="See who's nearby"
            className="bg-white/10 hover:bg-white/20 text-white px-7 py-3.5 transition-colors"
            action={() =>
              document
                .getElementById("coverage-map")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          />
        </div>
      </div>
    </section>
  );
}
