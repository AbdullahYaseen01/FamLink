import { useParams } from "react-router-dom";
import Hero from "./Hero";
import SEOMetaData from "../../SEOMetaData";
import Browse from "./Browse";
import Footer from "../../Footer/Footer";
import CostEstimation from "../CostEstimation";
import Testimonial from "../../Home/Testimonial";
import Community from "../../Home/Community";
import FAQ from "../../Home/FAQ";
import HeroOakland from "./HeroOakland";
import NannySharePreview from "../NannySharePreview";
import ServiceAreaOakland from "./ServiceAreaOakland";

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
        title={`Nanny Share in ${formatCity(city)} | Find Families & Reduce Childcare Costs`}
        description={`Connect with families in ${formatCity(city)} to share a nanny, save on childcare costs, and provide consistent care for your children.`}
      />

      {formatCity(city) === "Oakland" ? (
        <div className="min-h-screen bg-white">
          {/* Hero Wrapper with Curve */}
          <div className="relative bg-white pb-8">
            <div className="relative z-10">
              <HeroOakland city={formatCity(city)} />
            </div>
            {/* Bottom Curve */}
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
          </div>
          
          <div className="bg-[#F6F3EE] pb-6 relative z-10">
            <NannySharePreview caregiver={true} />
            <ServiceAreaOakland />
          </div>
          
          <FAQ />
          <Footer />
        </div>
      ) : (
        <div className="min-h-screen bg-white">
          {/* Hero Wrapper with Curve */}
          <div className="relative bg-white pb-8">
            {/* Content */}
            <div className="relative z-10">
              <Hero city={formatCity(city)} />
            </div>

            {/* Bottom Curve */}
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
          </div>

          {/* CostEstimation Section with Beige background */}
          <div className="bg-[#F6F3EE] pb-12 relative z-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-[20px] my-4 overflow-hidden">
                <CostEstimation />
              </div>
            </div>
          </div>
          
          {/* FAQ and Footer sit on default white background */}
          <FAQ />
          <Footer />
        </div>
      )}
    </div>
  );
}
