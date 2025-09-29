import React from "react";
import { Card, Avatar, Tag, Button } from "antd";
import { EnvironmentOutlined, UserOutlined } from "@ant-design/icons";
import { createChatThunk } from "../../../Components/Redux/chatSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import CustomButton from "../../Button";
import { fireToastMessage } from "../../../toastContainer";

const serviceTagMap = {
  "Full-time care": "Full Time",
  "Part-time care": "Part Time",
  "Pickup/Drop-off (Carpool style)": "Carpool",
  "After-school care": "After-school",
  "Summer/Seasonal": "Seasonal",
  Other: "Other",
};

function NannyShareCard({ share, cta = false }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const title = `${formatLocation(share.user?.location)} • ${
    share.nannyShareType || share.otherShareTypeSpecify || "Nanny Share"
  }`;

  const handleMessage = async () => {
    console.log(share?.user?._id, user._id);
    try {
      const participants = [share?.user?._id, user._id];
      const { status } = await dispatch(
        createChatThunk({ participants })
      ).unwrap();
      if (status == 201 || status == 200) {
        navigate(`/family/message/`);
      }
    } catch (error) {
      console.log(error);
      fireToastMessage({ type: "error", message: error.message });
    }
  };

  // Chips
  const chips = [
    share.flexibility && share.flexibility,
    share.hostingPreference && `Host: ${share.hostingPreference}`,
    share.specificDays && formatSchedule(share.specificDays),
    share.hourlyBudget
      ? `$${share.hourlyBudget.min}–${share.hourlyBudget.max}/hr`
      : `$${share.hourlyBudgetSpecify}/hr`,
    share.childrenAges?.length
      ? `Children: ${share.childrenAges.map((age) => `${age}`).join(", ")}`
      : null,
  ].filter(Boolean);

  return (
    <Card className="relative border rounded-[20px] border-[#EEEEEE] bg-white h-[390px] w-[370px] p-4">
      {/* Top Content */}
      <div>
        {/* Profile */}
        <div className="flex justify-between mb-2">
          <div className="flex items-center gap-3 mb-2">
            <Avatar size={56} src={share.user?.imageUrl}>
              {!share.user?.imageUrl &&
                share.user?.name
                  ?.split(" ")
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
            </Avatar>
            <div>
              <div className="font-semibold text-base">{share.user?.name}</div>
              <div className="text-gray-500 text-sm flex items-center">
                <EnvironmentOutlined className="mr-1" />
                <div className="Livvic-Medium text-sm text-[#777777]">
                  {formatLocation(share.user?.location)}
                </div>
              </div>
            </div>
          </div>
          <div className="p-2 bg-[#ECF1FF] text-primary rounded-full w-fit h-fit Livvic-SemiBold text-xs">
            {serviceTagMap[share.nannyShareType] ?? "Other"}
          </div>
        </div>

        {/* Title */}
        <div className="Livvic-Medium text-sm text-[#555555] mb-2">{title}</div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2 mb-2">
          {chips.map((chip, i) => (
            <div
              key={i}
              className="py-1 px-3 bg-[#ECF1FF] text-primary rounded-full w-fit h-fit text-xs"
            >
              {chip}
            </div>
          ))}
        </div>

        {/* Blurb */}
        {share.careDescription?.length > 0 ? (
          <p className="text-sm text-[#777777]">
            {share.careDescription?.length > 80
              ? `${share.careDescription?.substring(0, 80)}...`
              : share.careDescription}
          </p>
        ) : share.openNotes?.length > 0 ? (
          <p className="text-sm text-[#777777]">
            {share.openNotes.length > 80
              ? `${share.openNotes.substring(0, 80)}...`
              : share.openNotes}
          </p>
        ) : null}
      </div>

      {/* Bottom CTA */}
      {share?.user?._id !== user._id && !cta && (
        <div className="absolute bottom-4 mt-4 left-8 right-8">
          <CustomButton
            btnText={"Message"}
            action={() => handleMessage()}
            className="bg-[#AEC4FF] w-full"
          />
        </div>
      )}
    </Card>
  );
}

// Format schedule: e.g. "Mon–Fri 9:00–12:30"
function formatSchedule(days) {
  if (!days) return "N/A";
  const activeDays = Object.keys(days).filter((d) => days[d]?.checked);
  if (!activeDays.length) return "N/A";
  const start = new Date(days[activeDays[0]].start).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const end = new Date(days[activeDays[0]].end).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${activeDays[0]}–${
    activeDays[activeDays.length - 1]
  } ${start}–${end}`;
}

function formatLocation(loc) {
  if (!loc?.format_location) return "Neighborhood";
  const parts = loc.format_location.split(",") || [];
  const city = parts.at(-3)?.trim();
  const state = parts.at(-2)?.trim().split(" ")[0];
  return city && state ? `${city}, ${state}` : "Neighborhood";
}

export default NannyShareCard;
