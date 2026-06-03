import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ChevronLeft, MapPin, Users, Clock, Calendar, Heart, Baby } from "lucide-react";
import CustomButton from "../../NewComponents/Button";
import { fetchNannyByIdThunk } from "../../Components/Redux/nannyData";
import Avatar from "react-avatar";

export default function FamilyProfileView() {
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

  const family = {
    name: selectedNanny.name,
    goal: selectedNanny.goal || "Looking for a nanny share",
    children: childrenStr,
    schedule: profile.nannyShareType || "Schedule not specified",
    location: formatLocation(),
    budget: budgetStr,
    startDate: profile.nannyshareStart || "Flexible",
    bio: selectedNanny.aboutMe || profile.careDescription || profile.openNotes || "No bio provided.",
    img: selectedNanny.imageUrl || profile.imageFile,
    preferences: [
      profile.hasNanny ? "Already have a nanny" : "Looking for a nanny",
      profile.flexible || "Schedule flexibility not specified",
      profile.urgency || "Urgency not specified",
      profile.prefferedCommunication || "Communication preference not specified"
    ].filter(Boolean)
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Premium Header */}
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
                {family.img ? (
                  <img
                    src={family.img}
                    alt={family.name}
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover shadow-sm shrink-0"
                  />
                ) : (
                  <div className="shrink-0">
                    <Avatar
                      name={family.name?.charAt(0)}
                      size="160"
                      round="16px"
                      color="#38AEE3"
                      className="shadow-sm w-32 h-32 sm:w-40 sm:h-40"
                    />
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

              <div className="mt-8">
                <h3 className="text-lg Livvic-SemiBold text-[#0D134C] mb-4">Preferences & Requirements</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {family.preferences.map((pref, index) => (
                    <div key={index} className="flex items-center gap-3 bg-[#F8F9FA] p-3 rounded-xl border border-[#EAEAEA]">
                      <div className="w-8 h-8 rounded-full bg-[#E5F6FF] text-[#38AEE3] flex items-center justify-center shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                      <span className="Livvic-Medium text-[#0D134C]">{pref}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Details Sticky Sidebar */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#EAEAEA] shadow-sm sticky top-[100px]">
              <h3 className="text-xl Livvic-SemiBold text-[#0D134C] mb-6">Share Details</h3>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0">
                    <Baby className="text-[#555555]" size={20} />
                  </div>
                  <div>
                    <p className="text-[#555555] text-sm mb-1">Children</p>
                    <p className="Livvic-SemiBold text-[#0D134C]">{family.children}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0">
                    <Clock className="text-[#555555]" size={20} />
                  </div>
                  <div>
                    <p className="text-[#555555] text-sm mb-1">Schedule Needed</p>
                    <p className="Livvic-SemiBold text-[#0D134C]">{family.schedule}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0">
                    <span className="Livvic-Bold text-[#555555] text-lg">$</span>
                  </div>
                  <div>
                    <p className="text-[#555555] text-sm mb-1">Budget</p>
                    <p className="Livvic-SemiBold text-[#0D134C]">{family.budget}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0">
                    <Calendar className="text-[#555555]" size={20} />
                  </div>
                  <div>
                    <p className="text-[#555555] text-sm mb-1">Target Start Date</p>
                    <p className="Livvic-SemiBold text-[#0D134C]">{family.startDate}</p>
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
