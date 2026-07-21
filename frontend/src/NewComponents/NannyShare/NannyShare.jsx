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
import { homeMeta } from "../../seo/routeMeta";

function NannyShare() {
  return (
    <>
      <SEOMetaData {...homeMeta()} />
      <div className="relative w-full">
        <Hero />
      </div>
      <div className="bg-[#F6F3EE]">
        <NannySharePreview />
      </div>

      {/* <Metrics /> */}
      <div className="">
        <div className="rounded-2xl">
          <div className="pt-12">
            <About />
          </div>
          <HowItWorks />
        </div>
      </div>
      <div className="bg-[#F6F3EE] py-12">
        <Features />
        <div className="container px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20">
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
      <div className=" p-4 sm:p-6 lg:p-8 bg-[#E7FCFF]">
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
