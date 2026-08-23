import { useNavigate } from "react-router-dom";
import { Home, Search } from "lucide-react";
import { Card } from "./OnboardingKit/shell";

const FLOW_KEY = "nannyOnboardingFlow";

export function readNannyOnboardingFlow() {
  try {
    return sessionStorage.getItem(FLOW_KEY);
  } catch {
    return null;
  }
}

export default function NannyOnboardingChooser() {
  const navigate = useNavigate();

  const choose = (flow) => {
    try {
      sessionStorage.setItem(FLOW_KEY, flow);
    } catch {
      /* ignore */
    }
    navigate(`/dashboard/complete-profile?flow=${flow}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] Livvic text-[#001243]">
      <main className="max-w-[640px] mx-auto px-6 pt-8 pb-20 max-[600px]:px-3 max-[600px]:pt-5">
        <Card
          heading="Which nanny share is this for?"
          sub="Pick the path that matches your situation. Families have one flow; nannies have two."
        >
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => choose("looking")}
              className="flex items-start gap-3 text-left rounded-[16px] border-[1.5px] border-[#E8ECF4] bg-white p-4 hover:border-[#001243] transition-colors"
            >
              <span className="w-10 h-10 rounded-[10px] bg-[#EEF3FF] border border-[#C8D8FF] flex items-center justify-center shrink-0">
                <Search size={18} color="#001243" />
              </span>
              <span>
                <span className="block Livvic-Bold text-[15px] text-[#001243] mb-1">
                  Looking for a share position
                </span>
                <span className="block Livvic text-[13px] text-[#6B7280] leading-relaxed">
                  You want to find a nanny share job with families.
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => choose("family")}
              className="flex items-start gap-3 text-left rounded-[16px] border-[1.5px] border-[#E8ECF4] bg-white p-4 hover:border-[#001243] transition-colors"
            >
              <span className="w-10 h-10 rounded-[10px] bg-[#EEF3FF] border border-[#C8D8FF] flex items-center justify-center shrink-0">
                <Home size={18} color="#001243" />
              </span>
              <span>
                <span className="block Livvic-Bold text-[15px] text-[#001243] mb-1">
                  I already work with a family
                </span>
                <span className="block Livvic text-[13px] text-[#6B7280] leading-relaxed">
                  You have a current family and want to add a share.
                </span>
              </span>
            </button>
          </div>
        </Card>
      </main>
    </div>
  );
}
