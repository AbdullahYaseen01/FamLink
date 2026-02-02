import React from "react";
import CustomButton from "../Button";
import { NavLink } from "react-router-dom";
import ProfileCard from "../../Components/subComponents/profileCard";
import NannyShareCard from "../NannyShareCard";

const nannyShareData = [
  {
    name: "The Harris Family",
    profile: "School Pickup + After-school care",
    img: "/nanny/nanny1.jpeg",
    location: "Rockridge, Oakland, CA",
    schedule: " Mon–Thu, 2:30–6:30 PM",
    child: "1 kindergartener (5)",
    req: "A Rockridge-area family with a child 4–7 needing after-school care",
    start: "March 2026",
    description:
      "We’re looking to share a nanny for school pickup and afternoon care. Our afternoons include park time, snack, and creative play.",
  },
   {
    name: "The Robinson Family",
    profile: "School Pickup + After-school care",
    img: "/nanny/nanny2.jpeg",
    location: "Montclair, Oakland, CA",
    schedule: " Tue–Fri, 2:00–6:00 PM",
    child: "1 preschooler entering TK (4)",
    req: "A Montclair family open to rotating homes weekly",
    start: "April 2026",
    description:
      "We’re transitioning into TK and would love to share a nanny for structured afternoons and social time.",
  },
   {
    name: "The Patel Family",
    profile: " Summer/Seasonal",
    img: "/nanny/nanny3.jpeg",
    location: " Rockridge, Oakland, CA",
    schedule: "Mon–Thu, 9:00 AM–3:00 PM",
    child: "1 toddler (2)",
    req: "A Rockridge or Piedmont family with a child 1.5–3",
    start: " June 10 – August 15, 2026",
    description:
      "Looking for a summer nanny share with lots of outdoor play, walks, and age-appropriate activities.",
  },
   {
    name: "The Alvarez Family",
    profile:  "Summer/Seasonal",
    img: "/nanny/nanny4.jpeg",
    location: "Montclair, Oakland, CA",
    schedule: "Mon–Fri, 8:30 AM–2:30 PM",
    child: " 1 toddler (18 months)",
    req: " A Montclair family seeking daytime summer care",
    start: "July 1 – September 1, 2026",
    description:
      "Hoping to create a relaxed, consistent summer routine while splitting care costs with another nearby family.",
  },
    {
    name: "The Nguyen Family",
    profile: "School Pickup + After-school care",
    img: "/nanny/nanny5.jpeg",
    location: "Piedmont Avenue, Oakland, CA",
    schedule: "Mon–Fri, 3:00–6:30 PM",
    child: "1 first grader (6)",
    req: "A family near Piedmont Avenue with similar pickup timing",
    start: "ASAP",
    description:
      "Our child attends a nearby elementary school and we’re hoping to create a consistent after-school nanny share.",
  },
    {
    name: "The Williams Family",
    profile: "Full-time care",
    img: "/nanny/nanny6.jpeg",
    location: " Piedmont, CA",
    schedule: "Mon–Fri, 8:00 AM–4:30 PM",
    child: "1 toddler (16 months)",
    req: "A Piedmont or Rockridge family with a child under 2",
    start: "May 2026",
    description:
      " We’re seeking a full-time nanny share with a nearby family for long-term care.",
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
          />
        ))}
      </div>
    </div>
  );
}

export default NannySharePreview;
