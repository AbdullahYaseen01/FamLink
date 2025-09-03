import React from "react";

function Benefits() {
  return (
    <div className="container my-4">
      <h1 className="Livvic-Bold text-4xl sm:text-5xl mt-12">
        Benefits of Listing Your Business
      </h1>
      <p className="text-lg Livvic-Medium mt-6 sm:mt-8 lg:mt-9 leading-[30px] text-[#00000099]">
        Showcase your business, connect with families, and grow your reach with Famlink’s trusted platform.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mt-9 auto-rows-fr">
        <div className="p-6 rounded-[20px] shadow-soft lg:col-span-3 xl:col-span-3">
          <img src="/coins-hand.svg" alt="coins-hand" />
          <h2 className="text-[#001243] Livvic-SemiBold text-2xl mt-4">
            Increased Visibility
          </h2>
          <p className="text-[#8A8E99] text-md Livvic-Medium mt-4">
            Reach a larger audience of families seeking your services.
          </p>
        </div>
        <div className="p-6  rounded-[20px] shadow-soft lg:col-span-1 xl:col-span-3">
          <img src="/shield-tick.svg" alt="coins-hand" />
          <h2 className="text-[#001243] Livvic-SemiBold text-2xl mt-4">
            Targeted Marketing
          </h2>
          <p className="text-[#8A8E99] text-md Livvic-Medium mt-4">
            Connect with families specifically looking for your expertise.
          </p>
        </div>
        <div className="p-6  rounded-[20px] shadow-soft lg:col-span-2 xl:col-span-3">
          <img src="/certificate-01.svg" alt="coins-hand" />
          <h2 className="text-[#001243] Livvic-SemiBold text-2xl mt-4">
            Community Engagement
          </h2>
          <p className="text-[#8A8E99] text-md Livvic-Medium mt-4">
            Join a network of trusted service providers and engage with the Famlink community.
          </p>
        </div>
        <div className="p-6  rounded-[20px] shadow-soft lg:col-span-2 xl:col-span-3">
          <img src="/certificate-01.svg" alt="coins-hand" />
          <h2 className="text-[#001243] Livvic-SemiBold text-2xl mt-4">
            Easy Management
          </h2>
          <p className="text-[#8A8E99] text-md Livvic-Medium mt-4">
            Effortlessly manage your profile, listings, and customer interactions from one platform.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Benefits;
