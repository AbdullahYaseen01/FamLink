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

  // BASE_RATE = $31.12/hr (national avg for 2 children)
  const SOLO_HOURLY_BASE = 31.12;
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

  // State multipliers (all 50 states + DC)
  const STATE_MULTIPLIERS = {
    AL: 0.75, AK: 1.00, AZ: 0.85, AR: 0.72, CA: 1.00,
    CO: 0.90, CT: 0.95, DE: 0.85, DC: 0.95, FL: 0.82,
    GA: 0.78, HI: 1.05, ID: 0.78, IL: 0.88, IN: 0.78,
    IA: 0.72, KS: 0.74, KY: 0.74, LA: 0.75, ME: 0.90,
    MD: 0.92, MA: 0.98, MI: 0.80, MN: 0.90, MS: 0.70,
    MO: 0.76, MT: 0.82, NE: 0.75, NV: 0.82, NH: 0.92,
    NJ: 1.00, NM: 0.78, NY: 1.00, NC: 0.80, ND: 0.74,
    OH: 0.75, OK: 0.70, OR: 0.92, PA: 0.85, RI: 0.92,
    SC: 0.76, SD: 0.72, TN: 0.78, TX: 0.82, UT: 0.82,
    VT: 0.90, VA: 0.90, WA: 1.00, WV: 0.72, WI: 0.80,
    WY: 0.78,
  };

  // City overrides — checked before state multiplier
  // Each entry: [cityNameSubstring, multiplier]
  const CITY_OVERRIDES = {
    CA: [
      ["Sacramento",    0.95],
      ["San Diego",     1.00],
      ["Los Angeles",   1.08],
      ["Orange",        1.10],
      ["Anaheim",       1.10],
      ["Irvine",        1.10],
      ["Oakland",       1.12],
      ["Berkeley",      1.12],
      ["San Jose",      1.18],
      ["San Francisco", 1.25],
      ["Palo Alto",     1.30],
      ["Menlo Park",    1.30],
      ["Atherton",      1.30],
    ],
    NY: [
      ["Brooklyn",      1.20],
      ["Queens",        1.20],
      ["Bronx",         1.20],
      ["New York",      1.20],
      ["Manhattan",     1.28],
    ],
    FL: [
      ["Miami",         0.95],
      ["Palm Beach",    1.00],
    ],
    TX: [
      ["Houston",       0.80],
      ["Dallas",        0.85],
      ["Austin",        0.92],
    ],
    MA: [
      ["Boston",        1.08],
      ["Cambridge",     1.10],
    ],
    WA: [
      ["Seattle",       1.08],
      ["Bellevue",      1.12],
    ],
  };

  const getLocationMultiplier = (state, cityName) => {
    const overrides = CITY_OVERRIDES[state] || [];
    const city = (cityName || "").toLowerCase();
    for (const [name, mult] of overrides) {
      if (city.includes(name.toLowerCase())) return mult;
    }
    return STATE_MULTIPLIERS[state] || 1.0;
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

    // Get state and city from zip for regional adjustment
    const res = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
    const data = await res.json();
    const state = data.places?.[0]?.["state abbreviation"] || "";
    const cityName = data.places?.[0]?.["place name"] || "";
    const regionalMultiplier = getLocationMultiplier(state, cityName);

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
              className="bg-[#AEC4FF] w-full sm:w-auto px-6 py-3 sm:py-4"
              action={() => handleCalculate()}
              isLoading={loading}
              loadingBtnText="Calculating..."
            />
          </div>

          {earnings && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <h3 className="text-xl Livvic-SemiBold text-primary">
                Your Estimated Nanny Share Earnings
              </h3>
              <p className="text-sm Livvic-Medium text-gray-500 mb-2">
                Caring for {earnings.numFamilies} families · ZIP: {earnings.zip}
                {earnings.state ? `, ${earnings.state}` : ""}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                {/* Hourly */}
                <div className="bg-blue-50 rounded-2xl px-6 py-4 text-center min-w-[140px]">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 Livvic-Medium">Hourly Rate</p>
                  <p className="text-2xl Livvic-Bold text-primary">
                    ${earnings.hourly[0]}–${earnings.hourly[1]}
                  </p>
                </div>

                {/* Monthly */}
                <div className="bg-blue-100 rounded-2xl px-6 py-4 text-center min-w-[140px]">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 Livvic-Medium">Per Month</p>
                  <p className="text-2xl Livvic-Bold text-primary">
                    ${parseInt(earnings.monthly[0]).toLocaleString()}–${parseInt(earnings.monthly[1]).toLocaleString()}
                  </p>
                </div>

                {/* Annual */}
                <div className="bg-blue-200 rounded-2xl px-6 py-4 text-center min-w-[140px]">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 Livvic-Medium">Per Year</p>
                  <p className="text-2xl Livvic-Bold text-primary">
                    ${parseInt(earnings.annual[0]).toLocaleString()}–${parseInt(earnings.annual[1]).toLocaleString()}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-3 max-w-sm Livvic">
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