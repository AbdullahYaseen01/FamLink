import React from "react";
import { Card, Avatar, Tag, Button } from "antd";
import { EnvironmentOutlined, UserOutlined } from "@ant-design/icons";
import { createChatThunk } from "../../../Components/Redux/chatSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import CustomButton from "../../Button";
import { fireToastMessage } from "../../../toastContainer";
import { House, CalendarDays, DollarSign, Baby, Info } from "lucide-react";

const serviceTagMap = {
  "full-time care": "Full Time",
  "part-time care": "Part Time",
  "pickup/drop-off (Carpool style)": "Carpool",
  "after-school care": "After-school",
  "summer/seasonal": "Seasonal",
  "weekend nanny share": "Weekend",
  other: "Other",
};

function formatNeigborhood(loc) {
  if (!loc?.format_location) return "Neighborhood";
  const parts = loc.format_location.split(",") || [];
  const neighborhood = parts.at(-4)?.trim();
  return neighborhood ? `${neighborhood}` : "Neighborhood";
}

function NannyShareCard({ share, cta = false }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const title = `${formatLocation(share.user?.location)} • ${
    share.nannyShareType || share.otherShareTypeSpecify || "Nanny Share"
  }`;

  const handleMessage = async () => {
    // console.log(share?.user?._id, user._id);
    try {
      const participants = [share?.user?._id, user._id];
      const { status } = await dispatch(
        createChatThunk({ participants }),
      ).unwrap();
      if (status == 201 || status == 200) {
        navigate(`/family/message/`);
      }
    } catch (error) {
      // console.log(error);
      fireToastMessage({ type: "error", message: error.message });
    }
  };

  const chips = [
    share.user.location?.format_location && {
      icon: <House size={16} />,
      text: formatNeigborhood(share.user.location),
    },
    // share.shareLocation.length > 0 && {
    //   icon: <Info size={16} className="relative top-[2px]" />,
    //   text: share.shareLocation.join(", "),
    // },
    share.specificDays && {
      icon: <CalendarDays size={16} />,
      text: formatSchedule(share.specificDays),
    },
    share.hourlyBudget
      ? {
          icon: <DollarSign size={16} />,
          text: `$${share.hourlyBudget.minShare}–${share.hourlyBudget.maxShare}/hr per family`,
        }
      : {
          icon: <DollarSign size={16} />,
          text: `$${share.hourlyBudgetSpecify}/hr`,
        },
    share.childrenAges?.length
      ? {
          icon: <Baby size={16} />,
          text: `Children: ${share.childrenAges.join(", ")}`,
        }
      : null,
  ].filter(Boolean);

  return (
    <Card className="relative border rounded-[20px] border-[#EEEEEE] bg-white h-[390px] w-[370px] p-4">
      {/* Top Content */}
      <div>
        {/* Profile */}
        <div className="flex justify-between mb-2">
          <div className="flex items-center gap-3 mb-2">
            <Avatar
              size={56}
              src={share.user?.imageUrl}
              style={{
                backgroundColor: !share.user?.imageUrl
                  ? "#38AEE3"
                  : "transparent",
                color: "#fff",
                fontWeight: 600,
              }}
            >
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
            {serviceTagMap[
              share.nannyShareType
                ? share.nannyShareType.toLowerCase()
                : share.otherShareTypeSpecify.toLowerCase()
            ] ?? "Other"}
          </div>
        </div>

        {/* Title */}
        {/* <div className="Livvic-Medium text-sm text-[#555555] mb-2">{title}</div> */}

        {/* Chips */}
        <div className="mb-2 space-y-1">
          {chips.map((chip, i) => (
            <div key={i} className="flex gap-2 ">
              <span className=" relative top-[3px] text-[#555555] Livvic-Medium">
                {chip.icon}
              </span>
              <span className="text-[#555555] Livvic-Medium">{chip.text}</span>
            </div>
          ))}
        </div>

        {/* Blurb */}
        {share.careDescription?.length > 0 ? (
          <p className="text-sm text-[#777777]">
            {share.careDescription?.length > 200
              ? `${share.careDescription?.substring(0, 90)}...`
              : share.careDescription}
          </p>
        ) : share.openNotes?.length > 0 ? (
          <p className="text-sm text-[#777777]">
            {share.openNotes.length > 200
              ? `${share.openNotes.substring(0, 90)}...`
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

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const SHORT = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

function formatSchedule(days) {
  if (!days) return "N/A";

  const activeDays = DAY_ORDER.filter((d) => days[d]?.checked);
  if (!activeDays.length) return "N/A";

  // Step 1: group days by same time
  const timeGroups = {};

  activeDays.forEach((day) => {
    const { start, end } = days[day];
    const key = `${start}-${end}`;

    if (!timeGroups[key]) timeGroups[key] = [];
    timeGroups[key].push(day);
  });

  // Step 2: format each group
  const result = Object.entries(timeGroups).map(([timeKey, groupDays]) => {
    // sort properly
    groupDays.sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));

    // group consecutive days
    const groups = [];
    let temp = [groupDays[0]];

    for (let i = 1; i < groupDays.length; i++) {
      const prev = DAY_ORDER.indexOf(groupDays[i - 1]);
      const curr = DAY_ORDER.indexOf(groupDays[i]);

      if (curr === prev + 1) {
        temp.push(groupDays[i]);
      } else {
        groups.push([...temp]);
        temp = [groupDays[i]];
      }
    }
    groups.push(temp);

    const dayStr = groups
      .map((g) =>
        g.length > 1 ? `${SHORT[g[0]]}–${SHORT[g[g.length - 1]]}` : SHORT[g[0]],
      )
      .join(", ");

    // format time
    const [startRaw, endRaw] = timeKey.split("-");
    const start = new Date(startRaw).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const end = new Date(endRaw).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${dayStr} ${start}–${end}`;
  });

  return result.join(" • ");
}

function formatLocation(loc) {
  if (!loc?.format_location) return "Neighborhood";
  const parts = loc.format_location.split(",") || [];
  const city = parts.at(-3)?.trim();
  const state = parts.at(-2)?.trim().split(" ")[0];
  return city && state ? `${city}, ${state}` : "Neighborhood";
}

export default NannyShareCard;
