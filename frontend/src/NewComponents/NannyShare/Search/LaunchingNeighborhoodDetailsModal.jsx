import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { shareUrlFor } from "../../../Config/neighborhoodCatalog";
import { fireToastMessage } from "../../../toastContainer";

const LAUNCHING_BADGE = "bg-[#FFF1E0] text-[#C2410C]";

function neighborhoodLabel(displayName) {
  return String(displayName || "").split(",")[0]?.trim() || displayName;
}

function ProgressRow({ label, have, need, fillClass }) {
  const pct = need > 0 ? Math.min(100, (have / need) * 100) : 0;
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <span className="Livvic-Bold text-[#001243] text-[15px]">{label}</span>
        <span className="Livvic-Bold text-[#001243] text-[15px] tabular-nums">
          {have} of {need}
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#F5F0EB] overflow-hidden">
        <div
          className={`h-full rounded-full ${fillClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function LaunchingNeighborhoodDetailsModal({ item, onClose }) {
  const [copied, setCopied] = useState(false);
  const url = shareUrlFor(item);
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
        className="relative bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,18,67,0.12)] w-full max-w-[420px] px-6 pt-6 pb-6"
        style={{ animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 pr-1">
          <p className="text-[11px] tracking-[0.12em] text-gray-400 uppercase Livvic-Bold">
            Share &amp; Details
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 -mt-0.5 w-9 h-9 flex items-center justify-center rounded-xl border border-[#E8E8E8] text-[#9CA3AF] hover:bg-[#FAFAFA] transition-colors"
          >
            <X size={18} strokeWidth={2} className="text-gray-600 font-normal" />
          </button>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <h2
            id="launching-neighborhood-title"
            className="Livvic-Bold text-[#001243] text-[22px] leading-tight"
          >
            {name}
          </h2>
          <span
            className={`inline-flex items-center rounded-full Livvic-Bold text-[10px] tracking-[0.06em] uppercase px-2.5 py-1 ${LAUNCHING_BADGE}`}
          >
            Launching
          </span>
        </div>

        <p className="mt-5 text-[10px] tracking-[0.12em] text-[#9CA3AF] uppercase Livvic-Bold">
          Progress to active
        </p>

        <div className="mt-3 flex gap-4">
          <ProgressRow
            label="Families"
            have={familiesHave}
            need={familiesNeed}
            fillClass="bg-[#AEC4FF]"
          />
          <ProgressRow
            label="Nannies"
            have={nanniesHave}
            need={nanniesNeed}
            fillClass="bg-[#F97316]"
          />
        </div>

        <p className="mt-3 Livvic text-[13px] leading-snug text-[#6B7280]">
          {familiesLeft} more {familiesLeft === 1 ? "family" : "families"} ·{" "}
          {nanniesLeft} more {nanniesLeft === 1 ? "nanny" : "nannies"} needed to
          activate {name}.
        </p>

        <hr className="mt-5 border-0 border-t border-[#E8E8E8]" />

        <div className="mt-5">
          <p className="Livvic-Bold text-[#001243] text-[15px]">
            Share this neighborhood
          </p>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] pl-4 pr-1.5 py-1.5">
            <span className="flex-1 min-w-0 text-[13px] Livvic-Medium text-[#9CA3AF] truncate">
              {displayUrl}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded-lg bg-[#EFEFEF] Livvic-Medium text-[13px] text-[#6B7280] px-3 py-1.5 hover:bg-[#E8E8E8] transition-colors"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="mt-4 w-full rounded-2xl bg-[#AEC4FF] text-[#001243] Livvic-Bold py-3.5 text-[15px] hover:brightness-[0.98] transition-[filter]"
        >
          Share FamLink with neighbors
        </button>
      </div>
      <style>{`
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.92); } 100% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
