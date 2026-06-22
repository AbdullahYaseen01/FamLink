import React from 'react';
import { Users, Heart } from 'lucide-react';
import home1 from '../assets/images/home1.png';
import home2 from '../assets/images/home2.png';

const DotPattern = ({ className }) => (
  <svg className={`absolute ${className} pointer-events-none z-0`} width="100" height="80" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="2.5" fill="#C4D0EB" opacity="0.4" />
    </pattern>
    <rect width="100" height="80" fill="url(#dots)" />
  </svg>
);

const ShareManagement = () => {
  return (
    <div className="min-h-[85vh] flex justify-center items-center px-4 py-12">
      <div className="relative bg-white rounded-[32px] p-8 sm:p-12 md:p-16 max-w-[1000px] w-full flex flex-col items-center text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#F1F3F9] overflow-hidden">

        {/* Background Elements */}
        {/* Center Glow */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[400px] h-[350px] bg-[#EEF2FF] rounded-full blur-[80px] pointer-events-none z-0"></div>

        {/* Left Purple Wave */}
        <svg className="absolute bottom-0 left-0 w-[50%] md:w-[45%] h-[80%] pointer-events-none z-0 opacity-80" preserveAspectRatio="none" viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,600 L0,200 C150,150 250,350 400,450 C400,600 200,600 0,600 Z" fill="url(#paint_purple)" />
          <defs>
            <linearGradient id="paint_purple" x1="0" y1="200" x2="300" y2="600" gradientUnits="userSpaceOnUse">
              <stop stopColor="#EBF2FF" />
              <stop offset="1" stopColor="#F5F8FF" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>

        {/* Right Green Wave */}
        <svg className="absolute top-0 right-0 w-[45%] md:w-[40%] h-[70%] pointer-events-none z-0 opacity-80" preserveAspectRatio="none" viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M400,0 L400,400 C250,300 150,150 0,50 C50,0 200,0 400,0 Z" fill="url(#paint_green)" />
          <defs>
            <linearGradient id="paint_green" x1="400" y1="0" x2="100" y2="300" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E8F7EE" />
              <stop offset="1" stopColor="#F5FCF8" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>

        {/* Dot Patterns */}
        <DotPattern className="left-6 md:left-12 bottom-[30%]" />
        <DotPattern className="right-6 md:right-12 top-[40%]" />

        {/* Floating Star (Left) */}
        <div className="absolute left-[20%] top-[30%] text-[#EAEBFE] opacity-60 z-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0L13.5 8.5L22 10L13.5 11.5L12 20L10.5 11.5L2 10L10.5 8.5L12 0Z" />
          </svg>
        </div>

        {/* Custom Illustration */}
        <div className="relative w-full max-w-[750px] mx-auto mb-16 h-[220px] md:h-[260px] flex items-end justify-between z-10 px-2 sm:px-10">
          {/* Dashed Line and Heart */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] flex items-center justify-center">
            <svg className="absolute top-[30px] w-full h-[100px] md:h-[130px] pointer-events-none" viewBox="0 0 300 120" preserveAspectRatio="none">
              <path d="M 10 120 Q 150 -20 290 120" fill="none" stroke="#AEC4FF" strokeWidth="2.5" strokeDasharray="8 8" />
            </svg>
            <div className="bg-transparent p-2 z-10 absolute top-4 md:top-2">
               <Heart className="text-[#AEC4FF] fill-[#AEC4FF]" size={28} />
            </div>
          </div>

          {/* Left House */}
          <div className="flex flex-col items-center relative z-10 pb-2">
            <img src={home1} alt="House" className="w-[160px] md:w-[220px] h-auto relative z-10" style={{ filter: 'drop-shadow(0px 15px 20px rgba(114, 155, 255, 0.2))' }} />
          </div>

          {/* Center Users */}
          <div className="flex flex-col items-center z-10 absolute left-1/2 -translate-x-1/2 bottom-[30px] md:bottom-[40px]">
            <div className="w-[110px] h-[110px] md:w-[150px] md:h-[150px] rounded-full bg-gradient-to-b from-[#F8F9FF] to-[#EDF1FF] flex items-center justify-center border-[6px] border-white shadow-[0_15px_35px_rgba(174,196,255,0.25)] relative">
              <Users size={56} className="text-[#AEC4FF]" strokeWidth={3} />
            </div>
          </div>

          {/* Right House */}
          <div className="flex flex-col items-center relative z-10 pb-2">
            <img src={home2} alt="House" className="w-[160px] md:w-[220px] h-auto relative z-10" style={{ filter: 'drop-shadow(0px 15px 20px rgba(91, 184, 123, 0.2))' }} />
          </div>
        </div>

        {/* Text Content */}
        <h1 className="text-3xl sm:text-4xl md:text-[42px] Livvic-Bold text-[#0D134C] mb-5 tracking-tight z-10 relative">
          Share Management
        </h1>
        <p className="text-[#555555] text-base sm:text-[19px] max-w-[550px] mb-12 Livvic-Medium leading-relaxed z-10 relative">
          We're building Share Management to help families and caregivers stay organized once a nanny share is up and running.
        </p>

        {/* Stylized Separator Line */}
        <div className="flex items-center w-full max-w-[500px] mb-10 z-10 relative opacity-60">
          <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent to-[#D1D5DB]"></div>
          <div className="mx-5 text-[#AEC4FF]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0L13.5 8.5L22 10L13.5 11.5L12 20L10.5 11.5L2 10L10.5 8.5L12 0Z" />
            </svg>
          </div>
          <div className="flex-1 h-[2px] bg-gradient-to-l from-transparent to-[#D1D5DB]"></div>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-[40px] Livvic-Bold text-[#AEC4FF] mb-4 z-10 relative">
          Coming Soon
        </h2>
        <p className="text-[#666666] text-base sm:text-[18px] Livvic-Medium z-10 relative">
          We're working hard to bring this feature to you.
        </p>

      </div>
    </div>
  );
};

export default ShareManagement;