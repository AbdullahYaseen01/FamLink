import React from "react";

function HowItWorks() {
  return (
    <div className="container py-12 my-24 sm:py-24 px-4">
      <h1 className="Livvic-Bold text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-center">
        Most Common Ways to
        <br /> Share a Nanny
      </h1>
      <div className="flex mt-12 gap-6 flex-col md:flex-row">
        <div className="onboarding-box space-y-4 flex flex-col items-center">
          <h1 className="Livvic-SemiBold text-2xl">
            Share at One Family’s Home
          </h1>
          <img src="/nanny-share.svg" alt="nanny-share" />
          <p className="text-base sm:text-lg lg:text-xl text-[#4A4F57] Livvic-Medium mt-4 sm:mt-6 text-center">
            Families agree to have the nanny provide care at one of their homes. This setup simplifies logistics and allows the children to become familiar with a single environment.
          </p>
        </div>
         <div className="onboarding-box space-y-4 flex flex-col items-center">
          <h1 className="Livvic-SemiBold text-2xl">
            Alternate Between Homes
          </h1>
          <img src="/nanny-share.svg" alt="nanny-share" />
          <p className="text-base sm:text-lg lg:text-xl text-[#4A4F57] Livvic-Medium mt-4 sm:mt-6 text-center">
           Families alternate hosting the nanny at their respective homes. This arrangement ensures that both families share the hosting responsibilities and children get comfortable in different settings.
          </p>
        </div>
      </div>
    </div>
  );
}

export default HowItWorks;
