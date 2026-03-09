import React, { useState, useEffect } from "react";
import Header from "../Header";
import { Spin, Input } from "antd";
import { fireToastMessage } from "../../toastContainer";
import Button from "../Button";
import { useNavigate } from "react-router-dom";

function Hero() {
  const [zipCode, setZipCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleDataRetrieve = async () => {
    // 1. Format Validation (5 digits or ZIP+4)
    const zipCodeRegex = /^\d{5}(-\d{4})?$/;

    if (!zipCode || !zipCodeRegex.test(zipCode)) {
      fireToastMessage({
        type: "error",
        message: "Please enter a valid US ZIP code (e.g., 90210)",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 2. Existence Verification using Proxy to bypass CORS
      // const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
      //   `https://api.zippopotam.us/us/${zipCode.split("-")[0]}`, // Verify base 5 digits
      // )}`;

      const proxyUrl = `https://api.zippopotam.us/us/${zipCode.split("-")[0]}`;

      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error();

      const wrappedData = await res.json();
      console.log(wrappedData);

      // AllOrigins returns the result as a string in .contents
      if (!wrappedData) {
        throw new Error("Invalid ZIP code");
      }

      // 3. If the object isn't empty, it's a valid ZIP
      if (wrappedData && Object.keys(wrappedData).length > 0) {
        navigate(`/find-nanny-share?zipCode=${encodeURIComponent(zipCode)}`);
      } else {
        throw new Error("ZIP not found");
      }
    } catch (err) {
      fireToastMessage({
        type: "error",
        message:
          err.message ||
          "We couldn't verify that ZIP code. Please check and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="Livvic container min-h-screen px-4 sm:px-6 lg:px-8">
      <Header />

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

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 max-w-md sm:max-w-lg">
          <div className="flex-1 relative">
            <Input
              name="zipCode"
              placeholder="Enter zip code (e.g. 90210)"
              onChange={(e) => setZipCode(e.target.value.trim())}
              onPressEnter={handleDataRetrieve} // Allow 'Enter' key to submit
              value={zipCode}
              disabled={isLoading}
              className="w-full p-3 sm:p-4 rounded-full"
              maxLength={10}
            />
          </div>
          <Button
            btnText={isLoading ? <Spin size="small" /> : "Find Nanny Share"}
            className="bg-[#FFADE1] w-full sm:w-auto px-6 py-3 sm:py-4 flex items-center justify-center"
            action={handleDataRetrieve}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

export default Hero;
