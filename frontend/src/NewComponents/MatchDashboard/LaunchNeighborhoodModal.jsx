import React, { useState, useEffect } from "react";
import { X, Loader2, MapPin, Send } from "lucide-react";
import { api } from "../../Config/api";
import { fireToastMessage } from "../../toastContainer";
import Autocomplete from "react-google-autocomplete";
import { Spin } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function LaunchNeighborhoodModal({ onClose }) {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    neighborhood: "",
    city: "",
    tract_geoid: "",
    zipCode: "",
    accountType: user?.type === "Parents" ? "Family" : user?.type === "Nanny" ? "Nanny" : "",
    email: user?.email || ""
  });
  
  const [locationText, setLocationText] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [neighborhoodStatus, setNeighborhoodStatus] = useState(null); // { status, families, nannies, ... }

  const handlePlaceSelected = async (place) => {
    setLocationLoading(true);
    try {
      const components = place?.address_components || [];
      const get = (type) => components.find((c) => c.types.includes(type))?.long_name || "";
      
      const extractedCity = get("locality") || get("administrative_area_level_2");
      const extractedNeighborhood = get("neighborhood") || get("sublocality_level_1") || get("sublocality") || extractedCity || "";
      const zipCode = get("postal_code");
      
      const newFormData = {
        ...formData,
        neighborhood: extractedNeighborhood,
        city: extractedCity,
        zipCode: zipCode,
      };
      
      setFormData(newFormData);
      
      const displayLoc = extractedNeighborhood !== extractedCity 
        ? `${extractedNeighborhood}, ${extractedCity}` 
        : extractedCity;
      setLocationText(displayLoc);

      // Check status
      setStatusLoading(true);
      const res = await api.post("/api/neighborhood/check-status", {
        city: extractedCity,
        neighborhood: extractedNeighborhood,
      });
      setNeighborhoodStatus(res.data);
      setStep(2);
    } catch (err) {
      console.error("Error checking status:", err);
      fireToastMessage({ type: "error", message: "Failed to verify location. Please try again." });
    } finally {
      setLocationLoading(false);
      setStatusLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!formData.accountType) {
      fireToastMessage({ type: "error", message: "Please select if you are a Family or Nanny." });
      return;
    }
    if (!user && !formData.email) {
      fireToastMessage({ type: "error", message: "Please enter your email to be notified." });
      return;
    }

    setSubmitLoading(true);
    
    try {
      await api.post("/api/neighborhood/launch-request", formData);
      fireToastMessage({
        success: true,
        message: "Request submitted! We'll notify you when we launch."
      });
      onClose();
    } catch (error) {
      console.error("Error submitting launch request:", error);
      fireToastMessage({
        type: "error",
        message: error.response?.data?.message || "Failed to submit request. Please try again."
      });
    } finally {
      setSubmitLoading(false);
    }
  };
  
  const handleGoToMatch = () => {
    onClose();
    if (!user) {
      navigate("/");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-end sm:justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl flex flex-col animate-in fade-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8ECF4]">
          <h2 className="Livvic-Bold text-xl text-[#001243]">Launch a Neighborhood</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-500 text-sm mb-6">
            Help bring nanny share matching to your area.
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm Livvic-SemiBold text-[#001243] mb-1">
                Where would you like to launch?
              </label>
              <p className="text-xs text-gray-400 mb-2">Enter an address. We'll identify the neighborhood.</p>
              
              <Spin spinning={locationLoading} size="small">
                <div className="relative">
                  <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-400 z-10" />
                  <Autocomplete
                    apiKey={import.meta.env.VITE_GOOGLE_KEY}
                    value={locationText}
                    onPlaceSelected={handlePlaceSelected}
                    onChange={(e) => setLocationText(e.target.value)}
                    options={{ types: ["geocode"], componentRestrictions: { country: "us" } }}
                    placeholder="Enter your street address"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8ECF4] text-sm focus:outline-none focus:border-[#AEC4FF] transition-colors bg-white font-medium text-[#001243]"
                  />
                </div>
              </Spin>
            </div>
            
            {/* Step 1 Empty State */}
            {step === 1 && !statusLoading && (
              <div className="bg-[#f0f4fc] border border-[#dce5fa] rounded-2xl p-6 text-center">
                <p className="text-sm text-[#001243] Livvic-Medium">
                  Your neighborhood and its launch progress will show up here once you enter an address above.
                </p>
              </div>
            )}
            
            {/* Step 2 Dynamic States */}
            {step === 2 && neighborhoodStatus && (
              <div className={`border rounded-2xl p-5 ${neighborhoodStatus.status === 'active' ? 'bg-[#f3faeb] border-[#d4eab4]' : 'bg-[#f0f4fc] border-[#dce5fa]'}`}>
                <p className="text-[11px] Livvic-Bold tracking-wider text-gray-500 mb-1 uppercase">
                  {neighborhoodStatus.status === 'active' ? 'THIS NEIGHBORHOOD IS ALREADY ACTIVE' : neighborhoodStatus.families + neighborhoodStatus.nannies > 0 ? 'THIS NEIGHBORHOOD ALREADY EXISTS' : 'NEIGHBORHOOD'}
                </p>
                
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-lg Livvic-Bold text-[#001243]">{neighborhoodStatus.neighborhood}{neighborhoodStatus.city && neighborhoodStatus.neighborhood !== neighborhoodStatus.city ? `, ${neighborhoodStatus.city}` : ''}</h3>
                  <div className={`px-3 py-1 rounded-full text-xs Livvic-Bold flex items-center gap-1.5 ${neighborhoodStatus.status === 'active' ? 'bg-[#e4f4cf] text-[#4d7a16] border border-[#c1e592]' : 'bg-[#fff5e0] text-[#b37a1c] border border-[#f5dca3]'}`}>
                    <span className="text-lg leading-none mt-[-2px]">+</span>
                    {neighborhoodStatus.status === 'active' ? 'ACTIVE' : 'LAUNCHING'}
                  </div>
                </div>
                
                {neighborhoodStatus.status !== 'active' && (
                  <div className="space-y-3">
                    <p className="text-[11px] Livvic-Bold tracking-wider text-gray-500 mb-2 uppercase">
                      {neighborhoodStatus.neighborhood.toUpperCase()} LAUNCH PROGRESS
                    </p>
                    
                    <div>
                      <div className="flex justify-between text-sm Livvic-Bold text-[#001243] mb-1">
                        <span>Families</span>
                        <span className="text-gray-500">{Math.max(0, neighborhoodStatus.familyNeed - neighborhoodStatus.families)} more to launch</span>
                      </div>
                      <div className="h-2 w-full bg-[#E8ECF4] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#AEC4FF] rounded-full" 
                          style={{ width: `${Math.min(100, (neighborhoodStatus.families / neighborhoodStatus.familyNeed) * 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm Livvic-Bold text-[#001243] mb-1">
                        <span>Nannies</span>
                        <span className="text-gray-500">{Math.max(0, neighborhoodStatus.nannyNeed - neighborhoodStatus.nannies)} more to launch</span>
                      </div>
                      <div className="h-2 w-full bg-[#E8ECF4] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#AEC4FF] rounded-full" 
                          style={{ width: `${Math.min(100, (neighborhoodStatus.nannies / neighborhoodStatus.nannyNeed) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!user && step === 2 && neighborhoodStatus?.status !== 'active' && (
              <div>
                <label className="block text-sm Livvic-SemiBold text-[#001243] mb-1">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email to get notified"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8ECF4] text-sm focus:outline-none focus:border-[#AEC4FF] transition-colors"
                />
              </div>
            )}

            {!user && (!user?.type || user.type === "Guest") && (
              <div>
                <label className="block text-sm Livvic-SemiBold text-[#001243] mb-3">
                  I am a...
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.accountType === "Family" ? "border-[#AEC4FF] bg-[#f0f4fc]" : "border-gray-300 group-hover:border-[#AEC4FF]"}`}>
                      {formData.accountType === "Family" && <div className="w-2.5 h-2.5 bg-[#AEC4FF] rounded-full" />}
                    </div>
                    <input
                      type="radio"
                      name="accountType"
                      value="Family"
                      className="hidden"
                      checked={formData.accountType === "Family"}
                      onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                    />
                    <span className="text-sm Livvic-SemiBold text-[#001243]">Family</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.accountType === "Nanny" ? "border-[#AEC4FF] bg-[#f0f4fc]" : "border-gray-300 group-hover:border-[#AEC4FF]"}`}>
                      {formData.accountType === "Nanny" && <div className="w-2.5 h-2.5 bg-[#AEC4FF] rounded-full" />}
                    </div>
                    <input
                      type="radio"
                      name="accountType"
                      value="Nanny"
                      className="hidden"
                      checked={formData.accountType === "Nanny"}
                      onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                    />
                    <span className="text-sm Livvic-SemiBold text-[#001243]">Nanny</span>
                  </label>
                </div>
              </div>
            )}

            {step === 1 ? (
              <div className="w-full mt-2 bg-[#e9ecef] text-gray-400 Livvic-SemiBold py-3 rounded-xl flex items-center justify-center cursor-not-allowed">
                Enter an address to continue
              </div>
            ) : neighborhoodStatus?.status === 'active' ? (
              <button
                type="button"
                onClick={handleGoToMatch}
                className="w-full mt-2 bg-[#c9e8f5] text-[#001243] Livvic-Bold py-3.5 rounded-xl transition-colors hover:bg-[#b0dbed] flex items-center justify-center gap-2"
              >
                Go to Find a Match <span className="text-lg leading-none">→</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitLoading || (!formData.accountType) || (!user && !formData.email)}
                className="w-full mt-2 bg-[#c9e8f5] text-[#001243] Livvic-Bold py-3 rounded-xl transition-colors hover:bg-[#b0dbed] flex flex-col items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      <span>
                        {neighborhoodStatus.families + neighborhoodStatus.nannies > 0 
                          ? `Join ${neighborhoodStatus.neighborhood}` 
                          : `Launch ${neighborhoodStatus.neighborhood}`}
                      </span>
                    </div>
                    <span className="text-xs Livvic-Medium mt-0.5 opacity-70">
                      Get notified when it's active
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
