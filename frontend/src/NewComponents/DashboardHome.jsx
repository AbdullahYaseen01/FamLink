import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import FamilyHowItWorks from "./NannyShare/HowItWorks";
import CaregiverHowItWorks from "./Caregivers/HowItWorks";

export default function DashboardHome() {
  const { user } = useSelector((s) => s.auth);
  const isNanny = user?.type === "Nanny";

  return (
    <div className="min-h-screen bg-white">
      <div
        className="padding-navbar1 pt-8 pb-4 text-center"
        style={{ backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(174,196,255,0.15) 0%, transparent 70%)" }}
      >
        <div className="inline-flex items-center gap-2 bg-[#EEF3FF] border border-[#C8D8FF] rounded-full px-4 py-1.5 text-[14px] font-bold text-[#001243] mb-6 shadow-sm">
          Meet Fam
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
          your AI match assistant
        </div>
        <h1 className="text-[36px] sm:text-[52px] font-black leading-[1.05] tracking-tight Livvic-Bold mb-4">
          {isNanny ? (
            <>
              <span className="text-[#001243]">Earn More as a</span>
              <br />
              <span className="text-[#AEC4FF]">Nanny Share Nanny.</span>
            </>
          ) : (
            <>
              <span className="text-[#001243]">Find your</span>
              <br />
              <span className="text-[#AEC4FF]">nanny share.</span>
            </>
          )}
        </h1>
        <p className="text-[#6b7280] text-[16px] max-w-[640px] mx-auto leading-[1.7] mb-8">
          {isNanny
            ? "Fam helps families and nannies find compatible nanny share partners."
            : "Save up to 50% compared to hiring your own nanny."}
        </p>
        <NavLink
          to="/dashboard"
          className="inline-flex bg-[#FFADE1] text-[#3B0025] Livvic-SemiBold text-[15px] px-8 py-3 rounded-full"
        >
          Find a Match
        </NavLink>
      </div>
      {isNanny ? <CaregiverHowItWorks /> : <FamilyHowItWorks />}
    </div>
  );
}
