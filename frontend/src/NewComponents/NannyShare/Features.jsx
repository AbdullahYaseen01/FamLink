import { DollarSign, Heart, Smile, Calendar } from "lucide-react";
import React from "react";

const services = [
  {
    icon: <DollarSign className="w-5 h-5 text-indigo-600" />,
    iconBg: "bg-indigo-50",
    topColor: "border-t-indigo-200",
    title: "Lower Your Childcare Costs",
    description: "Share a nanny and split the cost — without sacrificing quality.",
  },
  {
    icon: <Heart className="w-5 h-5 text-pink-600" />,
    iconBg: "bg-pink-50",
    topColor: "border-t-pink-200",
    title: "More Personalized Care",
    description: "Smaller group setting means your child gets more attention.",
  },
  {
    icon: <Smile className="w-5 h-5 text-emerald-600" />,
    iconBg: "bg-emerald-50",
    topColor: "border-t-emerald-200",
    title: "Built-In Playmate",
    description: "Your child gets social interaction in a calm, home-based environment.",
  },
  {
    icon: <Calendar className="w-5 h-5 text-amber-600" />,
    iconBg: "bg-amber-50",
    topColor: "border-t-amber-200",
    title: "Flexible for Your Schedule",
    description: "Coordinate care in a way that works for both families.",
  },
];

function ServicesCard({ title, description, icon, iconBg, topColor }) {
  return (
    <div className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-start text-left`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
        {icon}
      </div>
      <h3 className="Livvic-Bold text-[16px] font-bold text-black mb-2">{title}</h3>
      <p className="text-[#666] Livvic-Medium text-[14px] leading-[1.6]">{description}</p>
    </div>
  );
}

function Features() {
  return (
    <section className="w-full bg-[#F6F3EE] py-[80px] px-4 sm:px-[72px]">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-7 sm:mb-9 max-w-3xl text-left">
          <h2 className="Livvic-Bold text-[40px] sm:text-[48px] lg:text-[56px] text-[#001243] leading-[1.1] tracking-tight mb-4">
            Why Families Love Nanny Sharing
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[20px] mt-[48px]">
          {services.map((service) => (
            <ServicesCard
              key={service.title}
              title={service.title}
              description={service.description}
              icon={service.icon}
              iconBg={service.iconBg}
              topColor={service.topColor}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
