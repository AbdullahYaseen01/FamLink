import { useEffect, useState } from "react";
import { X, Send } from "lucide-react";
import { useSelector } from "react-redux";
import { neighborhoodInviteLink } from "../../Config/neighborhoodCatalog";
import { fireToastMessage } from "../../toastContainer";
import StatusPill from "../StatusPill";
import { LaunchProgressSection } from "../LaunchProgressRows";

export default function WaitlistShareModal({ onClose, launchData }) {
  const { user } = useSelector((s) => s.auth);
  const [copied, setCopied] = useState(false);

  const neighborhood = launchData?.neighborhood || "Your neighborhood";
  const city = launchData?.city || "";
  const families = launchData?.families ?? 0;
  const nannies = launchData?.nannies ?? 0;
  const familyNeed = launchData?.familyNeed ?? 8;
  const nannyNeed = launchData?.nannyNeed ?? 3;
  const shortNeighborhood =
    neighborhood && neighborhood !== city ? neighborhood : neighborhood || "your neighborhood";

  const inviteLink = neighborhoodInviteLink(user?.sheetId);
  const displayUrl = inviteLink.replace(/^https?:\/\//, "");

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
    } catch {
      fireToastMessage({
        type: "error",
        message: "Couldn't copy — select the link and copy it manually",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Help launch FamLink in ${shortNeighborhood}`,
          text: `Help bring nanny share to ${shortNeighborhood}.`,
          url: inviteLink,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to copy.
      }
    }
    handleCopy();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="waitlist-share-title"
        className="relative w-full max-w-md bg-[#F1F3FC] rounded-3xl shadow-xl p-6 sm:p-7"
        style={{ animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-lg  text-gray-500 bg-white transition-colors"
        >
          <X size={18} strokeWidth={2} />
        </button>

        <p className="text-[11px] tracking-[0.15em] text-[#6B7280] uppercase Livvic-Bold">
          Almost Active
        </p>

        <div className="mt-2 flex items-center gap-2.5 flex-wrap pr-8">
          <h2 id="waitlist-share-title" className="Livvic-Bold text-[#001243] text-2xl leading-tight">
            {shortNeighborhood}
          </h2>
          <StatusPill status="launching" />
        </div>

        <div className="mt-5">
          <LaunchProgressSection
            neighborhood={shortNeighborhood}
            families={families}
            nannies={nannies}
            familyNeed={familyNeed}
            nannyNeed={nannyNeed}
          />
        </div>

        <hr className="mt-5 border-0 border-t border-[#E8E8E8]" />

        <div className="mt-5">
          <p className="Livvic-Bold text-[#001243] text-[15px] mb-2">Share this neighborhood</p>
          <div className="flex items-center gap-2 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] pl-4 pr-1 py-1">
            <span className="flex-1 min-w-0 text-sm Livvic-Medium text-[#6B7280] truncate">{displayUrl}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded-lg bg-white shadow-sm Livvic-SemiBold text-sm text-[#001243] px-3 py-2 hover:bg-[#FAFAFA] transition-colors"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>
        <div className="w-full text-center mt-4">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#C5CAF4] border border-[#ABB4ED] text-[#001243] Livvic-Bold py-3 px-4 text-[14px] transition-[background-color]"
          >
            <Send size={16} />
            Share FamLink with neighbors
          </button>
        </div>
      </div>
      <style>{`
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.92); } 100% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
