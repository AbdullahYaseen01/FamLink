import React, { useState, useEffect } from "react";
import { Slider } from "antd";
import { useSelector } from "react-redux";

export default function FilterSlidersJobPost({
  onLocationChange,
  onPriceChange,
  onAvailabilityChange,
  onCareChange,
  maxChildrenChange,
  onServicesChange,
  // onStartChange
}) {
  // State for sliders
  const { user } = useSelector((s) => s.auth);
  const budgetRange = user?.additionalInfo
    .find((info) => info.key === "totalBudget")
    ?.value.option.split("to")
    .map((value) => parseFloat(value.trim())); // Convert to numbers and remove any extra spaces

  const [locationValue, setLocationValue] = useState(5); // Location slider
  const [priceValue, setPriceValue] = useState(
    budgetRange ? [0, budgetRange[1]] : [0, 50]
  ); // Price slider
  const ageOfChildren = ["Infant", "Toddler", "Preschool", "School-age"];
  const [selectedCare, setSelectedCare] = useState([]);
  const [selectedAvailability, setSelectedAvailability] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  // Notify parent when values change
  useEffect(() => {
    onLocationChange(locationValue);
  }, [locationValue, onLocationChange]);

  useEffect(() => {
    onPriceChange(priceValue);
  }, [priceValue, onPriceChange]);
  useEffect(() => { });
  useEffect(() => {
    onAvailabilityChange(selectedAvailability);
  }, [selectedAvailability, onAvailabilityChange]);

  // useEffect(() => {
  //     onStartChange(selectedStart)
  // }, [selectedStart, onStartChange])

  useEffect(() => {
    onCareChange(selectedCare);
  }, [selectedCare, onCareChange]);

  useEffect(() => {
    onServicesChange(selectedServices);
  }, [selectedServices, onServicesChange]);

  // Toggle selection with smooth transition for any category
  const toggleSelection = (category, value) => {
    switch (category) {
      case "care":
        const actualValue = value;
        setSelectedCare((prev) =>
          prev.includes(actualValue)
            ? prev.filter((item) => item !== actualValue)
            : [...prev, actualValue]
        );
        break;
      // case 'start':
      //     setSelectedStart(prev =>
      //         prev.includes(value)
      //             ? prev.filter(item => item !== value)
      //             : [...prev, value]
      //     )
      //     break
      case "shareType":
        setSelectedServices((prev) =>
          prev.includes(value)
            ? prev.filter((item) => item !== value)
            : [...prev, value]
        );
        break;
      case "availability":
        setSelectedAvailability((prev) =>
          prev.includes(value)
            ? prev.filter((item) => item !== value)
            : [...prev, value]
        );
        break;
      default:
        break;
    }
  };

  // Define a function to apply conditional styling
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
    <div className="shadow-soft bg-white p-4 rounded-2xl filter-width">
      {/* Location Slider */}
      <div className="">
        <h4 className="onboarding-subHead text-[#001243]">Distance</h4>
        <Slider
          className=""
          min={0}
          max={10}
          value={locationValue}
          onChange={setLocationValue}
          trackStyle={{
            background: `${"linear-gradient(90deg, #AEC4FF 0%, #AEC4FF 100%)"}`,
          }}
        />
        <p className='Livvic-SemiBold text-[#001243] text-sm'>
          Within {locationValue}mi of 10mi,{" "}
          {user?.location?.format_location
            ? user.location.format_location
            : "Your given location (please add your address in the Edit Profile tab from the menu after clicking your profile picture in the navbar)"}
        </p>

      </div>
      <hr className="border-1 my-4" />

      {/* <div className="mt-6">
        <h4 className="onboarding-subHead text-[#001243]">Number of Children</h4>
        <input
          type="number"
          min={1}
          max={10}
          placeholder="Enter number of children"
          className="mt-2 w-full border rounded-full Livvic-SemiBold text-[#001243] text-sm border-[#D6DDEB] px-4 py-2 outline-none focus:ring-2 focus:ring-[#9EDCE1]"
          onChange={(e) => {
            maxChildrenChange(parseInt(e.target.value));
          }}
        />
      </div> */}
      {/* <hr className="border-1 my-4" /> */}

      <div>
        <h4 className="onboarding-subHead text-[#001243]">Schedule</h4>
        <div className="flex flex-wrap gap-x-2 gap-y-4 mt-3">
          {["Full-time", "Part-time", "Flexible"].map(
            (option) => (
              <p
                key={option}
                onClick={() => toggleSelection("availability", option)}
                style={getOptionStyle("availability", option)} // Pass the correct category here
                className="Livvic-Medium text-[#555555] border border-[#EEEEEE] px-4 py-1 rounded-full cursor-pointer"
              >
                {option}
              </p>
            )
          )}
        </div>
      </div>
      <hr className="border-1 my-4" />
      {/* Services Options */}
      <div>
        <h4 className="onboarding-subHead text-[#001243]">Age of Children</h4>
        <div className="flex flex-wrap gap-x-2 gap-y-4 mt-3">
          {ageOfChildren.map((option) => (
            <p
              key={option}
              onClick={() => toggleSelection("care", option)}
              style={getOptionStyle("care", option)}
              className=" px-4 py-1 rounded-3xl Livvic-Medium text-[#555555] border border-[#EEEEEE] cursor-pointer"
            >
              {option}
            </p>
          ))}
        </div>
      </div>
      <hr className="border-1 my-4" />
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
              style={getOptionStyle("shareType", option)} // Pass the correct category here
              className=" px-4 py-1 rounded-3xl Livvic-Medium text-[#555555] border border-[#EEEEEE] cursor-pointer"
            >
              {option}
            </p>
          ))}
        </div>
      </div>
      <hr className="border-1 my-4" />
      <div>
        <div>
          <h4 className="onboarding-subHead text-[#001243]">Price</h4>
          <Slider
            className=""
            range
            min={0}
            max={50}
            value={priceValue}
            onChange={setPriceValue}
            trackStyle={{
              background: `${"linear-gradient(90deg, #AEC4FF 0%, #AEC4FF 100%)"}`,
            }}
          />
          <p className="Livvic-SemiBold text-[#001243] text-sm">
            Within ${priceValue[0]} - ${priceValue[1]}/hr
          </p>
        </div>
      </div>
    </div>
  );
}
