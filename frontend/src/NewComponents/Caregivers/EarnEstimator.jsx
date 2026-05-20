import React, { useState, useRef } from "react";
import Button from "../Button";
import { Spin, Input, Select } from "antd";
import { fireToastMessage } from "../../toastContainer";

const { Option } = Select;

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_RATE = 31.12; // national avg for 2 children

const EXPERIENCE_MULTIPLIERS = {
  standard:   1.0,
  experienced: 1.1,
  career:     1.25,
};

const EXPERIENCE_LABELS = {
  standard:    "Standard Nanny",
  experienced: "Experienced Nanny",
  career:      "Career Nanny",
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

// City overrides keyed by state: [cityName, multiplier]
// Matched case-insensitively against the place name from zippopotam.us
const CITY_OVERRIDES = {
  CA: [
    ["Sacramento",   0.95],
    ["San Diego",    1.00],
    ["Los Angeles",  1.08],
    ["Orange",       1.10],
    ["Anaheim",      1.10],
    ["Irvine",       1.10],
    ["Oakland",      1.12],
    ["Berkeley",     1.12],
    ["San Jose",     1.18],
    ["San Francisco",1.25],
    ["Palo Alto",    1.30],
    ["Menlo Park",   1.30],
    ["Atherton",     1.30],
  ],
  NY: [
    ["Brooklyn",     1.20],
    ["Queens",       1.20],
    ["Bronx",        1.20],
    ["New York",     1.20],
    ["Manhattan",    1.28],
  ],
  FL: [
    ["Miami",        0.95],
    ["Palm Beach",   1.00],
  ],
  TX: [
    ["Houston",      0.80],
    ["Dallas",       0.85],
    ["Austin",       0.92],
  ],
  MA: [
    ["Boston",       1.08],
    ["Cambridge",    1.10],
  ],
  WA: [
    ["Seattle",      1.08],
    ["Bellevue",     1.12],
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveLocationMultiplier(state, cityName) {
  const overrides = CITY_OVERRIDES[state] || [];
  const city = (cityName || "").toLowerCase();
  for (const [overrideCity, multiplier] of overrides) {
    if (city.includes(overrideCity.toLowerCase())) {
      return { multiplier, label: `${overrideCity}, ${state}` };
    }
  }
  return { multiplier: STATE_MULTIPLIERS[state] ?? 1.0, label: state };
}

function calculateEarnings(locationMultiplier, experienceMultiplier) {
  const hourly = BASE_RATE * locationMultiplier * experienceMultiplier;
  return {
    hourly:  Math.round(hourly * 100) / 100,
    weekly:  Math.round(hourly * 40),
    monthly: Math.round(hourly * 173),
    yearly:  Math.round(hourly * 2080),
  };
}

// Fetches ZIP data and returns { state, cityName } or throws on failure
async function fetchZipLocation(zip) {
  const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
  if (!res.ok) throw new Error("Invalid ZIP");
  const data = await res.json();
  const place = data.places?.[0] || {};
  const state = place["state abbreviation"] || "";
  const cityName = place["place name"] || "";
  if (!state) throw new Error("Invalid structure");
  return { zip: data["post code"] || zip, state, cityName };
}

// ─── Component ────────────────────────────────────────────────────────────────

function EarnEstimation() {
  const [loading, setLoading]               = useState(false);
  const [zipCode, setZipCode]               = useState("");
  const [experience, setExperience]         = useState("standard");
  const [earnings, setEarnings]             = useState(null);
  const [resolvedLocation, setResolvedLocation] = useState(null); // { zip, state, cityName }

  // Holds the in-flight validation promise so handleCalculate can await it
  // instead of racing or re-fetching
  const validationPromiseRef = useRef(null);

  // ── ZIP validation (called on blur) ────────────────────────────────────────
  const handleZipValidation = (zip) => {
    if (!zip) return;

    setLoading(true);
    setResolvedLocation(null);
    setEarnings(null);

    // Store the promise in the ref so Calculate can await it
    const promise = fetchZipLocation(zip)
      .then((location) => {
        setZipCode(location.zip);
        setResolvedLocation(location);
        return location;
      })
      .catch(() => {
        setZipCode("");
        setResolvedLocation(null);
        fireToastMessage({
          type: "error",
          message: "Invalid ZIP code. Please enter a valid U.S. ZIP.",
        });
        return null;
      })
      .finally(() => {
        setLoading(false);
        // Clear the ref once settled so future clicks don't re-await a stale promise
        if (validationPromiseRef.current === promise) {
          validationPromiseRef.current = null;
        }
      });

    validationPromiseRef.current = promise;
  };

  // ── Calculate ───────────────────────────────────────────────────────────────
  const handleCalculate = async () => {
    let location = resolvedLocation;

    // If blur fired and a validation is still in flight, wait for it
    if (!location && validationPromiseRef.current) {
      location = await validationPromiseRef.current;
    }

    // If still no location, try fetching now (user never blurred the field)
    if (!location && zipCode) {
      setLoading(true);
      try {
        location = await fetchZipLocation(zipCode);
        setZipCode(location.zip);
        setResolvedLocation(location);
      } catch {
        fireToastMessage({
          type: "error",
          message: "Please enter a valid U.S. ZIP code.",
        });
        return;
      } finally {
        setLoading(false);
      }
    }

    if (!location?.state) {
      fireToastMessage({
        type: "error",
        message: "Please enter a valid U.S. ZIP code.",
      });
      return;
    }

    const { multiplier, label } = resolveLocationMultiplier(location.state, location.cityName);
    const expMult  = EXPERIENCE_MULTIPLIERS[experience] ?? 1.0;
    const result   = calculateEarnings(multiplier, expMult);

    setEarnings({
      zip:      location.zip,
      locationLabel: label,
      cityName: location.cityName,
      experience,
      locationMultiplier: multiplier,
      ...result,
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="py-10 sm:py-14 lg:py-16 relative Livvic flex justify-center items-center min-h-[400px] sm:min-h-[600px]">
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
                  onChange={(e) => {
                    const newZip = e.target.value;
                    setZipCode(newZip);
                    // Only invalidate resolved location when the value actually changes
                    if (newZip !== zipCode) {
                      setResolvedLocation(null);
                      setEarnings(null);
                      validationPromiseRef.current = null;
                    }
                  }}
                  onBlur={(e) => {
                    const zip = e.target.value.trim();
                    if (zip) handleZipValidation(zip);
                  }}
                  value={zipCode}
                  className="w-full p-3 sm:p-4 rounded-full border-2"
                  maxLength={10}
                />
              </Spin>
            </div>

            {/* Experience level */}
            <Select
              value={experience}
              onChange={(val) => {
                setExperience(val);
                setEarnings(null);
              }}
              className="w-full sm:w-[220px] rounded-full border-2"
              size="large"
            >
              <Option value="standard">Standard Nanny</Option>
              <Option value="experienced">Experienced Nanny</Option>
              <Option value="career">Career Nanny</Option>
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
                Your Estimated Nanny Earnings
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                {EXPERIENCE_LABELS[earnings.experience]} · ZIP: {earnings.zip}
                {earnings.cityName ? ` (${earnings.cityName})` : ""}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-4 text-center min-w-[140px]">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Hourly Rate</p>
                  <p className="text-2xl Livvic-Bold text-primary">${earnings.hourly.toFixed(2)}</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-4 text-center min-w-[140px]">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Per Week</p>
                  <p className="text-2xl Livvic-Bold text-primary">${earnings.weekly.toLocaleString()}</p>
                </div>

                <div className="bg-blue-100 border border-blue-300 rounded-2xl px-6 py-4 text-center min-w-[140px]">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Per Month</p>
                  <p className="text-2xl Livvic-Bold text-primary">${earnings.monthly.toLocaleString()}</p>
                </div>

                <div className="bg-blue-200 border border-blue-400 rounded-2xl px-6 py-4 text-center min-w-[140px]">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Per Year</p>
                  <p className="text-2xl Livvic-Bold text-primary">${earnings.yearly.toLocaleString()}</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-3 max-w-sm">
                Estimates based on national average rates with regional cost-of-living adjustments.
                Actual earnings may vary based on your specific agreement with families.
              </p>
            </div>
          )}
        </div>

        <div className="absolute left-4 bottom-4 hidden sm:block">
          <img src="/icons/Background/Rainbow.svg" alt="rainbow" />
        </div>
      </div>
    </>
  );
}

export default EarnEstimation;