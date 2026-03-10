import React from "react";
import Hero from "./Hero";
import NannySharePreview from "./NannySharePreview";
import Metrics from "./Metrics";
import About from "./About";
import HowItWorks from "./HowItWorks";
import Features from "./Features";
import CostEstimation from "./CostEstimation";
import Timeline from "./Timeline";
// import Services from './Services'
// import JobPreview from './JobPreview'
// import ServicesHomePage from '../Home/Services'
// import Timeline from './Timeline'
import Community from "../Home/Community";
import Testimonial from "../Home/Testimonial";
import FAQ from "../Home/FAQ";
import Feedback from "../Feedback";
import SEOMetaData from "../SEOMetaData";

function NannyShare() {
  return (
    <>
      <SEOMetaData
        title={"Nanny Share | Find Families & Reduce Childcare Costs"}
        description={`Connect with local families to share a nanny, save on childcare costs, and provide consistent care for your children. Easy, safe, and convenient.
`}
      />
      <div className="relative bg-[url('/Hero-NannyShare.jpg')] bg-cover bg-center h-screen">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 z-0"></div>

        {/* Content */}
        <div className="relative z-10">
          <Hero />
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
      </div>
      <div className="bg-[#F6F3EE] py-12">
        <NannySharePreview />
      </div>
      {/* <Metrics /> */}
      <div className="pt-12">
        <About />
      </div>
      <HowItWorks />
      <div className="bg-[#F6F3EE] py-12">
        <Features />
            <CostEstimation />
      </div>
      {/* <div className="bg-[#F6F3EE] py-12">
        <Timeline />
      </div> */}
      <Testimonial type="NannyShare" />
      <div className="py-24 bg-[#E7FCFF]">
        <Community />
      </div>
      <FAQ />
      <Feedback />
      {/* <JobPreview/>
    <div className="bg-[#F6F3EE] py-12">
        <ServicesHomePage/>
      </div>
      <Timeline/>
      <div className="bg-[#E7FCFF] py-24">
        <Community />
      </div>
      <div className="bg-[#F6F3EE] py-24">
        <Testimonial />
      </div>
      <FAQ />  */}
    </>
  );
}

export default NannyShare;
