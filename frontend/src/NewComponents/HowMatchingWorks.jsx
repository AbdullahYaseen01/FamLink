import { Info, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import {
  FamSays,
  FAM_SAYS_STUB,
  MatchBadge,
} from "../Components/subComponents/profileCardUpgraded";
import "../Components/subComponents/profileCardUpgraded.css";

const LEVEL_CARDS = [
  { level: "great", detail: "Key details align.", footer: "Fam sends a request", accent: "#10b981", icon: true },
  { level: "possible", detail: "Some details differ.", footer: "Review and decide to connect", accent: "#f59e0b" },
  { level: "none", detail: "Key preferences don't align.", footer: "Review and decide to connect", accent: "#ef4444" },
];

function Step({ n, last, title, children }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center shrink-0">
        <span className="w-8 h-8 rounded-full bg-[#001243] text-white Livvic-Bold text-[14px] flex items-center justify-center">
          {n}
        </span>
        {!last ? <span className="w-px flex-1 bg-[#E6E8EE] mt-2 min-h-[16px]" /> : null}
      </div>
      <div className={`min-w-0 flex-1 ${last ? "" : "pb-8"}`}>
        <h2 className="Livvic-Bold text-[18px] sm:text-[20px] text-[#001243] leading-snug">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default function HowMatchingWorks() {
  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <div className="padding-navbar1 max-w-[920px] mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-[24px] px-5 py-7 sm:px-10 sm:py-10">
          <h1 className="Livvic-Bold text-[28px] sm:text-[34px] text-[#001243] leading-tight">
            How matching works
          </h1>
          <p className="Livvic text-[15px] text-[#6B7280] mt-2 mb-8">
            Fam compares profiles to yours and shows you what fits.
          </p>

          <Step n={1} title="Complete your profile">
            <p className="Livvic text-[14px] text-[#6B7280] mt-1">
              Add your schedule, location, start date, and share preferences.
            </p>
          </Step>

          <Step n={2} title="See your best matches">
            <p className="Livvic text-[14px] text-[#6B7280] mt-1 mb-4">
              Fam compares profiles and shows what fits your preferences.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LEVEL_CARDS.map((card) => (
                <div
                  key={card.level}
                  className="rounded-2xl border border-[#E8ECF4] bg-white px-4 py-3.5"
                  style={{ borderTop: `3px solid ${card.accent}` }}
                >
                  <MatchBadge level={card.level} />
                  <p className="Livvic text-[13px] text-[#6B7280] mt-2.5">{card.detail}</p>
                  <p className="Livvic-SemiBold text-[12px] text-[#001243] mt-3 flex items-center gap-1.5">
                    {card.icon ? <Sparkles size={13} className="text-[#10b981]" /> : null}
                    {card.footer}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-[#E8ECF4] bg-[#F7F8FA] p-4">
              <MatchBadge level="possible" />
              <div className="flex items-center gap-3 mt-3 mb-3">
                <span className="w-11 h-11 rounded-full bg-[#E8ECF4] shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="block h-3 w-32 rounded bg-[#E8ECF4]" />
                  <span className="block h-2.5 w-48 rounded bg-[#EEF0F4] mt-2" />
                </div>
              </div>
              <FamSays level="possible" text={FAM_SAYS_STUB.possible} />
            </div>

            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-[#EEF3FF] px-3.5 py-3">
              <Info size={16} strokeWidth={2} className="text-[#3B5BDB] shrink-0 mt-0.5" />
              <p className="Livvic text-[13px] text-[#001243] leading-relaxed">
                Your <Link to="/dashboard/home" className="Livvic-Bold underline-offset-2 hover:underline">Home</Link> page shows your match shortlist.{" "}
                <Link to="/dashboard" className="Livvic-Bold underline-offset-2 hover:underline">Find a Match</Link> shows all nearby profiles.
              </p>
            </div>
          </Step>

          <Step n={3} last title="Fam sends requests for Great Matches">
            <p className="Livvic text-[14px] text-[#6B7280] mt-1">
              Great Match requests are sent automatically. Possible Matches are up to you.
            </p>
          </Step>
        </div>
      </div>
    </div>
  );
}
