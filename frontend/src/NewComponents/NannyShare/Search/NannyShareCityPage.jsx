import { useState } from "react";
import { useParams } from "react-router-dom";
import SEOMetaData from "../../SEOMetaData";
import Footer from "../../Footer/Footer";
import FAQ from "../../Home/FAQ";
import Header from "../../Header";
import CityHero from "./CityHero";
import ActiveNeighborhoods from "./ActiveNeighborhoods";
import LaunchingCitySection from "./LaunchingCitySection";
import BrowseNeighborhoodsModal from "./BrowseNeighborhoodsModal";
import { resolveCityGeo } from "../../../Config/cityGeo";
import { cityMeta } from "../../../seo/routeMeta";

export default function NannyCityPage() {
  const { city } = useParams();
  const [isNeighborhoodsOpen, setIsNeighborhoodsOpen] = useState(false);

  const geo = resolveCityGeo(city);
  const cityName = geo.label;
  const meta = cityMeta(city);
  const isLaunching = geo.status === "launching";
  const openNeighborhoods = () => setIsNeighborhoodsOpen(true);

  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      <SEOMetaData
        title={meta.title}
        description={meta.description}
        canonical={meta.canonical}
        noIndex={meta.noIndex}
        jsonLd={meta.jsonLd}
      />

      <Header />
      <CityHero
        city={cityName}
        status={geo.status}
        onSeeAllNeighborhoods={openNeighborhoods}
      />

      {isLaunching ? (
        <LaunchingCitySection city={cityName} />
      ) : (
        <ActiveNeighborhoods
          city={cityName}
          cityKey={geo.key}
          neighborhoods={geo.neighborhoods}
          onSeeAllNeighborhoods={openNeighborhoods}
        />
      )}

      <FAQ headerOnly />
      <Footer />

      {isNeighborhoodsOpen && (
        <BrowseNeighborhoodsModal
          variant="landing"
          priorityCity={cityName}
          onClose={() => setIsNeighborhoodsOpen(false)}
        />
      )}
    </div>
  );
}
