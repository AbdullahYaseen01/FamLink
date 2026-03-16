import { Card, Avatar, Tag } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import CustomButton from "../../Button";

const serviceTagMap = {
  "Full-time care": "Full Time",
  "Part-time care": "Part Time",
  "Pickup/Drop-off (Carpool style)": "Carpool",
  "After-school care": "After-school",
  "Summer/Seasonal": "Seasonal",
  Other: "Other",
};

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

function NannyShareBrowseCard({ share, cta = false }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const chips = [
    share.specificDays && formatSchedule(share.specificDays),
    share.childrenAges?.length
      ? `Children: ${share.childrenAges.join(", ")}`
      : null,
  ].filter(Boolean);

const price = share.hourlyBudget
  ? `$${share.hourlyBudget.minShare}${
      share.hourlyBudget.maxShare ? ` – $${share.hourlyBudget.maxShare}` : "+"
    }`
  : `$${share.hourlyBudgetSpecify}`;

  return (
    <Card
      className="border rounded-[24px] border-[#EAEAEA] bg-white 
      max-w-2xl p-2 flex flex-col justify-between"
    >
      {/* Header */}
      <div>
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            <Avatar
              size={64}
              src={share.user?.imageUrl}
              style={{
                backgroundColor: !share.user?.imageUrl
                  ? "#38AEE3"
                  : "transparent",
                fontWeight: 600,
              }}
            >
              {!share.user?.imageUrl &&
                share.user?.name
                  ?.split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
            </Avatar>

            <div>
              <div className="text-lg Livvic-SemiBold">{share.user?.name}</div>

              <div className="flex Livvic-Medium items-center text-gray-500 text-sm">
                <EnvironmentOutlined className="mr-1" />
                {formatLocation(share.user?.location)}
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#ECF1FF] text-primary rounded-full Livvic-SemiBold text-xs">
            {serviceTagMap[share.nannyShareType] ?? "Other"}
          </div>
        </div>

        {/* Price Highlight */}
        <div className="mt-5">
          <div className="text-3xl Livvic-Bold text-[#1A1A1A] tracking-tight">
            {price}
            <span className="text-base Livvic-Medium ml-1">
              /hr per family
            </span>
          </div>
        </div>

        {/* Info Chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {chips.map((chip, i) => (
            <div key={i} className="rounded-full Livvic-Medium px-3 py-1 bg-[#F5F5F5]">
              {chip}
            </div>
          ))}
        </div>

        {/* Description */}
        {share.openNotes && (
          <p className="mt-4 text-sm text-gray-600 leading-relaxed">
            {share.openNotes.length > 180
              ? `${share.openNotes.substring(0, 180)}...`
              : share.openNotes}
          </p>
        )}
      </div>

      {/* CTA */}
      <div className="mt-4 flex justify-end">
        <CustomButton
          btnText={"Join to Contact"}
          action={() => navigate(`/joinNow`)}
          className="bg-[#AEC4FF]"
        />
      </div>
    </Card>
  );
}

export default NannyShareBrowseCard;
