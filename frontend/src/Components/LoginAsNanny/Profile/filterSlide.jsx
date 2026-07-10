import React, { useState, useEffect } from "react";
import { Slider } from "antd";
import { useSelector } from "react-redux";
import { MapPin, Clock, Calendar, Home, DollarSign } from "lucide-react";
import { SHARE_TYPE_GOALS, ShareTypeLabel } from "../../../Config/shareTypeTheme";

// Card wrapper + heading with a colored icon (colors mirror the profile-card
// meta-row icons so the whole dashboard reads as one system).
const FilterCard = ({ icon: Icon, iconColor, title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
    <div className="flex items-center gap-2 mb-3">
      <Icon size={18} className="flex-shrink-0" style={{ color: iconColor }} />
      <h4 className="text-base Livvic-SemiBold text-[#001243]">{title}</h4>
    </div>
    {children}
  </div>
);

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

  // Push the initial defaults to the parent once on mount (so the results list
  // and the filter UI start from the same values).
  useEffect(() => {
    onLocationChange(locationValue);
    onPriceChange(priceValue);
    onAvailabilityChange(selectedAvailability);
    onCareChange(selectedCare);
    onServicesChange(selectedServices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle a value in a multi-select filter and apply it live (no Apply button).
  const toggleAvailability = (value) => {
    const next = selectedAvailability.includes(value)
      ? selectedAvailability.filter((v) => v !== value)
      : [...selectedAvailability, value];
    setSelectedAvailability(next);
    onAvailabilityChange(next);
  };

  const toggleCare = (value) => {
    const next = selectedCare.includes(value)
      ? selectedCare.filter((v) => v !== value)
      : [...selectedCare, value];
    setSelectedCare(next);
    onCareChange(next);
  };

  const toggleShareType = (value) => {
    const next = selectedServices.includes(value)
      ? selectedServices.filter((v) => v !== value)
      : [...selectedServices, value];
    setSelectedServices(next);
    onServicesChange(next);
  };

  const chipStyle = (isSelected) =>
    isSelected
      ? { background: "#AEC4FF", color: "#001243" }
      : { background: "transparent", color: "#555555" };

  return (
    <div className="filter-width flex flex-col gap-4">
      {/* Distance */}
      <FilterCard icon={MapPin} iconColor="#F59E0B" title="Distance">
        <Slider
          min={0}
          max={10}
          value={locationValue}
          onChange={(val) => setLocationValue(val)}
          onChangeComplete={(val) => onLocationChange(val)}
          trackStyle={{ background: "#AEC4FF" }}
        />
        <p className="Livvic-SemiBold text-[#001243] text-sm">
          Within {locationValue}mi of 10mi,{" "}
          {user?.location?.format_location
            ? user.location.format_location
            : "Your given location (please add your address in the Edit Profile tab from the menu after clicking your profile picture in the navbar)"}
        </p>
      </FilterCard>

      {/* Schedule */}
      <FilterCard icon={Clock} iconColor="#6366F1" title="Schedule">
        <div className="flex flex-wrap gap-2">
          {["Full-time", "Part-time", "Flexible"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggleAvailability(option)}
              style={chipStyle(selectedAvailability.includes(option))}
              className="Livvic-Medium text-sm border border-[#EEEEEE] px-3 py-1 rounded-full cursor-pointer transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      </FilterCard>

      {/* Age of Children */}
      <FilterCard icon={Calendar} iconColor="#3B82F6" title="Age of Children">
        <div className="flex flex-wrap gap-2">
          {ageOfChildren.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggleCare(option)}
              style={chipStyle(selectedCare.includes(option))}
              className="Livvic-Medium text-sm border border-[#EEEEEE] px-3 py-1 rounded-full cursor-pointer transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      </FilterCard>

      {/* Share Type */}
      <FilterCard icon={Home} iconColor="#F97316" title="Share Type">
        <div className="flex flex-col gap-1">
          {Object.values(SHARE_TYPE_GOALS).map((entry) => {
            const isSelected = selectedServices.includes(entry.value);
            return (
              <button
                key={entry.value}
                type="button"
                onClick={() => toggleShareType(entry.value)}
                className="flex items-center gap-2 text-left px-3 py-2 rounded-xl transition-colors"
                style={{
                  background: isSelected ? "#EEF1FB" : "transparent",
                  color: isSelected ? "#001243" : "#555555",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: isSelected ? "#AEC4FF" : "#C4C4C4" }}
                />
                <span className="inline-flex items-center gap-1.5 Livvic-Medium text-sm">
                  <ShareTypeLabel role={entry.role} goal={entry.goal} />
                </span>
              </button>
            );
          })}
        </div>
      </FilterCard>

      {/* Price */}
      <FilterCard icon={DollarSign} iconColor="#10B981" title="Price">
        <Slider
          range
          min={0}
          max={50}
          value={priceValue}
          onChange={(val) => setPriceValue(val)}
          onChangeComplete={(val) => onPriceChange(val)}
          trackStyle={{ background: "#AEC4FF" }}
        />
        <p className="Livvic-SemiBold text-[#001243] text-sm">
          Within ${priceValue[0]} - ${priceValue[1]}/hr
        </p>
      </FilterCard>
    </div>
  );
}
