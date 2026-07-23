import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ChevronLeft, MapPin, Users, Clock, Calendar, Heart, Briefcase, Baby, List, ShieldCheck, Cake, Home, Bell, Phone, Info, Cloud, FileText } from "lucide-react";
import CustomButton from "../../NewComponents/Button";
import { fetchNannyByIdThunk } from "../../Components/Redux/nannyData";
import { addOrRemoveFavouriteThunk } from "../../Components/Redux/favouriteSlice";
import { refreshTokenThunk } from "../../Components/Redux/authSlice";
import { CompleteProfileModal } from "../CompleteProfileModal";
import { MatchRequestFormModal } from "../MatchRequestFormModal";
import { RequestMatchDenied } from "../RequestMatchDenied";
import { ReferAFriendModal } from "../ReferAFriendModal";
import { viewCurrentUserProfileThunk } from "../../Components/Redux/nannyShareSlice";
import { getMatchGate, MATCH_GATE } from "../../Config/matchGate";
import { formatStartDate } from "../../Config/helpFunction";
import { getNannyTheme, getNannyGoal, ShareTypeLabel } from "../../Config/shareTypeTheme";
import { getMyReferralThunk } from "../../Components/Redux/referralSlice";

export default function NannyProfileView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedNanny, isLoading, error } = useSelector((s) => s.nannyData);
  const { user, accessToken } = useSelector((state) => state.auth);

  // The viewer's own profile — hasFamily lives there, and it decides whether
  // this user is on the referral model or the subscription one.
  const { currentProfile } = useSelector((s) => s.postNannyShare);

  const [isMatchRequestDenied, setIsMatchRequestDenied] = React.useState(false);
  const [isReferModal, setIsReferModal] = React.useState(false);
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
    // Caregivers looking for a share job refer a friend instead of subscribing.
    const gate = getMatchGate(user, currentProfile);
    if (gate === MATCH_GATE.REFER) {
      setIsReferModal(true);
      return;
    }
    if (gate === MATCH_GATE.SUBSCRIBE) {
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

  // Both feed the match gate above. This page can be opened straight from a
  // link or an email, so currentProfile isn't guaranteed to be in the store —
  // and the referral fetch refreshes referralMatchingUntil, which otherwise
  // only updates when the access token does.
  useEffect(() => {
    dispatch(viewCurrentUserProfileThunk());
    if (user?.type === "Nanny") dispatch(getMyReferralThunk());
  }, [dispatch, user?.type]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Profile...</div>;
  }

  if (error || !selectedNanny) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg Livvic-SemiBold text-gray-800">
          {error || "We couldn't load this profile."}
        </p>
        <div className="flex gap-3">
          <CustomButton
            btnText="Try again"
            action={() => id && dispatch(fetchNannyByIdThunk(id))}
            className="bg-primary"
          />
          <CustomButton
            btnText="Go back"
            action={() => navigate(-1)}
            className="bg-white border"
          />
        </div>
      </div>
    );
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
    "eceCert",
    "trustLineCert",
    "carpool",
    "ageGroupsExp",
    "customCertifications",
    "skills",
    "salaryExp",
    "forWho",
    "numberOfChildren",
    "childrenAges",
    "currentSchedule",
    "joinTiming",
    "together",
    "whereCare"
  ];

  // Map to friendly names if needed or fallback mapping
  const keyMapping = {
    careType: "avaiForWorking",
    startAvailability: "availability",
    careExperience: "experience",
    languages: "language",
  };

  // additionalInfo reaches us in two shapes. Most profiles carry a plain array
  // of { key, value } objects, but sheet-imported "adding a share" caregivers
  // (e.g. currentSchedule / joinTiming / forWho / together) carry a single
  // JSON-stringified array instead: ["[{\"key\":\"currentSchedule\",…}]"].
  // Flatten both into one { key, value } list so a `.find(by key)` resolves
  // either way — otherwise those answers silently render "No details provided"
  // even though the data is present.
  const flatAdditionalInfo = (() => {
    const raw = selectedNanny?.additionalInfo;
    if (!Array.isArray(raw)) return [];
    const out = [];
    for (const item of raw) {
      if (item && typeof item === 'object' && 'key' in item) {
        out.push(item);
      } else if (typeof item === 'string') {
        try {
          const parsed = JSON.parse(item);
          const list = Array.isArray(parsed) ? parsed : [parsed];
          for (const p of list) if (p && typeof p === 'object' && 'key' in p) out.push(p);
        } catch { /* non-JSON string — nothing to extract */ }
      }
    }
    return out;
  })();

  const getFallbackValue = (key) => {
    // Intercept certifications which are stored in an array or in additionalDetails
    if (key === 'firstAidCert' || key === 'cprCert' || key === 'eceCert' || key === 'trustLineCert') {
      const searchStr = key === 'firstAidCert' ? 'first aid' :
        key === 'cprCert' ? 'cpr' :
          key === 'eceCert' ? 'early childhood' : 'trustline';

      const certs = profile?.certifications || [];
      const inCerts = certs.some(c => c.toLowerCase().includes(searchStr));

      const profileAddDetails = typeof profile?.additionalDetails === 'string' ? profile.additionalDetails.toLowerCase() : JSON.stringify(profile?.additionalDetails || "").toLowerCase();

      const fallback = flatAdditionalInfo.find(info => info.key === 'additionalDetails');
      const legacyAddDetails = JSON.stringify(fallback?.value || "").toLowerCase();

      return (inCerts || profileAddDetails.includes(searchStr) || legacyAddDetails.includes(searchStr)) ? 'Yes' : 'No';
    }

    // 1. Check profile schema directly
    if (profile && profile[key] !== undefined && profile[key] !== null && profile[key] !== "") {
      return profile[key];
    }
    // 2. Check additionalInfo with the exact key
    let fallback = flatAdditionalInfo.find(info => info.key === key);
    if (fallback) return fallback.value;

    // 3. Check additionalInfo with legacy mapped keys (e.g., careType -> avaiForWorking)
    if (keyMapping[key]) {
      fallback = flatAdditionalInfo.find(info => info.key === keyMapping[key]);
      if (fallback) return fallback.value;
    }
    return null;
  };

  const formatKey = (key) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();

  const formatValue = (key, val) => {
    if (val === false) return "No";
    if (val === null || val === undefined || val === "N A" || val === "null" || (typeof val === 'string' && val.trim() === '')) {
      return null;
    }

    let parsedVal = val;
    let iterations = 0;
    while (typeof parsedVal === 'string' && (parsedVal.startsWith('{') || parsedVal.startsWith('[')) && iterations < 3) {
      try {
        let temp = JSON.parse(parsedVal);
        if (typeof temp === 'string' && temp === parsedVal) break;
        parsedVal = temp;
      } catch (e) {
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
        try { parsedVal = JSON.parse(parsedVal); } catch (e) { parsedVal = [parsedVal]; }
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
    } else if (key === "salaryExp") {
      let expObj = parsedVal;
      if (typeof parsedVal === 'string') {
        try { expObj = JSON.parse(parsedVal); } catch (e) { }
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
    } else if (key === "hourlyBudget") {
      let bObj = parsedVal;
      if (typeof parsedVal === 'string') {
        try { bObj = JSON.parse(parsedVal); } catch (e) { }
      }
      if (bObj && typeof bObj === 'object') {
        if (bObj.maxShare && bObj.minShare) return `~$${bObj.minShare} - $${bObj.maxShare}/hr per family`;
        if (bObj.minShare) return `~$${bObj.minShare}+/hr per family`;
        if (bObj.max && bObj.min) return `~$${bObj.min} - $${bObj.max}/hr`;
        if (bObj.min) return `~$${bObj.min}+/hr`;
      }
      return typeof parsedVal === 'string' ? parsedVal : null;
    } else if (key === "startAvailability") {
      // Stored as an ISO date from the picker, so the detail row printed the raw
      // "2026-07-15T23:00:00.000Z". Route it through the shared formatter →
      // "July 15, 2026"; non-date answers ("Immediately", "Flexible") pass
      // through untouched.
      return formatStartDate(parsedVal);
    } else if (typeof parsedVal === 'object') {
      let arr = [];
      if (Array.isArray(parsedVal)) {
        arr = parsedVal;
      } else if (parsedVal && parsedVal.option) {
        arr = Array.isArray(parsedVal.option) ? parsedVal.option : [parsedVal.option];
      } else {
        return JSON.stringify(parsedVal);
      }

      if (key === 'additionalDetails') {
        arr = arr.filter(s => typeof s === 'string' && !s.toLowerCase().includes('first aid') && !s.toLowerCase().includes('cpr'));
      }

      let res = arr.length > 0 ? arr.map(v => {
        if (v && typeof v === 'object' && v.label) return v.label;
        if (v && typeof v === 'object' && v.value) return v.value;
        return String(v).replace(/[\[\]"]/g, '');
      }).join(", ") : null;
      return typeof res === 'string' ? res.split(',').map(s => s.trim()).join(', ') : res;
    } else if (typeof parsedVal === 'boolean') {
      return parsedVal ? "Yes" : "No";
    }

    if (key === 'additionalDetails' && typeof parsedVal === 'string') {
      const filtered = parsedVal.split(',').map(s => s.trim()).filter(s => !s.toLowerCase().includes('first aid') && !s.toLowerCase().includes('cpr'));
      return filtered.length > 0 ? filtered.join(", ") : null;
    }

    return String(parsedVal).replace(/[\[\]"]/g, '').split(',').map(s => s.trim()).join(', ');
  };

  const hasShareExp = formatValue('shareExperience', getFallbackValue('shareExperience'));
  const hasMultiExp = formatValue('multiFamilyComfort', getFallbackValue('multiFamilyComfort'));
  const hasTransp = formatValue('hasTransport', getFallbackValue('hasTransport'));
  const hasBgCheck = formatValue('backgroundCheck', getFallbackValue('backgroundCheck'));
  const workSetupVal = formatValue('workSetup', getFallbackValue('workSetup'));
  const childrenCap = formatValue('childrenCapacity', getFallbackValue('childrenCapacity'));

  const nanny = {
    name: formatName(selectedNanny.name),
    goal: selectedNanny.goal || "Looking for a family",
    experience: formatValue('careExperience', getFallbackValue('careExperience')) || "Experience not specified",
    ages: (profile.hasFamily ? formatValue('childrenAges', getFallbackValue('childrenAges')) : formatValue('preferredAges', getFallbackValue('preferredAges'))) || "Ages not specified",
    schedule: formatValue('careType', getFallbackValue('careType')) || "Schedule not specified",
    location: formatLocation(),
    sharedRate: formattedSharedRate,
    soloRate: formattedSoloRate,
    availability: formatValue('startAvailability', getFallbackValue('startAvailability')) || "Availability not specified",
    bio: profile.bio || additionalInfoBio || selectedNanny.aboutMe || "No bio provided.",
    img: selectedNanny.imageUrl || profile.imageFile,
    certifications: profile.certifications || [],
    compatibility: [
      hasShareExp === "Yes" ? "Has Share Experience" : null,
      hasMultiExp === "Yes" ? "Comfortable with Multiple Families" : null,
      hasTransp === "Yes" ? "Has Transportation" : null,
      hasBgCheck === "Yes" ? "Background Checked" : null,
      workSetupVal ? `Work Setup: ${workSetupVal}` : null,
      childrenCap ? `Capacity: ${childrenCap}` : null
    ].filter(Boolean)
  };

  const groupedDetails = [
    {
      title: "Professional Experience",
      icon: <Briefcase className="w-5 h-5 text-[#304B9E]" />,
      items: [
        { key: "careType", label: "Care Type Required", icon: <Clock className="w-4 h-4 text-[#6074A3]" /> },
        { key: "careExperience", label: "Years of Experience", icon: <Briefcase className="w-4 h-4 text-[#6074A3]" /> },
        { key: "ageGroupsExp", label: "Experience with Ages", icon: <Users className="w-4 h-4 text-[#6074A3]" /> },
        { key: "preferredAges", label: "Preferred Ages", icon: <Cake className="w-4 h-4 text-[#6074A3]" /> },
        { key: "childrenCapacity", label: "Max Children Capacity", icon: <Baby className="w-4 h-4 text-[#6074A3]" /> },
      ]
    },
    {
      title: "Share Schedule",
      icon: <Calendar className="w-5 h-5 text-[#304B9E]" />,
      items: [
        { key: "shareExperience", label: "Previous Share Experience", icon: <Users className="w-4 h-4 text-[#6074A3]" /> },
        { key: "multiFamilyComfort", label: "Multi-Family Comfort", icon: <Home className="w-4 h-4 text-[#6074A3]" /> },
        { key: "workSetup", label: "Work Setup Preference", icon: <Home className="w-4 h-4 text-[#6074A3]" /> },
        { key: "startAvailability", label: "Availability to Start", icon: <Calendar className="w-4 h-4 text-[#6074A3]" /> },
        { key: "specificDays", label: "Specific Schedule", icon: <Clock className="w-4 h-4 text-[#6074A3]" /> },
      ]
    },
    {
      title: "Rates & Compensation",
      icon: <FileText className="w-5 h-5 text-[#304B9E]" />,
      items: [
        { key: "rateType", label: "Rate Type", icon: <Clock className="w-4 h-4 text-[#6074A3]" /> },
        { key: "sharedRate", label: "Shared Rate", icon: <FileText className="w-4 h-4 text-[#6074A3]" /> },
        { key: "soloRate", label: "Solo Rate", icon: <FileText className="w-4 h-4 text-[#6074A3]" /> },
        { key: "salaryExp", label: "Salary Expectations", icon: <Briefcase className="w-4 h-4 text-[#6074A3]" /> },
      ]
    },
    {
      title: "Current Share Setup",
      icon: <Users className="w-5 h-5 text-[#304B9E]" />,
      items: [
        { key: "forWho", label: "Who is this share for?", icon: <Users className="w-4 h-4 text-[#6074A3]" /> },
        { key: "hourlyBudget", label: "Hourly Budget Split", icon: <FileText className="w-4 h-4 text-[#6074A3]" /> },
        { key: "numberOfChildren", label: "Children Currently in Care", icon: <Baby className="w-4 h-4 text-[#6074A3]" /> },
        { key: "childrenAges", label: "Ages of Children in Care", icon: <Cake className="w-4 h-4 text-[#6074A3]" /> },
        { key: "currentSchedule", label: "Current Schedule", icon: <Clock className="w-4 h-4 text-[#6074A3]" /> },
        { key: "joinTiming", label: "When Can Another Family Join?", icon: <Calendar className="w-4 h-4 text-[#6074A3]" /> },
        { key: "together", label: "Will Children be Together?", icon: <Home className="w-4 h-4 text-[#6074A3]" /> },
        { key: "whereCare", label: "Hosting Preference", icon: <Home className="w-4 h-4 text-[#6074A3]" /> },
      ]
    },
    {
      title: "Certification",
      icon: <ShieldCheck className="w-5 h-5 text-[#304B9E]" />,
      items: [
        { key: "firstAidCert", label: "First Aid Certified", icon: <ShieldCheck className="w-4 h-4 text-[#6074A3]" /> },
        { key: "cprCert", label: "CPR Certified", icon: <ShieldCheck className="w-4 h-4 text-[#6074A3]" /> },
        { key: "eceCert", label: "Early Childhood Education (ECE)", icon: <ShieldCheck className="w-4 h-4 text-[#6074A3]" /> },
        { key: "trustLineCert", label: "TrustLine Registered", icon: <ShieldCheck className="w-4 h-4 text-[#6074A3]" /> },
        { key: "backgroundCheck", label: "Background Checked", icon: <ShieldCheck className="w-4 h-4 text-[#6074A3]" /> },
        { key: "hasTransport", label: "Has Transportation", icon: <MapPin className="w-4 h-4 text-[#6074A3]" /> },
      ]
    },
    {
      title: "Additional Information",
      icon: <Info className="w-5 h-5 text-[#304B9E]" />,
      items: [
        { key: "languages", label: "Languages Spoken", icon: <Users className="w-4 h-4 text-[#6074A3]" /> },
        { key: "responsibilities", label: "Care Responsibilities", icon: <Briefcase className="w-4 h-4 text-[#6074A3]" /> },
        { key: "householdHelp", label: "Household Help", icon: <Home className="w-4 h-4 text-[#6074A3]" /> },
        { key: "customCertifications", label: "Additional Certifications", icon: <ShieldCheck className="w-4 h-4 text-[#6074A3]" /> },
        { key: "skills", label: "Special Skills", icon: <FileText className="w-4 h-4 text-[#6074A3]" /> },
      ]
    }
  ];

  // hasFamily is the schema-required boolean the card badge, the filter and the
  // shared theme all key off, so the sections shown here are driven by the same
  // source rather than a brittle match on the free-text `goal` string — that way
  // the "With a family" tag and the family-nanny sections can never disagree.
  const isFamilyNanny = !!profile?.hasFamily;

  // Job-seeker-only keys within "Share Schedule". A nanny who already has a
  // family and is adding a share never fills these (they describe a nanny
  // marketing themselves for hire), so for that audience they'd only render as
  // empty "No details provided" rows.
  const JOB_SEEKER_SCHEDULE_KEYS = ["shareExperience", "multiFamilyComfort", "workSetup"];

  const filteredGroupedDetails = groupedDetails.filter(group => {
    if (group.title === "Current Share Setup" && !isFamilyNanny) return false;
    return true;
  }).map(group => {
    // If it's the Professional Experience group, filter items based on the nanny type
    if (group.title === "Professional Experience") {
      return {
        ...group,
        items: group.items.filter(item => {
          if (isFamilyNanny && (item.key === "preferredAges" || item.key === "childrenCapacity")) return false;
          return true;
        })
      };
    }
    // "Share Schedule" used to be hidden entirely for family-nannies, which also
    // hid their start date and specific-days schedule — both of which they do
    // fill, and which already show on the profile card. Keep the section for
    // them, but drop the job-seeker-only items so it shows just the schedule.
    if (group.title === "Share Schedule" && isFamilyNanny) {
      return {
        ...group,
        items: group.items.filter(item => !JOB_SEEKER_SCHEDULE_KEYS.includes(item.key))
      };
    }
    return group;
  });

  const renderGroups = filteredGroupedDetails.map((group, gIndex) => {
    const validItems = group.items.map(item => {
      const rawValue = getFallbackValue(item.key);
      const formattedValue = formatValue(item.key, rawValue);
      return {
        ...item,
        value: (formattedValue !== null && formattedValue !== undefined && formattedValue !== "")
          ? formattedValue 
          : <span className="text-[#A1A1AA] italic font-normal text-[14px]">No details provided</span>
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
          onReferralRequired={() => setIsReferModal(true)}
        />
      )}
      {isProfileComplete && <CompleteProfileModal setIsProfileComplete={setIsProfileComplete} />}
      {isMatchRequestDenied && <RequestMatchDenied setIsMatchRequestDenied={setIsMatchRequestDenied} />}
      {isReferModal && <ReferAFriendModal onClose={() => setIsReferModal(false)} />}

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
                {nanny.img ? (
                  <img
                    src={nanny.img}
                    alt={nanny.name}
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover shadow-sm shrink-0"
                  />
                ) : (
                  <div className="shrink-0">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl shadow-sm bg-[#AEC4FF] flex items-center justify-center text-[#0D134C] Livvic-SemiBold text-5xl">
                      {nanny.name ? nanny.name.charAt(0).toUpperCase() : ""}
                    </div>
                  </div>
                )}
                <div className="flex-1">
                  {/* Same themed "Role • Goal" pill as the profile card — colors
                      and wording come from the shared shareTypeTheme, keyed off
                      hasFamily, so the details page reads identically to the card
                      (green "With a family, Looking to share" for a family-nanny,
                      orange "Looking for a share position" otherwise) instead of
                      the raw backend goal string in a fixed orange. */}
                  <div
                    style={{ backgroundColor: getNannyTheme(profile.hasFamily).bg, color: getNannyTheme(profile.hasFamily).text }}
                    className="inline-flex items-center gap-1.5 font-bold Livvic-Bold rounded-full px-3 py-1 text-xs sm:text-sm mb-3"
                  >
                    <Users size={14} />
                    <ShareTypeLabel role="Nanny" goal={getNannyGoal(profile.hasFamily)} />
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
              <h2 className="text-2xl Livvic-SemiBold text-[#0D134C] mb-4">About the Nanny</h2>
              <p className="text-[#555555] leading-relaxed text-base sm:text-lg">
                {nanny.bio}
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
