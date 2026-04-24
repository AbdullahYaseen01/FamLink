import React from "react";

function ServicesCard({ title, description, icon }) {
  return (
    <div className="relative rounded-2xl overflow-hidden  aspect-[3/4]">
      {/* Full-bleed image */}
      <img
        src={icon}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 "
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Text pinned to bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <p className="Livvic-SemiBold text-white text-xl md:text-lg leading-snug">{title}</p>
        <p className="Livvic text-white/70 text-lg md:text-sm mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default ServicesCard;