import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ChevronLeft, MapPin, Users, Clock, Calendar, Heart, Baby, List, ShieldCheck, Cake, Home, Bell, Phone, Briefcase, Info, Cloud, FileText, HeartPulse, CheckSquare, ClipboardList, BookOpen, Dog, Sun } from "lucide-react";
import CustomButton from "../../NewComponents/Button";
import { fetchNannyByIdThunk } from "../../Components/Redux/nannyData";
import { addOrRemoveFavouriteThunk } from "../../Components/Redux/favouriteSlice";
import { refreshTokenThunk } from "../../Components/Redux/authSlice";
import { CompleteProfileModal } from "../CompleteProfileModal";
import { MatchRequestFormModal } from "../MatchRequestFormModal";
import { RequestMatchDenied } from "../RequestMatchDenied";

export default function FamilyProfileView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedNanny, isLoading } = useSelector((s) => s.nannyData);
  const { user, accessToken } = useSelector((state) => state.auth);

  const [isMatchRequestDenied, setIsMatchRequestDenied] = React.useState(false);
  const [isFavorited, setIsFavorited] = React.useState(false);

  React.useEffect(() => {
    if (user?.favourite && id) {
      setIsFavorited(user.favourite.includes(id));
    }
  }, [user, id]);

  const favourite = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!id) return;
    dispatch(addOrRemoveFavouriteThunk({ favouriteUserId: id, accessToken }));
    dispatch(refreshTokenThunk());
    setIsFavorited((prev) => !prev);
  };
  const [isProfileComplete, setIsProfileComplete] = React.useState(false);
  const [senderId, setSenderId] = React.useState(null);
  const [receiverId, setReceiverId] = React.useState(null);
  const [isRequestSubmitModal, setIsRequestSubmitModal] = React.useState(false);

  const handleMatchRequest = () => {
    if (!user.nannyProfileCompleted) {
      setIsProfileComplete(true);
      return;
    }
    if (user.type === "Parents" && user.matchRequestsSent > 0 && !user.premium) {
      setIsMatchRequestDenied(true);
      return;
    }
    setSenderId(user._id);
    const targetId = selectedNanny.userId?._id || selectedNanny.userId || selectedNanny._id;
    setReceiverId(targetId);
    setIsRequestSubmitModal(true);
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchNannyByIdThunk(id));
    }
  }, [dispatch, id]);

  if (isLoading || !selectedNanny) {
    return <div className="min-h-screen flex items-center justify-center">Loading Profile...</div>;
  }

  // Map backend data to our premium layout
  const profile = selectedNanny?.nannyProfile || {};

  const formatLocation = () => {
    const parts = selectedNanny?.location?.format_location?.split(",") || [];
    const city = parts.at(-3)?.trim();
    const state = parts.at(-2)?.trim().split(" ")[0];
    return city && state ? `${city}, ${state}` : selectedNanny?.location?.format_location || "Location not specified";
  };

  let budgetStr = "Budget not specified";
  if (profile.hourlyBudget) {
    if (profile.hourlyBudget.maxShare && profile.hourlyBudget.minShare) {
      budgetStr = `~$${profile.hourlyBudget.minShare} - $${profile.hourlyBudget.maxShare}/hr per family`;
    } else if (profile.hourlyBudget.minShare) {
      budgetStr = `~$${profile.hourlyBudget.minShare}+/hr per family`;
    } else if (profile.hourlyBudget.max && profile.hourlyBudget.min) {
      budgetStr = `~$${profile.hourlyBudget.min} - $${profile.hourlyBudget.max}/hr`;
    } else if (profile.hourlyBudget.min) {
      budgetStr = `~$${profile.hourlyBudget.min}+/hr`;
    } else if (typeof profile.hourlyBudget === 'string') {
      budgetStr = profile.hourlyBudget;
    }
  }

  const childrenCount = profile.numberOfChildren !== undefined && profile.numberOfChildren !== null
    ? profile.numberOfChildren
    : selectedNanny?.noOfChildren?.length;

  const childrenStr = childrenCount !== undefined && childrenCount !== null
    ? `${childrenCount} Child${childrenCount === 1 ? '' : 'ren'}`
    : "Children count not specified";

  const formatName = (fullName) => {
    if (!fullName) return "";
    const parts = fullName.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "";
    
    const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    
    if (parts.length > 1) {
      const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
      return `${firstName} ${lastInitial}.`;
    }
    return firstName;
  };

  const expectedKeys = [
    "nannyShareType",
    "hasNanny",
    "shareLocation",
    "specifyNearbyWorkplace",
    "flexible",
    "nannyshareStart",
    "urgency",
    "hosting",
    "prefferedCommunication",
    "backupAvailable",
    "specificDaysAndTime",
    "numberOfChildren",
    "childrenAges",
    "allergiesHealth",
    "dailyRoutine",
    "responsibilities",
    "childResponsibilities",
    "householdAddOns",
    "parentingStyle",
    "houseRules",
    "hourlyBudget",
    "pets",
    "careDescription",
    "openNotes"
  ];

  // Map to friendly names if needed or fallback mapping
  const keyMapping = {
    flexible: "flexibility",
    hosting: "hostingPreference",
    prefferedCommunication: "communicationPreference",
    backupAvailable: "backupCare",
    hourlyRateSplit: "hourlyBudget",
    specificDaysAndTime: "specificDays"
  };

  const getFallbackValue = (key) => {
    // 1. Check profile schema directly
    if (profile && profile[key] !== undefined && profile[key] !== null && profile[key] !== "") {
      return profile[key];
    }
    // 2. Check additionalInfo with the exact key
    let fallback = selectedNanny?.additionalInfo?.find(info => info.key === key);
    if (fallback) return fallback.value;

    // 3. Check profile schema with legacy mapped keys
    if (keyMapping[key] && profile && profile[keyMapping[key]] !== undefined && profile[keyMapping[key]] !== null && profile[keyMapping[key]] !== "") {
      return profile[keyMapping[key]];
    }

    // 4. Check additionalInfo with legacy mapped keys
    if (keyMapping[key]) {
      fallback = selectedNanny?.additionalInfo?.find(info => info.key === keyMapping[key]);
      if (fallback) return fallback.value;
    }
    return null;
  };

  const formatKey = (key) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();

  const formatValue = (key, val) => {
    if (val === undefined || val === null || val === "" || val === "N A" || val === "null" || (typeof val === 'string' && val.trim() === '')) {
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
                  const s = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const e = new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  timeStr = ` (${s} - ${e})`;
                }
                return <span key={day} className="inline-flex items-center gap-1.5 bg-[#E9F8FF] text-[#001243] px-3 py-1 rounded-full text-xs Livvic-Medium border border-[#AEC4FF]">{day}{timeStr}</span>
              })}
            </div>
          );
        }
      } catch (e) { /* ignore */ }
    } else if (key === "childrenAges") {
      if (!Array.isArray(parsedVal)) {
        try { parsedVal = JSON.parse(parsedVal); } catch(e) { parsedVal = [parsedVal]; }
      }
      if (Array.isArray(parsedVal)) {
        return parsedVal.map(age => {
          if (typeof age === 'object' && age !== null && age.label) return age.label;
          let cleanAge = String(age).trim().replace(/[\[\]"']/g, '');
          if (!cleanAge) return null;
          let lower = cleanAge.toLowerCase();
          if (lower.includes("year") || lower.includes("yr") || lower.includes("month") || lower.includes("mo")) {
              return cleanAge;
          }
          return `${cleanAge} years`;
        }).filter(Boolean).join(", ");
      }
      return String(parsedVal);
    } else if (typeof parsedVal === 'object') {
      let res = Array.isArray(parsedVal) ? parsedVal.map(v => String(v).replace(/[\[\]"]/g, '')).join(", ") : (parsedVal?.option || JSON.stringify(parsedVal));
      return typeof res === 'string' ? res.split(',').map(s => s.trim()).join(', ') : res;
    } else if (typeof parsedVal === 'boolean') {
      if (key === "hasNanny") {
        return parsedVal ? "Yes - we already have a nanny" : "No - we are looking for a nanny";
      }
      return parsedVal ? "Yes" : "No";
    }
    return String(parsedVal).replace(/[\[\]"]/g, '').split(',').map(s => s.trim()).join(', '); 
  };

  const formatStartDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    if (!isNaN(d)) {
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    return val;
  };

  const flexVal = formatValue('flexible', getFallbackValue('flexible'));
  const urgVal = formatValue('urgency', getFallbackValue('urgency'));
  const commVal = formatValue('prefferedCommunication', getFallbackValue('prefferedCommunication'));

  const family = {
    name: formatName(selectedNanny.name),
    goal: selectedNanny.goal || "Looking for a nanny share",
    children: childrenStr,
    schedule: profile.nannyShareType || "Schedule not specified",
    location: formatLocation(),
    budget: budgetStr,
    startDate: formatStartDate(profile.nannyshareStart) || "Flexible",
    bio: selectedNanny.aboutMe || profile.careDescription || profile.openNotes || "No bio provided.",
    img: selectedNanny.imageUrl || profile.imageFile,
    preferences: [
      profile.hasNanny ? "Already have a nanny" : "Looking for a nanny",
      flexVal || "Schedule flexibility not specified",
      urgVal || "Urgency not specified",
      commVal || "Communication preference not specified"
    ].filter(Boolean)
  };

  const groupedDetails = [
    {
      title: "Family & Care Needs",
      icon: <Users className="w-5 h-5 text-[#304B9E]" />,
      items: [
        { key: "nannyShareType", label: "Nanny Share Type", icon: <Users className="w-4 h-4 text-[#6074A3]" /> },
        { key: "hasNanny", label: "Has Nanny", icon: <ShieldCheck className="w-4 h-4 text-[#6074A3]" /> },
        { key: "numberOfChildren", label: "Number of Children", icon: <Baby className="w-4 h-4 text-[#6074A3]" /> },
        { key: "childrenAges", label: "Ages of Children", icon: <Cake className="w-4 h-4 text-[#6074A3]" /> },
      ]
    },
    {
      title: "Share Preferences",
      icon: <MapPin className="w-5 h-5 text-[#304B9E]" />,
      items: [
        { key: "shareLocation", label: "Share Location", icon: <MapPin className="w-4 h-4 text-[#6074A3]" /> },
        { key: "hosting", label: "Hosting", icon: <Home className="w-4 h-4 text-[#6074A3]" /> },
        { key: "specifyNearbyWorkplace", label: "Nearby Workplace", icon: <Briefcase className="w-4 h-4 text-[#6074A3]" /> },
      ]
    },
    {
      title: "Schedule & Timing",
      icon: <Clock className="w-5 h-5 text-[#304B9E]" />,
      items: [
        { key: "nannyshareStart", label: "Start Date", icon: <Calendar className="w-4 h-4 text-[#6074A3]" /> },
        { key: "flexible", label: "Flexibility", icon: <Clock className="w-4 h-4 text-[#6074A3]" /> },
        { key: "urgency", label: "Urgency", icon: <Bell className="w-4 h-4 text-[#6074A3]" /> },
        { key: "specificDaysAndTime", label: "Specific Days & Time", icon: <Calendar className="w-4 h-4 text-[#6074A3]" /> },
      ]
    },
    {
      title: "Care Expectations",
      icon: <ClipboardList className="w-5 h-5 text-[#304B9E]" />,
      items: [
        { key: "dailyRoutine", label: "Daily Routine", icon: <Sun className="w-4 h-4 text-[#6074A3]" /> },
        { key: "childResponsibilities", label: "Child Responsibilities", icon: <Baby className="w-4 h-4 text-[#6074A3]" /> },
        { key: "householdAddOns", label: "Household Add-Ons", icon: <Home className="w-4 h-4 text-[#6074A3]" /> },
        { key: "careDescription", label: "Care Description", icon: <FileText className="w-4 h-4 text-[#6074A3]" /> },
      ]
    },
    {
      title: "Household & Environment",
      icon: <Home className="w-5 h-5 text-[#304B9E]" />,
      items: [
        { key: "parentingStyle", label: "Parenting Style", icon: <Heart className="w-4 h-4 text-[#6074A3]" /> },
        { key: "houseRules", label: "House Rules", icon: <BookOpen className="w-4 h-4 text-[#6074A3]" /> },
        { key: "pets", label: "Pets", icon: <Dog className="w-4 h-4 text-[#6074A3]" /> },
        { key: "allergiesHealth", label: "Allergies / Health Info", icon: <HeartPulse className="w-4 h-4 text-[#6074A3]" /> },
      ]
    },
    {
      title: "Communication & Backup",
      icon: <Phone className="w-5 h-5 text-[#304B9E]" />,
      items: [
        { key: "prefferedCommunication", label: "Preferred Communication", icon: <Phone className="w-4 h-4 text-[#6074A3]" /> },
        { key: "backupAvailable", label: "Backup Care Available", icon: <Cloud className="w-4 h-4 text-[#6074A3]" /> },
        { key: "openNotes", label: "Additional Notes", icon: <FileText className="w-4 h-4 text-[#6074A3]" /> },
      ]
    }
  ];

  const renderGroups = groupedDetails.map((group, gIndex) => {
    const validItems = group.items.map(item => {
      const rawValue = getFallbackValue(item.key);
      const formattedValue = formatValue(item.key, rawValue);
      return {
        ...item,
        value: formattedValue ? formattedValue : <span className="text-[#A1A1AA] italic font-normal text-[14px]">No details provided</span>
      };
    });

    return (
      <div key={gIndex} className="bg-white rounded-[16px] border border-[#EAEAEA] shadow-sm mb-4 overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-[#EAEAEA] bg-[#FAFCFF]">
          <div className="w-9 h-9 rounded-full bg-[#F3F5FC] flex items-center justify-center shrink-0">
            {group.icon}
          </div>
          <h4 className="text-[17px] Livvic-Bold text-[#0D134C]">{group.title}</h4>
        </div>
        <div className="flex flex-col px-5">
          {validItems.map((item, iIndex) => (
            <div key={iIndex} className={`flex flex-col sm:flex-row sm:items-center py-4 ${iIndex !== validItems.length - 1 ? 'border-b border-[#F4F4F5]' : ''}`}>
              <div className="flex items-center gap-3 w-full sm:w-[280px] shrink-0 mb-1 sm:mb-0">
                <div className="w-8 h-8 rounded-full bg-transparent border border-[#EAEAEA] flex items-center justify-center shrink-0">
                  {React.cloneElement(item.icon, { className: "w-4 h-4 text-[#6B7CC3]" })}
                </div>
                <span className="text-[14px] Livvic-Medium text-[#64748B]">{item.label}</span>
              </div>
              <div className="Livvic-SemiBold text-[#1E293B] text-[15px] sm:ml-4">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  });

  return (
    <div className="min-h-screen pb-20">
      {isRequestSubmitModal && (
        <MatchRequestFormModal
          setIsRequestSubmitModal={setIsRequestSubmitModal}
          senderId={senderId}
          receiverId={receiverId}
        />
      )}
      {isProfileComplete && <CompleteProfileModal setIsProfileComplete={setIsProfileComplete} />}
      {isMatchRequestDenied && <RequestMatchDenied setIsMatchRequestDenied={setIsMatchRequestDenied} />}

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
            <button onClick={favourite} className="p-2 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-colors border-none cursor-pointer">
              <Heart size={20} className={isFavorited ? "text-red-500 fill-red-500" : "text-[#555555]"} />
            </button>
            <button onClick={handleMatchRequest} className="bg-[#AEC4FF] text-[#0D134C] px-6 py-2 rounded-xl Livvic-SemiBold text-sm sm:text-base hover:bg-[#C1D6FF] transition-colors border-none cursor-pointer">
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
                {family.img ? (
                  <img
                    src={family.img}
                    alt={family.name}
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover shadow-sm shrink-0"
                  />
                ) : (
                  <div className="shrink-0">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl shadow-sm bg-[#AEC4FF] flex items-center justify-center text-[#0D134C] Livvic-SemiBold text-5xl">
                      {family.name ? family.name.charAt(0).toUpperCase() : ""}
                    </div>
                  </div>
                )}
                <div className="flex-1">
                  <div className="inline-flex items-center gap-1.5 bg-[#d9f0ff] text-[#5fbfff] rounded-full px-3 py-1 text-xs sm:text-sm Livvic-Medium mb-3">
                    <Users size={14} />
                    Family • {family.goal}
                  </div>
                  <h1 className="text-3xl sm:text-4xl Livvic-Bold text-[#0D134C] mb-2">
                    {family.name}
                  </h1>
                  <p className="text-[#555555] text-lg Livvic-Medium flex items-center gap-2">
                    <MapPin size={18} /> {family.location}
                  </p>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#EAEAEA] shadow-sm">
              <h2 className="text-2xl Livvic-SemiBold text-[#0D134C] mb-4">About the Family</h2>
              <p className="text-[#555555] leading-relaxed text-base sm:text-lg">
                {family.bio}
              </p>

            </div>

            {/* Profile Details Section */}
            <div className="mt-12">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-[#F3F5FC] flex items-center justify-center shrink-0">
                    <List className="w-6 h-6 text-[#304B9E]" />
                  </div>
                  <h3 className="text-[24px] Livvic-Bold text-[#0D134C]">Profile Details</h3>
                </div>
                <p className="text-[#64748B] text-[15px] Livvic-Regular sm:ml-[60px]">Review the information you've provided for matching and share compatibility.</p>
              </div>

              {renderGroups}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
