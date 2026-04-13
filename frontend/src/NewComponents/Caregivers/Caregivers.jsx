import React from "react";
import Hero from "./Hero";
import Services from "./Services";
import JobPreview from "./JobPreview";
import ServicesHomePage from "../Home/Services";
import Timeline from "./Timeline";
import Community from "../Home/Community";
import Testimonial from "../Home/Testimonial";
import FAQ from "../Home/FAQ";
import Feedback from "../Feedback";
import SEOMetaData from "../SEOMetaData";
import About from "./About";
import HowItWorks from "./HowItWorks";

function Caregivers() {
  return (
    <>
      <SEOMetaData
        title="Caregivers & Nanny Job Opportunities | Famlink"
        description="Find nanny and caregiver opportunities with local families on Famlink. Browse job listings, connect with families, and grow your childcare career."
      />

      <div className="relative bg-[url('/Hero-Caregivers.jpg')] bg-cover bg-center h-screen">
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
        <div className="bg-[#F6F3EE] flex justify-center items-center">
        <div className="sm:px-12 rounded-2xl">
          <div className="pt-12">
            <About />
          </div>
          {/* <HowItWorks /> */}
        </div>
      </div>
      <div className=" py-12">
        <Services />
      </div>
      {/* <JobPreview /> */}
      {/* <div className="bg-[#F6F3EE] py-12">
        <ServicesHomePage />
      </div> */}
      <Timeline />
      {/* <div className="bg-[#E7FCFF] py-24">
        <Community />
      </div> */}
      {/* <div className="bg-[#F6F3EE] py-24">
        <Testimonial type="Caregiver" />
      </div> */}
      <FAQ caregiver={true}/>
      <Feedback />
    </>
  );
}

export default Caregivers;
