import React from 'react'
import { useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import IncomingRequests from './IncomingRequests';
import OutgoingRequests from './OutgoingRequests';
import DeclinedRequests from './DeclinedRequests';

const MatchRequests = () => {
  const [val, setVal] = useState("incoming");
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);

  const isProfileComplete = user?.type === "Nanny" ? user?.nannyProfileCompleted : user?.shareSetupCompleted;

  useEffect(() => {
    // Check if there's an initialTab value in the location state
    if (location.state?.initialTab) {
      setVal(location.state.initialTab);
    }
  }, [location.state]);

  const handleClick = (e) => {
    const value = e.currentTarget.getAttribute("data-value");
    setVal(value);
  };

  if (!isProfileComplete) {
    const redirectPath = user?.type === "Nanny" ? "/dashboard/complete-profile" : "/dashboard/post-a-nannyShare";
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <div className="padding-navbar1 Quicksand lg:w-[80%] mx-2 sm:mx-4 ">
         <div className="rounded-xl my-5">
           <p className="lg:text-3xl text-2xl Livvic-Bold mb-6">
             Requests
           </p>
           <div>
             <div className="pb-10">
               {/* Tab Navigation - Always Horizontal */}
               <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2">
                 <div
                   data-value="incoming"
                   style={val === "incoming" ? { backgroundColor: "#AEC4FF" } : {}}
                   onClick={handleClick}
                   className="cursor-pointer flex justify-center items-center rounded-full bg-[#EFF1F9] px-2 sm:px-3 md:px-4 py-2 flex-shrink-0"
                 >
                   <p className="Livvic-Medium text-xs sm:text-sm md:text-md text-primary text-center whitespace-nowrap">
                     Incoming
                   </p>
                 </div>
                 <div
                   data-value="outgoing"
                   style={
                     val === "outgoing" ? { backgroundColor: "#AEC4FF" } : {}
                   }
                   onClick={handleClick}
                   className="cursor-pointer flex justify-center items-center rounded-full bg-[#EFF1F9] px-2 sm:px-3 md:px-4 py-2 flex-shrink-0"
                 >
                   <p className="Livvic-Medium text-xs sm:text-sm md:text-md text-primary text-center whitespace-nowrap">
                     Outgoing
                   </p>
                 </div>
                 <div
                   data-value="declined"
                   style={
                     val === "declined" ? { backgroundColor: "#AEC4FF" } : {}
                   }
                   onClick={handleClick}
                   className="cursor-pointer flex justify-center items-center rounded-full bg-[#EFF1F9] px-2 sm:px-3 md:px-4 py-2 flex-shrink-0"
                 >
                   <p className="Livvic-Medium text-xs sm:text-sm md:text-md text-primary text-center whitespace-nowrap">
                     Declined
                   </p>
                 </div>
               </div>
   
               {/* Content Area */}
               <div className="mt-6 min-h-[calc(100vh-150px)]">
                 {val === "incoming" && (
                   <div className="mt-5">
                     <IncomingRequests type={"family"} />
                   </div>
                 )}
                 {val === "outgoing" && (
                   <div className="mt-5">
                     <OutgoingRequests type={"family"} />
                   </div>
                 )}
                 {val === "declined" && (
                   <div className="mt-5">
                     <DeclinedRequests type={"family"} />
                   </div>
                 )}
               </div>
             </div>
           </div>
         </div>
       </div>
  )
}

export default MatchRequests