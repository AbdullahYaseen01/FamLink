import { Clock } from "lucide-react";
import { Users } from "lucide-react";
import React from "react";
import { NavLink } from "react-router-dom";

function ResourceArticleCard({ title, exerpt, time, img, slug, hideImage }) {
  // If a slug is provided, we use it to build the link. Otherwise, we default to #
  const linkTo = slug ? `/resources/${slug}` : "#";

  return (
    <div className={`bg-white rounded-[16px] overflow-hidden flex flex-col h-full border-[1.5px] border-gray-200 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${hideImage ? 'p-2 sm:p-4' : ''}`}>
      
      {/* Top Accent for text-only card */}
      {hideImage && (
        <div className="px-[22px] pt-[20px] pb-2">
          <div className="h-1.5 w-12 bg-[#AEC4FF] rounded-full"></div>
        </div>
      )}

      {/* Top image */}
      {!hideImage && (
        <div className="relative w-full h-44 rounded-t-2xl overflow-hidden shrink-0">
          <img
            src={img}
            alt="article cover"
            className="w-full h-full object-cover object-top"
          />
        </div>
      )}

      {/* Content */}
      <div className={`flex flex-col flex-grow ${hideImage ? 'px-[22px] pb-[18px]' : 'p-[20px_22px_18px]'}`}>
        <h3 className={`text-[#111] font-bold Livvic-Bold leading-[1.4] mb-[10px] ${hideImage ? 'text-[18px]' : 'text-[15px]'}`}>
          {title}
        </h3>
        <p className={`text-[#666] leading-[1.6] flex-1 mb-[18px] ${hideImage ? 'text-[14px]' : 'text-[13.5px]'}`}>
          {exerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#F0F0F0] pt-[14px] mt-auto">
          <div className="flex items-center gap-[6px] text-[#666] text-[12px] font-medium">
            <Clock size={14} className="shrink-0 opacity-60" />
            <span>{time} min read</span>
          </div>

          <NavLink
            to={linkTo}
            className="text-[#AEC4FF] text-[13.5px] font-bold Livvic-Bold inline-flex items-center gap-[4px] hover:opacity-80"
          >
            Read More
            <span aria-hidden="true">→</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
}

export default ResourceArticleCard;