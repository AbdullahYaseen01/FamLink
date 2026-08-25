export default function HowItWorksLandingPreview({ audience = "family" }) {
  const isCaregiver = audience === "caregiver";
  return (
    <div
      className="pointer-events-none bg-white overflow-hidden origin-top"
      style={{ backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(174,196,255,0.15) 0%, transparent 70%)" }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#EEF1F6]">
        <div className="flex items-center gap-1.5">
          <img src="/logo3.png" alt="" className="w-6 h-6 object-contain" />
          <p className="Livvic-Bold text-[#001243] text-lg">Famlink</p>
        </div>
        <div className="flex flex-col justify-center items-center w-8 h-8">
          <span className="block w-5 h-0.5 bg-[#001243]" />
          <span className="block w-5 h-0.5 mt-1.5 bg-[#001243]" />
          <span className="block w-5 h-0.5 mt-1.5 bg-[#001243]" />
        </div>
      </div>

      <div className="flex flex-col items-center text-center px-4 pt-5 pb-6">
        <div className="inline-flex items-center gap-2 bg-[#EEF3FF] border border-[#C8D8FF] rounded-full px-3 py-1 text-[11px] font-bold text-[#001243] mb-4 shadow-sm">
          Meet Fam
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
          your AI match assistant
        </div>
        <h1 className="text-[28px] sm:text-[34px] mb-3 font-black leading-[1.05] tracking-tight Livvic-Bold">
          {isCaregiver ? (
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
        <p className="text-[#6b7280] text-[12px] sm:text-[13px] font-[400] max-w-[420px] mx-auto leading-[1.6] mb-5">
          {isCaregiver
            ? "Fam helps families and nannies find compatible nanny share partners. No searching, no spreadsheets, no Facebook groups."
            : "Save up to 50% compared to hiring your own nanny. Fam continuously searches for compatible nanny share matches, so you don't have to."}
        </p>
        <div className="w-full max-w-[480px] text-left">
          <p className="text-[#001243] text-[13px] font-medium leading-[1.5] Livvic-Medium mb-2">
            I'll ask a few quick questions to personalize your matches.
          </p>
          <p className="text-[#001243] text-[13px] font-medium leading-[1.5] Livvic-Medium mb-3">
            Are you a family or a nanny?
          </p>
          <div className="flex flex-wrap gap-2">
            {["Family", "Nanny"].map((opt) => (
              <span
                key={opt}
                className="border font-medium py-1.5 px-5 rounded-full text-[13px] shadow-sm bg-white border-gray-200 text-[#001243]"
              >
                {opt}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
