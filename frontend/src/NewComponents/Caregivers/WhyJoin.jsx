import React from "react";
import { Clock, Users, MapPin, Calendar } from "lucide-react";

const features = [
  {
    icon: <Clock className="w-5 h-5 text-indigo-600" />,
    iconBg: "bg-indigo-50",
    title: "Earn More",
    description: "Nanny share nannies typically earn 20–30% more than single-family positions.",
  },
  {
    icon: <Users className="w-5 h-5 text-orange-600" />,
    iconBg: "bg-orange-50",
    title: "One Job, Two Families",
    description: "Work with two families on a consistent schedule instead of juggling multiple jobs.",
  },
  {
    icon: <MapPin className="w-5 h-5 text-emerald-600" />,
    iconBg: "bg-emerald-50",
    title: "Real Matches Nearby",
    description: "Connect with families already looking for a nanny share in your area.",
  },
  {
    icon: <Calendar className="w-5 h-5 text-purple-600" />,
    iconBg: "bg-purple-50",
    title: "Consistent Work",
    description: "Many nanny shares are structured for long-term, reliable care with stable hours.",
  },
];

function FeatureCard({ title, description, icon, iconBg }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-start text-left">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
        {icon}
      </div>
      <h3 className="Livvic-Bold text-[16px] font-bold text-black mb-2">
        {title}
      </h3>
      <p className="text-[#666] Livvic-Medium text-[14px] leading-[1.6]">
        {description}
      </p>
    </div>
  );
}

export default function WhyJoinFamLink() {
  return (
    <section className="w-full bg-[#F6F3EE] py-[80px] px-4 sm:px-[72px]">
      <div className="container mx-auto max-w-7xl text-left">
        <div className="mb-7 sm:mb-9 max-w-3xl">
          <h2 className="Livvic-Bold text-[40px] sm:text-[48px] lg:text-[56px] text-[#001243] leading-[1.1] tracking-tight mb-4">
            Why Join Famlink?
          </h2>
          <p className="text-[16px] lg:text-[18px] text-[#666] leading-[1.6] Livvic-Medium">
            We make it easier to earn more, find great families, and build
            long-term nanny share relationships.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[20px] mt-[48px]">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}