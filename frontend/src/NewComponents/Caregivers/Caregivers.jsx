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
import EarnEstimation from "./EarnEstimator";
import WhyJoinFamLink from "./WhyJoin";
import NannySharePreview from "../NannyShare/NannySharePreview";

function Caregivers() {
  return (
    <>
      <SEOMetaData
        title="Caregivers & Nanny Job Opportunities | Famlink"
        description="Find nanny and caregiver opportunities with local families on Famlink. Browse job listings, connect with families, and grow your childcare career."
      />

      <div className="relative w-full">
        <Hero />
      </div>
      <div className="bg-[#F6F3EE]">
        <NannySharePreview caregiver={true}/>
      </div>
      <About />
      <HowItWorks />
      <WhyJoinFamLink />
      <div className="bg-[#F6F3EE] py-12">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-[20px] my-4">
            <EarnEstimation />
          </div>
        </div>
      </div>

      {/* <JobPreview /> */}
      {/* <div className="bg-[#F6F3EE] py-12">
        <ServicesHomePage />
      </div> */}
      {/* <Timeline /> */}
      {/* <div className="bg-[#E7FCFF] py-24">
        <Community />
      </div> */}
      {/* <div className="bg-[#F6F3EE] py-24">
        <Testimonial type="Caregiver" />
      </div> */}
      <div className=" p-6 sm:p-8 lg:p-12 bg-[#E7FCFF]">
        <Community />
      </div>
      <FAQ caregiver={true} />
      <Feedback />
    </>
  );
}

export default Caregivers;
