import React, { useEffect, useState } from "react";
import { X, MapPin, Search } from "lucide-react";
import { fetchAllLaunchStatuses } from "../../Config/neighborhoodLaunch";
import CustomButton from "../Button";

export default function OtherNeighborhoodsModal({ onClose, onShare, onLaunchNew }) {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAllLaunchStatuses()
      .then((data) => {
        setStatuses(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredStatuses = statuses.filter((s) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return s.city?.toLowerCase().includes(term) || s.neighborhood?.toLowerCase().includes(term);
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end sm:justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8ECF4] shrink-0">
          <h2 className="Livvic-Bold text-xl text-[#001243]">Other Neighborhoods</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:px-6 bg-white border-b border-[#E8ECF4]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search neighborhood or city"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8ECF4] text-sm focus:outline-none focus:border-[#AEC4FF] transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F9FAFB]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 rounded-full border-4 border-[#AEC4FF] border-t-transparent animate-spin" />
            </div>
          ) : filteredStatuses.length === 0 ? (
            <div className="text-center py-12 px-4">
              <h3 className="text-[#001243] Livvic-Bold mb-2 text-lg">We're not in your area yet</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                Launch a new neighborhood and help bring nanny share to your area.
              </p>
              <button 
                onClick={onLaunchNew} 
                className="bg-[#AEC4FF] text-[#001243] Livvic-SemiBold py-3 px-6 rounded-xl w-full max-w-sm transition-colors hover:bg-[#9BB4F5]"
              >
                + Launch a new neighborhood
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStatuses.map((s, i) => (
                  <NeighborhoodProgressCard key={i} data={s} onShare={onShare} />
                ))}
              </div>
              <div className="pt-6 mt-6 border-t border-[#E8ECF4] text-center">
                <p className="text-[#001243] Livvic-Bold mb-1 text-[15px]">Don't see your neighborhood?</p>
                <p className="text-gray-500 text-sm mb-4">Launch a new neighborhood and help bring nanny share to your neighborhood.</p>
                <button 
                  onClick={onLaunchNew} 
                  className="bg-[#AEC4FF] text-[#001243] Livvic-SemiBold py-3 px-6 rounded-xl w-full max-w-sm transition-colors hover:bg-[#9BB4F5]"
                >
                  + Launch a new neighborhood
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NeighborhoodProgressCard({ data, onShare }) {
  const { city, neighborhood, families, nannies, familyNeed, nannyNeed, status, badge } = data;
  const isLaunching = status === "launching";
  const familiesLeft = Math.max(0, familyNeed - families);
  const nanniesLeft = Math.max(0, nannyNeed - nannies);

  return (
    <div className="bg-white border border-[#E8ECF4] rounded-2xl overflow-hidden p-4 shadow-sm flex flex-col h-full">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <p className="Livvic-Bold text-[#001243] text-[15px] leading-tight">
            {neighborhood}
          </p>
          {city && city !== neighborhood && (
            <p className="text-[#6B7280] text-[12px] flex items-center gap-1 mt-0.5">
              <MapPin size={12} /> {city}
            </p>
          )}
        </div>
        <span className={`inline-flex items-center rounded-full Livvic-Bold text-[10px] tracking-wide uppercase px-2.5 py-1 shrink-0 ${
          isLaunching ? "bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA]" : "bg-[#D6FB9A] text-[#075B49]"
        }`}>
          {badge}
        </span>
      </div>

      <div className="mt-auto">
        {isLaunching ? (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="flex justify-between text-[11px] Livvic-Bold text-[#001243] mb-1">
                  <span>Families</span>
                  <span>{families} of {familyNeed}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#EEF3FF] overflow-hidden">
                  <div className="h-full rounded-full bg-[#AEC4FF]" style={{ width: `${Math.min(100, (families / familyNeed) * 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] Livvic-Bold text-[#001243] mb-1">
                  <span>Nannies</span>
                  <span>{nannies} of {nannyNeed}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#FFF7ED] overflow-hidden">
                  <div className="h-full rounded-full bg-[#F97316]" style={{ width: `${Math.min(100, (nannies / nannyNeed) * 100)}%` }} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="Livvic text-[11px] text-[#6B7280] leading-tight flex-1">
                {familiesLeft} more {familiesLeft === 1 ? "family" : "families"} • {nanniesLeft} more {nanniesLeft === 1 ? "nanny" : "nannies"} needed
              </p>
              <button
                onClick={() => onShare(data)}
                className="text-[#001243] Livvic-SemiBold text-[12px] whitespace-nowrap hover:opacity-70"
              >
                Share Details →
              </button>
            </div>
          </div>
        ) : (
          <div className="py-2">
            <p className="text-[12px] text-[#6B7280]">
              This neighborhood is fully active and matching families with nannies.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
