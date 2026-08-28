import { useNavigate } from "react-router-dom";
import { Bell, MapPin, Send } from "lucide-react";

function CountTile({ count, need, label, more }) {
  return (
    <div className="flex w-[260px] max-w-[48%] flex-col overflow-hidden rounded-[14px] bg-[#EEF1FC]">
      <div className="flex items-start gap-2.5 px-4 pt-3.5 pb-2.5">
        <p className="flex items-baseline gap-1 shrink-0">
          <span className="Livvic-Bold text-[26px] leading-none text-[#001243]">{count}</span>
          <span className="Livvic text-[12px] text-[#8B92A5]">of {need}</span>
        </p>
        <div className="min-w-0 pt-0.5">
          <p className="Livvic-Bold text-[13px] leading-tight text-[#001243]">{label}</p>
          <p className="mt-0.5 Livvic text-[11px] text-[#8B92A5]">{more}</p>
        </div>
      </div>
      <div className="h-[5px] bg-[#E4E8F5]">
        <div
          className="h-full bg-[#AEC4FF]"
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
  const familyNeed = launch?.familyNeed ?? 8;
  const nannyNeed = launch?.nannyNeed ?? 3;
  const familiesCount = 4;
  const nanniesCount = 1;
  const familiesLeft = 4;
  const nanniesLeft = 2;
  const place = [neighborhood, city].filter((p, i, a) => p && a.indexOf(p) === i).join(", ");
  const placeCaps = place.toUpperCase();
  const hoodShort = neighborhood.split(",")[0].trim() || "your neighborhood";

  return (
    <div className="mb-4 w-full">
      <div
        className="relative w-full overflow-hidden rounded-[20px] px-6 py-5"
        style={{
          background: "linear-gradient(180deg, #F4F6FD 0%, #FFFFFF 70%)",
          boxShadow: "0 8px 24px rgba(0, 18, 67, 0.06)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-1 Livvic-Bold text-[10px] tracking-[0.14em] text-[#B08968]">
            <MapPin size={12} strokeWidth={2.25} className="shrink-0 text-[#E68A45]" />
            {placeCaps || "YOUR NEIGHBORHOOD"}
          </p>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#FEF6E8] px-3 py-1 Livvic-Bold text-[10px] tracking-[0.08em] text-[#E08A3C]">
            <span className="h-[6px] w-[6px] rounded-full bg-[#E08A3C]" />
            LAUNCHING
          </span>
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-3">
          <h2 className="Livvic-Bold text-[22px] leading-tight text-[#001243]">
            You’re on the waitlist
          </h2>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="shrink-0 Livvic-SemiBold text-[13px] text-[#6B7A99] whitespace-nowrap"
          >
            Browse matches while you wait →
          </button>
        </div>
        <p className="mt-1.5 max-w-[34rem] Livvic text-[13px] leading-relaxed text-[#8B92A5]">
          We’re building enough local coverage to open nanny share matching in your neighborhood.
        </p>

        <div className="mt-4 flex items-stretch justify-center gap-2">
          <CountTile
            count={familiesCount}
            need={familyNeed}
            label="Families joined"
            more={`${familiesLeft} more needed`}
          />
          <span className="self-center Livvic text-[16px] text-[#8B92A5]">+</span>
          <CountTile
            count={nanniesCount}
            need={nannyNeed}
            label="Nannies joined"
            more={`${nanniesLeft} more needed`}
          />
        </div>

        <p className="mt-4 text-center Livvic-Bold text-[13px] text-[#001243]">
          {familiesLeft} more families & {nanniesLeft} more nannies unlock your neighborhood
        </p>
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#AEC4FF] px-6 py-2.5 Livvic-Bold text-[13px] text-[#001243]"
          >
            <Send size={14} strokeWidth={2} />
            Help {hoodShort} launch faster
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#E8EBF3] pt-3.5">
          <p className="flex min-w-0 items-center gap-2 Livvic-Bold text-[12px] text-[#001243]">
            <Bell size={14} strokeWidth={1.75} className="shrink-0 text-[#001243]" />
            We’ll notify you the moment matching opens
          </p>
          <button
            type="button"
            onClick={() => navigate("/nanny-share/oakland-ca")}
            className="shrink-0 Livvic-Bold text-[12px] text-[#001243] whitespace-nowrap"
          >
            Explore other neighborhoods →
          </button>
        </div>
      </div>
    </div>
  );
}
