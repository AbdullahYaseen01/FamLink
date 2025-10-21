import React from "react";

function NannyShareCard({
  img,
  name,
  location,
  schedule,
  child,
  description,
  req,
  start,
  profile,
}) {
  return (
    <div className="onboarding-box w-[400px] min-h-[330px] bg-white space-y-2">
      <div className="flex justify-between items-center mb-2">
        <img
          src={img}
          alt="family"
          className="rounded-full w-20 h-20 object-cover"
        />
        <div className="space-y-2 flex flex-col items-center">
          <div className="rounded-full py-2 px-6 w-fit bg-[#ECF1FF] text-primary Livvic-SemiBold text-sm">{start}</div>
          <div className="rounded-lg py-1 px-4 bg-[#d6f7ff] text-[#777777] Livvic-Medium text-sm">{profile}</div>
        </div>
      </div>
      <p className="Livvic-SemiBold text-lg text-primary">{name}</p>
      <p className="text-[#555555] Livvic-Medium">{location}</p>
      <p className="text-[#555555] Livvic-Medium">Schedule: {schedule}</p>
      <p className="text-[#555555] Livvic-Medium">Child: {child}</p>
      <p className="text-[#555555]">{description.slice(0,120)}...</p>
      <p className="italic text-sm text-[#555555]">Looking for: {req}</p>
    </div>
  );
}

export default NannyShareCard;
