import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import Header from "../Header";
import { Spin, Input } from "antd";
import { fireToastMessage } from "../../toastContainer";
import { api } from "../../Config/api";
import Button from "../Button";
import { useNavigate } from "react-router-dom";
import { X, Star } from "lucide-react";

function Hero() {
  const [loading, setLoading] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  const [isGlowing, setIsGlowing] = useState(false);
  const buttonRef = useRef(null);


  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsGlowing(true);
          setTimeout(() => setIsGlowing(false), 1000);
        }
      },
      { threshold: 0.5 },
    );

    if (buttonRef.current) observer.observe(buttonRef.current);
    return () => observer.disconnect();
  }, []); // Remove hasGlowed from deps

  useEffect(() => {
    if (showResults) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    // Clean up on unmount
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showResults]);

  const handleZipValidation = async (zip) => {
    if (!zip) return;

    setLoading(true);
    try {
      // Use AllOrigins proxy to bypass CORS
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
        `https://api.zippopotam.us/us/${zip}`
      )}`;

      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Invalid ZIP");

      const wrappedData = await res.json();
      const data = JSON.parse(wrappedData.contents); // Extract actual JSON from proxy response

      const finalZip = data["post code"];
      if (finalZip) {
        setZipCode(finalZip);
        // form.setFieldsValue({
        //   zipCode: finalZip,
        // });
      } else {
        throw new Error("Invalid structure");
      }
    } catch (err) {
      setZipCode("");
      // form.setFieldsValue({ zipCode: "" });
      fireToastMessage({
        type: "error",
        message: "Invalid ZIP code. Please enter a valid U.S. ZIP.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDataRetrieve = async () => {
    if (!zipCode) {
      fireToastMessage({
        type: "error",
        message: "Enter a valid US zip code first",
      });
      return;
    }
    setIsLoading(true);

    try {
      const { data } = await api.get(
        `postJob/job-seeker-opportunities/${zipCode}`
      );
      const response = data?.data || [];
      // const shuffled = [...response].sort(() => 0.5 - Math.random());
      // return shuffled.slice(0, 3);
      setData(response);
      setShowResults(true);
    } catch (err) {
      console.error("Error fetching service providers:", err);
      fireToastMessage({
        type: "error",
        message: "Could not load service providers. Try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseResults = () => {
    setShowResults(false);
    setData([]);
  };

  return (
    <div className="Livvic container min-h-screen px-4 sm:px-6 lg:px-8">

      {/* Inject keyframes globally */}
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
      <div className="mt-20 sm:mt-32">
        {/* <em className="text-sm Livvic-Medium tracking-widest uppercase text-[#ffffffc9]">
          No commitment · Free to join
        </em> */}

        <h1 className="Livvic-Bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white leading-tight sm:leading-[50px] md:leading-[60px] lg:leading-[80px] mt-3">
          Earn More as a <br /> Nanny with Nanny Share
        </h1>

        <p className="Livvic text-[#ffffffc9] text-base sm:text-lg md:text-xl mt-4 max-w-2xl leading-relaxed">
          Earn more as a nanny by working with two families instead of one. Whether you
          already work with a family or are looking for a nanny share job, Famlink helps you
          find the right match.
        </p>

        <div
          ref={buttonRef}
          className={isGlowing ? "glow-once rounded-full mt-7 w-full sm:w-fit" : "mt-7 w-full sm:w-fit"}
        >
          <Button
            btnText={isLoading ? <Spin size="small" /> : "Find a nanny share"}
            className="bg-[#AEC4FF] w-full sm:w-auto px-6 py-3 sm:py-4 flex items-center justify-center"
            action={() => navigate("/caregiver/nannyshare")}
            disabled={isLoading}
          />
        </div>

        {/* <div className="flex flex-col gap-3 mt-7 max-w-md">
          <Button
            btnText="Get Started"
            className="bg-[#AEC4FF] w-fit"
            action={() => navigate("/caregiver/nannyshare")}
            isLoading={isLoading}
            loadingBtnText="Searching..."
          /> */}
          {/* <Button
            btnText="I'm looking for a nanny share position →"
            className="bg-[#AEC4FF] w-full px-6 py-3 sm:py-4"
            action={() => handleDataRetrieve()}
            isLoading={isLoading}
            loadingBtnText="Searching..."
          /> */}
        {/* </div> */}
        <p className="Livvic-Bold text-white text-base sm:text-lg md:text-xl mt-4 max-w-2xl">
          Nanny share caregivers typically earn 20–30% more than single-family jobs.
        </p>
      </div>

      {/* Results Section with Background Overlay */}

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