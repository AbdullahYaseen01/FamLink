import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../Config/api";

const FAMILY_QUESTIONS = [
  { id: "how_nanny_shares_work", label: "How does a nanny share actually work?" },
  { id: "how_much_save", label: "How much could my family save?" },
  { id: "already_have_nanny", label: "I already have a nanny. Can I still share?" },
  { id: "how_find_matches", label: "How does FamLink find my matches?" },
];

const NANNY_QUESTIONS = [
  { id: "how_nanny_shares_work", label: "How does a nanny share work for nannies?" },
  { id: "nanny_share_pay", label: "How much more can I get paid as a nanny share nanny?" },
  { id: "already_work_family", label: "I already work with a family. Can I add a share?" },
  { id: "how_find_positions", label: "How does FamLink find share positions for me?" },
];

const NAV_ROUTES = {
  how_nanny_shares_work: "/resources/how-does-a-nanny-share-work",
  nanny_share_resources: "/nanny-share-resources",
  find_nanny_share: "/find-nanny-share",
  find_family_to_share: "/find-nanny-share",
  explore_opportunities: "/jobSeekers",
  find_second_family: "/caregiver/nannyshare",
  create_account: "/joinNow",
  sign_in: "/login",
  explore_resources: "/resources",
};

export default function FamLandingChat({ answers }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [thread, setThread] = useState([]);
  const questions = answers?.role === "Nanny" ? NANNY_QUESTIONS : FAMILY_QUESTIONS;

  const ask = async (question) => {
    if (busy) return;
    setBusy(true);
    setThread((prev) => [...prev, { role: "user", text: question.label }]);
    try {
      const { data } = await api.post("/landing/guided-qa", {
        answers,
        question_id: question.id,
      });
      setThread((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer,
          navIntent: data.navigation_intent,
          navLabel: data.primary_button_label,
        },
      ]);
    } catch {
      setThread((prev) => [
        ...prev,
        { role: "assistant", text: "Complete the questions above to continue with Fam." },
      ]);
    } finally {
      setBusy(false);
    }
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
            disabled={busy}
            onClick={() => ask(q)}
            className="rounded-full border border-[#C8D8FF] bg-white text-[#001243] Livvic-SemiBold text-sm px-4 py-2 hover:bg-[#EEF3FF] disabled:opacity-40"
          >
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );
}
