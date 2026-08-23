import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";

const FAMILY_QUESTIONS = [
  {
    id: "how_nanny_shares_work",
    label: "How does a nanny share actually work?",
    answer:
      "Two families share one trusted nanny. You split the schedule and the pay, so each family usually spends less than hiring alone — and your child still gets consistent care. FamLink finds families and nannies that actually fit.",
    navIntent: "how_nanny_shares_work",
    navLabel: "See How Nanny Shares Work",
  },
  {
    id: "how_much_save",
    label: "How much could my family save?",
    answer:
      "Many families save up to about 50% compared with hiring a nanny on their own, depending on hours, location, and how you split the week. We don’t invent local rates here — FamLink’s resources walk through cost, payroll, and agreements.",
    navIntent: "nanny_share_resources",
    navLabel: "Open Nanny-Share Resources",
  },
  {
    id: "already_have_nanny",
    label: "I already have a nanny. Can I still share?",
    answer:
      "Yes. Keep your nanny and add a second family to the week. FamLink looks for a compatible family so your nanny can work with both of you — and you both share the cost.",
    navIntent: "find_family_to_share",
    navLabel: "Find a Family to Share With",
  },
  {
    id: "how_find_matches",
    label: "How does FamLink find my matches?",
    answer:
      "Tell Fam your location, schedule, and share type. We surface families and caregivers that fit — no Facebook groups or spreadsheets. Create a free account to see full matches.",
    navIntent: "create_account",
    navLabel: "Create a Free Account",
  },
];

const NANNY_QUESTIONS = [
  {
    id: "how_nanny_shares_work",
    label: "How does a nanny share work for nannies?",
    answer:
      "You work with two families on a shared schedule. They split your pay, so you keep one role — and typically earn more than a single-family job. FamLink matches you with families ready to share.",
    navIntent: "how_nanny_shares_work",
    navLabel: "See How Nanny Shares Work",
  },
  {
    id: "nanny_share_pay",
    label: "How much more can I get paid as a nanny share nanny?",
    answer:
      "Two families share your hours and your rate, so combined pay is often higher than a single-family role. The exact bump depends on your schedule and local rates. FamLink’s resources explain share pay — we don’t invent numbers in chat.",
    navIntent: "nanny_share_resources",
    navLabel: "Open Nanny-Share Resources",
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
      "We match you with families looking for a share, using your schedule, location, and experience. Create a free account to see positions and keep matching.",
    navIntent: "create_account",
    navLabel: "Create a Free Account",
  },
];

const NAV_ROUTES = {
  how_nanny_shares_work: "/resources/how-does-a-nanny-share-work",
  nanny_share_resources: "/nanny-share-resources",
  find_family_to_share: "/find-nanny-share",
  find_second_family: "/caregiver/nannyshare",
  create_account: "/joinNow",
};

export default function FamLandingChat({ answers }) {
  const navigate = useNavigate();
  const [thread, setThread] = useState([]);
  const questions = answers?.role === "Nanny" ? NANNY_QUESTIONS : FAMILY_QUESTIONS;

  const ask = (question) => {
    setThread((prev) => [
      ...prev,
      { role: "user", text: question.label },
      {
        role: "assistant",
        text: question.answer,
        navIntent: question.navIntent,
        navLabel: question.navLabel,
      },
    ]);
  };

  return (
    <div className="w-full max-w-[680px] mx-auto mt-8 px-4">
      <div className="flex flex-col gap-3 mb-4">
        {thread.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <p className={`Livvic text-[15px] ${m.role === "user" ? "text-[#001243]" : "text-[#374151]"}`}>
              {m.text}
            </p>
            {m.role === "assistant" && m.navLabel && (
              <button
                type="button"
                onClick={() => {
                  const to = NAV_ROUTES[m.navIntent];
                  if (to) navigate(to);
                }}
                className="mt-2 inline-flex items-center rounded-full bg-[#001243] text-white Livvic-Bold text-sm px-4 py-2"
              >
                {m.navLabel}
              </button>
            )}
          </div>
        ))}
      </div>
      <p className="Livvic-Medium text-sm text-[#6B7280] mb-3">
        What would you like to know?
      </p>
      <div className="flex flex-wrap gap-2">
        {questions.map((q) => (
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
      <div className="relative flex items-center w-full bg-white rounded-[16px] border border-gray-200 shadow-md pl-5 pr-2 py-2 mt-6 pointer-events-none select-none">
        <span className="text-gray-400 text-[13px] whitespace-nowrap">
          Select a question above
        </span>
        <span className="flex-1" />
        <span className="w-11 h-11 flex items-center justify-center bg-[#001243] text-white rounded-[12px] ml-2 shrink-0 blur-[2px] opacity-50">
          <Send className="w-5 h-5 ml-0.5" />
        </span>
      </div>
    </div>
  );
}
