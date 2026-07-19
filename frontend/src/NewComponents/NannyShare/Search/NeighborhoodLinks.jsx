import { Link } from "react-router-dom";
import { CITY_PAGES } from "../../../Config/cityGeo";

// Internal links between the city/neighborhood landing pages. Without this
// section most neighborhood pages are orphans — listed in the sitemap but
// linked from nowhere on the site — which stalls their indexing. City pages
// link to their neighborhoods plus the other cities; neighborhood pages link to
// their parent city plus sibling neighborhoods.
export default function NeighborhoodLinks({ slugKey }) {
  const current = CITY_PAGES.find((p) => p.key === slugKey);
  if (!current) return null;

  const related = current.parent
    ? [
        CITY_PAGES.find((p) => p.key === current.parent),
        ...CITY_PAGES.filter(
          (p) => p.parent === current.parent && p.key !== current.key
        ),
      ].filter(Boolean)
    : [
        ...CITY_PAGES.filter((p) => p.parent === current.key),
        ...CITY_PAGES.filter((p) => !p.parent && p.key !== current.key),
      ];

  if (related.length === 0) return null;

  return (
    <div className="bg-[#F6F3EE]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <h2 className="Livvic-Bold text-2xl sm:text-3xl text-[#001243] text-center">
          Explore nanny shares nearby
        </h2>
        <p className="text-gray-500 mt-2 text-base sm:text-lg text-center">
          Families often match across neighborhood lines — browse the areas
          around {current.label}.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {related.map((p) => (
            <Link
              key={p.key}
              to={`/nanny-share/${p.canonicalSlug}`}
              onClick={() => window.scrollTo({ top: 0 })}
              className="text-base Livvic-Medium text-[#001243] bg-white border-2 border-gray-100 rounded-full px-4 py-1.5 hover:border-[#AEC4FF] transition-colors"
            >
              Nanny Share in {p.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
