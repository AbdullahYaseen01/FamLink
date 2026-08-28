import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import CustomButton from "./Button";

const FAMILY_NEED = 8;
const NANNY_NEED = 3;
const FAMILY_HAVE = 4;
const NANNY_HAVE = 1;

export default function LaunchingNeighborhoodCard({ onShare, badge = "Launching" }) {
  const navigate = useNavigate();
  const isActive = FAMILY_HAVE >= FAMILY_NEED && NANNY_HAVE >= NANNY_NEED;
  const familiesLeft = Math.max(0, FAMILY_NEED - FAMILY_HAVE);
  const nanniesLeft = Math.max(0, NANNY_NEED - NANNY_HAVE);

  return (
    <div className="bg-white border border-[#E8ECF4] rounded-2xl overflow-hidden mb-4">
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[#E8ECF4]">
        <img src="/logo3.png" alt="" className="w-4 h-4" />
        <span className="Livvic-Bold text-[#001243] text-[13px]">Fam</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
        <p className="Livvic italic text-[12px] text-[#9CA3AF] truncate">
          Searching nearby cities and neighborhoods...
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-[#E8ECF4]">
        <div>
          <p className="text-[10px] tracking-[0.12em] text-[#6B7280] uppercase Livvic-Bold">
            Your neighborhood
          </p>
          <p className="Livvic-Bold text-[#001243] text-[14px] flex items-center gap-1 mt-0.5">
            <MapPin size={14} className="text-[#001243] shrink-0" />
            Temescal, Oakland
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full Livvic-Bold text-[10px] tracking-wide uppercase px-3 py-1 ${
          isActive ? "bg-[#D6FB9A] text-[#075B49]" : "bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA]"
        }`}>
          {isActive ? "Active" : badge}
        </span>
      </div>

      <div className="px-4 py-3">
        <p className="text-[10px] tracking-[0.12em] text-[#6B7280] uppercase mb-2 Livvic-Bold">
          Progress to active
        </p>
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div>
            <div className="flex justify-between text-[12px] Livvic-Bold text-[#001243] mb-1">
              <span>Families</span>
              <span>{FAMILY_HAVE} of {FAMILY_NEED}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#EEF3FF] overflow-hidden">
              <div className="h-full rounded-full bg-[#AEC4FF]" style={{ width: `${Math.min(100, (FAMILY_HAVE / FAMILY_NEED) * 100)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[12px] Livvic-Bold text-[#001243] mb-1">
              <span>Nannies</span>
              <span>{NANNY_HAVE} of {NANNY_NEED}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#FFF7ED] overflow-hidden">
              <div className="h-full rounded-full bg-[#F97316]" style={{ width: `${Math.min(100, (NANNY_HAVE / NANNY_NEED) * 100)}%` }} />
            </div>
          </div>
        </div>
        <p className="Livvic text-[12px] text-[#6B7280] mb-3">
          {isActive
            ? "This neighborhood is active."
            : `${familiesLeft} more ${familiesLeft === 1 ? "family" : "families"} • ${nanniesLeft} more ${nanniesLeft === 1 ? "nanny" : "nannies"} needed`}
        </p>
        <div className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CustomButton
            btnText="Share FamLink with neighbors"
            action={onShare}
            className="bg-[#AEC4FF] text-[#001243] !rounded-full !h-9 px-4 py-2 w-auto text-[13px] shrink"
          />
          <button
            type="button"
            onClick={() => navigate("/nanny-share/oakland-ca")}
            className="Livvic-SemiBold text-[13px] text-[#001243] hover:opacity-70 whitespace-nowrap"
          >
            See other neighborhoods →
          </button>
        </div>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="mt-3 Livvic-SemiBold text-[13px] text-[#001243] bg-[#AEC4FF] rounded-full px-4 py-2 w-fit hover:bg-[#9db4f7]"
        >
          Explore matches →
        </button>
      </div>
    </div>
  );
}
