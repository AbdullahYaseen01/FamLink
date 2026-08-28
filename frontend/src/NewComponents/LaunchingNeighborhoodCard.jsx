import { useNavigate } from "react-router-dom";
import { Bell, MapPin, Send } from "lucide-react";

function CountTile({ count, need, label, more }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-[16px] bg-[#F8FAFF] px-6 py-5">
      <div className="flex items-start gap-3">
        <p className="flex items-baseline gap-1.5 shrink-0">
          <span className="Livvic-Bold text-[32px] leading-none text-[#001243]">{count}</span>
          <span className="Livvic text-[14px] text-[#001243]">of {need}</span>
        </p>
        <div className="min-w-0 pt-1">
          <p className="Livvic-Bold text-[16px] leading-tight text-[#001243]">{label}</p>
          <p className="mt-0.5 Livvic text-[13px] text-[#001243]">{more}</p>
        </div>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#E6E8F0]">
        <div
          className="h-full rounded-full bg-[#8B9CF7]"
          style={{ width: `${Math.min(100, (count / need) * 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function LaunchingNeighborhoodCard({ onShare, launch }) {
  const navigate = useNavigate();
  const neighborhood = launch?.neighborhood || "Your neighborhood";
  const city = launch?.city || "";
  const families = launch?.families ?? 0;
  const nannies = launch?.nannies ?? 0;
  const familyNeed = launch?.familyNeed ?? 8;
  const nannyNeed = launch?.nannyNeed ?? 3;
  const familiesLeft = Math.max(0, familyNeed - families);
  const nanniesLeft = Math.max(0, nannyNeed - nannies);
  const place = [neighborhood, city].filter((p, i, a) => p && a.indexOf(p) === i).join(", ");
  const placeCaps = place.toUpperCase();
  const hoodShort = neighborhood.split(",")[0].trim() || "your neighborhood";

  return (
    <div className="mb-5 w-full">
      <div
        className="relative w-full overflow-hidden rounded-[24px] px-8 py-8"
        style={{
          background: "linear-gradient(180deg, #F2F4FE 0%, #FFFFFF 62%)",
          boxShadow: "0 10px 32px rgba(26, 28, 61, 0.06)",
        }}
      >
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-center gap-1.5 Livvic-Bold text-[11px] tracking-[0.12em] text-[#001243]">
              <MapPin size={13} strokeWidth={2} className="shrink-0 text-[#001243]" />
              {placeCaps || "YOUR NEIGHBORHOOD"}
            </p>
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#E8D7A8] bg-[#FEF9E8] px-4 py-1.5 Livvic-Bold text-[11px] tracking-[0.08em] text-[#B47F46]">
              <span className="h-[8px] w-[8px] rounded-full bg-[#E68A45]" />
              LAUNCHING
            </span>
          </div>

          <div className="mt-5 flex items-start justify-between gap-4">
            <h2 className="Livvic-Bold text-[26px] leading-tight text-[#001243]">
              You’re on the waitlist
            </h2>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mt-1 shrink-0 Livvic-SemiBold text-[14px] text-[#001243] whitespace-nowrap"
            >
              Browse matches while you wait →
            </button>
          </div>
          <p className="mt-3 max-w-[38rem] Livvic text-[16px] leading-relaxed text-[#001243]">
            We’re building enough local coverage to open nanny share matching in your neighborhood.
          </p>

          <div className="mt-6 flex w-full items-stretch gap-3">
            <CountTile
              count={families}
              need={familyNeed}
              label="Families joined"
              more={`${familiesLeft} more needed`}
            />
            <span className="self-center Livvic text-[20px] text-[#001243]">+</span>
            <CountTile
              count={nannies}
              need={nannyNeed}
              label="Nannies joined"
              more={`${nanniesLeft} more needed`}
            />
          </div>

          <p className="mt-8 text-center Livvic-Bold text-[15px] text-[#001243]">
            {familiesLeft} more {familiesLeft === 1 ? "family" : "families"} & {nanniesLeft} more{" "}
            {nanniesLeft === 1 ? "nanny" : "nannies"} unlock your neighborhood
          </p>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={onShare}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#AEC4FF] px-8 py-3 Livvic-Bold text-[14px] text-[#001243]"
            >
              <Send size={16} strokeWidth={2} />
              Help {hoodShort} launch faster
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#E6E8F0] pt-5">
            <p className="flex min-w-0 items-center gap-2.5 Livvic-Bold text-[14px] text-[#001243]">
              <Bell size={16} strokeWidth={1.75} className="shrink-0 text-[#001243]" />
              We’ll notify you the moment matching opens
            </p>
            <button
              type="button"
              onClick={() => navigate("/nanny-share/oakland-ca")}
              className="shrink-0 Livvic-Bold text-[14px] text-[#001243] whitespace-nowrap"
            >
              Explore other neighborhoods →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
