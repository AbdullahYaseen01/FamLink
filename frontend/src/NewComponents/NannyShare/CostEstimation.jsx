import React, { useState } from "react";
import Button from "../Button";
import { Spin, Input } from "antd";
import { fireToastMessage } from "../../toastContainer";

function CostEstimation() {
  const [loading, setLoading] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [childCareCost, setChildCareCost] = useState("");
  const [savings, setSavings] = useState(null);

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
      } else {
        throw new Error("Invalid structure");
      }
    } catch (err) {
      setZipCode("");
      fireToastMessage({
        type: "error",
        message: "Invalid ZIP code. Please enter a valid U.S. ZIP.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    const cost = parseFloat(childCareCost);

    if (!zipCode || isNaN(cost) || cost <= 0) {
      fireToastMessage({
        type: "error",
        message: "Please enter a valid ZIP code and monthly childcare cost.",
      });
      setSavings(null);
      return;
    }

    // Estimate savings
    const minSave = cost * 0.4;
    const maxSave = cost * 0.5;

    setSavings({
      zip: zipCode,
      range: [minSave.toFixed(0), maxSave.toFixed(0)],
    });
  };

  return (
    <>
      <div className="py-10 sm:py-14 lg:py-16 relative Livvic flex justify-center items-center min-h-[400px] sm:min-h-[600px]">
        {/* Sun decoration - hidden on mobile */}
        <div className="absolute right-0 top-2 hidden sm:block">
          <img src="/icons/Background/Sun.svg" alt="sun" />
        </div>

        <div className="text-center">
          <h1 className="Livvic-Bold text-2xl sm:text-5xl sm:leading-[70px] ">
            See how much you could save each month
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            by sharing a nanny.
          </h1>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8 sm:mt-12 justify-center items-center w-full px-4 sm:px-0">
            <div className="relative w-full sm:w-[300px]">
              <Spin
                spinning={loading}
                size="small"
                className="absolute z-10 left-3 top-1/2 -translate-y-1/2"
              >
                <Input
                  name="zipCode"
                  placeholder="Enter zip code"
                  onChange={(e) => setZipCode(e.target.value)}
                  onBlur={(e) => handleZipValidation(e.target.value.trim())}
                  value={zipCode}
                  className="w-full p-3 sm:p-4 rounded-full border-2"
                  maxLength={10}
                />
              </Spin>
            </div>

            <Input
              name="currentCost"
              placeholder="Your monthly childcare cost"
              type="number"
              onChange={(e) => setChildCareCost(e.target.value)}
              value={childCareCost}
              className="w-full sm:w-[300px] p-3 sm:p-4 rounded-full border-2"
              prefix="$"
            />

            <Button
              btnText={"Calculate Savings"}
              className="bg-[#FFADE1] w-full sm:w-auto px-6 py-3 sm:py-4"
              action={() => handleCalculate()}
              isLoading={loading}
              loadingBtnText="Searching..."
            />
          </div>
          {savings && (
            <div className="mt-6 flex flex-col items-center">
              <h3 className="text-xl font-semibold mb-2 text-pink-950">
                Potential Monthly Savings:
              </h3>
              <p className="text-lg">
                Between <strong>${savings.range[0]}</strong> and{" "}
                <strong>${savings.range[1]}</strong> per month.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Based on ZIP code: {savings.zip}
              </p>
            </div>
          )}
        </div>
        {/* Rainbow decoration - hidden on mobile */}
        <div className="absolute left-0 bottom-2 hidden sm:block">
          <img src="/icons/Background/Rainbow.svg" alt="rainbow" />
        </div>
      </div>
    </>
  );
}

export default CostEstimation;
