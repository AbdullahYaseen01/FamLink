import React from "react";
import Hero from "./Hero";
// import Services from "./Services";
// import JobPreview from "./JobPreview";
// import ServicesHomePage from "../Home/Services";
import Timeline from "./Timeline";
import Community from "../Home/Community";
import Testimonial from "../Home/Testimonial";
import FAQ from "../Home/FAQ";
import Feedback from "../Feedback";
import Benefits from "./Benefits";
import SEOMetaData from "../SEOMetaData";

function Business() {
  return (
    <>
      <SEOMetaData
        title="Business Solutions | Famlink"
        description="Discover how Famlink helps businesses connect with families, streamline childcare solutions, and support employee benefits programs."
      />

      <div className="relative bg-[url('/Hero-Business.jpg')] bg-cover bg-center h-screen">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 z-0"></div>

        {/* Content */}
        <div className="relative z-10">
          <Hero />
        </div>

        {/* Bottom Curve */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1440 120"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#FFFFFF"
            d="M0,0 C360,120 1080,120 1440,0 L1440,120 L0,120 Z"
          />
        </svg>
      </div>
      <div className="bg-[#FFFFFF] py-12">
        <Benefits />
      </div>
      <div className="bg-[#F6F3EE] py-24">
        <Testimonial type="Business" />
      </div>
      {/* <JobPreview /> */}
      {/* <div className="bg-[#F6F3EE] py-12">
        <ServicesHomePage />
      </div> */}
      <Timeline />
      <div className="bg-[#E7FCFF] py-24">
        <Community />
      </div>
      <FAQ business={true} />
      <Feedback />
    </>
  );
}

export default Business;
