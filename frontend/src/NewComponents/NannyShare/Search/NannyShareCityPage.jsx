import { useParams } from "react-router-dom";
import Hero from "./Hero";
import SEOMetaData from "../../SEOMetaData";
import Browse from "./Browse";
import Footer from "../../Footer/Footer";
import CostEstimation from "../CostEstimation";
import Testimonial from "../../Home/Testimonial";
import Community from "../../Home/Community";
import FAQ from "../../Home/FAQ";

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

      <div className="relative bg-[url('/SpecificCityPagesHero.png')] bg-cover bg-center h-screen">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 z-0"></div>
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
        <div className="bg-[#F6F3EE] pb-12">
          <div className="container px-4 sm:px-6 lg:px-8">
            {" "}
            {/* ← add padding here */}
            <div className="bg-white rounded-[20px] my-4">
                <CostEstimation />
            </div>
          </div>
        </div>
        {/* <div className="bg-[#F6F3EE] py-12">
        <Timeline />
      </div> */}
        {/* <Testimonial type="NannyShare" /> */}
        {/* <div className="py-24 bg-[#E7FCFF]">
        <Community />
      </div> */}
        <FAQ />
        <Footer />
      </div>
    </div>
  );
}
