import React, { useState } from "react";
import { X, Copy, Check } from "lucide-react";
import { useSelector } from "react-redux";
import { neighborhoodInviteLink } from "../../Config/neighborhoodCatalog";

export default function WaitlistShareModal({ onClose, launchData }) {
  const { user } = useSelector((s) => s.auth);
  const [copied, setCopied] = useState(false);
  
  const neighborhood = launchData?.neighborhood || "Your neighborhood";
  const families = launchData?.families ?? 0;
  const nannies = launchData?.nannies ?? 0;
  const familyNeed = launchData?.familyNeed ?? 8;
  const nannyNeed = launchData?.nannyNeed ?? 3;

  const inviteLink = neighborhoodInviteLink(user?.sheetId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const familiesLeft = Math.max(0, familyNeed - families);
  const nanniesLeft = Math.max(0, nannyNeed - nannies);

  const familyText = familiesLeft === 0 ? "more Families" : `${familiesLeft} ${familiesLeft === 1 ? "Family" : "Families"}`;
  const nannyText = nanniesLeft === 0 ? "more Nannies" : `${nanniesLeft} ${nanniesLeft === 1 ? "Nanny" : "Nannies"}`;

  let dynamicHelpText = (
    <>
      Help us get {familyText} and {nannyText} in <span className="Livvic-Bold text-[#001243]">{neighborhood}</span> to launch active matching!
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 transition"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#EEF3FF] flex items-center justify-center mx-auto mb-4">
            <span className="text-[#AEC4FF] text-2xl Livvic-Bold">F</span>
          </div>
          <h2 className="text-2xl Livvic-Bold text-[#001243] mb-2">Share Details</h2>
          <p className="text-gray-500 text-sm">
            {dynamicHelpText}
          </p>
        </div>

        <div className="bg-[#F9FAFB] border border-[#E8ECF4] rounded-2xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-[12px] Livvic-Bold text-[#001243] mb-1">
                <span>Families</span>
                <span>{families} of {familyNeed}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#EEF3FF] overflow-hidden">
                <div className="h-full rounded-full bg-[#AEC4FF]" style={{ width: `${Math.min(100, (families / familyNeed) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[12px] Livvic-Bold text-[#001243] mb-1">
                <span>Nannies</span>
                <span>{nannies} of {nannyNeed}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#FFF7ED] overflow-hidden">
                <div className="h-full rounded-full bg-[#F97316]" style={{ width: `${Math.min(100, (nannies / nannyNeed) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-2">
          <label className="block text-xs Livvic-Bold text-gray-500 uppercase tracking-wide mb-2">
            Your Invite Link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 truncate">
              {inviteLink}
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center justify-center w-12 h-12 rounded-xl transition-colors shrink-0 ${
                copied ? "bg-[#10B981] text-white" : "bg-[#AEC4FF] text-[#001243] hover:bg-[#9BB4F5]"
              }`}
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
