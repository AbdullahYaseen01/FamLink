import { CalendarCheck, Link, Users2 } from "lucide-react";
import React from "react";

const services = [
  {
    icon: <img src="/piggy_bank.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain object-center block"/>,
    title: "Lower Your Childcare Costs",
    description:
      "Share a nanny and split the cost — without sacrificing quality.",
  },
  {
    icon: <img src="/care.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain object-center block"/>,
    title: " More Personalized Care ",
    description:
      "Smaller group setting means your child gets more attention.",
  },
  {
    icon: <img src="/play.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain object-center block"/>,
    title: "Built-In Playmate",
    description: "Your child gets social interaction in a calm, home-based environment.",
  },
  {
    icon: <img src="/calendar.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain object-center block"/>,
    title: "Flexible for Your Schedule ",
    description:
      "Coordinate care in a way that works for both families.",
  },
];

function ServicesCard({ title, description, icon }) {
  return (
    <div className="rounded-2xl pl-4 sm:pl-6 pr-2 py-8 sm:py-10 bg-white">
      {/* Use flex end to pin images to the bottom baseline */}
      <div className="w-full h-32 sm:h-48 flex items-center justify-center p-4 mb-4 flex-shrink-0">
          {icon}
      </div>

      <div className="mt-3">
        <h3 className="Livvic-SemiBold text-base sm:text-lg">{title}</h3>
        <p className="text-[#4A4F57] Livvic text-sm sm:text-base">{description}</p>
      </div>
    </div>
  );
}

function Features() {
  return (
    <div>
      <div className="container px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        <div className="text-center sm:text-left max-w-4xl mx-auto sm:mx-0">
          <h1 className="Livvic-Bold text-3xl sm:text-4xl md:text-5xl leading-tight sm:leading-[50px] md:leading-[60px] lg:leading-[80px] mb-6 sm:mb-8">
            Why Families Love Nanny Sharing
          </h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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
