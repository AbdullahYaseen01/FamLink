import NeighborhoodActiveCard from "./NeighborhoodActiveCard";
import NeighborhoodLaunchingCard from "./NeighborhoodLaunchingCard";

export default function CityNeighborhoodSection({
  city,
  isActive,
  activeNeighborhoods = [],
  launchingNeighborhoods = [],
  launchingActionLabel,
  onJoinActive,
  onJoinLaunching,
  sectionRef,
  variant = "landing",
}) {
  const isDashboard = variant === "dashboard";
  const hasActive = activeNeighborhoods.length > 0;
  const hasLaunching = launchingNeighborhoods.length > 0;
  if (!hasActive && !hasLaunching) return null;

  return (
    <section ref={sectionRef} className="scroll-mt-4">
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-[#88B253]" : "bg-[#DB8C4B]"}`}
          aria-hidden
        />
        <h3 className="Livvic-Bold text-[15px] text-[#001243]">
          {isActive ? `${city} is Active` : `${city} is building toward Share`}
        </h3>
      </div>

      {hasActive && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {activeNeighborhoods.map((item) => (
            <NeighborhoodActiveCard
              key={item.id}
              name={item.displayName}
              status={item.status}
              showAction={!isDashboard}
              onJoin={() => onJoinActive(item)}
            />
          ))}
        </div>
      )}

      {hasLaunching && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {launchingNeighborhoods.map((item) => (
            <NeighborhoodLaunchingCard
              key={item.id}
              name={item.displayName}
              families={item.families}
              nannies={item.nannies}
              familyNeed={item.familyNeed}
              nannyNeed={item.nannyNeed}
              actionLabel={launchingActionLabel}
              showArrow={!isDashboard}
              onAction={() => onJoinLaunching(item)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
