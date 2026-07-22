import { useParams } from "react-router-dom";
import SEOMetaData from "../../SEOMetaData";
import Footer from "../../Footer/Footer";
import CostEstimation from "../CostEstimation";
import FAQ from "../../Home/FAQ";
import Header from "../../Header";
import CityHero from "./CityHero";
import Hero from "./Hero";
import HeroOakland from "./HeroOakland";
import NannySharePreview from "../NannySharePreview";
import ServiceAreaOakland from "./ServiceAreaOakland";
import NannyShareMap from "./NannyShareMap";
import NeighborhoodLinks from "./NeighborhoodLinks";
import { resolveCityGeo } from "../../../Config/cityGeo";
import { cityMeta } from "../../../seo/routeMeta";

// Section wrapper for the live coverage map — reused by every city/neighborhood
// variant so the map presentation stays consistent. Sits on the beige brand
// background like the other content sections on these pages.
function MapSection({ geo, cityName }) {
  return (
    <div id="coverage-map" className="bg-[#F6F3EE] scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="text-center max-w-2xl mx-auto mb-6">
          <h2 className="Livvic-Bold text-3xl sm:text-4xl text-[#001243]">
            Nanny shares near {cityName}
          </h2>
          <p className="text-gray-500 mt-2 text-base sm:text-lg leading-relaxed">
            See where local families and caregivers are looking to share — then join to connect.
          </p>
        </div>
        <NannyShareMap center={geo} areaLabel={cityName} />
      </div>
    </div>
  );
}

// Curved beige transition under the legacy heroes (Oakland / San Francisco).
// The templated CityHero pages don't use it — their navy hero butts straight
// into the beige below.
function HeroCurve() {
  return (
    <svg
      className="absolute -bottom-1 left-0 w-full z-20"
      viewBox="0 0 1440 120"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      style={{ height: '80px' }}
    >
      <path
        fill="#F6F3EE"
        d="M0,0 C360,120 1080,120 1440,0 L1440,120 L0,120 Z"
      />
    </svg>
  );
}

export default function NannyCityPage() {
  const { city } = useParams();

  // Resolve the slug (city OR neighborhood, e.g. "oakland-ca" or "rockridge")
  // to a map centre + a display name in one place. cityMeta canonicalizes slug
  // variants ("/nanny-share/oakland" → ".../oakland-ca") and noindexes unknown
  // slugs, which would otherwise render as indexable near-duplicates.
  const geo = resolveCityGeo(city);
  const cityName = geo.label;
  const meta = cityMeta(city);

  return (
    <div>
      <SEOMetaData
        title={meta.title}
        description={meta.description}
        canonical={meta.canonical}
        noIndex={meta.noIndex}
        jsonLd={meta.jsonLd}
      />

      {cityName === "Oakland" ? (
        <div className="min-h-screen bg-white">
          {/* Hero Wrapper with Curve */}
          {/* z-30 keeps the fixed Header (rendered inside the hero) above the
              beige sections below. The inner hero wrapper sets NO z-index on
              purpose: giving it one traps the fixed header beneath the z-20
              bottom curve, so the curve paints over the nav while scrolling. */}
          <div className="relative z-30 bg-white pb-8">
            <div className="relative">
              <HeroOakland city={cityName} />
            </div>
            {/* Bottom Curve */}
            <HeroCurve />
          </div>

          <div className="bg-[#F6F3EE] pb-6 relative z-10">
            <NannySharePreview caregiver={true} flush />
            <ServiceAreaOakland />
            <MapSection geo={geo} cityName={cityName} />
            <NeighborhoodLinks slugKey={geo.key} />
          </div>

          <FAQ />
          <Footer />
        </div>
      ) : cityName === "San Francisco" ? (
        <div className="min-h-screen bg-white">
          {/* Hero Wrapper with Curve — see the z-index note on Oakland above. */}
          <div className="relative z-30 bg-white pb-8">
            {/* Content */}
            <div className="relative">
              <Hero city={cityName} />
            </div>

            {/* Bottom Curve */}
            <HeroCurve />
          </div>

          {/* Unique local intro — keeps the templated pages from reading
              identically to search engines. Beige, and with no bottom padding,
              so it runs straight into the map section below it as one block. */}
          {geo.blurb && (
            <div className="bg-[#F6F3EE]">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
                <p className="text-gray-600 text-base sm:text-lg leading-relaxed Livvic-Medium max-w-3xl mx-auto text-center">
                  {geo.blurb}
                </p>
              </div>
            </div>
          )}

          {/* Live coverage map — also beige, continuing the same block */}
          <MapSection geo={geo} cityName={cityName} />

          {/* CostEstimation Section with Beige background */}
          <div className="bg-[#F6F3EE] pb-12 relative z-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-[20px] my-4 overflow-hidden">
                <CostEstimation />
              </div>
            </div>
          </div>

          <NeighborhoodLinks slugKey={geo.key} />

          {/* FAQ and Footer sit on default white background */}
          <FAQ />
          <Footer />
        </div>
      ) : (
        <div className="min-h-screen bg-white">
          <Header />
          <CityHero city={cityName} />

          {/* Unique local intro — keeps the templated pages from reading
              identically to search engines. Beige, and with no bottom padding,
              so it runs straight into the map section below it as one block. */}
          {geo.blurb && (
            <div className="bg-[#F6F3EE]">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
                <p className="text-gray-600 text-base sm:text-lg leading-relaxed Livvic-Medium max-w-3xl mx-auto text-center">
                  {geo.blurb}
                </p>
              </div>
            </div>
          )}

          {/* Live coverage map — also beige, continuing the same block */}
          <MapSection geo={geo} cityName={cityName} />

          {/* CostEstimation Section with Beige background */}
          <div className="bg-[#F6F3EE] pb-12 relative z-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-[20px] my-4 overflow-hidden">
                <CostEstimation />
              </div>
            </div>
          </div>

          <NeighborhoodLinks slugKey={geo.key} />

          {/* FAQ and Footer sit on default white background */}
          <FAQ />
          <Footer />
        </div>
      )}
    </div>
  );
}
