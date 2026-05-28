import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ChevronLeft, MapPin, Users, Clock, Calendar, Heart } from "lucide-react";
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

  // Map backend data to our premium layout
  const profile = selectedNanny?.nannyProfile || {};

  const formatLocation = () => {
    const parts = selectedNanny?.location?.format_location?.split(",") || [];
    const city = parts.at(-3)?.trim();
    const state = parts.at(-2)?.trim().split(" ")[0];
    return city && state ? `${city}, ${state}` : selectedNanny?.location?.format_location || "Location not specified";
  };

  const nanny = {
    name: selectedNanny.name,
    goal: selectedNanny.goal || "Looking for a family",
    experience: profile.careExperience || "Experience not specified",
    ages: profile.preferredAges?.join(", ") || "Ages not specified",
    schedule: profile.careType || "Schedule not specified",
    location: formatLocation(),
    sharedRate: profile.sharedRate || "Rate not specified",
    soloRate: profile.soloRate || "Rate not specified",
    availability: profile.startAvailability || "Availability not specified",
    bio: profile.bio || "No bio provided.",
    img: profile.imageFile || selectedNanny.imageUrl,
    certifications: profile.certifications || []
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
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
                {nanny.certifications.map((cert, index) => (
                  <div key={index} className="flex items-center gap-3 bg-[#F8F9FA] p-3 rounded-xl border border-[#EAEAEA]">
                    <div className="w-8 h-8 rounded-full bg-[#E5F6FF] text-[#38AEE3] flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className="Livvic-Medium text-[#0D134C]">{cert}</span>
                  </div>
                ))}
              </div>
            </div>

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
                    <Users className="text-[#555555]" size={20} />
                  </div>
                  <div>
                    <p className="text-[#555555] text-sm mb-1">Experience & Ages</p>
                    <p className="Livvic-SemiBold text-[#0D134C]">{nanny.experience}</p>
                    <p className="text-[#555555] text-sm mt-0.5">{nanny.ages}</p>
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
