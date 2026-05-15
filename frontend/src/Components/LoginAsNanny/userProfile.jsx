import { useSelector, useDispatch } from "react-redux";
import { useRef, useMemo, useState } from "react";
import Reviews from "../LoginAsFamily/subcomponents/Reviews";
import Ra from "../subComponents/rate";
import Prog from "../LoginAsFamily/subcomponents/progress";
import { NavLink } from "react-router-dom";
import Avatar from "react-avatar";
import { format, parseISO } from "date-fns";
import { customFormat } from "../subComponents/toCamelStr";
import { editUserThunk, verifyUserThunk, verifyCriminalRecordThunk } from "../Redux/authSlice";
import { fireToastMessage } from "../../toastContainer";
import { Spin, Modal, Upload, Button } from "antd";
import PhoneVerification from "../subComponents/PhoneVerification";
import {
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  MapPin,
  Clock,
  User,
  ShieldCheck,
  Languages,
  Briefcase,
  Baby,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Camera,
  Edit3,
} from "lucide-react";

export default function Profile() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const [uploading, setUploading] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isIDModalOpen, setIsIDModalOpen] = useState(false);
  const [isCriminalModalOpen, setIsCriminalModalOpen] = useState(false);
  const [idFiles, setIdFiles] = useState({ front: null, back: null });
  const [criminalRecordFile, setCriminalRecordFile] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const scrollRef = useRef(null);
  const scrollAmount = 300;

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

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

  const formatLocation = () => {
    if (!user?.zipCode || !user?.location?.format_location) return "Location not set";
    const parts = user?.location?.format_location.split(",") || [];
    const city = parts.at(-3)?.trim();
    const state = parts.at(-2)?.trim().split(" ")[0];
    return city && state ? `${city}, ${state}` : user?.location?.format_location;
  };

  const getInfo = (key) => user?.additionalInfo?.find((info) => info.key === key);

  const timingValue = getInfo("specificDaysAndTime")?.value;
  const salaryExp = getInfo("salaryExp")?.value;
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const isFullyVerified = user?.verified?.phoneVer &&
    user?.verified?.nationalIDVer === "true" &&
    user?.verified?.criminalRecordVer === "true";

  const isUnderProcess =
    user?.verified?.nationalIDVer === "underprocess" ||
    user?.verified?.criminalRecordVer === "underprocess";

  // Profile Strength Calculation
  const profileStrength = useMemo(() => {
    let score = 0;
    const total = 10;
    if (user?.imageUrl) score++;
    if (user?.location?.format_location) score++;
    if (getInfo("jobDescription")?.value) score++;
    if (getInfo("experience")?.value?.option) score++;
    if (getInfo("language")?.value?.option?.length > 0) score++;
    if (getInfo("salaryExp")?.value) score++;
    if (timingValue && Object.keys(timingValue).some(d => timingValue[d]?.checked)) score++;

    // Verifications
    if (user?.verified?.phoneVer) score++;
    if (user?.verified?.nationalIDVer === "true") score++;
    if (user?.verified?.criminalRecordVer === "true") score++;

    return {
      percentage: Math.round((score / total) * 100),
      completed: score,
      total: total,
      checklist: [
        { label: "Profile Photo", done: !!user?.imageUrl },
        { label: "Location Details", done: !!user?.location?.format_location },
        { label: "About Me / Bio", done: !!getInfo("jobDescription")?.value },
        { label: "Experience Details", done: !!getInfo("experience")?.value?.option },
        { label: "Languages", done: !!getInfo("language")?.value?.option?.length > 0 },
        { label: "Hourly Rates", done: !!getInfo("salaryExp")?.value },
        { label: "Weekly Schedule", done: !!(timingValue && Object.keys(timingValue).some(d => timingValue[d]?.checked)) },
        { label: "Phone Verification", done: !!user?.verified?.phoneVer },
        { label: "Identity Verified", done: user?.verified?.nationalIDVer === "true" },
        { label: "Criminal Record Check", done: user?.verified?.criminalRecordVer === "true" },
      ]
    };
  }, [user, timingValue]);

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

  const handleVerificationUpload = async (field, files) => {
    setVerifying(true);
    try {
      const formData = new FormData();
      if (field === "nationalIDVer") {
        if (!files.front || !files.back) {
          fireToastMessage({ type: "error", message: "Please upload both front and back images." });
          setVerifying(false);
          return;
        }
        formData.append("frontImage", files.front);
        formData.append("backImage", files.back);
        const res = await dispatch(verifyUserThunk(formData)).unwrap();
        if (res.status === 200) {
          fireToastMessage({ success: true, message: "ID submitted for verification!" });
          setIsIDModalOpen(false);
          setIdFiles({ front: null, back: null });
        }
      } else if (field === "criminalRecordVer") {
        formData.append("criminalRecordVer", files);
        const res = await dispatch(verifyCriminalRecordThunk(formData)).unwrap();
        if (res.status === 200) {
          fireToastMessage({ success: true, message: "Criminal record submitted for verification!" });
          setIsCriminalModalOpen(false);
        }
      }
    } catch (error) {
      fireToastMessage({ type: "error", message: error?.message || "Upload failed." });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-4 md:p-8 lg:p-12">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="Livvic-Bold text-2xl md:text-3xl text-primary">
            Welcome back, {user?.name?.split(" ")[0]}!
          </h1>
          <p className="Livvic text-secondary text-sm md:text-base mt-1">
            Here's what's happening with your profile today.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div
            onClick={() => {
              const element = document.getElementById('verification-section');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white p-2 rounded-full shadow-sm cursor-pointer relative"
          >
            <ShieldCheck className={`${isFullyVerified ? 'text-[#029E76]' : isUnderProcess ? 'text-amber-500' : 'text-tertiary'} w-5 h-5 transition-colors`} />
            {(isUnderProcess || !isFullyVerified) && (
              <span className={`absolute top-0 right-0 w-3 h-3 ${isUnderProcess ? 'bg-amber-500' : 'bg-red-500'} rounded-full border-2 border-white animate-pulse`}></span>
            )}
          </div>
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="profile" className="w-10 h-10 rounded-full object-cover shadow-sm" />
          ) : (
            <Avatar name={user?.name} size="40" round={true} color="#AEC4FF" />
          )}
        </div>
      </div>

      {/* Hero Banner Card */}
      <div className="bg-[#FFF4F7] rounded-[24px] p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center gap-6 shadow-sm border border-pink-50">
        <div className="relative">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt="profile"
              className={`w-24 h-24 md:w-32 md:h-32 rounded-[24px] object-cover shadow-md ${uploading ? 'opacity-50' : ''}`}
            />
          ) : (
            <Avatar
              name={user?.name}
              size="128"
              className={`rounded-[24px] shadow-md border-4 border-white ${uploading ? 'opacity-50' : ''}`}
              color="#38AEE3"
            />
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spin size="small" />
            </div>
          )}
          <label className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-full border-4 border-[#FFF4F7] shadow-sm cursor-pointer hover:scale-110 transition-transform">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <Camera className="w-4 h-4 text-white" />
          </label>
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
            <h2 className="Livvic-Bold text-2xl md:text-3xl text-primary">{user?.name}</h2>
            <span className="bg-[#AEC4FF] text-[#4A69BD] px-4 py-1.5 Livvic-SemiBold text-xs px-3 py-1 rounded-full w-fit mx-auto md:mx-0">
              NANNY
            </span>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-secondary">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#FF7D9E]" />
              <span className="Livvic-Medium text-sm">{formatLocation()}</span>
            </div>
            {isFullyVerified && (
              <div className="flex items-center gap-1.5 bg-[#029E76]/10 px-3 py-1 rounded-lg border border-[#029E76]/20">
                <ShieldCheck className="w-4 h-4 text-[#029E76]" />
                <span className="Livvic-Bold text-[#029E76] text-xs">Verified Professional</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto">
          <NavLink to="/nanny/edit" className="w-full">
            <button className="bg-primary hover:bg-[#9DB4F0] text-primary Livvic-SemiBold px-8 py-2.5 rounded-full transition-all w-full md:w-auto shadow-sm">
              Edit Profile
            </button>
          </NavLink>
          <button
            onClick={() => {
              const url = `${window.location.origin}/family/profileNanny/${user?._id}`;
              navigator.clipboard.writeText(url).then(() => fireToastMessage({ type: "success", message: "Link copied" }));
            }}
            className="flex items-center justify-center gap-2 text-secondary hover:text-primary Livvic-Medium text-sm px-4 py-2 transition-all"
          >
            <LinkIcon className="w-4 h-4" />
            Copy Profile Link
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Profile Details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic Information */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="Livvic-Bold text-lg text-primary flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Basic Information
              </h3>
              <NavLink to="/nanny/edit" className="text-primary Livvic-SemiBold text-sm hover:underline">Edit</NavLink>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
              <div>
                <p className="Livvic text-secondary text-xs uppercase tracking-wider mb-1">Gender</p>
                <p className="Livvic-SemiBold text-primary">{user?.gender || "Not specified"}</p>
              </div>
              <div>
                <p className="Livvic text-secondary text-xs uppercase tracking-wider mb-1">Age</p>
                <p className="Livvic-SemiBold text-primary">{user?.age ? `${user.age} Years` : "Not specified"}</p>
              </div>
              <div>
                <p className="Livvic text-secondary text-xs uppercase tracking-wider mb-1">Zip Code</p>
                <p className="Livvic-SemiBold text-primary">{user?.zipCode || "Not set"}</p>
              </div>
              <div className="col-span-full">
                <p className="Livvic text-secondary text-xs uppercase tracking-wider mb-1">Languages</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {getInfo("language")?.value?.option?.map((lang, i) => (
                    <span key={i} className="bg-gray-50 border border-gray-100 px-3 py-1 rounded-full text-sm Livvic-Medium text-primary flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5 text-secondary" />
                      {lang}
                    </span>
                  )) || <p className="text-gray-400 Livvic italic">No languages listed</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Experience & Services */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="Livvic-Bold text-lg text-primary flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Experience & Services
              </h3>
              <NavLink to="/nanny/edit" className="flex items-center gap-2 text-[#8ba7ff] hover:text-[#AEC4FF] transition-all">
                <Edit3 size={18} />
                <span className="Livvic-SemiBold">Edit</span>
              </NavLink>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50/50 p-4 rounded-[16px] border border-blue-50">
                  <p className="Livvic text-secondary text-xs uppercase tracking-wider mb-1">Total Experience</p>
                  <p className="Livvic-SemiBold text-primary text-lg">
                    {getInfo("experience")?.value?.option || "Not specified"}
                  </p>
                </div>
                <div className="bg-green-50/50 p-4 rounded-[16px] border border-green-50">
                  <p className="Livvic text-secondary text-xs uppercase tracking-wider mb-1">Availability Type</p>
                  <p className="Livvic-SemiBold text-primary text-lg">
                    {getInfo("interestedChildcare")?.value?.option || "Not specified"}
                  </p>
                </div>
              </div>

              <div>
                <p className="Livvic-SemiBold text-primary text-sm mb-3 flex items-center gap-2">
                  <Baby className="w-4 h-4" /> Age Group Expertise
                </p>
                <div className="flex flex-wrap gap-2">
                  {getInfo("ageGroupsExp")?.value?.option?.map((v, i) => (
                    <span key={i} className="bg-white border border-gray-200 px-4 py-2 rounded-[12px] text-sm Livvic-Medium text-secondary shadow-sm">
                      {customFormat(v)}
                    </span>
                  )) || <p className="text-gray-400 Livvic italic">None listed</p>}
                </div>
              </div>

              <div>
                <p className="Livvic-SemiBold text-primary text-sm mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Additional Specializations
                </p>
                <div className="flex flex-wrap gap-2">
                  {getInfo("additionalDetails")?.value?.option?.map((det, i) => (
                    <span key={i} className="bg-[#F8F9FB] text-secondary px-3 py-1.5 rounded-lg text-xs Livvic-Medium border border-gray-100">
                      {det}
                    </span>
                  )) || <p className="text-gray-400 Livvic italic">None listed</p>}
                </div>
              </div>
            </div>
          </div>

          {/* About Me Section */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="Livvic-Bold text-lg text-primary">About Me</h3>
              <NavLink to="/nanny/edit" className="flex items-center gap-2 text-[#8ba7ff] hover:text-[#AEC4FF] transition-all">
                <Edit3 size={18} />
                <span className="Livvic-SemiBold">Edit</span>
              </NavLink>
            </div>
            <p className="Livvic text-[#555555] leading-relaxed">
              {getInfo("jobDescription")?.value || "Tell families about your passion for childcare, your approach, and what makes you a great nanny."}
            </p>
          </div>

          {/* Schedule Section */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="Livvic-Bold text-lg text-primary flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Weekly Schedule
              </h3>
              <NavLink to="/nanny/edit" className="flex items-center gap-2 text-[#8ba7ff] hover:text-[#AEC4FF] transition-all">
                <Edit3 size={18} />
                <span className="Livvic-SemiBold">Edit</span>
              </NavLink>
            </div>
            <div className="flex flex-wrap gap-4">
              {days.map((day) => {
                const isChecked = timingValue?.[day]?.checked;
                const start = timingValue?.[day]?.start;
                const end = timingValue?.[day]?.end;

                return (
                  <div key={day} className={`flex-1 min-w-[140px] p-4 rounded-[20px] border transition-all ${isChecked ? 'bg-primary/5 border-primary shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                    <p className={`Livvic-Bold text-sm mb-2 ${isChecked ? 'text-primary' : 'text-secondary'}`}>{day.slice(0, 3)}</p>
                    {isChecked && start && end ? (
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase text-secondary Livvic-Medium tracking-wider">Available</p>
                        <p className="Livvic-SemiBold text-primary text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(parseISO(start), "hh:mm a")} - {format(parseISO(end), "hh:mm a")}
                        </p>
                      </div>
                    ) : (
                      <p className="Livvic-Medium text-xs text-secondary italic">Off Day</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hourly Rates */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="Livvic-Bold text-lg text-primary flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Service Pricing
              </h3>
              <NavLink to="/nanny/edit" className="flex items-center gap-2 text-[#8ba7ff] hover:text-[#AEC4FF] transition-all">
                <Edit3 size={18} />
                <span className="Livvic-SemiBold">Edit</span>
              </NavLink>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: "1 Child", key: "firstChild" },
                { label: "2 Children", key: "secChild" },
                { label: "3 Children", key: "thirdChild" },
                { label: "4 Children", key: "fourthChild" },
                { label: "5+ Children", key: "fiveOrMoreChild" },
              ].map((item, i) => (
                <div key={i} className="bg-white border border-gray-100 p-4 rounded-[20px] shadow-sm hover:shadow-md transition-shadow text-center">
                  <p className="Livvic text-secondary text-[10px] uppercase tracking-tighter mb-1">{item.label}</p>
                  <p className="Livvic-Bold text-primary text-xl">
                    ${getInfo("salaryExp")?.value?.[item.key] || "0"}<span className="text-xs font-normal">/h</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="Livvic-Bold text-lg text-primary">Reviews & Ratings</h3>
            </div>
            {totalReviews > 0 ? (
              <div>
                <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                  <div className="text-center bg-gray-50 p-6 rounded-[24px] min-w-[160px]">
                    <p className="Livvic-Bold text-5xl text-primary mb-2">{user?.averageRating}</p>
                    <Ra points={user?.averageRating} size={20} />
                    <p className="Livvic-Medium text-secondary text-sm mt-2">{totalReviews} Reviews</p>
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    {ratingPercentages.map(({ num, pro }, i) => (
                      <Prog key={i} num={num} pro={pro} color={"#029E76"} />
                    ))}
                  </div>
                </div>

                <div className="relative group">
                  <div className="flex justify-end gap-2 mb-4">
                    <button onClick={scrollLeft} className="p-2 rounded-full border border-gray-200 hover:bg-primary/10 transition-colors">
                      <ChevronLeft className="w-5 h-5 text-primary" />
                    </button>
                    <button onClick={scrollRight} className="p-2 rounded-full border border-gray-200 hover:bg-primary/10 transition-colors">
                      <ChevronRight className="w-5 h-5 text-primary" />
                    </button>
                  </div>
                  <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-hidden scroll-smooth pb-4"
                  >
                    {user?.reviews?.map((v, i) => (
                      <div key={i} className="min-w-[280px] md:min-w-[320px]">
                        <Reviews
                          size={13.5}
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
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-[24px] border border-dashed border-gray-200">
                <p className="Livvic-Medium text-secondary">No reviews yet. Complete bookings to get rated!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Status & Preview */}
        <div className="space-y-6">

          {/* Profile Strength Card */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
            <h3 className="Livvic-Bold text-lg text-primary mb-6">Profile Strength</h3>

            <div className="flex justify-center mb-8">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="#F3F4F6"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="#FF7D9E"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={364.4}
                    strokeDashoffset={364.4 - (364.4 * profileStrength.percentage) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="Livvic-Bold text-2xl text-primary">{profileStrength.percentage}%</span>
                  <span className="Livvic text-secondary text-[10px] uppercase tracking-tighter">Completed</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {profileStrength.checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.done ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {item.done ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#029E76]" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>
                  <span className={`Livvic-Medium text-sm ${item.done ? 'text-primary' : 'text-secondary'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {profileStrength.percentage < 100 && (
              <NavLink to="/nanny/edit">
                <button className="w-full mt-6 bg-primary/10 text-primary hover:bg-primary/20 Livvic-SemiBold py-3 rounded-xl transition-colors text-sm">
                  Complete Your Profile
                </button>
              </NavLink>
            )}
          </div>

          {/* Identity Verifications */}
          <div id="verification-section" className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 scroll-mt-24">
            <h3 className="Livvic-Bold text-lg text-primary mb-4">Verifications</h3>
            <ul className="space-y-4">
              <li
                onClick={() => !user?.verified?.phoneVer && setIsPhoneModalOpen(true)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${user?.verified?.phoneVer ? 'bg-[#029E76]/5 border-[#029E76]/20' : 'bg-gray-50/50 border-gray-50 hover:bg-primary/5 hover:border-primary/20'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-xs">
                    <ShieldCheck className={`w-4 h-4 ${user?.verified?.phoneVer ? 'text-[#029E76]' : 'text-tertiary'}`} />
                  </div>
                  <span className="Livvic-Medium text-sm text-primary">Phone Number</span>
                </div>
                {user?.verified?.phoneVer ? (
                  <CheckCircle2 className="w-4 h-4 text-[#029E76]" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
              </li>
              <li
                onClick={() => user?.verified?.nationalIDVer !== "true" && setIsIDModalOpen(true)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${user?.verified?.nationalIDVer === "true" ? 'bg-[#029E76]/5 border-[#029E76]/20' : 'bg-gray-50/50 border-gray-50 hover:bg-primary/5 hover:border-primary/20'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-xs">
                    <ShieldCheck className={`w-4 h-4 ${user?.verified?.nationalIDVer === "true" ? 'text-[#029E76]' : 'text-tertiary'}`} />
                  </div>
                  <span className="Livvic-Medium text-sm text-primary">National ID</span>
                </div>
                <div className="flex items-center gap-2">
                  {user?.verified?.nationalIDVer === "true" ? (
                    <CheckCircle2 className="w-4 h-4 text-[#029E76]" />
                  ) : user?.verified?.nationalIDVer === "underprocess" ? (
                    <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                      <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                      <span className="text-[10px] Livvic-Bold text-amber-600">Pending</span>
                    </div>
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                </div>
              </li>
              <li
                onClick={() => user?.verified?.criminalRecordVer !== "true" && setIsCriminalModalOpen(true)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${user?.verified?.criminalRecordVer === "true" ? 'bg-[#029E76]/5 border-[#029E76]/20' : 'bg-gray-50/50 border-gray-50 hover:bg-primary/5 hover:border-primary/20'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-xs">
                    <ShieldCheck className={`w-4 h-4 ${user?.verified?.criminalRecordVer === "true" ? 'text-[#029E76]' : 'text-tertiary'}`} />
                  </div>
                  <span className="Livvic-Medium text-sm text-primary">Criminal Record</span>
                </div>
                <div className="flex items-center gap-2">
                  {user?.verified?.criminalRecordVer === "true" ? (
                    <CheckCircle2 className="w-4 h-4 text-[#029E76]" />
                  ) : user?.verified?.criminalRecordVer === "underprocess" ? (
                    <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                      <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                      <span className="text-[10px] Livvic-Bold text-amber-600">Pending</span>
                    </div>
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                </div>
              </li>
            </ul>
            <button className="w-full mt-4 text-primary Livvic-SemiBold text-xs hover:underline py-2">
              Learn about verification
            </button>
          </div>

          {/* Public Profile Preview */}
          <div className="bg-[#FFF8FA] rounded-[24px] p-6 md:p-8 border border-pink-100/50">
            <h3 className="text-center text-lg Livvic-Bold text-primary mb-6">Your Public Profile</h3>

            <div className="bg-white rounded-[20px] p-5 shadow-sm border border-pink-50">
              <div className="flex gap-4 items-start mb-4">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} className="w-14 h-14 rounded-xl object-cover" alt="Avatar" />
                ) : (
                  <Avatar name={user?.name} size="56" round="12px" />
                )}
                <div>
                  <h5 className="Livvic-Bold text-primary">{user?.name}</h5>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="flex items-center gap-1 text-[10px] text-gray-500 Livvic-Bold">
                      <Clock size={10} className="text-[#AEC4FF]" /> {getInfo("experience")?.value?.option || "1-3 years"}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-500 Livvic-Bold">
                      <Briefcase size={10} className="text-[#AEC4FF]" /> {getInfo("avaiForWorking")?.value?.option || "Full-time"}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-500 Livvic-Bold">
                      <MapPin size={10} className="text-[#AEC4FF]" /> {formatLocation().split(",")[0]}
                    </span>
                  </div>
                  <p className="text-[10px] text-tertiary Livvic-Bold mt-1">
                    ${salaryExp?.firstChild || "20"}/hr • {getInfo("ageGroupsExp")?.value?.option?.[0] || "Toddlers"}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 Livvic-Bold mb-1">About</p>
                <p className="text-[11px] text-gray-600 Livvic-Medium line-clamp-2">
                  {getInfo("jobDescription")?.value || "Tell families about your approach, skills, and background..."}
                </p>
              </div>

              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 Livvic-Bold mb-2">Availability</p>
                <div className="flex gap-1.5">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => {
                    const dayName = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][idx];
                    const isAvailable = timingValue && timingValue[dayName]?.checked;
                    return (
                      <div
                        key={idx}
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] Livvic-Bold ${isAvailable ? "bg-[#AEC4FF] text-white" : "bg-gray-50 text-gray-300"
                          }`}
                      >
                        {day[0]}
                      </div>
                    );
                  })}
                </div>
              </div>

              <NavLink to={`/family/profileNanny/${user?._id}`} className="block">
                <button className="w-full bg-[#FFF8FA] text-primary border border-pink-100 hover:bg-pink-50 transition-colors Livvic-SemiBold py-2 rounded-xl text-xs">
                  View Public Profile
                </button>
              </NavLink>
            </div>
            <p className="text-[11px] text-secondary text-center mt-4 Livvic-Medium">
              This is how families see your profile in search results.
            </p>
          </div>

        </div>
      </div>

      {/* Verification Modals */}
      <Modal
        title={null}
        footer={null}
        open={isPhoneModalOpen}
        onCancel={() => setIsPhoneModalOpen(false)}
        width={450}
        centered
        className="verification-modal"
      >
        <div className="py-6 px-2">
          <PhoneVerification />
        </div>
      </Modal>

      <Modal
        title="Identity Verification"
        footer={null}
        open={isIDModalOpen}
        onCancel={() => {
          setIsIDModalOpen(false);
          setIdFiles({ front: null, back: null });
        }}
        centered
        width={500}
      >
        <div className="py-6 text-center">
          <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="Livvic-Bold text-xl text-primary mb-2">National ID Verification</h3>
          <p className="Livvic text-secondary mb-8 text-sm px-4">
            Please upload clear photos of the front and back of your Government ID.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="space-y-2">
              <p className="text-xs Livvic-SemiBold text-secondary">Front Side</p>
              <Upload
                beforeUpload={(file) => {
                  setIdFiles(prev => ({ ...prev, front: file }));
                  return false;
                }}
                showUploadList={false}
              >
                <div className={`border-2 border-dashed rounded-xl overflow-hidden min-h-[80px] p-1 transition-all cursor-pointer flex items-center justify-center ${idFiles.front ? 'border-[#029E76] bg-[#029E76]/5' : 'border-gray-200 hover:border-primary'}`}>
                  {idFiles.front ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={URL.createObjectURL(idFiles.front)}
                        className="w-full h-32 object-cover"
                        alt="Front ID"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={20} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center gap-1">
                      <Camera size={20} />
                      <span className="text-[10px]">Upload Front</span>
                    </div>
                  )}
                </div>
              </Upload>
            </div>

            <div className="space-y-2">
              <p className="text-xs Livvic-SemiBold text-secondary">Back Side</p>
              <Upload
                beforeUpload={(file) => {
                  setIdFiles(prev => ({ ...prev, back: file }));
                  return false;
                }}
                showUploadList={false}
              >
                <div className={`border-2 border-dashed rounded-xl overflow-hidden min-h-[80px] p-1 transition-all cursor-pointer flex items-center justify-center ${idFiles.back ? 'border-[#029E76] bg-[#029E76]/5' : 'border-gray-200 hover:border-primary'}`}>
                  {idFiles.back ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={URL.createObjectURL(idFiles.back)}
                        className="w-full h-32 object-cover"
                        alt="Back ID"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={20} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center gap-1">
                      <Camera size={20} />
                      <span className="text-[10px]">Upload Back</span>
                    </div>
                  )}
                </div>
              </Upload>
            </div>
          </div>

          <Button
            type="primary"
            loading={verifying}
            disabled={!idFiles.front || !idFiles.back}
            onClick={() => handleVerificationUpload("nationalIDVer", idFiles)}
            className="bg-primary w-full h-12 rounded-xl Livvic-SemiBold shadow-lg shadow-primary/20"
          >
            Submit for Verification
          </Button>
        </div>
      </Modal>

      <Modal
        title="Criminal Record Check"
        footer={null}
        open={isCriminalModalOpen}
        onCancel={() => setIsCriminalModalOpen(false)}
        centered
      >
        <div className="py-8 text-center">
          <Briefcase className="w-16 h-16 text-primary mx-auto mb-4" />
          <h3 className="Livvic-Bold text-xl text-primary mb-2">Criminal Background Check</h3>
          <p className="Livvic text-secondary mb-6 px-4">
            Upload your latest criminal record clearance or background check document.
          </p>
          <Upload
            beforeUpload={(file) => {
              setCriminalRecordFile(file);
              return false;
            }}
            showUploadList={false}
          >
            <div className={`border-2 border-dashed rounded-2xl mb-6 p-6 transition-all cursor-pointer ${criminalRecordFile ? 'border-[#029E76] bg-[#029E76]/5' : 'border-gray-200 hover:border-primary'}`}>
              {criminalRecordFile ? (
                <div className="flex flex-col items-center gap-2">
                  {criminalRecordFile.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(criminalRecordFile)}
                      className="max-h-40 rounded-lg shadow-sm"
                      alt="Criminal Record"
                    />
                  ) : (
                    <div className="p-4 bg-white rounded-xl shadow-sm">
                      <Briefcase size={32} className="text-[#029E76]" />
                    </div>
                  )}
                  <span className="text-sm Livvic-SemiBold text-primary truncate max-w-[200px]">
                    {criminalRecordFile.name}
                  </span>
                </div>
              ) : (
                <div className="text-gray-400 flex flex-col items-center gap-2">
                  <div className="p-3 bg-gray-50 rounded-full">
                    <Camera size={24} />
                  </div>
                  <span className="text-sm">Select clearance document</span>
                </div>
              )}
            </div>
          </Upload>

          <Button
            type="primary"
            loading={verifying}
            disabled={!criminalRecordFile}
            onClick={() => handleVerificationUpload("criminalRecordVer", criminalRecordFile)}
            className="bg-primary w-full h-12 rounded-xl Livvic-SemiBold shadow-lg shadow-primary/20"
          >
            Submit for Verification
          </Button>
        </div>
      </Modal>
    </div>
  );
}
