import React from "react";

export default function FindMatchTabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex gap-8 mb-6 border-b border-[#E8ECF4]">
      <button
        type="button"
        onClick={() => setActiveTab("neighborhood")}
        className={`pb-3 text-sm transition-colors duration-200 border-b-2 -mb-px ${
          activeTab === "neighborhood"
            ? "Livvic-Bold text-[#001243] border-[#001243]"
            : "Livvic-Medium text-[#6B7280] border-transparent hover:text-[#001243]"
        }`}
      >
        Neighborhood Matching
      </button>
      <button
        type="button"
        onClick={() => setActiveTab("groups")}
        className={`pb-3 text-sm transition-colors duration-200 border-b-2 -mb-px ${
          activeTab === "groups"
            ? "Livvic-Bold text-[#001243] border-[#001243]"
            : "Livvic-Medium text-[#6B7280] border-transparent hover:text-[#001243]"
        }`}
      >
        Share Groups
      </button>
    </div>
  );
}
