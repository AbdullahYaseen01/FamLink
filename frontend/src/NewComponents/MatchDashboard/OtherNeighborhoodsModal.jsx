import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ArrowRight, ChevronLeft, Plus, Search } from "lucide-react";
import { launchStatusToCatalogItem } from "../../Config/neighborhoodCatalog";
import { fetchAllLaunchStatuses } from "../../Config/neighborhoodLaunch";
import LaunchNeighborhoodModal from "./LaunchNeighborhoodModal";
import LaunchingNeighborhoodDetailsModal from "../NannyShare/Search/LaunchingNeighborhoodDetailsModal";
import StatusPill from "../StatusPill";

function displayName(city, neighborhood) {
  if (city && neighborhood && neighborhood !== city) {
    return `${neighborhood}, ${city}`;
  }
  return neighborhood || city;
}

function remainingCopy(families, familyNeed, nannies, nannyNeed) {
  const familiesLeft = Math.max(0, familyNeed - families);
  const nanniesLeft = Math.max(0, nannyNeed - nannies);
  return `${familiesLeft} more ${familiesLeft === 1 ? "family" : "families"} · ${nanniesLeft} more ${nanniesLeft === 1 ? "nanny" : "nannies"} needed`;
}

function ActiveNeighborhoodRow({ name }) {
  return (
    <div className="flex items-center justify-between gap-3 border border-[#E8E8E8] rounded-2xl px-[18px] py-3">
      <p className="Livvic-Bold text-[#001243] text-[15px] leading-tight">{name}</p>
      <StatusPill status="active" />
    </div>
  );
}

function LaunchingNeighborhoodRow({ name, families, familyNeed, nannies, nannyNeed, onShareDetails, data }) {
  return (
    <div className="border border-[#E8E8E8] rounded-2xl px-[18px] py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="Livvic-Bold text-[#001243] text-[15px] leading-tight">{name}</p>
          <p className="mt-3 Livvic-Medium text-[12px] leading-snug text-[#6B7280]">
            Families {families} of {familyNeed}
            {" · "}
            Nannies {nannies} of {nannyNeed}
          </p>
          <p className="mt-1 Livvic text-[12px] leading-snug text-[#9CA3AF]">
            {remainingCopy(families, familyNeed, nannies, nannyNeed)}
          </p>
        </div>

        <div className="flex flex-col items-center shrink-0">
          <StatusPill status="launching" />
          <button
            type="button"
            onClick={() => onShareDetails(launchStatusToCatalogItem(data))}
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

function NeighborhoodRow({ data, onShareDetails }) {
  const { city, neighborhood, families, nannies, familyNeed, nannyNeed, status } = data;
  const name = displayName(city, neighborhood);

  if (status === "launching") {
    return (
      <LaunchingNeighborhoodRow
        name={name}
        families={families}
        familyNeed={familyNeed}
        nannies={nannies}
        nannyNeed={nannyNeed}
        onShareDetails={onShareDetails}
        data={data}
      />
    );
  }

  return <ActiveNeighborhoodRow name={name} />;
}

export default function OtherNeighborhoodsModal({ onClose }) {
  const sheetId = useSelector((s) => s.auth.user?.sheetId);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detailsItem, setDetailsItem] = useState(null);
  const [showLaunchModal, setShowLaunchModal] = useState(false);

  useEffect(() => {
    fetchAllLaunchStatuses()
      .then((data) => {
        setStatuses(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

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

  const filteredStatuses = statuses.filter((s) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return s.city?.toLowerCase().includes(term) || s.neighborhood?.toLowerCase().includes(term);
  });

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
          aria-labelledby="dashboard-other-neighborhoods-title"
          className="relative bg-white rounded-[24px] shadow-[0_8px_40px_rgba(0,18,67,0.12)] w-full max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden"
          style={{ animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}
          onClick={(e) => e.stopPropagation()}
        >
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
                id="dashboard-other-neighborhoods-title"
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
                placeholder="Search neighborhood or city"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 rounded-full border border-[#E8E8E8] bg-white pl-11 pr-5 text-[14px] Livvic-Medium text-[#001243] placeholder:text-[#9CA3AF] outline-none focus:border-[#AEC4FF] transition-colors"
              />
            </label>
          </div>

          <div className="px-6 overflow-y-auto flex-1 min-h-0 space-y-3 pb-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 rounded-full border-4 border-[#AEC4FF] border-t-transparent animate-spin" />
              </div>
            ) : filteredStatuses.length === 0 ? (
              <div className="text-center py-10 px-2">
                <h3 className="text-[#001243] Livvic-Bold mb-2 text-[15px]">We&apos;re not in your area yet</h3>
                <p className="text-[#9CA3AF] text-[13px] mb-6">
                  Launch a new neighborhood and help bring nanny share to your area.
                </p>
                <button
                  type="button"
                  onClick={() => setShowLaunchModal(true)}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[#AEC4FF] text-[#001243] Livvic-Bold text-[15px] py-[14px] hover:brightness-[0.98] transition-[filter]"
                >
                  <Plus size={16} strokeWidth={2.5} aria-hidden />
                  Launch a new neighborhood
                </button>
              </div>
            ) : (
              filteredStatuses.map((s) => (
                <NeighborhoodRow
                  key={`${s.city}-${s.neighborhood}`}
                  data={s}
                  onShareDetails={setDetailsItem}
                />
              ))
            )}
          </div>

          {!loading && filteredStatuses.length > 0 && (
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
          )}
        </div>
        <style>{`
          @keyframes popIn { 0% { opacity: 0; transform: scale(0.94); } 100% { opacity: 1; transform: scale(1); } }
        `}</style>
      </div>

      {detailsItem && (
        <LaunchingNeighborhoodDetailsModal
          item={detailsItem}
          sheetId={sheetId}
          onClose={() => setDetailsItem(null)}
        />
      )}

      {showLaunchModal && (
        <LaunchNeighborhoodModal onClose={() => setShowLaunchModal(false)} />
      )}
    </>
  );
}
