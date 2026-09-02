import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { buildBrowseNeighborhoodCatalog } from "../../../Config/neighborhoodCatalog";
import { fetchAllLaunchStatuses } from "../../../Config/neighborhoodLaunch";

const PER_ROW = 6;

function chunk(items, size) {
  const rows = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

export default function ActiveNeighborhoods({
  city,
  cityKey = "",
  neighborhoods: fallbackNeighborhoods = [],
  onSeeAllNeighborhoods,
}) {
  const [apiStatuses, setApiStatuses] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchAllLaunchStatuses()
      .then((data) => {
        if (!cancelled) setApiStatuses(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setApiStatuses([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeNeighborhoods = useMemo(() => {
    const catalog = buildBrowseNeighborhoodCatalog(apiStatuses, { priorityCity: city });
    const section = catalog.find(
      (entry) =>
        entry.cityKey === cityKey ||
        entry.city.toLowerCase() === String(city || "").toLowerCase()
    );

    if (section?.activeNeighborhoods?.length) {
      return section.activeNeighborhoods.map((item) => item.neighborhood);
    }

    return fallbackNeighborhoods;
  }, [apiStatuses, city, cityKey, fallbackNeighborhoods]);

  if (!activeNeighborhoods.length) return null;

  const rows = chunk(activeNeighborhoods, PER_ROW);

  return (
    <section
      id="active-neighborhoods"
      className="bg-[#F6F3EE] scroll-mt-20"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="Livvic-Bold text-3xl sm:text-4xl text-[#001243]">
            Where FamLink is active in {city}
          </h2>
          <p className="text-gray-500 mt-3 text-base sm:text-lg leading-relaxed">
            See active neighborhoods across {city}.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="flex flex-wrap justify-center gap-2 sm:gap-3"
            >
              {row.map((name) => (
                <span
                  key={name}
                  className="text-base Livvic-Medium text-[#001243] bg-white border-2 border-gray-100 rounded-full px-4 py-1.5"
                >
                  {name}
                </span>
              ))}
            </div>
          ))}
        </div>

        {onSeeAllNeighborhoods && (
          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={onSeeAllNeighborhoods}
              className="inline-flex items-center gap-1.5 text-[#3B6DFF] Livvic-SemiBold text-base hover:underline"
            >
              See all neighborhoods
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
