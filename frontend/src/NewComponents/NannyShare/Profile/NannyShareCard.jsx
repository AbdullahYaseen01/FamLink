import React from "react";
import { Avatar } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { createChatThunk } from "../../../Components/Redux/chatSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import CustomButton from "../../Button";
import { fireToastMessage } from "../../../toastContainer";
import { DollarSign, Baby, Info } from "lucide-react";

const serviceTagMap = {
  "full-time care": "Full Time",
  "part-time care": "Part Time",
  "pickup/drop-off (carpool style)": "Carpool",
  "after-school care": "After-school",
  "summer/seasonal": "Seasonal",
  "weekend nanny share": "Weekend",
  other: "Other",
};

function formatLocation(loc) {
  if (!loc?.format_location) return "Neighborhood";
  const parts = loc.format_location.split(",") || [];
  const neighborhood = parts.at(-4)?.trim();
  const city = parts.at(-3)?.trim();
  const state = parts.at(-2)?.trim().split(" ")[0];
  return city && state && neighborhood
    ? `${neighborhood}, ${city}, ${state}`
    : "Neighborhood";
}

function NannyShareCard({ share, cta = false }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const handleMessage = async () => {
    try {
      const participants = [share?.user?._id, user._id];
      const { status } = await dispatch(
        createChatThunk({ participants })
      ).unwrap();
      if (status == 201 || status == 200) {
        navigate(`/family/message/`);
      }
    } catch (error) {
      fireToastMessage({ type: "error", message: error.message });
    }
  };

  const chips = [
    share.childrenAges?.length
      ? {
          icon: <Baby size={20} />,
          text: `Children: ${share.childrenAges.join(", ")}`,
        }
      : null,
    share.shareLocation?.length > 0 && {
      icon: <Info size={20} className="relative top-[1px]" />,
      text: `Open to: ${
        share.shareLocation.length <= 2
          ? share.shareLocation.join(", ")
          : "Flexible locations"
      }`,
    },
    share.hourlyBudget
      ? {
          icon: <DollarSign size={20} />,
          text: `$${share.hourlyBudget.minShare}–${share.hourlyBudget.maxShare}/hr per family`,
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

  const shareTypeLabel =
    serviceTagMap[
      share.nannyShareType
        ? share.nannyShareType.toLowerCase()
        : share.otherShareTypeSpecify?.toLowerCase()
    ] ?? "Other";

  const blurb = share.careDescription?.length > 0
    ? share.careDescription
    : share.openNotes?.length > 0
    ? share.openNotes
    : null;

  const initials = share.user?.name
    ?.split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="onboarding-box w-[480px] h-[450px] bg-white space-y-2 relative pb-16">
      {/* Top row: Avatar + tags */}
      <div className="flex justify-between items-start mb-2">
        <Avatar
          size={80}
          src={share.user?.imageUrl}
          style={{
            backgroundColor: !share.user?.imageUrl ? "#38AEE3" : "transparent",
            color: "#fff",
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {!share.user?.imageUrl && initials}
        </Avatar>

        <div className="space-y-2 flex flex-col items-end">
          {/* Share type pill */}
          <div className="rounded-full py-2 px-5 w-fit bg-[#ECF1FF] text-primary Livvic-SemiBold text-sm">
            {shareTypeLabel}
          </div>
          {/* Profile status pill — using nannyShareType as secondary label
          <div className="rounded-lg py-1 px-4 bg-[#d6f7ff] text-[#777777] Livvic-Medium text-sm">
            Nanny Share
          </div> */}
        </div>
      </div>

      {/* Name */}
      <p className="Livvic-SemiBold text-xl text-primary leading-tight">
        {formattedName}
      </p>

      {/* Location */}
      <p className="text-[#555555] Livvic-Medium flex items-center gap-1 text-md">
        <EnvironmentOutlined className="text-lg mr-2"/>
        {formatLocation(share.user?.location)}
      </p>

      {/* Chips */}
      <div className="space-y-2 mb-2">
        {chips.map((chip, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="relative top-[1px] text-[#555555] text-md Livvic-Medium shrink-0">
              {chip.icon}
            </span>
            <span className="text-[#555555] Livvic-Medium text-md">
              {chip.text}
            </span>
          </div>
        ))}
      </div>

      {/* Blurb / description */}
      {blurb && (
        <p className="text-sm text-[#777777]">
          {blurb.length > 120 ? `${blurb.substring(0, 120)}...` : blurb}
        </p>
      )}

      {/* Bottom CTA */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-end gap-2">
        {share?.user?._id !== user._id && !cta && (
          <div className="w-1/2">
            <CustomButton
              btnText={"Message"}
              action={handleMessage}
              className="bg-[#AEC4FF] w-full"
            />
          </div>
        )}
        <div className="w-1/2">
          <CustomButton
            btnText={"View Details"}
            action={() => navigate(`/family/nannyShareView/${share._id}`)}
            className="border border-[#777777] w-full"
          />
        </div>
      </div>
    </div>
  );
}

export default NannyShareCard;