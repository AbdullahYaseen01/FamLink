import React from "react";
import { EnvironmentOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import CustomButton from "../../Button";
import { DollarSign, Baby, Info } from "lucide-react";

const serviceTagMap = {
  "full-time care": "Full Time",
  "part-time care": "Part Time",
  "pickup/drop-off (carpool style)": "Carpool",
  "after-school care": "After-school",
  "summer/seasonal": "Seasonal",
  Other: "Other",
};

function formatLocation(loc) {
  if (!loc?.format_location) return "Neighborhood";
  const parts = loc.format_location.split(",") || [];
  const neighborhood = parts.at(-4)?.trim();
  const city = parts.at(-3)?.trim();
  const state = parts.at(-2)?.trim().split(" ")[0];
  return city && state && neighborhood
    ? ` ${city}, ${state}`
    : "Neighborhood";
}

function NannyShareBrowseCard({ share, cta = false }) {
  const navigate = useNavigate();

  const chips = [
    share.childrenAges?.length
      ? {
        icon: <Baby size={16} />,
        text: `Children: ${share.childrenAges
          .map((age) => {
            const numAge = parseFloat(age);
            if (numAge < 1) {
              const months = Math.round(numAge * 12);
              return `${months} month${months > 1 ? "s" : ""}`;
            }
            return `${numAge} year${numAge > 1 ? "s" : ""}`;
          })
          .join(", ")}`,
      }
      : null,
    share.shareLocation?.length > 0 && {
      icon: <Info size={16} className="relative top-[1px]" />,
      text: `Open to: ${share.shareLocation.length <= 2
        ? share.shareLocation.join(", ")
        : "Flexible locations"
        }`,
    },
    share.hourlyBudget
      ? {
        icon: <DollarSign size={20} />,
        text: `$${share.hourlyBudget.minShare}${share.hourlyBudget.maxShare ? `–${share.hourlyBudget.maxShare}` : '+'}/hr per family`
      }
      : {
        icon: <DollarSign size={20} />,
        text: `$${share.hourlyBudgetSpecify}/hr`,
      },
  ].filter(Boolean);

  const formattedName = (share.user?.name || "")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  const shareTypeLabel = serviceTagMap[share.nannyShareType.toLowerCase()] ?? "Other";

  const blurb =
    share.openNotes?.length > 0
      ? share.openNotes
      : share.careDescription?.length > 0
        ? share.careDescription
        : null;

  const initials = share.user?.name
    ?.split(" ")
    .filter((w) => w.length > 0)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="onboarding-box w-[400px] h-[450px] bg-white space-y-1 relative pb-16">
      {/* Top row: img + pill */}
      <div className="flex justify-between mb-2">
        {share.user?.imageUrl ? (
          <img
            src={share.user.imageUrl}
            alt={formattedName}
            className="rounded-xl w-20 h-20 object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="rounded-xl w-20 h-20 flex items-center justify-center flex-shrink-0 text-white text-xl Livvic-SemiBold"
            style={{ backgroundColor: "#38AEE3" }}
          >
            {initials}
          </div>
        )}

        <div className="space-y-2">
          <div className="rounded-lg mb-2 w-fit py-1 px-4 bg-[#ECF1FF] text-primary Livvic-SemiBold text-sm">
            {shareTypeLabel}
          </div>
          {share.nannyshareStart && <div className="rounded-lg py-2 px-5 w-fit bg-[#d6f7ff] text-primary Livvic-SemiBold text-sm">
            {share.nannyshareStart}
          </div>}
        </div>
      </div>

      {/* Name */}
      <p className="Livvic-SemiBold text-lg text-primary">{formattedName}</p>

      {/* Location */}
      <p className="text-[#555555] Livvic-Medium flex gap-1 mb-0">
        <EnvironmentOutlined className="text-base mr-1" />
        {formatLocation(share.user?.location)}
      </p>

      {/* Chips */}
      <div className="space-y-1">
        {chips.map((chip, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-[#555555] shrink-0 mt-[2px]">{chip.icon}</span>
            <span className="text-[#555555] Livvic-Medium text-sm">{chip.text}</span>
          </div>
        ))}
      </div>

      {/* Description */}
      {blurb && (
        <p className="text-[#555555] text-sm">
          {blurb.length > 120 ? `${blurb.substring(0, 120)}...` : blurb}
        </p>
      )}

      {/* Bottom CTA */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-end gap-2">
        <div className="w-1/2">
          <CustomButton
            btnText={"Join to Contact"}
            action={() => navigate("/joinNow")}
            className="bg-[#AEC4FF] w-full"
          />
        </div>
        <div className="w-1/2">
          <CustomButton
            btnText={"View Details"}
            action={() => navigate(`/nanny-share/profile/${share._id}`)}
            className="border border-[#777777] w-full"
          />
        </div>
      </div>
    </div>
  );
}

export default NannyShareBrowseCard;