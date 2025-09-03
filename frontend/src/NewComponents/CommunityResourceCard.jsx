import { Clock } from "lucide-react";
import React from "react";

function CommunityResourceCard({ title, exerpt, author, replyCount, time, img }) {
  return (
    <div className="rounded-2xl p-4 sm:p-6 bg-white w-full max-w-[30rem] mx-auto">
      <p className="text-[#00333B] text-base sm:text-lg Livvic-SemiBold leading-tight">{title}</p>
      <p className="text-[#5C6566] text-sm sm:text-base Livvic mt-2 leading-relaxed">{exerpt}</p>
      <div className="Livvic mt-4 flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-2 text-xs sm:text-sm">
        <div className="flex gap-2 items-center text-[#5C6566] Livvic-Medium">
          <img src={img} alt="user" className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="truncate Livvic-Medium">{author}</span>
        </div>
        <div className="flex justify-between sm:justify-end sm:gap-4">
          <div className="flex gap-1 items-center">
            <img src="/comment.svg" alt="replies" className="w-4 h-4" />
            <div className="flex gap-1">
              <span className="text-[#5C6566] Livvic">{replyCount}</span>
              <span className="text-[#5C6566] Livvic">replies</span>
            </div>
          </div>
          <div className="flex gap-1 items-center Livvic">
            <Clock color="gray" className="h-4 w-4 sm:h-5 sm:w-5" />
            <div className="flex gap-1">
              <span className="text-[#5C6566] Livvic">{time}</span>
              <span className="text-[#5C6566] Livvic">ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default CommunityResourceCard;