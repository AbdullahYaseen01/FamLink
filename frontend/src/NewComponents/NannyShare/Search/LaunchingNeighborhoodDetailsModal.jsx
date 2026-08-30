import { useEffect, useState } from "react";
import { Send, X } from "lucide-react";
import { shareUrlFor } from "../../../Config/neighborhoodCatalog";
import { fireToastMessage } from "../../../toastContainer";
import StatusPill from "../../StatusPill";

function neighborhoodLabel(displayName) {
  return String(displayName || "").split(",")[0]?.trim() || displayName;
}

function ProgressCard({ label, have, need }) {
  const pct = need > 0 ? Math.min(100, (have / need) * 100) : 0;
  return (
    <div className="flex-1 min-w-0 rounded-xl bg-[#EEF3FF] px-4 py-3">
      <p className="Livvic-Bold text-[#001243] text-2xl leading-snug">
        {have}
        <span className="text-sm font-bold text-gray-500 mr-1">
          {" of "}
          {need}
        </span>
        <span className="text-sm Livvic-Bold ml-1">{label}</span>
      </p>
      <div className="mt-2 h-2 rounded-full bg-gray-50 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#AEC4FF]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function LaunchingNeighborhoodDetailsModal({ item, onClose, sheetId }) {
  const [copied, setCopied] = useState(false);
  const url = shareUrlFor(item, sheetId);
  const displayUrl = url.replace(/^https?:\/\//, "");
  const name = neighborhoodLabel(item.displayName);
  const progress = item.progress || {
    familiesHave: 0,
    familiesNeed: 8,
    nanniesHave: 0,
    nanniesNeed: 3,
  };
  const { familiesHave, familiesNeed, nanniesHave, nanniesNeed } = progress;
  const familiesLeft = Math.max(0, familiesNeed - familiesHave);
  const nanniesLeft = Math.max(0, nanniesNeed - nanniesHave);

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
      await navigator.clipboard.writeText(url);
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
          title: `Help launch FamLink in ${name}`,
          text: `Help bring nanny share to ${name}.`,
          url,
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
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="launching-neighborhood-title"
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[420px] p-6 sm:p-7"
        style={{ animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full border border-[#E8E8E8] text-[#9CA3AF] hover:bg-[#FAFAFA] transition-colors"
        >
          <X size={18} strokeWidth={2} />
        </button>

        <p className="text-[11px] tracking-[0.15em] text-[#6B7280] uppercase Livvic-Bold">
          Almost Active
        </p>

        <div className="mt-2 flex items-center gap-2.5 flex-wrap pr-8">
          <h2
            id="launching-neighborhood-title"
            className="Livvic-Bold text-[#001243] text-2xl leading-tight"
          >
            {name}
          </h2>
          <StatusPill status="launching" />
        </div>

        <div className="mt-5 flex gap-3">
          <ProgressCard label="Families" have={familiesHave} need={familiesNeed} />
          <ProgressCard label="Nannies" have={nanniesHave} need={nanniesNeed} />
        </div>

        <p className="mt-4 text-center Livvic-SemiBold text-[#001243] text-sm leading-snug">
          {familiesLeft} more {familiesLeft === 1 ? "family" : "families"} &{" "}
          {nanniesLeft} more {nanniesLeft === 1 ? "nanny" : "nannies"} needed to
          activate {name}
        </p>

        <hr className="mt-5 border-0 border-t border-[#E8E8E8]" />

        <div className="mt-5">
          <p className="Livvic-Bold text-[#001243] text-[15px] mb-2">
            Share this neighborhood
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] pl-4 pr-1 py-1">
            <span className="flex-1 min-w-0 text-sm Livvic-Medium text-[#6B7280] truncate">
              {displayUrl}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded-lg bg-white shadow-sm Livvic-SemiBold text-sm text-[#001243] px-3 py-2 hover:bg-[#FAFAFA] transition-colors"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#AEC4FF] text-[#001243] Livvic-Bold py-3.5 text-[15px] hover:brightness-[0.98] transition-[filter]"
        >
          <Send size={16} />
          Share FamLink with neighbors
        </button>
      </div>
      <style>{`
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.92); } 100% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
