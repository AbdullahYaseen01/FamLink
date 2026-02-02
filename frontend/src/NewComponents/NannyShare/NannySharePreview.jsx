import React from "react";
import CustomButton from "../Button";
import { NavLink } from "react-router-dom";
import ProfileCard from "../../Components/subComponents/profileCard";
import NannyShareCard from "../NannyShareCard";

const nannyShareData = [
  {
    name: "The Harris Family",
    profile: "School Pickup + Afternoon care",
    img: "/nanny/nanny1.jpeg",
    location: "Oakland, CA",
    schedule: "M–F, 8AM–4PM",
    child: "1 kindergartener (5)",
    req: "A Rockridge-area family with a child 4–7 needing after-school care",
    start: "March 2026",
    description:
      "We’re looking to share a nanny for school pickup and afternoon care. Our afternoons include park time, snack, and creative play.",
  },
   {
    name: "The Patel Family",
    profile: "School Pickup + Afternoon care",
    img: "/nanny/nanny2.jpeg",
    location: "Oakland, CA",
    schedule: "M–Th, 9AM–5PM",
    child: "2-year-old girl",
    req: "A family open to alternating homes weekly",
    start: "July 1 – September 1, 2026",
    description:
      "We’re hoping to create a fun social environment for our daughter and split the cost of care with a reliable nearby family",
  },
   {
    name: "The Johnson Family",
    profile: "School Pickup + Afternoon care",
    img: "/nanny/nanny3.jpeg",
    location: "Silver Lake, Los Angeles",
    schedule: "Mon–Fri, 9AM–3PM",
    child: "10-month-old boy",
    req: "A family with a child under 2",
    start: "April 2026",
    description:
      "We work from home and would love to share a nanny with another mellow family nearby. Open to rotating houses.",
  },
   {
    name: "The Rivera Family",
    profile:  "Summer Nanny Share",
    img: "/nanny/nanny4.jpeg",
    location: "Astoria, Queens",
    schedule: "M/W/F, 8AM–6PM",
    child: "3-year-old girl",
    req: "Family with a preschool-aged child",
    start: "June 10 - August 15, 2026",
    description:
      "Our daughter is very social — we’d love to team up with a family to reduce cost and make care more fun!",
  },
    {
    name: "The Nguyen Family",
    profile: "Summer Nanny Share",
    img: "/nanny/nanny5.jpeg",
    location: "South San Jose, CA",
    schedule: "Tues–Fri, 7:30AM–4:30PM",
    child: "2-year-old girl",
    req: "Family in same ZIP willing to host part-time",
    start: "July 1 - September 1, 2026",
    description:
      "I’m a single mom working hybrid — looking for a nearby family to split care and build some community too.",
  },
    {
    name: "The Williams Family",
    profile: "Full-Time Nanny Share",
    img: "/nanny/nanny6.jpeg",
    location: "Capitol Hill, Seattle",
    schedule: "Full-time (40 hrs/week)",
    child: "14-month-old girl",
    req: "A family open to rotating locations weekly",
    start: "May 2026",
    description:
      "We love the idea of creating a pod-like setup with another family. Let’s connect if you’re close by!e",
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
