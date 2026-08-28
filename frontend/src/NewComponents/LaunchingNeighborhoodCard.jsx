import { useNavigate } from "react-router-dom";
import { Bell, MapPin, Send } from "lucide-react";

function CountTile({ count, need, label, more }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-[12px] bg-[#F3F4FF] px-4 py-4">
      <p className="flex items-baseline gap-1.5">
        <span className="Livvic-Bold text-[28px] leading-none text-[#1E1B4B]">{count}</span>
        <span className="Livvic text-[13px] text-[#64748B]">of {need}</span>
      </p>
      <p className="mt-1.5 Livvic-Bold text-[14px] text-[#1E1B4B]">{label}</p>
      <p className="mt-0.5 Livvic text-[12px] text-[#64748B]">{more}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#E8EAF5]">
        <div
          className="h-full rounded-full bg-[#818CF8]"
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
          background: "linear-gradient(180deg, #F7F8FF 0%, #FFFFFF 52%)",
          boxShadow: "0 10px 32px rgba(30, 27, 75, 0.06)",
        }}
      >
        <div
          className="pointer-events-none absolute -top-8 right-0 h-[200px] w-[220px]"
          style={{ background: "radial-gradient(ellipse at 85% 0%, rgba(199, 210, 254, 0.55) 0%, transparent 70%)" }}
        />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-center gap-1.5 Livvic-Bold text-[11px] tracking-[0.12em] text-[#78716C]">
              <MapPin size={13} strokeWidth={2} className="shrink-0 text-[#D97706]" />
              {placeCaps || "YOUR NEIGHBORHOOD"}
            </p>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#FED7AA] bg-[#FFF7ED] px-3 py-[5px] Livvic-Bold text-[10px] tracking-[0.08em] text-[#9A3412]">
              <span className="h-[6px] w-[6px] rounded-full bg-[#EA580C]" />
              LAUNCHING
            </span>
          </div>

          <div className="mt-4 flex items-start justify-between gap-4">
            <h2 className="Livvic-Bold text-[24px] leading-tight text-[#1E1B4B]">
              You’re on the waitlist
            </h2>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mt-1 shrink-0 Livvic text-[13px] text-[#64748B] whitespace-nowrap"
            >
              Browse matches while you wait →
            </button>
          </div>
          <p className="mt-2 max-w-[36rem] Livvic text-[14px] leading-relaxed text-[#64748B]">
            We’re building enough local coverage to open nanny share matching in your neighborhood.
          </p>

          <div className="mt-6 flex w-full items-stretch gap-3">
            <CountTile
              count={families}
              need={familyNeed}
              label="Families joined"
              more={`${familiesLeft} more needed`}
            />
            <span className="self-center Livvic text-[22px] text-[#94A3B8]">+</span>
            <CountTile
              count={nannies}
              need={nannyNeed}
              label="Nannies joined"
              more={`${nanniesLeft} more needed`}
            />
          </div>

          <p className="mt-6 text-center Livvic-Bold text-[14px] text-[#1E1B4B]">
            {familiesLeft} more {familiesLeft === 1 ? "family" : "families"} & {nanniesLeft} more{" "}
            {nanniesLeft === 1 ? "nanny" : "nannies"} unlock your neighborhood
          </p>
          <div className="mt-3.5 flex justify-center">
            <button
              type="button"
              onClick={onShare}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#DBEAFE] px-5 Livvic-Bold text-[14px] text-[#1E1B4B]"
            >
              <Send size={15} strokeWidth={2} />
              Help {hoodShort} launch faster
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#E8ECF4] pt-4">
            <p className="flex min-w-0 items-center gap-2 Livvic text-[13px] text-[#1E1B4B]">
              <Bell size={15} strokeWidth={1.8} className="shrink-0 text-[#1E1B4B]" />
              We’ll notify you the moment matching opens
            </p>
            <button
              type="button"
              onClick={() => navigate("/nanny-share/oakland-ca")}
              className="shrink-0 Livvic-Bold text-[13px] text-[#1E1B4B] whitespace-nowrap"
            >
              Explore other neighborhoods →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
