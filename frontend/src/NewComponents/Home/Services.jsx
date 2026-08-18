import React from "react";
import ServicesCard from "../ServicesCard";

const services = [
  {
    icon: "/icons/Services/Nanny4.svg",
    title: "Nanny",
    description:
      "Experienced full-time, part-time, or live-in care tailored to your schedule.",
  },
  {
    icon: "/icons/Services/Babysitter.svg",
    title: "Babysitter",
    description: "Reliable care for evenings, weekends, or last-minute help.",
  },
  {
    icon: "/icons/Services/PrivateEducator.svg",
    title: "Private Educator",
    description:
      "One-on-one academic support at home from qualified tutors and educators.",
  },
  {
    icon: "/icons/Services/SpecializedCaregiver.svg",
    title: "Specialized Caregiver",
    description:
      "Doulas, night nurses, or caregivers trained for specific family needs.",
  },
  {
    icon: "/icons/Services/SportCoach.svg",
    title: "Sports Coaches",
    description:
      "Skill-building and athletic development for all ages and experience levels.",
  },
  {
    icon: "/icons/Services/MusicInstructor.svg",
    title: "Music Instructors",
    description:
      "Learn piano, guitar, or other instruments with flexible home or virtual lessons.",
  },
  {
    icon: "/icons/Services/SwimInstructor.svg",
    title: "Swim Instructors",
    description:
      "Safety-focused swimming lessons with certified professionals.",
  },
  {
    icon: "/icons/Services/HouseManager.svg",
    title: "House Managers",
    description:
      "Trusted help with organization, schedules, and household tasks.",
  },
];

function Services() {
  return (
    <div className="container px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      <div className="sm:text-left max-w-4xl mx-auto sm:mx-0">
        <h2 className="Livvic-Bold text-4xl sm:text-4xl md:text-5xl leading-tight sm:leading-[50px] md:leading-[60px] lg:leading-[80px] mb-4 sm:mb-6">
          Care Options That Fit Your Life
        </h2>
        <p className="Livvic text-[#00000099] text-lg sm:text-xl max-w-2xl mx-auto sm:mx-0 mb-8 sm:mb-10 lg:mb-12">
          Every family has different needs. We help you find care that actually
          fits yours.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {services.map((service) => (
          <ServicesCard
            key={service.title}
            title={service.title}
            description={service.description}
            icon={service.icon}
          />
        ))}
      </div>
    </div>
  );
}

export default Services;