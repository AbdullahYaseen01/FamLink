import React from 'react';

export default function FindMatchTabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <button
        onClick={() => setActiveTab('neighborhood')}
        className={`px-6 py-2.5 rounded-full text-sm Livvic-Bold transition-all duration-200 border ${
          activeTab === 'neighborhood'
            ? 'bg-[#001243] text-white border-[#001243] shadow-sm'
            : 'bg-white text-[#6B7280] border-[#E8ECF4] hover:border-gray-300 hover:text-[#001243]'
        }`}
      >
        Neighborhood Matching
      </button>
      <button
        onClick={() => setActiveTab('groups')}
        className={`px-6 py-2.5 rounded-full text-sm Livvic-Bold transition-all duration-200 border ${
          activeTab === 'groups'
            ? 'bg-[#001243] text-white border-[#001243] shadow-sm'
            : 'bg-white text-[#6B7280] border-[#E8ECF4] hover:border-gray-300 hover:text-[#001243]'
        }`}
      >
        Share Groups
      </button>
    </div>
  );
}
