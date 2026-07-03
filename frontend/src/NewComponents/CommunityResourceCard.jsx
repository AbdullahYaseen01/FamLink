import { Clock } from "lucide-react";
import { Users } from "lucide-react";
import React from "react";
import { NavLink } from "react-router-dom";

function ResourceArticleCard({ title, exerpt, time, img, content }) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <>
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

          {content ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-[#e0417a] text-xs Livvic-SemiBold flex items-center gap-1 cursor-pointer hover:opacity-80 border-none bg-transparent p-0 m-0"
            >
              Read More
              <span>→</span>
            </button>
          ) : (
             <span className="text-[#e0417a] text-xs Livvic-SemiBold flex items-center gap-1 opacity-50 cursor-not-allowed">
              Read More
              <span>→</span>
            </span>
          )}
        </div>
      </div>
    </div>

    {/* Modal Overlay */}
    {isModalOpen && content && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-hidden" onClick={() => setIsModalOpen(false)}>
        <div 
          className="bg-white w-full max-w-3xl rounded-[24px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
           {/* Modal Header / Banner */}
           <div className="relative h-48 sm:h-64 shrink-0 bg-[#f3f4f6]">
             <img src={img} className="w-full h-full object-cover" alt="" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-6 sm:p-10">
                <h2 className="text-white text-2xl sm:text-4xl Livvic-Bold leading-tight">{title}</h2>
             </div>
             <button 
               onClick={() => setIsModalOpen(false)} 
               className="absolute top-4 right-4 bg-black/40 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/60 border-none cursor-pointer transition-colors backdrop-blur-md"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
             </button>
           </div>
           
           {/* Modal Scrollable Content */}
           <div className="p-6 sm:p-10 overflow-y-auto custom-scrollbar">
             {content}
           </div>
        </div>
      </div>
    )}
    </>
  );
}

export default ResourceArticleCard;