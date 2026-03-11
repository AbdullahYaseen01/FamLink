import { CalendarCheck, Link, Users2 } from "lucide-react";
import React from "react";

const services = [
  {
    icon: <Link className="text-[#3B0025]" />,
    title: "Smart Family Matching",
    description:
      "Famlink helps match families with compatible parenting styles and schedules.",
  },
  {
    icon: <img src="/beaker.svg" alt="beaker" />,
    title: "Personalized Care",
    description:
      "Smaller group sizes mean the same nanny quality, shared between two families.",
  },
  {
    icon: <Users2 />,
    title: "Built-In Socialization",
    description: "Kids interact with peers in a calmer, home-based setting.",
  },
  {
    icon: <CalendarCheck />,
    title: "Flexible Scheduling",
    description:
      "Coordinate care in a way that works for both families involved.",
  },
];

function ServicesCard({ title, description, icon }) {
  return (
    <div className="rounded-2xl pl-6 pr-2 py-10 bg-white max-w-[18rem]">
      {/* Fixed-height image container */}
      <div className="h-[60px]">
        <div className="flex items-center rounded-full bg-[#FFADE1] w-fit p-4">
          {icon}
        </div>
      </div>

      {/* Text content - always starts at the same vertical position */}
      <div className="mt-4">
        <p className="Livvic-SemiBold text-lg">{title}</p>
        <p className="text-[#4A4F57] Livvic">{description}</p>
      </div>
    </div>
  );
}

function Features() {
  return (
    <div>
      <div className="container px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        <div className="sm:text-left max-w-4xl mx-auto sm:mx-0">
          <h1 className="Livvic-Bold text-4xl sm:text-4xl md:text-5xl leading-tight sm:leading-[50px] md:leading-[60px] lg:leading-[80px] mb-4 sm:mb-6">
            Why Families Love Nanny Sharing
          </h1>
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
    </div>
  );
}

export default Features;
