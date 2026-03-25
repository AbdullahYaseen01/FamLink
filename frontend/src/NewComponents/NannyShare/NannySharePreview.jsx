import React from "react";
import CustomButton from "../Button";
import { NavLink } from "react-router-dom";
import ProfileCard from "../../Components/subComponents/profileCard";
import NannyShareCard from "../NannyShareCard";

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
    location: "Montclair, Oakland, CA",
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
    shareLocation: ["nearby neighborhoods within ~10–15 minutes","anywhere in city that’s reasonably close", "near my workplace"],
    hourlyBudget: { minShare: 17, maxShare: 21 },
    description:
      "Looking for a summer nanny share with lots of outdoor play, walks, and age-appropriate activities.",
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
    hourlyBudget: { minShare: 15, maxShare: 20 },
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
    shareLocation: ["Piedmont Avenue area", "Lower Piedmont",  "Lower Piedmont"],
    hourlyBudget: { minShare: 19, maxShare: 24 },
    description:
      "Our child attends a nearby elementary school and we're hoping to create a consistent after-school nanny share.",
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
    hourlyBudget: { minShare: 20, maxShare: 26 },
    description:
      "We're seeking a full-time nanny share with a nearby family for long-term, reliable care.",
  },
];

function NannySharePreview() {
  return (
    <div className="container px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      <div className="flex flex-col sm:flex-row sm:justify-between mt-6 sm:mt-12 gap-4 sm:gap-0">
        <div>
          <h1 className="Livvic-Bold text-4xl sm:text-5xl">
            Nannies Open to <br className="hidden lg:block" />
            Sharing Arrangements
          </h1>
        </div>
        <div className="sm:self-start">
          <NavLink to="/joinNow">
            <CustomButton
              btnText={"Explore More"}
              className="bg-[#FFADE1] text-[#00333B] w-full sm:w-auto"
            />
          </NavLink>
        </div>
      </div>
      <div className="flex flex-wrap mt-12 gap-2">
        {nannyShareData.map((f, i) => (
          <NannyShareCard
            key={i}
            name={f.name}
            img={f.img}
            profile={f.profile}
            location={f.location}
            schedule={f.schedule}
            child={f.child}
            req={f.req}
            start={f.start}
            description={f.description}
            shareLocation={f.shareLocation}
            hourlyBudget={f.hourlyBudget}
          />
        ))}
      </div>
    </div>
  );
}

export default NannySharePreview;