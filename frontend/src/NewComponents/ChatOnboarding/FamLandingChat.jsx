import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";

const FAMILY_QUESTIONS = [
  {
    id: "how_nanny_shares_work",
    label: "How does a nanny share actually work?",
    answer: (
      <>
        <p>Two families share one nanny, often with the nanny caring for both families&apos; children at the same time.</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><span className="Livvic-Bold">Share the cost</span> of having a nanny</li>
          <li><span className="Livvic-Bold">Your child gets a built-in playmate</span> and more social time</li>
          <li><span className="Livvic-Bold">Your nanny can earn more overall</span> through the shared arrangement</li>
        </ul>
        <p className="mt-2">FamLink helps you find families and nannies whose schedules, locations, and care needs work well together.</p>
      </>
    ),
    navIntent: "how_nanny_shares_work",
    navLabel: "See how nanny shares work →",
  },
  {
    id: "how_much_save",
    label: "How much could my family save?",
    answer: (
      <>
        <p>Families can save <span className="Livvic-Bold">up to 50%</span> compared with hiring a nanny on their own, depending on your schedule, location, and share setup.</p>
        <p className="mt-2">Use our calculator to estimate what your family could save.</p>
      </>
    ),
    navIntent: "cost_calculator",
    navLabel: "See how much you could save →",
  },
  {
    id: "already_have_nanny",
    label: "I already have a nanny. Can I still share?",
    answer: (
      <>
        <p>Yes! Keep the nanny you already love and use FamLink to find another family to join your share.</p>
        <p className="mt-2">We&apos;ll help you find families whose <span className="Livvic-Bold">schedule, location, and care needs</span> align with yours.</p>
      </>
    ),
    navIntent: "find_family_to_share",
    navLabel: "Find a family to share with →",
  },
  {
    id: "how_find_matches",
    label: "How does FamLink find my matches?",
    answer: (
      <>
        <p>Complete your profile so FAM can understand your <span className="Livvic-Bold">schedule, location, preferences, and share needs.</span></p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><span className="Livvic-Bold">See how well each match fits</span> — FAM shows how closely families and nannies align with what you&apos;re looking for, while still letting you explore other possible matches.</li>
          <li><span className="Livvic-Bold">Automatic match requests</span> — FAM sends requests to compatible users for you, including new users who join later, so you don&apos;t miss a potential match.</li>
        </ul>
      </>
    ),
    navIntent: "create_account",
    navLabel: "Create a free account →",
  },
];

const NANNY_QUESTIONS = [
  {
    id: "how_nanny_shares_work",
    label: "How does a nanny share work for nannies?",
    answer: (
      <>
        <p>You care for children from two families as part of one shared arrangement.</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Earn more overall than you typically would with one family</li>
          <li>Keep one consistent role while working with both families</li>
          <li>FamLink helps you find families whose schedules, locations, and care needs fit yours</li>
        </ul>
      </>
    ),
    navIntent: "how_nanny_shares_work",
    navLabel: "See How Nanny Shares Work →",
  },
  {
    id: "nanny_share_pay",
    label: "How much more can I get paid as a nanny share nanny?",
    answer: (
      <>
        <p>In a nanny share, each family contributes toward your rate, so your <span className="Livvic-Bold">total hourly pay is often higher</span> than in a single-family nanny role.</p>
        <p className="mt-2">What you can earn depends on your location, experience, schedule, and the share setup.</p>
      </>
    ),
    navIntent: "earn_calculator",
    navLabel: "See what you could earn →",
  },
  {
    id: "already_work_family",
    label: "I already work with a family. Can I add a share?",
    answer: (
      <>
        <p>Yes. Keep working with your current family and use FamLink to find a second family to join your share.</p>
        <p className="mt-2">We&apos;ll help you find families whose schedule, location, and care needs work with your current setup.</p>
      </>
    ),
    navIntent: "find_second_family",
    navLabel: "Find a Second Family →",
  },
  {
    id: "how_find_positions",
    label: "How does FamLink find share positions for me?",
    answer: (
      <>
        <p>Complete your profile so FAM can understand your <span className="Livvic-Bold">schedule, location, experience, preferences, and share needs.</span></p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><span className="Livvic-Bold">See how well each opportunity fits</span> — FAM shows how closely families align with what you&apos;re looking for, while still letting you explore other possible opportunities.</li>
          <li><span className="Livvic-Bold">Automatic match requests</span> — FAM sends requests to compatible families for you, including new families who join later, so you don&apos;t miss a potential match.</li>
        </ul>
      </>
    ),
    navIntent: "create_account",
    navLabel: "Create a Free Account →",
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
              className="mb-2 inline-flex items-center rounded-full bg-[#001243] text-white Livvic-Bold text-[12px] px-3 py-1.5"
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
