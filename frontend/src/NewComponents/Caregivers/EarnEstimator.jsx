import React, { useState } from "react";
import Button from "../Button";
import { Spin, Input, Select } from "antd";
import { fireToastMessage } from "../../toastContainer";

const { Option } = Select;

function EarnEstimation() {
  const [loading, setLoading] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [numFamilies, setNumFamilies] = useState(2);
  const [earnings, setEarnings] = useState(null);

  // Average nanny share hourly rates by number of families (base solo rate ~$20/hr)
  const SOLO_HOURLY_BASE = 20;
  const SHARE_PREMIUM_MULTIPLIERS = {
    2: 1.25, // 25% premium for 2 families
    3: 1.45, // 45% premium for 3 families
  };

  const handleZipValidation = async (zip) => {
    if (!zip) return;

    setLoading(true);
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (!res.ok) throw new Error("Invalid ZIP");

      const data = await res.json();
      const finalZip = data["post code"];
      const state = data.places?.[0]?.["state abbreviation"] || "";

      if (finalZip) {
        setZipCode(finalZip);
        return state;
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

  // Regional cost-of-living multipliers by state
  const STATE_MULTIPLIERS = {
    CA: 1.35, NY: 1.3, MA: 1.25, WA: 1.2, CO: 1.1,
    TX: 1.0, FL: 1.0, IL: 1.05, GA: 0.95, OH: 0.9,
  };

  const handleCalculate = async () => {
    const hours = parseFloat(hoursPerWeek);

    if (!zipCode || isNaN(hours) || hours <= 0) {
      fireToastMessage({
        type: "error",
        message: "Please enter a valid ZIP code and weekly hours.",
      });
      setEarnings(null);
      return;
    }

    // Get state from zip validation result for regional adjustment
    const res = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
    const data = await res.json();
    const state = data.places?.[0]?.["state abbreviation"] || "";
    const regionalMultiplier = STATE_MULTIPLIERS[state] || 1.0;

    const baseHourly = SOLO_HOURLY_BASE * regionalMultiplier;
    const shareMultiplier = SHARE_PREMIUM_MULTIPLIERS[numFamilies] || 1.25;

    const minHourly = baseHourly * shareMultiplier * 0.95;
    const maxHourly = baseHourly * shareMultiplier * 1.05;

    const weeksPerMonth = 4.33;
    const minMonthly = minHourly * hours * weeksPerMonth;
    const maxMonthly = maxHourly * hours * weeksPerMonth;
    const minAnnual = minMonthly * 12;
    const maxAnnual = maxMonthly * 12;

    setEarnings({
      zip: zipCode,
      state,
      hourly: [minHourly.toFixed(2), maxHourly.toFixed(2)],
      monthly: [minMonthly.toFixed(0), maxMonthly.toFixed(0)],
      annual: [minAnnual.toFixed(0), maxAnnual.toFixed(0)],
      numFamilies,
    });
  };

  return (
    <>
      <div className="py-10 sm:py-14 lg:py-16 relative Livvic flex justify-center items-center min-h-[400px] sm:min-h-[600px]">
        {/* Sun decoration - hidden on mobile */}
        <div className="absolute right-4 top-4 hidden sm:block">
          <img src="/icons/Background/Sun.svg" alt="sun" />
        </div>

        <div className="text-center">
          <h1 className="Livvic-Bold text-center text-lg sm:text-5xl sm:leading-[70px]">
            See how much you could earn each month
            <br />
            as a nanny share caregiver.
          </h1>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8 sm:mt-12 justify-center items-center w-full px-4 sm:px-0">
            {/* ZIP Code */}
            <div className="relative w-full sm:w-[220px]">
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

            {/* Hours per week */}
            <Input
              name="hoursPerWeek"
              placeholder="Hours per week"
              type="number"
              onChange={(e) => setHoursPerWeek(e.target.value)}
              value={hoursPerWeek}
              className="w-full sm:w-[220px] p-3 sm:p-4 rounded-full border-2"
              suffix="hrs/wk"
              min={1}
              max={60}
            />

            {/* Number of families */}
            <Select
              value={numFamilies}
              onChange={(val) => setNumFamilies(val)}
              className="w-full sm:w-[180px] rounded-full border-2"
              size="large"
            >
              <Option value={2}>2 Families</Option>
              <Option value={3}>3 Families</Option>
            </Select>

            <Button
              btnText={"Calculate Earnings"}
              className="bg-[#FFADE1] w-full sm:w-auto px-6 py-3 sm:py-4"
              action={() => handleCalculate()}
              isLoading={loading}
              loadingBtnText="Calculating..."
            />
          </div>

          {earnings && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <h3 className="text-xl font-semibold text-pink-950">
                Your Estimated Nanny Share Earnings
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                Caring for {earnings.numFamilies} families · ZIP: {earnings.zip}
                {earnings.state ? `, ${earnings.state}` : ""}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                {/* Hourly */}
                <div className="bg-pink-50 border border-pink-200 rounded-2xl px-6 py-4 text-center min-w-[140px]">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Hourly Rate</p>
                  <p className="text-2xl font-bold text-pink-700">
                    ${earnings.hourly[0]}–${earnings.hourly[1]}
                  </p>
                </div>

                {/* Monthly */}
                <div className="bg-pink-100 border border-pink-300 rounded-2xl px-6 py-4 text-center min-w-[140px]">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Per Month</p>
                  <p className="text-2xl font-bold text-pink-800">
                    ${parseInt(earnings.monthly[0]).toLocaleString()}–${parseInt(earnings.monthly[1]).toLocaleString()}
                  </p>
                </div>

                {/* Annual */}
                <div className="bg-pink-200 border border-pink-400 rounded-2xl px-6 py-4 text-center min-w-[140px]">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Per Year</p>
                  <p className="text-2xl font-bold text-pink-900">
                    ${parseInt(earnings.annual[0]).toLocaleString()}–${parseInt(earnings.annual[1]).toLocaleString()}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-3 max-w-sm">
                Estimates based on average nanny share rates and regional cost-of-living adjustments.
                Actual earnings may vary based on experience, certifications, and family agreements.
              </p>
            </div>
          )}
        </div>

        {/* Rainbow decoration - hidden on mobile */}
        <div className="absolute left-4 bottom-4 hidden sm:block">
          <img src="/icons/Background/Rainbow.svg" alt="rainbow" />
        </div>
      </div>
    </>
  );
}

export default EarnEstimation;