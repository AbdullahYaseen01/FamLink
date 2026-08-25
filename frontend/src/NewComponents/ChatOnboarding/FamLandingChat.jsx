import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";

const FAMILY_QUESTIONS = [
  {
    id: "how_nanny_shares_work",
    label: "How does a nanny share actually work?",
    answer:
      "Two families share one trusted nanny. You split the schedule and the pay, so each family usually spends less than hiring alone, and your child still gets consistent care. FamLink finds families and nannies that actually fit.",
    navIntent: "how_nanny_shares_work",
    navLabel: "See How Nanny Shares Work",
  },
  {
    id: "how_much_save",
    label: "How much could my family save?",
    answer:
      "Many families save up to about 50% compared with hiring a nanny on their own, depending on hours, location, and how you split the week. Use the cost calculator below to see a local estimate.",
    navIntent: "cost_calculator",
    navLabel: "See how much you could save",
  },
  {
    id: "already_have_nanny",
    label: "I already have a nanny. Can I still share?",
    answer:
      "You can keep your nanny and find another family to join your share. FamLink helps you find a compatible family so your nanny can care for both families and you can split the cost.",
    navIntent: "find_family_to_share",
    navLabel: "Find a Family to Share With",
  },
  {
    id: "how_find_matches",
    label: "How does FamLink find my matches?",
    answer:
      "Tell Fam your location, schedule, and share type. We surface families and caregivers that fit. Create a free account to see full matches.",
    navIntent: "create_account",
    navLabel: "Create a Free Account",
  },
];

const NANNY_QUESTIONS = [
  {
    id: "how_nanny_shares_work",
    label: "How does a nanny share work for nannies?",
    answer:
      "You work with two families on a shared schedule. They split your pay, so you keep one role and typically earn more than a single-family job. FamLink matches you with families ready to share.",
    navIntent: "how_nanny_shares_work",
    navLabel: "See How Nanny Shares Work",
  },
  {
    id: "nanny_share_pay",
    label: "How much more can I get paid as a nanny share nanny?",
    answer:
      "Two families share your hours and your rate, so combined pay is often higher than a single-family role. The exact bump depends on your schedule and local rates. Use the earnings calculator to see a range.",
    navIntent: "earn_calculator",
    navLabel: "See what you could earn",
  },
  {
    id: "already_work_family",
    label: "I already work with a family. Can I add a share?",
    answer:
      "Yes. Keep your current family and add a second one to your week. FamLink helps you find a compatible second family so you can earn more without starting over.",
    navIntent: "find_second_family",
    navLabel: "Find a Second Family",
  },
  {
    id: "how_find_positions",
    label: "How does FamLink find share positions for me?",
    answer:
      "Find nanny share partners near you. Whether you already care for a child or are looking for a nanny share job, Fam helps you find compatible families.",
    navIntent: "create_account",
    navLabel: "Create a Free Account",
  },
];

const NAV_ROUTES = {
  how_nanny_shares_work: "/resources/how-does-a-nanny-share-work",
  find_family_to_share: "/find-nanny-share",
  find_second_family: "/caregiver/nannyshare",
  create_account: "/joinNow",
};

const scrollToId = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

export default function FamLandingChat({ answers }) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const all = answers?.role === "Nanny" ? NANNY_QUESTIONS : FAMILY_QUESTIONS;
  const remaining = all.filter((q) => !history.some((h) => h.id === q.id));

  const ask = (question) => {
    setHistory((prev) => (prev.some((h) => h.id === question.id) ? prev : [...prev, question]));
  };

  const go = (intent) => {
    if (intent === "cost_calculator") {
      if (window.location.pathname === "/") scrollToId("cost-estimator");
      else navigate("/#cost-estimator");
      return;
    }
    if (intent === "earn_calculator") {
      if (window.location.pathname === "/jobSeekers") scrollToId("earn-estimator");
      else navigate("/jobSeekers#earn-estimator");
      return;
    }
    const to = NAV_ROUTES[intent];
    if (to) navigate(to);
  };

  return (
    <div className="w-full max-w-[680px] mx-auto mt-8 px-4">
      {history.map((item) => (
        <div key={item.id} className="mb-6">
          <div className="flex justify-end mb-4">
            <div className="max-w-[80%] flex items-center gap-[6px] bg-[#EEF3FF] border border-[#C8D8FF] rounded-full pl-[12px] pr-[12px] py-[6px] text-[14px] font-medium text-[#001243] shadow-sm">
              {item.label}
            </div>
          </div>
          <div className="flex justify-start mb-[12px]">
            <div className="text-[#001243] text-[16px] font-medium leading-[1.5] Livvic-Medium">
              {item.answer}
            </div>
          </div>
          {item.navLabel && (
            <button
              type="button"
              onClick={() => go(item.navIntent)}
              className="mb-2 inline-flex items-center rounded-full bg-[#001243] text-white Livvic-Bold text-sm px-4 py-2"
            >
              {item.navLabel}
            </button>
          )}
        </div>
      ))}
      {remaining.length > 0 && (
        <>
          <p className="Livvic-Medium text-sm text-[#6B7280] mb-3">
            What would you like to know?
          </p>
          <div className="flex flex-wrap gap-2">
            {remaining.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => ask(q)}
                className="rounded-full border border-[#C8D8FF] bg-white text-[#001243] Livvic-SemiBold text-sm px-4 py-2 hover:bg-[#EEF3FF]"
              >
                {q.label}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="relative flex items-center w-full bg-white rounded-[16px] border border-gray-200 shadow-md pl-5 pr-2 py-2 mt-6 pointer-events-none select-none">
        <span className="text-gray-400 text-[13px] whitespace-nowrap">
          Select an answer
        </span>
        <span className="flex-1" />
        <span className="w-11 h-11 flex items-center justify-center bg-transparent text-[#D1D5DB] rounded-[12px] ml-2 shrink-0">
          <Send className="w-5 h-5 ml-0.5" />
        </span>
      </div>
      <div className="mt-4 mb-2 flex items-center justify-center gap-1.5 text-[12px] text-[#6B7280] Livvic">
        <img src="/logo3.png" alt="" className="h-3.5 w-3.5" />
        <span className="font-bold">Famlink</span>
        <span>—</span>
        <span>Nanny share made simple.</span>
      </div>
    </div>
  );
}
