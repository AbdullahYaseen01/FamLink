import { Info, User, Users } from "lucide-react";
import { SHARE_TYPE_GOALS } from "../Config/shareTypeGoals";

const ICON = { familyLooking: Users, familyHasNanny: Users, nannyLooking: User, nannyHasFamily: User };

function TypeIcon({ variant, size = 16 }) {
  const g = SHARE_TYPE_GOALS[variant];
  if (!g) return null;
  const Glyph = ICON[variant];
  return (
    <span
      className="inline-flex items-center justify-center rounded-[8px] shrink-0"
      style={{ width: size + 16, height: size + 16, backgroundColor: g.theme.bg, color: g.theme.text }}
    >
      <Glyph size={size} strokeWidth={2.2} />
    </span>
  );
}

function TypePill({ variant, goal }) {
  const g = SHARE_TYPE_GOALS[variant];
  if (!g) return null;
  const Glyph = ICON[variant];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] whitespace-nowrap"
      style={{ backgroundColor: g.theme.bg, color: g.theme.text }}
    >
      <Glyph size={13} strokeWidth={2.2} className="shrink-0" />
      <span className="Livvic-Bold">{g.role}</span>
      <span className="opacity-40">·</span>
      <span className="Livvic">{goal || g.goal}</span>
    </span>
  );
}

function Plus() {
  return <span className="Livvic-Bold text-[20px] text-[#9AA3B5] shrink-0 px-1 self-center">+</span>;
}

function Seat({ title, hint, variants, goal }) {
  const lead = variants[0];
  return (
    <div className="flex-1 min-w-[148px] rounded-[12px] border border-[#E8ECF4] bg-[#F7F8FA] px-3.5 py-3.5">
      <div className="flex items-center gap-1.5">
        {variants.map((v) => (
          <TypeIcon key={v} variant={v} size={18} />
        ))}
      </div>
      <p className="Livvic-Bold text-[13px] text-[#001243] leading-snug mt-2.5">{title}</p>
      {hint ? <p className="Livvic text-[11px] text-[#6B7280] mt-0.5">{hint}</p> : null}
      <div className="mt-2.5">
        <TypePill variant={lead} goal={goal} />
      </div>
    </div>
  );
}

function Scenario({ title, body, children }) {
  return (
    <div className="bg-white rounded-[16px] border border-[#E8ECF4] px-5 py-5">
      <h3 className="Livvic-Bold text-[17px] text-[#001243] leading-snug">{title}</h3>
      <p className="Livvic text-[14px] text-[#6B7280] mt-1.5 mb-4 leading-relaxed">{body}</p>
      <div className="flex flex-col sm:flex-row sm:items-stretch gap-2.5">{children}</div>
    </div>
  );
}

export default function WaysShareComesTogether() {
  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <div className="padding-navbar1 max-w-[880px] mx-auto px-4 sm:px-6 py-8">
        <h1 className="Livvic-Bold text-[26px] sm:text-[32px] text-[#001243] leading-[1.15]">
          Ways your nanny share can come together
        </h1>
        <p className="Livvic text-[15px] text-[#6B7280] mt-2 leading-relaxed max-w-[640px]">
          Every nanny share is two families and one nanny, but there&apos;s more than one way to get there.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 rounded-[12px] bg-[#F3F4F6] px-4 py-3.5 text-[14px] text-[#001243]">
          <span className="inline-flex items-center gap-2 Livvic-SemiBold">
            <TypeIcon variant="familyLooking" size={15} /> Family
          </span>
          <Plus />
          <span className="inline-flex items-center gap-2 Livvic-SemiBold">
            <TypeIcon variant="familyLooking" size={15} /> Family
          </span>
          <Plus />
          <span className="inline-flex items-center gap-2 Livvic-SemiBold">
            <TypeIcon variant="nannyLooking" size={15} /> Nanny
          </span>
          <span className="Livvic-Bold text-[#9AA3B5] px-0.5">=</span>
          <span className="Livvic-Bold">one nanny share</span>
        </div>

        <h2 className="Livvic-Bold text-[20px] text-[#001243] mt-9">Three ways those seats get filled</h2>
        <p className="Livvic text-[14px] text-[#6B7280] mt-1.5 mb-4 leading-relaxed">
          One family always holds a seat. What changes is whether the profile they match with arrives on its own or already paired up.
        </p>

        <div className="flex flex-col gap-3.5">
          <Scenario
            title="A family brings their nanny"
            body="They come as a pair. Their nanny takes on the second family too, so two profiles fill all three seats."
          >
            <Seat
              title="A family, plus their nanny"
              variants={["familyHasNanny", "nannyLooking"]}
              goal="Has a nanny, looking to share"
            />
            <Plus />
            <Seat title="A family" variants={["familyLooking"]} />
          </Scenario>

          <Scenario
            title="A nanny brings their family"
            body="This nanny comes as a pair too. The family they already work for becomes the second family in the share."
          >
            <Seat
              title="A nanny, plus their work family"
              variants={["nannyHasFamily", "familyLooking"]}
              goal="With a family, looking to share"
            />
            <Plus />
            <Seat title="A family" variants={["familyLooking"]} />
          </Scenario>

          <Scenario
            title="A nanny joins two families"
            body="This nanny arrives on their own, so the share needs a second family before it is complete. Fam looks for one who fits both sides."
          >
            <Seat title="A nanny" variants={["nannyLooking"]} />
            <Plus />
            <Seat title="A family" variants={["familyLooking"]} />
            <Plus />
            <Seat title="A second family" hint="joins through the nanny" variants={["familyLooking"]} />
          </Scenario>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-[14px] bg-[#EEF3FF] px-4 py-3.5">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#001243] text-[#001243]">
            <Info size={12} strokeWidth={2.4} />
          </span>
          <p className="Livvic text-[14px] leading-relaxed text-[#001243]">
            <span className="Livvic-Bold">Every share includes a Family · Looking for a share.</span>{" "}
            The three profile types above are the ones who can fill the remaining seats.
          </p>
        </div>
      </div>
    </div>
  );
}
