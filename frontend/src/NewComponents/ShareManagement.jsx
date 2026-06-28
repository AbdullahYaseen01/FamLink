import React from 'react';
import { Users, Heart, PiggyBank, Calendar, ShieldCheck, Search, Link as LinkIcon, Handshake } from 'lucide-react';
import familyNanny1 from '../assets/images/familyNanny1.jpeg';
import familyNanny2 from '../assets/images/familyNanny2.jpeg';
import shareNanny3 from '../assets/images/shareNanny3.png';
const ShareManagement = () => {
  return (
    <div className="w-full overflow-x-hidden">

      {/* SVG Clip Path Definition for the house-curved photo */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id="houseCurve" clipPathUnits="objectBoundingBox">
            <path d="M 0 0 L 1 0 A 0.5 0.5 0 0 1 0 0 Z" />
          </clipPath>
          <clipPath id="topCurve" clipPathUnits="objectBoundingBox">
            <path d="M 0 1 L 1 1 L 1 0 A 0.5 0.1 0 0 1 0 0 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* --- HERO SECTION --- */}
      <div className="relative w-full lg:min-h-[700px] min-h-[850px] pt-10 lg:pt-16">
        {/* The Clipped Background */}
        {/* <div
          className="absolute top-0 left-0 w-full h-[600px] lg:h-[750px] bg-cover bg-bottom z-0"
          style={{ backgroundImage: `url(${shareNanny2})`, clipPath: 'url(#houseCurve)' }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div> */}

        {/* Content Container */}
        <div className="max-w-[1300px] mx-auto px-4 relative z-10">
          {/* TOP LEFT TEXT */}
          <div className="relative lg:absolute lg:top-[0px] lg:left-[70px] z-30 mb-2 lg:mb-0 text-center lg:text-left">
            <h1 className="Livvic-Bold text-[#001243] text-[2.5rem] lg:text-[3.5rem] leading-tight tracking-tight">Share Management</h1>
            <p className="Livvic-semibold text-[#001243] text-lg lg:text-[1.25rem] mt-4 leading-[1.6] px-4 md:ml-10">
              One nanny. Two or more families. Countless benefits.
            </p>
          </div>

          {/* HERO CLUSTER DIAGRAM */}
          <div className="relative w-full h-[850px] lg:h-[700px] -mt-[170px] lg:mt-0 flex flex-col lg:block items-center">
            <div className="relative lg:absolute lg:top-0 lg:left-1/2 lg:-translate-x-1/2 w-full lg:w-[800px] h-[850px] lg:h-[700px]">
              {/* Left Family Node */}
              <div className="absolute top-[280px] lg:top-[160px] left-[-10px] lg:left-[-50px] z-20 flex flex-col items-center transform scale-75 lg:scale-100 origin-top-left lg:origin-center">
                <div className="relative w-[280px] h-[280px] flex items-center justify-center">
                  {/* Left House Background */}
                  <svg className="absolute w-[260px] h-[280px] text-[#AEC4FF]" viewBox="-15 0 130 115" fill="currentColor">
                    <path d="M50 0 L110 40 L100 40 L100 65 A50 50 0 1 1 0 65 L0 40 L-10 40 Z" />
                  </svg>
                  {/* Circle Photo */}
                  <div className="w-[165px] h-[165px] rounded-full overflow-hidden border-8 border-white z-10 shadow-lg relative mt-4">
                    <img src={familyNanny1} alt="Family 1" className="w-full h-full object-cover bg-white" onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=400&auto=format&fit=crop" }} />
                  </div>
                </div>
                {/* Small Heart Badge */}
                <div className="absolute bottom-[12px] w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg z-20">
                  <Heart className="w-7 h-7 text-[#001243] fill-[#001243]" />
                </div>
              </div>

              {/* Right Family Node */}
              <div className="absolute top-[180px] lg:top-[30px] right-[-10px] lg:right-[-60px] z-20 flex flex-col items-center transform scale-75 lg:scale-100 origin-top-right lg:origin-center">
                <div className="relative w-[280px] h-[280px] flex items-center justify-center">
                  {/* Right House Background */}
                  <svg className="absolute w-[260px] h-[280px] text-[#AEC4FF]" viewBox="-15 0 130 115" fill="currentColor">
                    <path d="M50 0 L110 40 L100 40 L100 65 A50 50 0 1 1 0 65 L0 40 L-10 40 Z" />
                  </svg>
                  {/* Circle Photo */}
                  <div className="w-[165px] h-[165px] rounded-full overflow-hidden border-8 border-white z-10 shadow-lg relative mt-4">
                    <img src={familyNanny2} alt="Family 2" className="w-full h-full object-cover bg-white" onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=400&auto=format&fit=crop" }} />
                  </div>
                </div>
                {/* Small Heart Badge */}
                <div className="absolute bottom-[12px] w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg z-20">
                  <Heart className="w-7 h-7 text-[#001243] fill-[#001243]" />
                </div>
              </div>

              {/* Central SHARE MANAGEMENT Badge */}
              <div className="absolute top-[480px] lg:top-[300px] left-1/2 -translate-x-1/2 w-[260px] h-[260px] lg:w-[320px] lg:h-[320px] bg-[#AEC4FF] rounded-full flex flex-col items-center justify-center text-[#001243] shadow-2xl z-30 border-4 border-white">
                {/* Nanny Icon Custom */}
                <div className="flex flex-col items-center">
                  <Users className="w-[84px] h-[84px]" strokeWidth={2.5} />
                </div>

                <h3 className="text-center font-bold text-2xl lg:text-[1.75rem] leading-tight tracking-wider Livvic-Bold mt-3">SHARED<br />NANNY</h3>
                <Heart className="w-3 h-3 lg:w-10 lg:h-10 my-2 lg:my-3 fill-[#001243]" />
                <p className="text-center text-[10px] lg:text-xs Livvic-SemiBold px-4 tracking-widest uppercase opacity-90">Smart care, shared<br />with love.</p>
              </div>

              {/* Connecting Dotted Arrows (Desktop Only) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 hidden lg:block" style={{ overflow: 'visible' }}>
                {/* Left line (Green) */}
                {/* Left heart is at X: 90, Y: 420 */}
                {/* Badge is center 400. Left edge is X: 240, Y: 460 */}
                <path d="M 90 420 C 90 480, 160 520, 230 460" fill="none" stroke="#AEC4FF" strokeWidth="2.5" strokeDasharray="4 8" strokeLinecap="round" />
                <polygon points="230,455 240,460 230,465" fill="#AEC4FF" transform="rotate(-30 235 460)" />

                {/* Right line */}
                {/* Right heart is at X: 710, Y: 290 */}
                {/* Badge right edge is at X: 560, Y: 460 */}
                <path d="M 710 290 L 710 460 L 580 460" fill="none" stroke="#AEC4FF" strokeWidth="2.5" strokeDasharray="4 8" strokeLinecap="round" />
                <polygon points="580,455 570,460 580,465" fill="#AEC4FF" />
              </svg>

              {/* Connecting Dotted Arrows (Mobile Only) */}
              <svg className="absolute top-[450px] left-[95px] pointer-events-none z-10 block lg:hidden" style={{ overflow: 'visible' }} width="1" height="1">
                <path d="M 0 0 L 0 150" fill="none" stroke="#AEC4FF" strokeWidth="2.5" strokeDasharray="4 8" strokeLinecap="round" />
              </svg>

              <svg className="absolute top-[350px] right-[95px] pointer-events-none z-10 block lg:hidden" style={{ overflow: 'visible' }} width="1" height="1">
                <path d="M 0 0 L 0 250" fill="none" stroke="#AEC4FF" strokeWidth="2.5" strokeDasharray="4 8" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* --- 4 COLUMNS SECTION --- */}
      <div
        className="w-full mx-auto relative z-20 -mt-[60px] lg:-mt-[100px] px-4 pt-[140px] lg:pt-24 pb-[140px] lg:pb-64 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${shareNanny3})`, clipPath: 'url(#topCurve)' }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        {/* Dotted horizontal line connecting the icons */}
        <div className="hidden lg:block absolute top-[136px] left-[12%] right-[12%] h-[2px] border-t-[3px] border-dotted border-white/80 z-0"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 relative z-10">
          {/* Column 1 */}
          <div className="flex flex-col items-center text-center px-4">
            <div className="w-[80px] h-[80px] rounded-full bg-[#FDF8F5] flex items-center justify-center mb-6 border-[4px] border-white shadow-md">
              <Handshake className="w-10 h-10 text-[#001243]" strokeWidth={1.5} />
            </div>
            <h4 className="font-bold text-[#AEC4FF] text-[1.2rem] mb-2 Livvic-Bold">Stronger together</h4>
            <p className="text-white text-sm md:text-base leading-relaxed Livvic-Medium">Share responsibility and build lasting connections with other families.</p>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col items-center text-center px-4">
            <div className="w-[80px] h-[80px] rounded-full bg-[#FDF8F5] flex items-center justify-center mb-6 border-[4px] border-white shadow-md">
              <PiggyBank className="w-10 h-10 text-[#001243]" strokeWidth={1.5} />
            </div>
            <h4 className="font-bold text-[#AEC4FF] text-[1.2rem] mb-2 Livvic-Bold">Smarter savings</h4>
            <p className="text-white text-sm md:text-base leading-relaxed Livvic-Medium">Split the cost, maximize value, and enjoy premium care for less.</p>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col items-center text-center px-4">
            <div className="w-[80px] h-[80px] rounded-full bg-[#FDF8F5] flex items-center justify-center mb-6 border-[4px] border-white shadow-md">
              <Calendar className="w-10 h-10 text-[#001243]" strokeWidth={1.5} />
            </div>
            <h4 className="font-bold text-[#AEC4FF] text-[1.2rem] mb-2 Livvic-Bold">Easy scheduling</h4>
            <p className="text-white text-sm md:text-base leading-relaxed Livvic-Medium">Coordinate schedules seamlessly for balanced and stress-free routines.</p>
          </div>

          {/* Column 4 */}
          <div className="flex flex-col items-center text-center px-4">
            <div className="w-[80px] h-[80px] rounded-full bg-[#FDF8F5] flex items-center justify-center mb-6 border-[4px] border-white shadow-md">
              <ShieldCheck className="w-10 h-10 text-[#001243]" strokeWidth={1.5} />
            </div>
            <h4 className="font-bold text-[#AEC4FF] text-[1.2rem] mb-2 Livvic-Bold">Trusted care</h4>
            <p className="text-white text-sm md:text-base leading-relaxed Livvic-Medium">One dedicated nanny, consistent care, and complete peace of mind.</p>
          </div>
        </div>
      </div>

      {/* --- BOTTOM SECTION (Coming Soon) --- */}
      <div className="w-full relative">

        {/* Coming Soon White Overlay Box */}
        <div className="relative -mt-[100px] lg:-mt-[150px] mx-auto w-full max-w-[1200px] bg-white rounded-t-[40px] lg:rounded-t-[80px] pt-12 lg:pt-20 pb-20 px-6 lg:px-10 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] z-30 flex flex-col items-center text-center">

          {/* Leaf decorations left/right of Coming Soon */}
          <div className="flex items-center justify-center gap-4 lg:gap-8 mb-8">
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#AEC4FF" strokeWidth="1" className="transform -scale-x-100 opacity-60 hidden sm:block">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
              <path d="M12 2v20 M2 12h20 M5 5l14 14 M19 5L5 19" />
            </svg>
            <h2 className="text-[3.5rem] lg:text-[4.5rem] Livvic-Bold font-bold text-[#001243] tracking-widest uppercase">COMING SOON</h2>
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#AEC4FF" strokeWidth="1" className="opacity-60 hidden sm:block">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
              <path d="M12 2v20 M2 12h20 M5 5l14 14 M19 5L5 19" />
            </svg>
          </div>

          <p className="text-[#777777] text-[1.1rem] lg:text-[1.3rem] mb-14 max-w-3xl Livvic-Medium">
            A simple and smart platform that helps families connect, share, and <span className="text-[#AEC4FF]">manage</span> childcare together.
          </p>

          <div className="flex flex-wrap justify-center gap-6 lg:gap-12">
            <div className="flex items-center gap-4">
              <div className="w-[50px] h-[50px] rounded-full bg-[#EEF2E8] flex items-center justify-center">
                <Users className="w-6 h-6 text-[#AEC4FF]" strokeWidth={2} />
              </div>
              <span className="text-[0.8rem] lg:text-[0.95rem] Livvic-Bold font-bold text-[#001243] uppercase tracking-wider text-left">Find compatible<br />families</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-[50px] h-[50px] rounded-full bg-[#EEF2E8] flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-[#AEC4FF]" strokeWidth={2} />
              </div>
              <span className="text-[0.8rem] lg:text-[0.95rem] Livvic-Bold font-bold text-[#001243] uppercase tracking-wider text-left">Match &<br />connect</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-[50px] h-[50px] rounded-full bg-[#EEF2E8] flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#AEC4FF]" strokeWidth={2} />
              </div>
              <span className="text-[0.8rem] lg:text-[0.95rem] Livvic-Bold font-bold text-[#001243] uppercase tracking-wider text-left">Manage &<br />coordinate</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-[50px] h-[50px] rounded-full bg-[#EEF2E8] flex items-center justify-center">
                <Heart className="w-6 h-6 text-[#AEC4FF]" strokeWidth={2} />
              </div>
              <span className="text-[0.8rem] lg:text-[0.95rem] Livvic-Bold font-bold text-[#001243] uppercase tracking-wider text-left">Share care,<br />share joy</span>
            </div>
          </div>

          {/* Right Sticker (Better Care...) */}
          <div className="hidden lg:flex absolute right-[-40px] top-[-80px] w-[300px] h-[300px] bg-[#AEC4FF] rounded-t-full rounded-br-full rounded-bl-[150px] flex-col items-center justify-center p-6 text-center shadow-2xl border-[12px] border-white text-[#001243] z-40 transform rotate-6">
            <Heart className="w-8 h-8 text-[#001243] fill-[#001243] mb-4" />
            <span className="Livvic-Bold font-bold text-base tracking-widest leading-[2]">BETTER CARE.<br />BETTER VALUE.<br />BETTER FUTURE.</span>
          </div>

          {/* Leaf Decoration on Bottom Left */}
          <div className="absolute left-[20px] lg:left-[-80px] bottom-10 opacity-30 pointer-events-none hidden md:block">
            <svg width="250" height="250" viewBox="0 0 100 100" fill="none" stroke="#AEC4FF" strokeWidth="1">
              <path d="M10,90 Q30,50 90,10" />
              <path d="M30,70 Q40,40 80,20" />
              <path d="M50,90 Q60,60 90,40" />
              <path d="M20,80 Q50,40 70,30" />
            </svg>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ShareManagement;