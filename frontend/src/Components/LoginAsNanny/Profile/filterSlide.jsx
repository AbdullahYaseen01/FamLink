import React, { useState, useEffect, useCallback } from "react";
import { Slider } from "antd";
import { useSelector } from "react-redux";

export default function FilterSlidersJobPost({
  onLocationChange,
  onPriceChange,
  onAvailabilityChange,
  onCareChange,
  maxChildrenChange,
  onServicesChange,
}) {
  const { user } = useSelector((s) => s.auth);
  const budgetRange = user?.additionalInfo
    .find((info) => info.key === "totalBudget")
    ?.value.option.split("to")
    .map((value) => parseFloat(value.trim()));

  const [locationValue, setLocationValue] = useState(5);
  const [priceValue, setPriceValue] = useState(
    budgetRange ? [0, budgetRange[1]] : [0, 50]
  );
  const ageOfChildren = ["Infant", "Toddler", "Preschool", "School-age"];
  const [selectedCare, setSelectedCare] = useState([]);
  const [selectedAvailability, setSelectedAvailability] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [isDirty, setIsDirty] = useState(false);

  const markDirty = () => setIsDirty(true);

  const handleApply = useCallback(() => {
    onLocationChange(locationValue);
    onPriceChange(priceValue);
    onAvailabilityChange(selectedAvailability);
    onCareChange(selectedCare);
    onServicesChange(selectedServices);
    setIsDirty(false);
  }, [
    locationValue,
    priceValue,
    selectedAvailability,
    selectedCare,
    selectedServices,
    onLocationChange,
    onPriceChange,
    onAvailabilityChange,
    onCareChange,
    onServicesChange,
  ]);

  useEffect(() => {
    handleApply();
  }, []);

  const toggleSelection = (category, value) => {
    markDirty();
    switch (category) {
      case "care":
        setSelectedCare((prev) =>
          prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
        );
        break;
      case "shareType":
        setSelectedServices((prev) =>
          prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
        );
        break;
      case "availability":
        setSelectedAvailability((prev) =>
          prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
        );
        break;
      default:
        break;
    }
  };

  const getOptionStyle = (category, value) => {
    const isSelected =
      category === "care"
        ? selectedCare.includes(value)
        : category === "availability"
        ? selectedAvailability.includes(value)
        : selectedServices.includes(value);

    return {
      background: isSelected ? "#AEC4FF" : "transparent",
      color: isSelected ? "#001243" : "#666",
      borderColor: isSelected ? "" : "#D6DDEB",
      transition: "all 0.3s ease",
    };
  };

  return (
    <div className="shadow-soft bg-white rounded-2xl filter-width flex flex-col lg:block lg:p-4">
      {/* Scrollable filter content */}
      <div className="flex-1 overflow-y-auto p-4 pb-2 lg:overflow-visible lg:p-0">
        {/* Distance */}
        <div>
          <h4 className="onboarding-subHead text-[#001243]">Distance</h4>
          <Slider
            min={0}
            max={10}
            value={locationValue}
            onChange={(val) => { setLocationValue(val); markDirty(); }}
            trackStyle={{ background: "linear-gradient(90deg, #AEC4FF 0%, #AEC4FF 100%)" }}
          />
          <p className="Livvic-SemiBold text-[#001243] text-sm">
            Within {locationValue}mi of 10mi,{" "}
            {user?.location?.format_location
              ? user.location.format_location
              : "Your given location (please add your address in the Edit Profile tab from the menu after clicking your profile picture in the navbar)"}
          </p>
        </div>
        <hr className="border-1 my-4" />

        {/* Schedule */}
        <div>
          <h4 className="onboarding-subHead text-[#001243]">Schedule</h4>
          <div className="flex flex-wrap gap-x-2 gap-y-4 mt-3">
            {["Full-time", "Part-time", "Flexible"].map((option) => (
              <p
                key={option}
                onClick={() => toggleSelection("availability", option)}
                style={getOptionStyle("availability", option)}
                className="Livvic-Medium text-[#555555] border border-[#EEEEEE] px-4 py-1 rounded-full cursor-pointer"
              >
                {option}
              </p>
            ))}
          </div>
        </div>
        <hr className="border-1 my-4" />

        {/* Age of Children */}
        <div>
          <h4 className="onboarding-subHead text-[#001243]">Age of Children</h4>
          <div className="flex flex-wrap gap-x-2 gap-y-4 mt-3">
            {ageOfChildren.map((option) => (
              <p
                key={option}
                onClick={() => toggleSelection("care", option)}
                style={getOptionStyle("care", option)}
                className="px-4 py-1 rounded-3xl Livvic-Medium text-[#555555] border border-[#EEEEEE] cursor-pointer"
              >
                {option}
              </p>
            ))}
          </div>
        </div>
        <hr className="border-1 my-4" />

        {/* Share Type */}
        <div>
          <h4 className="onboarding-subHead text-[#001243]">Share Type</h4>
          <div className="flex flex-wrap gap-x-2 gap-y-4 mt-3">
            {[
              "Family ● Looking for a share",
              "Family ● Has a Nanny, Looking for a share",
              "Nanny ● Looking for a share position",
              "Nanny ● With a Family, Looking for a share",
            ].map((option) => (
              <p
                key={option}
                onClick={() => toggleSelection("shareType", option)}
                style={getOptionStyle("shareType", option)}
                className="px-4 py-1 rounded-3xl Livvic-Medium text-[#555555] border border-[#EEEEEE] cursor-pointer"
              >
                {option}
              </p>
            ))}
          </div>
        </div>
        <hr className="border-1 my-4" />

        {/* Price */}
        <div>
          <h4 className="onboarding-subHead text-[#001243]">Price</h4>
          <Slider
            range
            min={0}
            max={50}
            value={priceValue}
            onChange={(val) => { setPriceValue(val); markDirty(); }}
            trackStyle={{ background: "linear-gradient(90deg, #AEC4FF 0%, #AEC4FF 100%)" }}
          />
          <p className="Livvic-SemiBold text-[#001243] text-sm">
            Within ${priceValue[0]} - ${priceValue[1]}/hr
          </p>
        </div>
      </div>

      {/* Apply Button — sticky on mobile, inline on lg+ */}
      <div className="sticky bottom-0 p-4 bg-white border-t border-[#EEEEEE] lg:static lg:border-none lg:p-0 lg:mt-4">
        <button
          onClick={handleApply}
          className={`w-full py-2 rounded-full Livvic-SemiBold text-sm transition-all duration-300 ${
            isDirty
              ? "bg-[#AEC4FF] text-[#001243] cursor-pointer"
              : "bg-[#E8EDF5] text-[#999] cursor-default"
          }`}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}