import React, { useState, useEffect } from "react";
import Header from "../Header";
import ChatContainer from "../ChatOnboarding/ChatContainer";
import { useNavigate } from "react-router-dom";
import { useSelector } from 'react-redux';

function Hero() {
  const navigate = useNavigate();
  const { user, accessToken } = useSelector(state => state.auth);
  const isLoggedIn = !!(user && accessToken);

  useEffect(() => {
    document.body.style.overflow = "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className={`relative bg-white w-full pt-[80px] lg:pt-[100px] flex items-center ${isLoggedIn ? 'pb-8' : 'pb-[60px] min-h-[580px]'}`}>
      <style>{`
        @keyframes buttonGlow {
          0%   { box-shadow: 0 0 0px rgba(255, 173, 225, 0); }
          40%  { box-shadow: 0 0 18px 6px rgba(140, 172, 246, 0.9); }
          100% { box-shadow: 0 0 0px rgba(255, 173, 225, 0); }
        }
        .glow-once {
          animation: buttonGlow 1s ease-out forwards;
        }
      `}</style>
      <Header />

      {/* Radial Gradient Background behind dashboard */}
      <div
        className="absolute right-[-80px] top-[-100px] w-[680px] h-[680px] rounded-full pointer-events-none z-0 hidden lg:block"
        style={{ background: 'radial-gradient(ellipse at center, #E7FCFF 0%, rgba(238,243,255,0.5) 55%, transparent 75%)' }}
      />

      <div className="w-full relative z-10 px-4 sm:px-6 lg:px-8 mt-10">
        <ChatContainer isFullScreen={false} variant="caregiver" />
      </div>
    </div>
  );
}

export default Hero;























//  {showResults && (
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
//           <div className="rounded-3xl w-full max-w-7xl max-h-[90vh] overflow-hidden bg-white">
//             {/* Results Header */}
//             <div className="flex justify-between items-center p-6 sm:p-8 ">
//               <div>
//                 <h3 className=" text-xl sm:text-2xl md:text-3xl Livvic-Bold Livvic-Bold">
//                   Job Opportunities in {zipCode}
//                 </h3>
//                 <p className=" text-sm sm:text-base mt-1">
//                   {`${data.length} job${data.length !== 1 ? "s" : ""} found`}
//                 </p>
//               </div>
//               <button
//                 onClick={handleCloseResults}
//                 className="flex items-center gap-2  px-3 sm:px-4 py-2 rounded-full transition-all duration-200"
//               >
//                 <X className="w-4 h-4" />
//                 <span className="hidden sm:inline text-sm">Close</span>
//               </button>
//             </div>

//             {/* Results Content */}
//             <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6 sm:p-8">
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
//                 {data.length > 0 ? (
//                   data.map((job, index) => (
//                     <div
//                       key={index}
//                       className="rounded-2xl p-5 sm:p-6 flex flex-col justify-between h-full transition-all duration-300"
//                     >
//                       <div className="mb-4 bg-white">
//                         {/* Job Title */}
//                         <div className="mb-3">
//                           <h4 className="text-lg sm:text-xl Livvic-Bold text-gray-800 Livvic-Bold mb-2">
//                             {job.title}
//                           </h4>

//                           {/* Rate and Type */}
//                           <div className="flex flex-wrap gap-2 mb-3">
//                             <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs Livvic-Medium">
//                               {job.rate}
//                             </span>
//                             {job.type && (
//                               <span className="bg-[#AEC4FF]/20 text-gray-700 px-2 py-1 rounded-full text-xs Livvic-Medium">
//                                 {job.type}
//                               </span>
//                             )}
//                           </div>

//                           {/* Job Description (if available) */}
//                           {job.description && (
//                             <p className="text-gray-600 text-sm leading-relaxed mb-3">
//                               {job.description.slice(0, 100)}...
//                             </p>
//                           )}

//                           {/* Additional Details */}
//                           <div className=" px-3 py-2 rounded-lg">
//                             <p className="text-sm Livvic-Medium text-[#0f3460]">
//                               Job Opportunity Available
//                             </p>
//                           </div>
//                         </div>
//                       </div>

//                       {/* CTA Button */}
//                       <NavLink
//                         to="/joinNow"
//                         onClick={() => {
//                           handleCloseResults();
//                           window.scrollTo({ top: 0, behavior: "smooth" });
//                         }}
//                         className="mt-auto"
//                       >
//                         <button className="w-full Livvic-Bold text-sm sm:text-base px-4 py-3 rounded-full transition-all duration-300 bg-primary text-primary">
//                           {job.action || "Apply Now"}
//                         </button>
//                       </NavLink>
//                     </div>
//                   ))
//                 ) : (
//                   <div className="col-span-full text-center py-12">
//                     <div className="bg-gradient-to-br from-[#AEC4FF]/10 to-[#85D1F1]/10 backdrop-blur-sm rounded-2xl p-8 border border-[#AEC4FF]/30">
//                       <p className="text-white text-lg mb-2">
//                         No job opportunities found in this area
//                       </p>
//                       <p className="text-[#FFFFFF99] text-sm">
//                         Try searching with a different ZIP code
//                       </p>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}