import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import CustomButton from "./Button";

const FAMILY_NEED = 8;
const NANNY_NEED = 3;
const FAMILY_HAVE = 6;
const NANNY_HAVE = 2;

export default function LaunchingNeighborhoodCard({ onShare }) {
  const navigate = useNavigate();
  const isActive = FAMILY_HAVE >= FAMILY_NEED && NANNY_HAVE >= NANNY_NEED;
  const familiesLeft = Math.max(0, FAMILY_NEED - FAMILY_HAVE);
  const nanniesLeft = Math.max(0, NANNY_NEED - NANNY_HAVE);

  return (
    <div className="bg-white border border-[#ECECEC] rounded-2xl mb-6 shadow-[0_1px_4px_rgba(0,18,67,0.06)] overflow-hidden">
      <div className="flex items-center gap-2 px-5 sm:px-6 py-3 border-b border-[#ECECEC]">
        <img src="/logo3.png" alt="" className="w-4 h-4" />
        <span className="Livvic-Bold text-[#3B6DFF] text-[13px]">Fam</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
        <p className="Livvic italic text-[13px] text-[#9CA3AF]">
          Searching nearby cities and neighborhoods...
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-[#ECECEC]">
        <div>
          <p className="text-[11px] tracking-[0.15em] text-gray-500 uppercase mb-1 Livvic-Bold">
            Your neighborhood
          </p>
          <p className="Livvic-Bold text-[#001243] text-[16px] flex items-center gap-1.5">
            <MapPin size={16} className="text-[#3B6DFF] shrink-0" />
            Temescal, Oakland
          </p>
        </div>
        <span className={`inline-flex items-center rounded-md Livvic-Bold text-[11px] tracking-wide uppercase px-2.5 py-1 ${
          isActive ? "bg-[#D6FB9A] text-[#075B49]" : "bg-[#FFF1E0] text-[#C2410C]"
        }`}>
          {isActive ? "Active" : "Launching"}
        </span>
      </div>

      <div className="px-5 sm:px-6 py-4">
        <p className="text-[11px] tracking-[0.15em] text-gray-500 uppercase mb-3 Livvic-Bold">
          Progress to active
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
          <div>
            <div className="flex justify-between text-[13px] Livvic-Bold text-[#001243] mb-1.5">
              <span>Families</span>
              <span>{FAMILY_HAVE} of {FAMILY_NEED}</span>
            </div>
            <div className="h-2 rounded-full bg-[#EEF3FF] overflow-hidden">
              <div className="h-full rounded-full bg-[#AEC4FF]" style={{ width: `${Math.min(100, (FAMILY_HAVE / FAMILY_NEED) * 100)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[13px] Livvic-Bold text-[#001243] mb-1.5">
              <span>Nannies</span>
              <span>{NANNY_HAVE} of {NANNY_NEED}</span>
            </div>
            <div className="h-2 rounded-full bg-[#FFF1E0] overflow-hidden">
              <div className="h-full rounded-full bg-[#E8B86D]" style={{ width: `${Math.min(100, (NANNY_HAVE / NANNY_NEED) * 100)}%` }} />
            </div>
          </div>
        </div>
        <p className="Livvic text-[13px] text-[#6B7280] mb-4">
          {isActive
            ? "This neighborhood is active."
            : `${familiesLeft} more ${familiesLeft === 1 ? "family" : "families"} · ${nanniesLeft} more ${nanniesLeft === 1 ? "nanny" : "nannies"} needed`}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CustomButton
            btnText="Share FamLink with neighbors"
            action={onShare}
            className="bg-[#AEC4FF] text-[#001243] !rounded-full px-5 py-2.5 w-full sm:w-auto"
          />
          <button
            type="button"
            onClick={() => navigate("/nanny-share/oakland-ca")}
            className="Livvic-SemiBold text-[14px] text-[#3B6DFF] hover:opacity-70 text-left sm:text-right"
          >
            See other neighborhoods →
          </button>
        </div>
      </div>
    </div>
  );
}
