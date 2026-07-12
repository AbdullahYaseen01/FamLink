import { CalendarCheck, Link, Users2 } from "lucide-react";
import React from "react";

const services = [
  {
    icon: <img src="/piggy_bank.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain object-center block"/>,
    title: "Lower Your Childcare Costs",
    description: "Share a nanny and split the cost — without sacrificing quality.",
  },
  {
    icon: <img src="/care.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain object-center block"/>,
    title: "More Personalized Care",
    description: "Smaller group setting means your child gets more attention.",
  },
  {
    icon: <img src="/play.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain object-center block"/>,
    title: "Built-In Playmate",
    description: "Your child gets social interaction in a calm, home-based environment.",
  },
  {
    icon: <img src="/calendar.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain object-center block"/>,
    title: "Flexible for Your Schedule",
    description: "Coordinate care in a way that works for both families.",
  },
];

function ServicesCard({ title, description, icon }) {
  return (
    <div className="bg-white rounded-[16px] p-[28px_24px] border-[1.5px] border-gray-200 transition-all duration-200 relative overflow-hidden hover:-translate-y-1 hover:shadow-md hover:border-transparent">
      {/* Kept original layout but updated margin based on CSS */}
      <div className="w-full h-32 sm:h-40 flex items-center justify-center mb-[16px] flex-shrink-0">
          {icon}
      </div>

      <div>
        <h3 className="Livvic-SemiBold text-[18px] font-semibold text-black mb-[8px]">{title}</h3>
        <p className="text-[#666] Livvic text-[14px] leading-[1.65]">{description}</p>
      </div>
    </div>
  );
}

function Features() {
  return (
    <div>
      <div className="container px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        <div className="text-center sm:text-left max-w-4xl mx-auto sm:mx-0 mb-[44px]">
          <h1 className="Livvic-Bold text-[48px] text-black leading-tight sm:leading-[50px] md:leading-[60px]">
            Why Families Love Nanny Sharing
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[20px]">
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
