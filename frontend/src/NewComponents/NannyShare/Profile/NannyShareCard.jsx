import React from "react";
import { Card, Avatar, Tag, Button } from "antd";
import { EnvironmentOutlined, UserOutlined } from "@ant-design/icons";
import { createChatThunk } from "../../../Components/Redux/chatSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import CustomButton from "../../Button";
import { fireToastMessage } from "../../../toastContainer";

function NannyShareCard({ share }) {
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
      ? `Child: ${share.childrenAges.map((age) => `${age}yr`).join(", ")}`
      : null,
  ].filter(Boolean);

  return (
    <Card className="border rounded-[20px] border-[#EEEEEE] bg-white h-[311px] w-[330px]">
      {/* Profile */}
      <div className="flex justify-between mb-2">
        <div className="flex items-center gap-3 mb-2">
          <Avatar size={56} src={share.user?.imageUrl}>
            {!share.user?.imageUrl &&
              share.user?.name
                ?.split(" ") // Split into words
                .map((word) => word[0]) // Take first letter of each word
                .join("") // Join together
                .slice(0, 2) // Only first two letters
                .toUpperCase()}
          </Avatar>

          <div>
            <div className="font-semibold text-base">{share.user?.name}</div>
            <div className="text-gray-500 text-sm flex items-center">
              <EnvironmentOutlined className="mr-1" />
              <div className="Livvic-Medium text-sm text-[#777777]">
                {formatLocation(share.user?.location)}{" "}
              </div>
            </div>
          </div>
        </div>
        <div className="py-2 px-4 bg-[#ECF1FF] text-primary rounded-full w-fit h-fit Livvic-SemiBold text-xs">
          {share.nannyShareType ?? "Other"}
        </div>
      </div>

      {/* Title */}
      <div className="Livvic-Medium text-sm text-[#555555] mb-2">{title}</div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 mb-2">
        {chips.map((chip, i) => (
          <div
            key={i}
            className="py-1 px-3 bg-[#faeeff] text-primary rounded-full w-fit h-fit text-xs"
          >
            {chip}
          </div>
        ))}
      </div>

      {/* Blurb */}
      {share.careDescription && (
        <p className="text-sm text-[#777777]">
          {share.careDescription?.length > 80
            ? `${share.careDescription?.substring(0, 80)}...`
            : share.careDescription}
        </p>
      )}

      {/* CTA */}
      {share?.user?._id != user._id && (
        <CustomButton
          btnText={"Message"}
          action={() => handleMessage()}
          className="bg-[#AEC4FF]"
        />
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
