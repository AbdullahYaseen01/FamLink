import React from "react";

function TestimonialCard({ para, name, highlight }) {
  return (
    <div className="p-6 bg-white rounded-[20px] w-[24rem]">
      <div className="h-[250px] flex-col justify-center">
        <img src="/quote.svg" alt="quotes" />
        <p className="mt-6 Livvic-Medium text-xl leading-[34px]">{para}</p>
      </div>
      <p className="mt-6 Livvic-Bold text-xl text-[#001243] leading-[34px]">
        — {name}
      </p>
      <div className="mt-12 flex items-start gap-4">
        <img src="/info-circle.svg" alt="info" className="w-5 h-5 mt-[2px]" />
        <p className="text-[#6EA400] Livvic-SemiBold text-lg leading-[24px]">
          {highlight}
        </p>
      </div>
    </div>
  );
}

export default TestimonialCard;
