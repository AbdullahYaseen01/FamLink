import React, { useState } from "react";
import { X } from "lucide-react";

export default function LaunchNeighborhoodModal({ onClose }) {
  const [formData, setFormData] = useState({
    neighborhood: "",
    zipCode: "",
    accountType: "Family"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder submission action
    console.log("Submitting new neighborhood request:", formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-end sm:justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl flex flex-col animate-in fade-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8ECF4]">
          <h2 className="Livvic-Bold text-xl text-[#001243]">Launch a new neighborhood</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-500 text-sm mb-6">
            We're not in your area yet, but we'd love to be! Let us know where you are and we'll notify you when we launch.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm Livvic-SemiBold text-[#001243] mb-1">
                Neighborhood / City Name
              </label>
              <input
                type="text"
                required
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                placeholder="e.g. Rockridge, Oakland"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8ECF4] text-sm focus:outline-none focus:border-[#AEC4FF] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm Livvic-SemiBold text-[#001243] mb-1">
                Zip Code
              </label>
              <input
                type="text"
                required
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                placeholder="e.g. 94618"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8ECF4] text-sm focus:outline-none focus:border-[#AEC4FF] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm Livvic-SemiBold text-[#001243] mb-2">
                I am a...
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="accountType"
                    value="Family"
                    checked={formData.accountType === "Family"}
                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                    className="w-4 h-4 text-[#AEC4FF] focus:ring-[#AEC4FF]"
                  />
                  <span className="text-sm text-[#001243]">Family</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="accountType"
                    value="Nanny"
                    checked={formData.accountType === "Nanny"}
                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                    className="w-4 h-4 text-[#AEC4FF] focus:ring-[#AEC4FF]"
                  />
                  <span className="text-sm text-[#001243]">Nanny</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-[#AEC4FF] text-[#001243] Livvic-SemiBold py-3 rounded-xl transition-colors hover:bg-[#9BB4F5]"
            >
              Submit Request
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
