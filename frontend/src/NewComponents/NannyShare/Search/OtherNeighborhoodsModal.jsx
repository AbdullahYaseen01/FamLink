import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronLeft, Plus, Search } from "lucide-react";
import {
  buildCityNeighborhoodCatalog,
  filterNeighborhoodCatalog,
} from "../../../Config/neighborhoodCatalog";
import { fetchCityLaunchStatuses } from "../../../Config/neighborhoodLaunch";
import LaunchNeighborhoodModal from "../../MatchDashboard/LaunchNeighborhoodModal";
import LaunchingNeighborhoodDetailsModal from "./LaunchingNeighborhoodDetailsModal";
import StatusPill from "../../StatusPill";

function remainingCopy(progress) {
  const familiesLeft = Math.max(0, progress.familiesNeed - progress.familiesHave);
  const nanniesLeft = Math.max(0, progress.nanniesNeed - progress.nanniesHave);
  return `${familiesLeft} more ${familiesLeft === 1 ? "family" : "families"} · ${nanniesLeft} more ${nanniesLeft === 1 ? "nanny" : "nannies"} needed`;
}

function ActiveNeighborhoodRow({ item }) {
  return (
    <div className="flex items-center justify-between gap-3 border border-[#E8E8E8] rounded-2xl px-[18px] py-3">
      <p className="Livvic-Bold text-[#001243] text-[15px] leading-tight">
        {item.displayName}
      </p>
      <StatusPill status="active" />
    </div>
  );
}

function LaunchingNeighborhoodRow({ item, onShareDetails }) {
  return (
    <div className="border border-[#E8E8E8] rounded-2xl px-[18px] py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="Livvic-Bold text-[#001243] text-[15px] leading-tight">
            {item.displayName}
          </p>
          {item.progress && (
            <>
              <p className="mt-3 Livvic-Medium text-[12px] leading-snug text-[#6B7280]">
                Families {item.progress.familiesHave} of {item.progress.familiesNeed}
                {" · "}
                Nannies {item.progress.nanniesHave} of {item.progress.nanniesNeed}
              </p>
              <p className="mt-1 Livvic text-[12px] leading-snug text-[#9CA3AF]">
                {remainingCopy(item.progress)}
              </p>
            </>
          )}
        </div>

        <div className="flex flex-col items-center shrink-0">
          <StatusPill status="launching" />
          <button
            type="button"
            onClick={() => onShareDetails(item)}
            className="mt-2 inline-flex items-center gap-1 Livvic-SemiBold text-[11px] leading-none text-[#3B6DFF] hover:opacity-70 transition-opacity whitespace-nowrap"
          >
            Share Details
            <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

function NeighborhoodRow({ item, onShareDetails }) {
  if (item.status === "launching") {
    return <LaunchingNeighborhoodRow item={item} onShareDetails={onShareDetails} />;
  }
  return <ActiveNeighborhoodRow item={item} />;
}

export default function OtherNeighborhoodsModal({ city, neighborhoods = [], onClose }) {
  const [apiStatuses, setApiStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const catalog = useMemo(
    () => buildCityNeighborhoodCatalog(city, apiStatuses, neighborhoods),
    [city, apiStatuses, neighborhoods]
  );
  const [query, setQuery] = useState("");
  const [detailsItem, setDetailsItem] = useState(null);
  const visible = filterNeighborhoodCatalog(query, catalog);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCityLaunchStatuses(city)
      .then((data) => {
        if (!cancelled) setApiStatuses(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setApiStatuses([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [city]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (showLaunchModal) {
        setShowLaunchModal(false);
        return;
      }
      if (detailsItem) {
        setDetailsItem(null);
        return;
      }
      onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, detailsItem, showLaunchModal]);

  return (
    <>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-5 sm:p-8"
        style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.35)" }}
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="other-neighborhoods-title"
          className="relative bg-white rounded-[24px] shadow-[0_8px_40px_rgba(0,18,67,0.12)] w-full max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden"
          style={{ animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header + search */}
          <div className="px-6 pt-6 pb-5 shrink-0">
            <div className="relative flex items-center min-h-[40px] mb-5">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute left-0 w-10 h-10 flex items-center justify-center rounded-[10px] border border-[#E8E8E8] text-[#001243] hover:bg-[#FAFAFA] transition-colors"
              >
                <ChevronLeft size={20} strokeWidth={2} />
              </button>
              <h2
                id="other-neighborhoods-title"
                className="Livvic-Bold text-[#001243] text-[19px] leading-tight text-center w-full px-14"
              >
                Other Neighborhoods
              </h2>
            </div>

            <label className="relative block">
              <span className="sr-only">Search neighborhood or city</span>
              <Search
                size={17}
                strokeWidth={2}
                className="absolute left-[18px] top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search neighborhood or city"
                className="w-full h-11 rounded-full border border-[#E8E8E8] bg-white pl-11 pr-5 text-[14px] Livvic-Medium text-[#001243] placeholder:text-[#9CA3AF] outline-none focus:border-[#AEC4FF] transition-colors"
              />
            </label>
          </div>

          {/* List */}
          <div className="px-6 overflow-y-auto flex-1 min-h-0 space-y-3 pb-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 rounded-full border-4 border-[#AEC4FF] border-t-transparent animate-spin" />
              </div>
            ) : visible.length === 0 ? (
              <div className="text-center py-10 px-2">
                <p className="text-[14px] text-[#9CA3AF] Livvic-Medium">
                  No neighborhoods match
                </p>
                <button
                  type="button"
                  onClick={() => setShowLaunchModal(true)}
                  className="mt-6 w-full inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[#AEC4FF] text-[#001243] Livvic-Bold text-[15px] py-[14px] hover:brightness-[0.98] transition-[filter]"
                >
                  <Plus size={16} strokeWidth={2.5} aria-hidden />
                  Launch a new neighborhood
                </button>
              </div>
            ) : (
              visible.map((item) => (
                <NeighborhoodRow
                  key={item.id}
                  item={item}
                  onShareDetails={setDetailsItem}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="text-center px-6 pt-5 pb-6 border-t border-[#E8E8E8] shrink-0">
            <p className="Livvic-Bold text-[#001243] text-[15px] leading-snug">
              Don&apos;t see your neighborhood?
            </p>
            <p className="Livvic text-[13px] text-[#9CA3AF] mt-1.5 leading-relaxed">
              Launch a new neighborhood and help bring nanny share to your neighborhood.
            </p>
            <button
              type="button"
              onClick={() => setShowLaunchModal(true)}
              className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[#AEC4FF] text-[#001243] Livvic-Bold text-[15px] py-[14px] hover:brightness-[0.98] transition-[filter]"
            >
              <Plus size={16} strokeWidth={2.5} aria-hidden />
              Launch a new neighborhood
            </button>
          </div>
        </div>
        <style>{`
          @keyframes popIn { 0% { opacity: 0; transform: scale(0.94); } 100% { opacity: 1; transform: scale(1); } }
        `}</style>
      </div>

      {detailsItem && (
        <LaunchingNeighborhoodDetailsModal
          item={detailsItem}
          onClose={() => setDetailsItem(null)}
        />
      )}

      {showLaunchModal && (
        <LaunchNeighborhoodModal onClose={() => setShowLaunchModal(false)} />
      )}
    </>
  );
}
