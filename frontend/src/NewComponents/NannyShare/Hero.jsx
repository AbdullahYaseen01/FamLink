import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import Header from "../Header";
import { Spin, Input } from "antd";
import { fireToastMessage } from "../../toastContainer";
import { api } from "../../Config/api";
import Button from "../Button";
import { X, Star } from "lucide-react";
import NannyShareCard from "./Profile/NannyShareCard";

function Hero() {
  const [loading, setLoading] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (showResults) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    // Clean up on unmount
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showResults]);

  const handleZipValidation = async (zip) => {
    if (!zip) return;

    setLoading(true);
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (!res.ok) throw new Error("Invalid ZIP");

      const data = await res.json();
      const finalZip = data["post code"];
      if (finalZip) {
        setZipCode(finalZip);
        // form.setFieldsValue({
        //   zipCode: finalZip,
        // });
      } else {
        throw new Error("Invalid structure");
      }
    } catch (err) {
      setZipCode("");
      // form.setFieldsValue({ zipCode: "" });
      fireToastMessage({
        type: "error",
        message: "Invalid ZIP code. Please enter a valid U.S. ZIP.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDataRetrieve = async () => {
    if (!zipCode) {
      fireToastMessage({
        type: "error",
        message: "Enter a valid US zip code first",
      });
      return;
    }
    setIsLoading(true);

    try {
      const { data } = await api.get(
        `nannyShare/nanny-share-opportunities/${zipCode}`
      );
      const response = data?.data || [];
      // console.log("Nanny share response:", response);
      // const shuffled = [...response].sort(() => 0.5 - Math.random());
      // return shuffled.slice(0, 3);
      setData(response);
      setShowResults(true);
    } catch (err) {
      console.error("Error fetching service providers:", err);
      fireToastMessage({
        type: "error",
        message: "Could not load service providers. Try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseResults = () => {
    setShowResults(false);
    setData([]);
  };

  return (
    <div className="Livvic container min-h-screen px-4 sm:px-6 lg:px-8">
      <Header />

      <NavLink
        to={"/events"}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="mt-10"
      >
        <div className="flex justify-center items-center w-full">
          <div className="rounded-full px-6 py-3 border-2 border-gray-400 bg-black/60 text-white text-center shadow-md hover:bg-black/30 transition cursor-pointer">
            <p className="font-semibold text-base sm:text-lg">
              🎉 Exciting event ahead! Registration is now open — click to join!
            </p>
          </div>
        </div>
      </NavLink>

      <div className="mt-20 sm:mt-32">
        <h1 className="Livvic-Bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white leading-tight sm:leading-[50px] md:leading-[60px] lg:leading-[80px]">
          Find Your Perfect
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          Nanny Share Match
        </h1>
        <h2 className="Livvic text-[#ffffffc8] text-base sm:text-lg md:text-xl mt-4 sm:mt-6 max-w-2xl">
          Smart family compatibility for long-term, affordable childcare
          partnerships
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-7 max-w-md sm:max-w-lg">
          <div className="flex-1">
            <div className="relative">
              <Spin
                spinning={loading}
                size="small"
                className="absolute z-10 left-3 top-1/2 -translate-y-1/2"
              >
                <Input
                  name="zipCode"
                  placeholder="Enter zip code to find Nanny Share"
                  onChange={(e) => {
                    const zip = e.target.value;
                    setZipCode(zip);
                  }}
                  onBlur={(e) => handleZipValidation(e.target.value.trim())}
                  value={zipCode}
                  className="w-full p-3 sm:p-4 pr-12 rounded-full"
                  maxLength={10}
                />
              </Spin>
            </div>
          </div>
          <Button
            btnText="Find Nanny Share"
            className="bg-[#FFADE1] w-full sm:w-auto px-6 py-3 sm:py-4"
            action={() => handleDataRetrieve()}
            isLoading={isLoading}
            loadingBtnText="Searching..."
          />
        </div>
      </div>

      {/* Results Section with Background Overlay */}
      {showResults && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="rounded-3xl w-full max-w-7xl max-h-[90vh] overflow-hidden shadow-2xl bg-white">
            {/* Results Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 border-b border-[#AEC4FF]/20 bg-gradient-to-r from-[#AEC4FF]/5 to-[#85D1F1]/5">
              <div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold Livvic-Bold">
                  Available Nanny Shares in {zipCode}
                </h3>
                <p className="text-[#555555] text-sm sm:text-base mt-1">
                  {data.length} nanny share{data.length !== 1 ? "s" : ""} found
                </p>

                <NavLink
                  to="/joinNow"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="mt-auto"
                >
                  <button className="mt-2 px-4 py-1 font-bold text-sm sm:text-base rounded-full transition-all duration-300 bg-primary text-primary">
                    Contact Family – Sign Up Required
                  </button>
                </NavLink>
              </div>

              <button
                onClick={handleCloseResults}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full transition-all duration-200"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Close</span>
              </button>
            </div>

            {/* Results Grid with Scroll */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {data.length > 0 ? (
                  data.map((share, index) => (
                    <div key={index}>
                      <NannyShareCard share={share} cta={true} />
                    </div>
                    // <div
                    //   key={index}
                    //   className="rounded-2xl p-5 sm:p-6 flex flex-col justify-between h-full transition-all duration-300"
                    // >
                    //   <div className="mb-4">
                    //     {/* Header */}
                    //     <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2 mb-3">
                    //       <h4 className="text-lg sm:text-xl font-bold text-gray-800 Livvic-Bold">
                    //         {share.families}
                    //       </h4>
                    //       <span className="inline-block w-fit text-[#555555] border border-[#EEEEEE] text-xs sm:text-sm px-2 py-1 rounded-full font-medium">
                    //         {share.location}
                    //       </span>
                    //     </div>

                    //     {/* Rate and Savings */}
                    //     <div className="flex items-center gap-2 mb-3">
                    //       <p className="text-green-600 font-bold text-lg">
                    //         {share.rate}
                    //       </p>
                    //       <span className="text-sm text-gray-500">
                    //         ({share.savings})
                    //       </span>
                    //     </div>

                    //     {/* Details */}
                    //     <div className="space-y-2 mb-4">
                    //       <p className="text-sm text-gray-700 flex flex-wrap gap-2">
                    //         <span className="text-gray-700 px-2 py-1 rounded text-xs font-medium">
                    //           {share.schedule}
                    //         </span>
                    //         <span className="text-gray-700 px-2 py-1 rounded text-xs font-medium">
                    //           {share.kids}
                    //         </span>
                    //       </p>

                    //       <p className="text-gray-600 text-sm italic leading-relaxed">
                    //         "{share.description}"
                    //       </p>

                    //       <div className="bg-gradient-to-r from-[#AEC4FF]/10 to-[#85D1F1]/10 px-3 py-2 rounded-lg border border-[#AEC4FF]/20">
                    //         <p className="text-sm font-medium">
                    //           <span className="text-gray-600">
                    //             Share Details:
                    //           </span>
                    //           <span className="text-[#0f3460] ml-1">
                    //             {share.families} • {share.location}
                    //           </span>
                    //         </p>
                    //       </div>
                    //     </div>
                    //   </div>

                    //   {/* CTA Button */}
                    //   <NavLink
                    //     to="/joinNow"
                    //     onClick={() => {
                    //       handleCloseResults();
                    //       window.scrollTo({ top: 0, behavior: "smooth" });
                    //     }}
                    //     className="mt-auto"
                    //   >
                    //     <button className="w-full font-bold text-sm sm:text-base px-4 py-3 rounded-full transition-all duration-300 bg-primary text-primary">
                    //       {share.cta}
                    //     </button>
                    //   </NavLink>
                    // </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <div className="bg-gradient-to-br from-[#AEC4FF]/10 to-[#85D1F1]/10 backdrop-blur-sm rounded-2xl p-8 border border-[#AEC4FF]/30">
                      <p className="text-white text-lg mb-2">
                        No caregivers found in this area
                      </p>
                      <p className="text-[#FFFFFF99] text-sm">
                        Try searching with a different ZIP code
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Hero;
