// import React, { useState, useEffect } from 'react';
// import { NavLink } from 'react-router-dom';
// import { api } from '../../Config/api';
// import { FamilyProfile, NannyProfile } from '../../Components/subComponents/profileCard';
// import { Spin } from 'antd';
// 
// const MatchesScreen = ({ onComplete, answers }) => {
//   const [matches, setMatches] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [totalFound, setTotalFound] = useState(0);
// 
//   useEffect(() => {
//     const fetchMatches = async () => {
//       try {
//         setLoading(true);
//         // Query the new public endpoint designed for the onboarding teaser
//         const role = answers.role || 'Family';
//         const zipCode = answers.location?.zip || '';
// 
//         const response = await api.get('/userData/publicTeasers', {
//           params: { limit: 5, role, zipCode }
//         });
//         
//         let foundMatches = response.data?.message || [];
//         let total = response.data?.pagination?.totalRecords || foundMatches.length + 5;
// 
//         setMatches(foundMatches);
//         setTotalFound(total);
//       } catch (err) {
//         console.error("Failed to load matches", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchMatches();
//   }, [answers]);
// 
//   if (loading) {
//      return (
//        <div className="w-full h-40 flex items-center justify-center">
//          <Spin size="large" />
//        </div>
//      );
//   }
// 
//   return (
//     <div className="w-full flex flex-col items-center animate-[fadeIn_0.5s_ease-out]">
//       <h2 className="text-[17px] font-bold text-[#001243] mb-6 text-center w-full px-4">
//         I found {totalFound || 8} compatible profiles near you. Create a free account to connect with them.
//       </h2>
//       
//       <div className="w-full flex flex-col gap-4 relative">
//         {matches.slice(0, 3).map((match, index) => {
//           const isBlurred = index === matches.slice(0, 3).length - 1; // Blur the very last card shown
//           
//           return (
//             <div key={match._id} className={`w-full relative overflow-hidden rounded-2xl ${isBlurred ? 'border border-gray-100 shadow-sm' : ''}`}>
//               <div className={`w-full ${isBlurred ? 'filter blur-[4px] pointer-events-none' : ''}`}>
//                  {match.userType === "Parents" ? (
//                    <FamilyProfile 
//                      key={match._id}
//                      name={match.name}
//                      userId={match._id}
//                      id={match._id}
//                      childrenCount={match.childrenAges?.length || 0}
//                      hasNanny={match.alreadyHaveNanny}
//                      img={match.imageUrl}
//                      careType={match.nannyShareType}
//                      schedule={match.nannyshareStart}
//                      location={match.location}
//                      start={match.nannyshareStart}
//                      shareLocation={match.shareLocation}
//                      status={"idle"}
//                      isTeaser={true}
//                    />
//                 ) : (
//                    <NannyProfile
//                      key={match._id}
//                      name={match.name}
//                      userId={match._id}
//                      id={match._id}
//                      img={match.imageUrl}
//                      careType={match.nannyShareType}
//                      schedule={match.nannyshareStart}
//                      location={match.location}
//                      start={match.nannyshareStart}
//                      experience={match.experience}
//                      status={"idle"}
//                      hasFamily={match.alreadyHaveFamily}
//                      childrenCount={match.childrenAges?.length || 0}
//                      ages={match.ageGroupsExp}
//                      isTeaser={true}
//                    />
//                 )}
//               </div>
//               
//               {isBlurred && (
//                 <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px]">
//                   <p className="text-[#001243] font-bold text-sm mb-3 text-center">Create a free account<br/>to see all matches</p>
//                   <button 
//                     onClick={onComplete}
//                     className="bg-[#001243] hover:bg-[#152a6a] text-white font-bold py-2.5 px-6 rounded-full transition-colors flex items-center gap-2 text-sm"
//                   >
//                     Create Free Account <span>→</span>
//                   </button>
//                 </div>
//               )}
//             </div>
//           );
//         })}
//         
//         {/* If NO matches were found (unlikely due to fallback), show the CTA at the bottom */}
//         {matches.length === 0 && (
//             <div className="flex justify-center mt-4">
//                 <button 
//                   onClick={onComplete}
//                   className="bg-[#001243] hover:bg-[#152a6a] text-white font-bold py-2.5 px-6 rounded-full transition-colors flex items-center gap-2 text-sm"
//                 >
//                   Create Free Account <span>→</span>
//                 </button>
//             </div>
//         )}
//       </div>
//     </div>
//   );
// };
// 
// export default MatchesScreen;
// 
