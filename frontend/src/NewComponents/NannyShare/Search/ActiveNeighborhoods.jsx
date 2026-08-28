import { useState } from "react";
import { ArrowRight } from "lucide-react";

const INITIAL_VISIBLE = 4;

export default function ActiveNeighborhoods({ city, neighborhoods = [] }) {
  const [expanded, setExpanded] = useState(false);

  if (!neighborhoods.length) return null;

  const hasMore = neighborhoods.length > INITIAL_VISIBLE;
  const visible = expanded || !hasMore
    ? neighborhoods
    : neighborhoods.slice(0, INITIAL_VISIBLE);

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
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-8">
          {visible.map((name) => (
            <span
              key={name}
              className="text-base Livvic-Medium text-[#001243] bg-white border-2 border-gray-100 rounded-full px-4 py-1.5"
            >
              {name}
            </span>
          ))}
        </div>
        {hasMore && !expanded && (
          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={() => setExpanded(true)}
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
