import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ChevronLeft, MapPin, Users, Clock, Calendar, Heart, Briefcase, Baby, List } from "lucide-react";
import CustomButton from "../../NewComponents/Button";
import { fetchNannyByIdThunk } from "../../Components/Redux/nannyData";
import Avatar from "react-avatar";

export default function NannyProfileView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedNanny, isLoading } = useSelector((s) => s.nannyData);

  useEffect(() => {
    if (id) {
      dispatch(fetchNannyByIdThunk(id));
    }
  }, [dispatch, id]);

  if (isLoading || !selectedNanny) {
    return <div className="min-h-screen flex items-center justify-center">Loading Profile...</div>;
  }

  // Map backend data to layout
  const profile = selectedNanny?.nannyProfile || {};

  const formatLocation = () => {
    const parts = selectedNanny?.location?.format_location?.split(",") || [];
    const city = parts.at(-3)?.trim();
    const state = parts.at(-2)?.trim().split(" ")[0];
    return city && state ? `${city}, ${state}` : selectedNanny?.location?.format_location || "Location not specified";
  };

  const additionalInfoBio = selectedNanny?.additionalInfo?.find(info => info.key === "jobDescription")?.value;

  const rateLabel = profile.rateType === "hourly" ? "hr" : profile.rateType || "hr";

  const formattedSharedRate = profile.sharedRate 
    ? `$${profile.sharedRate}/${rateLabel}` 
    : "Rate not specified";

  const formattedSoloRate = profile.soloRate 
    ? `~$${profile.soloRate}/${rateLabel} per family` 
    : "";

  const getInfo = (key, profileKey) => {
    return profile[profileKey] || selectedNanny?.additionalInfo?.find(info => info.key === key)?.value?.option;
  };

  const nanny = {
    name: selectedNanny.name,
    goal: selectedNanny.goal || "Looking for a family",
    experience: profile.careExperience || getInfo('experience', 'careExperience') || "Experience not specified",
    ages: profile.preferredAges?.join(", ") || profile.agesCare?.join(", ") || getInfo('preferredAges', 'preferredAges')?.join(", ") || "Ages not specified",
    schedule: profile.careType || profile.currentSchedule || "Schedule not specified",
    location: formatLocation(),
    sharedRate: formattedSharedRate,
    soloRate: formattedSoloRate,
    availability: profile.startAvailability || getInfo('availability', 'startAvailability') || "Availability not specified",
    bio: profile.bio || additionalInfoBio || selectedNanny.aboutMe || "No bio provided.",
    img: selectedNanny.imageUrl || profile.imageFile,
    certifications: profile.certifications || [],
    compatibility: [
      getInfo('shareExperience', 'shareExperience') === "Yes" || getInfo('shareExperience', 'shareExperience') === "yes" ? "Has Share Experience" : null,
      getInfo('multiFamilyComfort', 'multiFamilyComfort') === "Yes" || getInfo('multiFamilyComfort', 'multiFamilyComfort') === "yes" ? "Comfortable with Multiple Families" : null,
      profile.hasTransport === "yes" || profile.hasTransport === "Yes" ? "Has Transportation" : null,
      profile.backgroundCheck === "yes" || profile.backgroundCheck === "Yes" ? "Background Checked" : null,
      getInfo('workSetup', 'workSetup') ? `Work Setup: ${getInfo('workSetup', 'workSetup')}` : null,
      profile.childrenCapacity ? `Capacity: ${profile.childrenCapacity} children` : null
    ].filter(Boolean)
  };

  const expectedKeys = [
    "careType",
    "startAvailability",
    "careExperience",
    "languages",
    "specificDaysAndTime",
    "shareExperience",
    "multiFamilyComfort",
    "childrenCapacity",
    "preferredAges",
    "workSetup",
    "responsibilities",
    "householdHelp",
    "hasTransport",
    "backgroundCheck",
    "rateType",
    "sharedRate",
    "soloRate",
    "firstAidCert",
    "cprCert",
    "carpool",
    "ageGroupsExp",
    "additionalDetails",
    "salaryExp"
  ];

  // Map to friendly names if needed or fallback mapping
  const keyMapping = {
    careType: "avaiForWorking",
    startAvailability: "availability",
    careExperience: "experience",
  };

  const getFallbackValue = (key) => {
    // 1. Check profile schema directly
    if (profile && profile[key] !== undefined && profile[key] !== null && profile[key] !== "") {
      return profile[key];
    }
    // 2. Check additionalInfo with the exact key
    let fallback = selectedNanny?.additionalInfo?.find(info => info.key === key);
    if (fallback) return fallback.value;

    // 3. Check additionalInfo with legacy mapped keys (e.g., careType -> avaiForWorking)
    if (keyMapping[key]) {
      fallback = selectedNanny?.additionalInfo?.find(info => info.key === keyMapping[key]);
      if (fallback) return fallback.value;
    }
    return null;
  };

  const formatKey = (key) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();

  const formatValue = (key, val) => {
    if (!val || val === "N A" || val === "null" || (typeof val === 'string' && val.trim() === '')) {
      return null;
    }
    
    let parsedVal = val;
    let iterations = 0;
    while (typeof parsedVal === 'string' && (parsedVal.startsWith('{') || parsedVal.startsWith('[')) && iterations < 3) {
      try { 
        let temp = JSON.parse(parsedVal); 
        if (typeof temp === 'string' && temp === parsedVal) break;
        parsedVal = temp;
      } catch(e) {
        break;
      }
      iterations++;
    }

    // Aggressive fallback for strings that look like arrays but failed parsing (e.g., single quotes)
    if (typeof parsedVal === 'string' && parsedVal.startsWith('[') && parsedVal.endsWith(']')) {
       parsedVal = parsedVal.replace(/[\[\]']/g, '').split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    }

    if (key === "specificDays" || key === "specificDaysAndTime") {
      try {
        let scheduleObj = parsedVal;
        if (scheduleObj && typeof scheduleObj === 'object' && !Array.isArray(scheduleObj)) {
           const days = Object.keys(scheduleObj).filter(day => scheduleObj[day].checked);
           if (days.length === 0) return null;
           return (
             <div className="flex flex-wrap gap-2 mt-1">
               {days.map(day => {
                 const { start, end } = scheduleObj[day];
                 let timeStr = "";
                 if (start && end) {
                    const s = new Date(start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    const e = new Date(end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    timeStr = ` (${s} - ${e})`;
                 }
                 return <span key={day} className="inline-flex items-center gap-1.5 bg-[#E9F8FF] text-[#001243] px-3 py-1 rounded-full text-xs Livvic-Medium border border-[#AEC4FF]">{day}{timeStr}</span>
               })}
             </div>
           );
        }
      } catch(e) { /* ignore */ }
    } else if (key === "childrenAges") {
      let stringified = Array.isArray(parsedVal) ? parsedVal.join(',') : String(parsedVal);
      let arr = stringified.split(',');
      return arr.map(age => {
         let cleanAge = String(age).trim().replace(/[\[\]"']/g, '');
         if (!cleanAge) return null;
         let lower = cleanAge.toLowerCase();
         if (lower.includes("year") || lower.includes("yr") || lower.includes("month") || lower.includes("mo")) {
             return cleanAge;
         }
         return `${cleanAge} years`;
      }).filter(Boolean).join(", ");
    } else if (key === "salaryExp") {
      let expObj = parsedVal;
      if (typeof parsedVal === 'string') {
        try { expObj = JSON.parse(parsedVal); } catch(e) {}
      }
      if (expObj && typeof expObj === 'object') {
        let parts = [];
        if (expObj.firstChild) parts.push(`1st Child: $${expObj.firstChild}/hr`);
        if (expObj.secChild) parts.push(`2nd Child: $${expObj.secChild}/hr`);
        if (expObj.thirdChild) parts.push(`3rd Child: $${expObj.thirdChild}/hr`);
        if (expObj.fourthChild) parts.push(`4th Child: $${expObj.fourthChild}/hr`);
        if (expObj.fiveOrMoreChild) parts.push(`5+ Children: $${expObj.fiveOrMoreChild}/hr`);
        return parts.length > 0 ? parts.join(" | ") : null;
      }
      return null;
    } else if (typeof parsedVal === 'object') {
      return Array.isArray(parsedVal) ? parsedVal.map(v => String(v).replace(/[\[\]"]/g, '')).join(", ") : (parsedVal?.option || JSON.stringify(parsedVal));
    } else if (typeof parsedVal === 'boolean') {
      return parsedVal ? "Yes" : "No";
    }
    return String(parsedVal).replace(/[\[\]"]/g, ''); 
  };

  const allAnswers = expectedKeys.map(key => {
      const rawValue = getFallbackValue(key);
      const formattedValue = formatValue(key, rawValue);
      return {
          label: formatKey(key),
          value: formattedValue ? formattedValue : <span className="text-gray-400 italic font-normal text-[14px]">No details provided</span>
      };
  });

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white border-b border-[#EAEAEA] sticky top-0 z-10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#555555] hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
          >
            <ChevronLeft size={20} />
            <span className="Livvic-SemiBold text-sm sm:text-base">Back to Search</span>
          </button>
          <div className="flex gap-3">
            <button className="p-2 rounded-full bg-[#F3F4F6] text-[#555555] hover:bg-[#E5E7EB] transition-colors border-none cursor-pointer">
              <Heart size={20} />
            </button>
            <button className="bg-[#38AEE3] text-white px-6 py-2 rounded-xl Livvic-SemiBold text-sm sm:text-base hover:bg-[#2a9fd4] transition-colors border-none cursor-pointer">
              Request a Match
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left Column - Main Info */}
          <div className="flex-1 space-y-6">

            {/* Hero Card */}
            <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#EAEAEA] shadow-sm">
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                {nanny.img ? (
                  <img
                    src={nanny.img}
                    alt={nanny.name}
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover shadow-sm shrink-0"
                  />
                ) : (
                  <div className="shrink-0">
                    <Avatar
                      name={nanny.name?.charAt(0)}
                      size="160"
                      round="16px"
                      color="#38AEE3"
                      className="shadow-sm w-32 h-32 sm:w-40 sm:h-40"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="inline-flex items-center gap-1.5 bg-[#FFF3EA] text-[#C4621A] rounded-full px-3 py-1 text-xs sm:text-sm Livvic-Medium mb-3">
                    <Users size={14} />
                    Nanny • {nanny.goal}
                  </div>
                  <h1 className="text-3xl sm:text-4xl Livvic-Bold text-[#0D134C] mb-2">
                    {nanny.name}
                  </h1>
                  <p className="text-[#555555] text-lg Livvic-Medium flex items-center gap-2">
                    <MapPin size={18} /> {nanny.location}
                  </p>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#EAEAEA] shadow-sm">
              <h2 className="text-2xl Livvic-SemiBold text-[#0D134C] mb-4">About {nanny.name.split(" ")[0]}</h2>
              <p className="text-[#555555] leading-relaxed text-base sm:text-lg">
                {nanny.bio}
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {nanny.certifications.length > 0 && nanny.certifications.map((cert, index) => (
                  <div key={index} className="flex items-center gap-3 bg-[#F8F9FA] p-3 rounded-xl border border-[#EAEAEA]">
                    <div className="w-8 h-8 rounded-full bg-[#E5F6FF] text-[#38AEE3] flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className="Livvic-Medium text-[#0D134C]">{cert}</span>
                  </div>
                ))}
              </div>

              {nanny.compatibility.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg Livvic-SemiBold text-[#0D134C] mb-4">Share Compatibility</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {nanny.compatibility.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 bg-[#F8F9FA] p-3 rounded-xl border border-[#EAEAEA]">
                        <div className="w-8 h-8 rounded-full bg-[#E5F6FF] text-[#38AEE3] flex items-center justify-center shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span className="Livvic-Medium text-[#0D134C]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* All Onboarding Answers Section */}
            {allAnswers.length > 0 && (
              <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#EAEAEA] shadow-sm mt-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#E9F8FF] flex items-center justify-center">
                    <List className="w-5 h-5 text-[#2E68FF]" />
                  </div>
                  <h3 className="text-xl Livvic-SemiBold text-[#0D134C]">Onboarding Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {allAnswers.map((item, index) => (
                    <div key={index} className="flex flex-col bg-[#F8FAFC] p-4 rounded-[16px] border border-[#EAEAEA] hover:border-[#AEC4FF] transition-all duration-300">
                      <span className="text-[13px] Livvic-Medium text-gray-500 mb-1">{item.label}</span>
                      <div className="Livvic-SemiBold text-[#0D134C] text-[15px]">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column - Details Sticky Sidebar */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#EAEAEA] shadow-sm sticky top-[100px]">
              <h3 className="text-xl Livvic-SemiBold text-[#0D134C] mb-6">Match Details</h3>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0">
                    <Clock className="text-[#555555]" size={20} />
                  </div>
                  <div>
                    <p className="text-[#555555] text-sm mb-1">Schedule</p>
                    <p className="Livvic-SemiBold text-[#0D134C]">{nanny.schedule}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0">
                    <Briefcase className="text-[#555555]" size={20} />
                  </div>
                  <div>
                    <p className="text-[#555555] text-sm mb-1">Experience</p>
                    <p className="Livvic-SemiBold text-[#0D134C]">{nanny.experience}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0">
                    <Baby className="text-[#555555]" size={20} />
                  </div>
                  <div>
                    <p className="text-[#555555] text-sm mb-1">Preferred Ages</p>
                    <p className="Livvic-SemiBold text-[#0D134C]">{nanny.ages}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0">
                    <span className="Livvic-Bold text-[#555555] text-lg">$</span>
                  </div>
                  <div>
                    <p className="text-[#555555] text-sm mb-1">Rate</p>
                    <p className="Livvic-SemiBold text-[#0D134C]">{nanny.sharedRate}</p>
                    <p className="text-[#555555] text-sm mt-0.5">{nanny.soloRate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0">
                    <Calendar className="text-[#555555]" size={20} />
                  </div>
                  <div>
                    <p className="text-[#555555] text-sm mb-1">Availability</p>
                    <p className="Livvic-SemiBold text-[#0D134C]">{nanny.availability}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#EAEAEA]">
                <button className="w-full bg-[#38AEE3] text-white py-4 rounded-xl Livvic-SemiBold text-lg hover:bg-[#2a9fd4] transition-colors border-none cursor-pointer flex items-center justify-center gap-2">
                  <Users size={20} />
                  Request a Match
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
