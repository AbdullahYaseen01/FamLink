import { useDispatch, useSelector } from "react-redux";
import { useRef, useState, useEffect } from "react";
import Avatar from "react-avatar";
import { format } from "date-fns";
import { NavLink } from "react-router-dom";
import {
  MapPin,
  Edit3,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  Camera
} from "lucide-react";
import Button from "../../NewComponents/Button";
import Ra from "../subComponents/rate";
import Prog from "./subcomponents/progress";
import Reviews from "./subcomponents/Reviews";
import { editUserThunk } from "../Redux/authSlice";
import { fetchNannyByIdThunk } from "../Redux/nannyData";
import { fireToastMessage } from "../../toastContainer";
import { Spin } from "antd";

export default function Profile() {
  const { user } = useSelector((s) => s.auth);
  const scrollRef = useRef(null);
  const dispatch = useDispatch();
  const [uploading, setUploading] = useState(false);
  const [nannyProfile, setNannyProfile] = useState(null);

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchNannyByIdThunk(user._id))
        .unwrap()
        .then((res) => {
           setNannyProfile(res?.nannyProfile || {});
        })
        .catch(console.log);
    }
  }, [user?._id, dispatch]);

  const handleImageChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("imageUrl", selectedFile);

        const res = await dispatch(editUserThunk(formData)).unwrap();
        if (res.status === 200) {
          fireToastMessage({
            type: "success",
            message: "Profile photo updated successfully!",
          });
        }
      } catch (error) {
        fireToastMessage({
          type: "error",
          message: "Failed to update profile photo.",
        });
      } finally {
        setUploading(false);
      }
    }
  };

  // --- Helper: Format Member Since ---
  const memberSince = user?.createdAt
    ? format(new Date(user.createdAt), "MMMM do")
    : "N/A";

  // --- Helper: Format Location ---
  const formatLocation = () => {
    if (!user?.location?.format_location) return "Location not set";
    const parts = user?.location?.format_location.split(",") || [];
    const city = parts.at(-3)?.trim();
    const state = parts.at(-2)?.trim().split(" ")[0];
    return city && state ? `${city}, ${state}` : user.location.format_location;
  };

  const getAdditionalInfo = (key) => {
    const keyMap = {
      specificDaysAndTime: "specificDays",
      flexible: "flexibility",
      hosting: "hostingPreference",
      prefferedCommunication: "communicationPreference",
      backupAvailable: "backupCare",
      hourlyRateSplit: "hourlyBudget"
    };
    const profileKey = keyMap[key] || key;

    if (nannyProfile && nannyProfile[profileKey] !== undefined && nannyProfile[profileKey] !== null) {
      let val = nannyProfile[profileKey];
      
      if (Array.isArray(val)) {
        val = val.map(item => {
          if (typeof item === 'string' && (item.startsWith('{') || item.startsWith('['))) {
            try { return JSON.parse(item); } catch (e) { return item; }
          }
          return item;
        }).flat();
      } else if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
        try { val = JSON.parse(val); } catch (e) {}
      }
      return val;
    }
    
    return Array.isArray(user?.additionalInfo)
      ? user?.additionalInfo?.find((info) => info.key === key)?.value
      : user?.additionalInfo?.[key];
  };

  // --- Helper: Get Schedule ---
  const timingValue = getAdditionalInfo("specificDaysAndTime");

  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // --- Scroll Logic for Reviews ---
  const scrollAmount = 300;
  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: scrollAmount, behavior: "smooth" });

  const ratingCount = user?.reviews?.reduce((acc, review) => {
    const rating = Math.floor(review.rating);
    acc[rating] = (acc[rating] || 0) + 1;
    return acc;
  }, {});

  const totalReviews = user?.reviews?.length || 0;
  const ratingPercentages = [5, 4, 3, 2, 1].map((num) => {
    const count = ratingCount?.[num] || 0;
    const pro = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { num, pro };
  });

  return (
    <div className="h-full overflow-y-auto bg-gray-50/30 p-4 md:p-8 lg:px-16 pb-24">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl Livvic-Bold text-gray-800">Welcome back, {user?.name?.split(" ")[0]}!</h1>
        <p className="text-gray-500 Livvic-Medium mt-1">Here's what's happening today</p>
      </div>

      {/* Profile Banner */}
      <div className="bg-[#FFF5F8] rounded-[24px] p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center gap-6 border border-pink-100/50">
        <div className="relative">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              className={`w-24 h-24 md:w-32 md:h-32 rounded-[20px] object-cover shadow-md ${uploading ? 'opacity-50' : ''}`}
              alt="Family"
            />
          ) : (
            <Avatar
              name={user?.name}
              size="128"
              round="20px"
              className={`shadow-md ${uploading ? 'opacity-50' : ''}`}
            />
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spin size="small" />
            </div>
          )}
          <label className="absolute -bottom-2 -right-2 bg-[#AEC4FF] p-2 rounded-full border-4 border-[#FFF5F8] cursor-pointer hover:bg-[#8ba7ff] transition-all shadow-sm">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <Camera size={16} className="text-white" />
          </label>
        </div>
        <div className="text-center md:text-left">
          <h2 className="text-2xl md:text-3xl Livvic-Bold text-gray-800">{user?.name}</h2>
          <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 mt-2">
            <MapPin size={18} className="text-gray-400" />
            <span className="Livvic-Medium">{user.type} in {formatLocation()}</span>
          </div>
          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
            <span className="bg-[#AEC4FF] text-[#4A69BD] px-4 py-1.5 rounded-full text-sm Livvic-SemiBold">
              {user.type}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-8">

          {/* Basic Information Card */}
          <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl Livvic-Bold text-gray-800">Basic Information</h3>
              <NavLink to="/dashboard/edit" className="flex items-center gap-2 text-[#8ba7ff] hover:text-[#AEC4FF] transition-all">
                <Edit3 size={18} />
                <span className="Livvic-SemiBold">Edit</span>
              </NavLink>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider Livvic-Bold">Family Name</p>
                <p className="text-[#001243] text-lg Livvic-SemiBold mt-1">{user?.name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider Livvic-Bold">Member Since</p>
                <p className="text-[#001243] text-lg Livvic-SemiBold mt-1">{memberSince}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider Livvic-Bold">Location</p>
                <p className="text-[#001243] text-lg Livvic-SemiBold mt-1">{formatLocation()}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider Livvic-Bold">Number of Kids</p>
                <p className="text-[#001243] text-lg Livvic-SemiBold mt-1">{user?.noOfChildren?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* Children Details Card */}
          <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl Livvic-Bold text-[#001243]">Children Details</h3>
              <NavLink to="/dashboard/edit" className="flex items-center gap-2 text-[#8ba7ff] hover:text-[#AEC4FF]">
                <Edit3 size={18} />
                <span className="Livvic-SemiBold">Edit</span>
              </NavLink>
            </div>
            <div className="space-y-6">
              {user?.noOfChildren?.info && Object.entries(user.noOfChildren.info).map(([key, age], index) => (
                <div key={index} className="flex items-center gap-12">
                  <div className="min-w-[120px]">
                    <p className="text-gray-400 text-xs uppercase tracking-wider Livvic-Bold">Children {index + 1}</p>
                    <p className="text-[#001243] text-lg Livvic-SemiBold mt-1">{key.replace("Child", "Child ")}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider Livvic-Bold">Age</p>
                    <p className="text-[#001243] text-lg Livvic-SemiBold mt-1">{age} Years</p>
                  </div>
                </div>
              ))}
              {(!user?.noOfChildren?.info || Object.keys(user.noOfChildren.info).length === 0) && (
                <p className="text-gray-500 Livvic-Medium italic">No children details added yet.</p>
              )}
            </div>
          </div>

          {/* Family Bio Card */}
          <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl Livvic-Bold text-[#001243]">Family Bio</h3>
              <NavLink to="/dashboard/edit" className="flex items-center gap-2 text-[#8ba7ff] hover:text-[#AEC4FF]">
                <Edit3 size={18} />
                <span className="Livvic-SemiBold">Edit</span>
              </NavLink>
            </div>
            <p className="text-gray-600 Livvic-Medium leading-relaxed">
              {user?.aboutMe || "Tell us about your family..."}
            </p>

            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl Livvic-Bold text-[#001243]">Schedule</h3>
                <NavLink to="/dashboard/edit" className="flex items-center gap-2 text-[#8ba7ff] hover:text-[#AEC4FF]">
                  <Edit3 size={18} />
                  <span className="Livvic-SemiBold">Edit</span>
                </NavLink>
              </div>
              <p className="text-gray-400 text-xs uppercase tracking-wider Livvic-Bold mb-3">Availability</p>
              <div className="flex gap-2">
                {days.map((day, idx) => {
                  const isAvailable = timingValue && timingValue[dayNames[idx]]?.checked;
                  return (
                    <div
                      key={idx}
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-sm md:text-base Livvic-Bold transition-all shadow-sm ${isAvailable
                        ? "bg-primary text-white shadow-primary/20"
                        : "bg-gray-100 text-gray-400"
                        }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Nanny Share Preferences Card */}
          <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl Livvic-Bold text-[#001243]">Nanny Share Preferences</h3>
              <NavLink to="/dashboard/edit" className="flex items-center gap-2 text-[#8ba7ff] hover:text-[#AEC4FF]">
                <Edit3 size={18} />
                <span className="Livvic-SemiBold">Edit</span>
              </NavLink>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider Livvic-Bold">Type of Care</p>
                <p className="text-[#001243] text-lg Livvic-SemiBold mt-1">{getAdditionalInfo("nannyShareType") || "Not set"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider Livvic-Bold">Have a Nanny?</p>
                <p className="text-[#001243] text-lg Livvic-SemiBold mt-1">{getAdditionalInfo("hasNanny") || "Not set"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider Livvic-Bold">Location</p>
                <p className="text-[#001243] text-lg Livvic-SemiBold mt-1">
                  {Array.isArray(getAdditionalInfo("shareLocation"))
                    ? getAdditionalInfo("shareLocation").join(", ")
                    : (getAdditionalInfo("shareLocation") || "Not set")}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider Livvic-Bold">Flexibility</p>
                <p className="text-[#001243] text-lg Livvic-SemiBold mt-1">{getAdditionalInfo("flexible") || "Not set"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider Livvic-Bold">Start Date</p>
                <p className="text-[#001243] text-lg Livvic-SemiBold mt-1">{getAdditionalInfo("nannyshareStart") || "Not set"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider Livvic-Bold">Urgency</p>
                <p className="text-[#001243] text-lg Livvic-SemiBold mt-1">{getAdditionalInfo("urgency") || "Not set"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider Livvic-Bold">Hosting Preference</p>
                <p className="text-[#001243] text-lg Livvic-SemiBold mt-1">{getAdditionalInfo("hosting") || "Not set"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider Livvic-Bold">Hourly Budget Split</p>
                <p className="text-[#001243] text-lg Livvic-SemiBold mt-1">{getAdditionalInfo("hourlyRateSplit") || "Not set"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider Livvic-Bold">Communication</p>
                <p className="text-[#001243] text-lg Livvic-SemiBold mt-1">{getAdditionalInfo("prefferedCommunication") || "Not set"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider Livvic-Bold">Backup Care</p>
                <p className="text-[#001243] text-lg Livvic-SemiBold mt-1">{getAdditionalInfo("backupAvailable") || "Not set"}</p>
              </div>
            </div>
            {(getAdditionalInfo("careDescription") || getAdditionalInfo("openNotes")) && (
              <div className="mt-6 space-y-4">
                {getAdditionalInfo("careDescription") && (
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider Livvic-Bold">Care Description</p>
                    <p className="text-[#001243] text-base Livvic-Medium mt-1">{getAdditionalInfo("careDescription")}</p>
                  </div>
                )}
                {getAdditionalInfo("openNotes") && (
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider Livvic-Bold">Additional Notes</p>
                    <p className="text-[#001243] text-base Livvic-Medium mt-1">{getAdditionalInfo("openNotes")}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <p className="text-xl Livvic-Bold text-gray-800 mb-6">Reviews</p>
            {user?.reviews && user?.reviews.length > 0 ? (
              <div className="mt-4">
                <div className="flex flex-col items-center md:flex-row justify-between gap-8">
                  <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
                    <div className="space-y-2 text-center sm:text-left">
                      <p className="Livvic-Bold text-4xl md:text-5xl text-gray-800">
                        {user?.averageRating}
                      </p>
                      <Ra points={user?.averageRating} size={20} />
                      <p className="Livvic-SemiBold text-sm text-gray-500 mt-2">
                        {user?.reviews.length} Reviews
                      </p>
                    </div>
                    <div className="flex-shrink-0 space-y-1">
                      {ratingPercentages.map(({ num, pro }, i) => (
                        <Prog key={i} num={num} pro={pro} color={"#029E76"} />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={scrollLeft}
                      className="p-3 rounded-full border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={scrollRight}
                      className="p-3 rounded-full border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
                <div
                  ref={scrollRef}
                  className="mt-10 flex flex-nowrap gap-6 overflow-x-hidden scroll-smooth snap-x snap-mandatory py-4"
                >
                  {user?.reviews?.map((v, i) => (
                    <div key={i} className="min-w-[300px] md:min-w-[400px] snap-center">
                      <Reviews
                        size={14}
                        points={v?.rating}
                        para={v?.msg}
                        name={v?.userId?.name}
                        img={v?.userId?.imageUrl}
                        hr={false}
                        created={v?.createdAt}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-[20px] border border-dashed border-gray-200">
                <p className="text-gray-500 Livvic-Medium">No reviews available yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-8">

          {/* Public Profile Preview */}
          <div className="bg-[#FFF8FA] rounded-[24px] p-6 md:p-8 border border-pink-100/50">
            <h4 className="text-center text-lg Livvic-Bold text-[#001243] mb-6">Your Public Profile</h4>

            <div className="bg-white rounded-[20px] p-5 shadow-sm border border-pink-50">
              <div className="flex gap-4 items-start mb-4">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} className="w-14 h-14 rounded-xl object-cover" alt="Avatar" />
                ) : (
                  <Avatar name={user?.name} size="56" round="12px" />
                )}
                <div>
                  <h5 className="Livvic-Bold text-[#001243]">{user?.name} Family</h5>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="flex items-center gap-1 text-[10px] text-gray-500 Livvic-Bold">
                      <Clock size={10} className="text-[#AEC4FF]" /> Afterschool
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-500 Livvic-Bold">
                      <Calendar size={10} className="text-[#AEC4FF]" /> Part-Time
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-500 Livvic-Bold">
                      <MapPin size={10} className="text-[#AEC4FF]" /> {formatLocation().split(",")[0]}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#AEC4FF] Livvic-Bold mt-1">Infant - School Age</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 Livvic-Bold mb-1">About</p>
                <p className="text-[11px] text-gray-600 Livvic-Medium line-clamp-3">
                  {user?.aboutMe || "Your family description will appear here..."}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 Livvic-Bold mb-2">Availability</p>
                <div className="flex gap-1.5">
                  {days.map((day, idx) => {
                    const isAvailable = timingValue && timingValue[dayNames[idx]]?.checked;
                    return (
                      <div
                        key={idx}
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] Livvic-Bold ${isAvailable ? "bg-[#AEC4FF] text-white" : "bg-gray-50 text-gray-300"
                          }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
