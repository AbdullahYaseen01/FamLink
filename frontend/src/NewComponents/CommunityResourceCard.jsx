import { Clock } from "lucide-react";
import { Users } from "lucide-react";
import React from "react";
import { NavLink } from "react-router-dom";

function ResourceArticleCard({ title, exerpt, time, img, slug }) {
  // If a slug is provided, we use it to build the link. Otherwise, we default to #
  const linkTo = slug ? `/resources/${slug}` : "#";

  return (
    <div className="rounded-2xl bg-white overflow-visible w-full mx-auto shadow-soft flex flex-col h-full border border-gray-100 hover:shadow-md transition-shadow">
      {/* Top image */}
      <div className="relative w-full h-44 rounded-t-2xl overflow-hidden shrink-0">
        <img
          src={img}
          alt="article cover"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="px-4 pt-6 pb-4 flex flex-col flex-grow">
        <h3 className="text-[#111] text-[15px] Livvic-Bold leading-snug mb-2">
          {title}
        </h3>
        <p className="text-[#666] text-[13px] leading-relaxed mb-4 flex-grow">
          {exerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-auto">
          <div className="flex items-center gap-1.5 text-[#888] text-xs">
            <Clock size={14} color="#888" />
            <span>{time} min read</span>
          </div>

          <NavLink
            to={linkTo}
            className="text-[#e0417a] text-xs Livvic-SemiBold flex items-center gap-1 cursor-pointer hover:opacity-80"
          >
            Read More
            <span>→</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
}

export default ResourceArticleCard;