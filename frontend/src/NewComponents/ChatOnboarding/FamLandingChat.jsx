import { useState } from "react";
import { Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../Config/api";

export default function FamLandingChat({ answers }) {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [thread, setThread] = useState([]);

  const send = async () => {
    const message = text.trim();
    if (!message || busy) return;
    setText("");
    setBusy(true);
    setThread((prev) => [...prev, { role: "user", text: message }]);
    try {
      const { data } = await api.post("/landing/fam-chat", { answers, message });
      setThread((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer,
          navIntent: data.navigation_intent,
          navLabel: data.primary_button_label,
          clarify: data.requires_clarification,
        },
      ]);
    } catch {
      setThread((prev) => [
        ...prev,
        { role: "assistant", text: "Complete the questions above before chatting with Fam." },
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
            {m.role === "assistant" && m.navLabel && !m.clarify && (
              <button
                type="button"
                onClick={() => {
                  const routes = {
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
                  const to = routes[m.navIntent];
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
      <div className="relative flex items-center w-full bg-white rounded-[16px] border border-gray-200 shadow-md pl-5 pr-2 py-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask FAM Anything"
          className="flex-1 bg-transparent border-none outline-none py-2 text-[#001243] placeholder-[#9CA3AF] text-[15px]"
        />
        <button
          type="button"
          onClick={send}
          disabled={busy || !text.trim()}
          className="w-11 h-11 flex items-center justify-center bg-[#001243] text-white rounded-[12px] disabled:opacity-40"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
