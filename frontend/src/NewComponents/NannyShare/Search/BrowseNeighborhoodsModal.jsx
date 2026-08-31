import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Search } from "lucide-react";
import {
  buildBrowseNeighborhoodCatalog,
  filterBrowseNeighborhoodCatalog,
} from "../../../Config/neighborhoodCatalog";
import { fetchAllLaunchStatuses } from "../../../Config/neighborhoodLaunch";
import LaunchNeighborhoodModal from "../../MatchDashboard/LaunchNeighborhoodModal";
import CityNeighborhoodSection from "./CityNeighborhoodSection";
import JoinLaunchingModal from "./JoinLaunchingModal";

export default function BrowseNeighborhoodsModal({
  onClose,
  variant = "landing",
  priorityCity = "",
}) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const prioritySectionRef = useRef(null);
  const [apiStatuses, setApiStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [joinTarget, setJoinTarget] = useState(null);

  const isDashboard = variant === "dashboard";
  const launchingActionLabel = isDashboard ? "Get notified when active" : "Join now";

  const catalog = useMemo(
    () => buildBrowseNeighborhoodCatalog(apiStatuses, { priorityCity }),
    [apiStatuses, priorityCity]
  );

  const visibleCities = useMemo(
    () => filterBrowseNeighborhoodCatalog(query, catalog),
    [query, catalog]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAllLaunchStatuses()
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
  }, []);

  useEffect(() => {
    if (loading || !priorityCity) return;
    const timer = setTimeout(() => {
      prioritySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(timer);
  }, [loading, priorityCity]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (joinTarget) {
        setJoinTarget(null);
        return;
      }
      if (showLaunchModal) {
        setShowLaunchModal(false);
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
  }, [onClose, joinTarget, showLaunchModal]);

  const handleJoinActive = () => {
    onClose();
    navigate("/joinNow");
  };

  const handleJoinLaunching = (item) => {
    setJoinTarget({ neighborhood: item.neighborhood, city: item.city });
  };

  const title = isDashboard ? "Browse Neighborhoods" : "Find nanny share by neighborhood";

  return (
    <>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6"
        style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.35)" }}
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="browse-neighborhoods-title"
          className="relative bg-white rounded-[24px] shadow-[0_8px_40px_rgba(0,18,67,0.12)] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
          style={{ animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 shrink-0 bg-white border-b border-[#E8E8E8]">
            <div className="relative flex items-center min-h-[40px] mb-4">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute left-0 w-10 h-10 flex items-center justify-center rounded-[10px] border border-[#E8E8E8] bg-white text-[#001243] hover:bg-[#FAFAFA] transition-colors"
              >
                <ChevronLeft size={20} strokeWidth={2} />
              </button>
              <h2
                id="browse-neighborhoods-title"
                className="Livvic-Bold text-[#001243] text-[18px] sm:text-[20px] leading-tight text-center w-full px-12"
              >
                {title}
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

          <div ref={scrollRef} className="px-5 sm:px-6 overflow-y-auto flex-1 min-h-0 py-5 space-y-8">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 rounded-full border-4 border-[#AEC4FF] border-t-transparent animate-spin" />
              </div>
            ) : visibleCities.length === 0 ? (
              <div className="text-center py-12 px-2">
                <p className="text-[14px] text-[#9CA3AF] Livvic-Medium">No neighborhoods match</p>
              </div>
            ) : (
              visibleCities.map((citySection, index) => (
                <CityNeighborhoodSection
                  key={citySection.cityKey}
                  variant={variant}
                  sectionRef={index === 0 && priorityCity ? prioritySectionRef : undefined}
                  city={citySection.city}
                  isActive={citySection.isActive}
                  activeNeighborhoods={citySection.activeNeighborhoods}
                  launchingNeighborhoods={citySection.launchingNeighborhoods}
                  launchingActionLabel={launchingActionLabel}
                  onJoinActive={handleJoinActive}
                  onJoinLaunching={handleJoinLaunching}
                />
              ))
            )}
          </div>

          <div className="text-center px-5 sm:px-6 pt-4 pb-5 sm:pb-6 border-t border-[#E8E8E8] shrink-0 bg-white">
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

      {joinTarget && (
        <JoinLaunchingModal
          neighborhood={joinTarget.neighborhood}
          city={joinTarget.city}
          variant={variant}
          onClose={() => setJoinTarget(null)}
        />
      )}

      {showLaunchModal && (
        <LaunchNeighborhoodModal onClose={() => setShowLaunchModal(false)} />
      )}
    </>
  );
}
