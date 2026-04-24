import { CalendarCheck, Link, Users2 } from "lucide-react";
import React from "react";

const services = [
  {
    icon: <Link className="text-[#3B0025]" aria-hidden="true"/>,
    title: "Lower Your Childcare Costs",
    description:
      "Share a nanny and split the cost — without sacrificing quality.",
  },
  {
    icon: <img src="/beaker.svg" alt="" aria-hidden="true" />,
    title: " More Personalized Care ",
    description:
      "Smaller group setting means your child gets more attention.",
  },
  {
    icon: <Users2 aria-hidden="true"/>,
    title: "Built-In Playmate",
    description: "Your child gets social interaction in a calm, home-based environment.",
  },
  {
    icon: <CalendarCheck aria-hidden="true"/>,
    title: "Flexible for Your Schedule ",
    description:
      "Coordinate care in a way that works for both families.",
  },
];

function ServicesCard({ title, description, icon }) {
  return (
    <div className="rounded-2xl pl-6 pr-2 py-10 bg-white">
      {/* Fixed-height image container */}
      <div className="h-[60px]">
        <div className="flex items-center rounded-full bg-[#FFADE1] w-fit p-4">
          {icon}
        </div>
      </div>

      {/* Text content - always starts at the same vertical position */}
      <div className="mt-4">
        <h3 className="Livvic-SemiBold text-lg">{title}</h3>
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
