import { useParams } from "react-router-dom";
import Hero from "./Hero";
import SEOMetaData from "../../SEOMetaData";
import Browse from "./Browse";
import Footer from "../../Footer/Footer";

export default function NannyCityPage() {
  const { city } = useParams();

  const formatCity = (slug) => {
    if (!slug) return "";

    return slug
      .split("-")
      .slice(0, -1) // remove state (ca)nannyShare
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div>
      <SEOMetaData
        title={`Nanny Share in ${city} | Find Families & Reduce Childcare Costs`}
        description={`Connect with families in ${city} to share a nanny, save on childcare costs, and provide consistent care for your children.`}
      />

      <div className="relative h-screen">
        {/* Content */}
        <div className="relative z-10">
          <Hero city={formatCity(city)} />
        </div>

        {/* Bottom Curve */}
        <svg
          className="absolute -bottom-1 left-0 w-full"
          viewBox="0 0 1440 120"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#F6F3EE"
            d="M0,0 C360,120 1080,120 1440,0 L1440,120 L0,120 Z"
          />
        </svg>
        <div className="bg-[#F6F3EE] py-6">
          <Browse city={formatCity(city)} />
        </div>
        <div className="bg-[#F6F3EE]">
          {" "}
          <Footer />
        </div>
      </div>
    </div>
  );
}
