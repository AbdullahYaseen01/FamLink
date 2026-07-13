import React from "react";
import CustomButton from "../Button";
import { NavLink } from "react-router-dom";
import ProfileCard from "../../Components/subComponents/profileCard";
import NannyShareCard from "../NannyShareCard";
import seeMatchesImg from "../../assets/images/seeMatches.png";
import seeMatchesCaregiverImg from "../../assets/images/seeMatchesCaregiver.png";

const nannyShareData = [
  {
    name: "The Harris Family",
    profile: "After-school care",
    img: "/nanny/nanny1.jpeg",
    location: "Rockridge, Oakland, CA",
    schedule: "Mon–Thu, 2:30–6:30 PM",
    child: "1 year, 2 years",
    req: "A Rockridge-area family with a child 4–7 needing after-school care",
    start: "within the next month",
    shareLocation: ["near our home / in our neighborhood", "nearby neighborhoods within ~10–15 minutes"],
    hourlyBudget: { minShare: 10, maxShare: 12.5 },
    description:
      "We're looking to share a nanny for school pickup and afternoon care. Our afternoons include park time, snack, and creative play.",
  },
  {
    name: "The Robinson Family",
    profile: "After-school care",
    img: "/nanny/nanny2.jpeg",
    location: "Mountain Blvd, Piedmont, CA",
    schedule: "Tue–Fri, 2:00–6:00 PM",
    child: "2 years, 4 years",
    req: "A Montclair family open to rotating homes weekly",
    start: "in 1-3 months",
    shareLocation: ["nearby neighborhoods within ~10–15 minutes", "near my workplace"],
    hourlyBudget: { minShare: 15, maxShare: 17.5 },
    description:
      "We're transitioning into TK and would love to share a nanny for structured afternoons and social time.",
  },
  {
    name: "The Patel Family",
    profile: "Seasonal",
    img: "/nanny/nanny3.jpeg",
    location: "Rockridge, Oakland, CA",
    schedule: "Mon–Thu, 9:00 AM–3:00 PM",
    child: "5 months",
    req: "A Rockridge or Piedmont family with a child 1.5–3",
    start: "within the next month",
    shareLocation: ["nearby neighborhoods within ~10–15 minutes", "anywhere in city that’s reasonably close", "near my workplace"],
    hourlyBudget: { minShare: 17.5, maxShare: 20 },
    description:
      "Looking for a summer nanny share for our 5 months old",
  },
  {
    name: "The Alvarez Family",
    profile: "Seasonal",
    img: "/nanny/nanny4.jpeg",
    location: "Montclair, Oakland, CA",
    schedule: "Mon–Fri, 8:30 AM–2:30 PM",
    child: "18 months",
    req: "A Montclair family seeking daytime summer care",
    start: "in 3+ months/flexible",
    shareLocation: ["near our home / in our neighborhood", "anywhere in city that’s reasonably close"],
    hourlyBudget: { minShare: 17.5, maxShare: 20 },
    description:
      "Hoping to create a relaxed, consistent summer routine while splitting care costs with another nearby family.",
  },
  {
    name: "The Nguyen Family",
    profile: "Carpool",
    img: "/nanny/nanny5.jpeg",
    location: "Piedmont Avenue, Oakland, CA",
    schedule: "Mon–Fri, 3:00–6:30 PM",
    child: "1 year",
    req: "A family near Piedmont Avenue with similar pickup timing",
    start: "in 1-3 months",
    shareLocation: ["Piedmont Avenue area", "Lower Piedmont", "Lower Piedmont"],
    hourlyBudget: { minShare: 19, maxShare: 24 },
    description:
      "Our child attends a nearby elementary school and we're hoping to create a consistent carpool nanny share.",
  },
  {
    name: "The Williams Family",
    profile: "Full-time care",
    img: "/nanny/nanny6.jpeg",
    location: "Piedmont, CA",
    schedule: "Mon–Fri, 8:00 AM–4:30 PM",
    child: "16 months",
    req: "A Piedmont or Rockridge family with a child under 2",
    start: "within the next month",
    shareLocation: ["Piedmont", "Rockridge", "Montclair", "Upper Broadway"],
    hourlyBudget: "20",
    description:
      "We're seeking a full-time nanny share with a nearby family for long-term, reliable care.",
  },
];

function NannySharePreview({ caregiver, flush = false }) {
  return (
    <div className={`w-full bg-[#F6F3EE] relative pt-4 sm:pt-8 lg:pt-1 ${flush ? "" : "mt-16 sm:mt-24 lg:mt-10"}`}>
      {/* Curly top SVG — skipped when `flush`, since the page already draws its
          own curve above (avoids a doubled curve + margin-collapse white gap). */}
      {!flush && (
        <div className="absolute bottom-[100%] left-0 w-full overflow-hidden leading-none z-10 -mb-[1px]">
          <svg
            className="w-full block h-[60px] sm:h-[80px] lg:h-[120px]"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#F6F3EE"
              d="M0,0 C360,120 1080,120 1440,0 L1440,120 L0,120 Z"
            />
          </svg>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 lg:pb-16 flex flex-col items-center text-center relative z-20">
        <div className="mt-4 sm:mt-8 lg:mt-2 flex flex-col items-center">
          <span className="text-[#888] uppercase tracking-widest text-xs font-semibold mb-3">
            Matches Near You
          </span>
          <h2 className="Livvic-Bold text-4xl sm:text-5xl text-[#111] mb-[12px]">
            {caregiver ? "See Families Near You" : "See Who's Near You"}
          </h2>
          <p className="text-[#666] mx-auto mb-[28px] max-w-xl text-sm sm:text-base">
            {caregiver ? "Browse families in your area looking for a nanny share caregiver." : "Browse families in your area looking for the same kind of nanny share."}
          </p>
          <NavLink to="/joinNow">
            <CustomButton
              btnText={"See All Matches Near You"}
              className={`${caregiver ? "bg-[#AEC4FF]" : "bg-[#FFADE1]"} text-[#00333B] px-8 py-3`}
            />
          </NavLink>
        </div>
        <div
          className="mt-12 w-full max-w-4xl mx-auto h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden relative"
          style={{
            maskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
          }}
        >
          <div className="flex flex-col animate-scrollUp w-full">
            <img
              src={caregiver ? seeMatchesCaregiverImg : seeMatchesImg}
              alt="Matches Near You"
              className="w-full block object-cover"
            />
            {/* Duplicated image below is required for the seamless infinite CSS scroll to work */}
            <img
              src={caregiver ? seeMatchesCaregiverImg : seeMatchesImg}
              alt="Matches Near You"
              className="w-full block object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default NannySharePreview;