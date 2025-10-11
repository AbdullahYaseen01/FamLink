import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import Header from "../Header";
import { Spin, Input } from "antd";
import { fireToastMessage } from "../../toastContainer";
import { api } from "../../Config/api";
import Button from "../Button";
import { X, Star } from "lucide-react";

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
      // Use AllOrigins proxy to bypass CORS
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
        `https://api.zippopotam.us/us/${zip}`
      )}`;

      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Invalid ZIP");

      const wrappedData = await res.json();
      const data = JSON.parse(wrappedData.contents); // Extract actual JSON from proxy response

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
        `postJob/job-seeker-opportunities/${zipCode}`
      );
      const response = data?.data || [];
      console.log("Service provider response:", response);
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
      <div className="mt-20 sm:mt-32">
        <h1 className="Livvic-Bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white leading-tight sm:leading-[50px] md:leading-[60px] lg:leading-[80px]">
          Find Jobs That Match
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          Your Skills and Schedule
        </h1>
        <h2 className="Livvic text-[#FFFFFF99] text-base sm:text-lg md:text-xl mt-4 sm:mt-6 max-w-2xl">
          Whether you’re a nanny, tutor, or swim instructor, Famlink helps you
          find the right family—faster.
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
                  placeholder="Enter zip code to find jobs"
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
            btnText="Browse Jobs"
            className="bg-[#AEC4FF] w-full sm:w-auto px-6 py-3 sm:py-4"
            action={() => handleDataRetrieve()}
            isLoading={isLoading}
            loadingBtnText="Searching..."
          />
        </div>
      </div>

      {/* Results Section with Background Overlay */}
      {showResults && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="rounded-3xl w-full max-w-7xl max-h-[90vh] overflow-hidden bg-white">
            {/* Results Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 ">
              <div>
                <h3 className=" text-xl sm:text-2xl md:text-3xl font-bold Livvic-Bold">
                  Job Opportunities in {zipCode}
                </h3>
                <p className=" text-sm sm:text-base mt-1">
                  {`${data.length} job${data.length !== 1 ? "s" : ""} found`}
                </p>
              </div>
              <button
                onClick={handleCloseResults}
                className="flex items-center gap-2  px-3 sm:px-4 py-2 rounded-full transition-all duration-200"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Close</span>
              </button>
            </div>

            {/* Results Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {data.length > 0 ? (
                  data.map((job, index) => (
                    <div
                      key={index}
                      className="rounded-2xl p-5 sm:p-6 flex flex-col justify-between h-full transition-all duration-300"
                    >
                      <div className="mb-4 bg-white">
                        {/* Job Title */}
                        <div className="mb-3">
                          <h4 className="text-lg sm:text-xl font-bold text-gray-800 Livvic-Bold mb-2">
                            {job.title}
                          </h4>

                          {/* Rate and Type */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                              {job.rate}
                            </span>
                            {job.type && (
                              <span className="bg-[#AEC4FF]/20 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                                {job.type}
                              </span>
                            )}
                          </div>

                          {/* Job Description (if available) */}
                          {job.description && (
                            <p className="text-gray-600 text-sm leading-relaxed mb-3">
                              {job.description.slice(0, 100)}...
                            </p>
                          )}

                          {/* Additional Details */}
                          <div className=" px-3 py-2 rounded-lg">
                            <p className="text-sm font-medium text-[#0f3460]">
                              Job Opportunity Available
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <NavLink
                        to="/joinNow"
                        onClick={() => {
                          handleCloseResults();
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="mt-auto"
                      >
                        <button className="w-full font-bold text-sm sm:text-base px-4 py-3 rounded-full transition-all duration-300 bg-primary text-primary">
                          {job.action || "Apply Now"}
                        </button>
                      </NavLink>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <div className="bg-gradient-to-br from-[#AEC4FF]/10 to-[#85D1F1]/10 backdrop-blur-sm rounded-2xl p-8 border border-[#AEC4FF]/30">
                      <p className="text-white text-lg mb-2">
                        No job opportunities found in this area
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
