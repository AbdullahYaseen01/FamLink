import { Clock } from "lucide-react";
import { Users } from "lucide-react";
import React from "react";
import { NavLink } from "react-router-dom";

function ResourceArticleCard({ title, exerpt, time, img }) {
  return (
    <div className="rounded-2xl bg-white overflow-visible w-full mx-auto shadow-soft">
      {/* Top image */}
      <div className="relative w-full h-44 rounded-t-2xl overflow-hidden">
        <img
          src={img}
          alt="article cover"
          className="w-full h-full object-cover"
        />
        {/* Icon badge overlapping the image bottom */}
        {/* <div className="absolute -bottom-4 left-4 bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-md">
          <Users size={18} color="#e0417a" />
        </div> */}
      </div>

      {/* Content */}
      <div className="px-4 pt-7 pb-4">
        <h3 className="text-[#111] text-[15px] font-bold leading-snug mb-2">
          {title}
        </h3>
        <p className="text-[#666] text-[13px] leading-relaxed mb-4">
          {exerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center gap-1.5 text-[#888] text-xs">
            <Clock size={14} color="#888" />
            <span>{time} min read</span>
          </div>

          <NavLink
            className="text-[#e0417a] text-xs font-semibold flex items-center gap-1"
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