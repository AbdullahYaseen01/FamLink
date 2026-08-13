import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../Config/api";
import { landingSessionHeaders } from "../../Config/landingFamSession";
import { resolveFamNav } from "../../Config/famNavIntents";
import Button from "../Button";

/**
 * Landing FAM free-text chat. When locked, input stays disabled (server also rejects).
 */
export default function LandingFamChat({ chatEnabled, profileType }) {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");

  const send = async () => {
    const text = input.trim();
    if (!text || !chatEnabled || sending) return;
    setSending(true);
    setError("");
    setInput("");
    const nextHistory = [...messages, { role: "user", content: text }];
    setMessages(nextHistory);

    try {
      const { data } = await api.post(
        "/landing/fam-chat",
        {
          message: text,
          history: nextHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
        { headers: landingSessionHeaders() }
      );

      if (data?.chat_enabled === false) {
        setError("Chat unlocks after initial onboarding.");
        return;
      }

      const nav =
        data?.navigation ||
        resolveFamNav(data?.navigation_intent, data?.primary_button_label);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data?.answer || "Sorry, I couldn't answer that.",
          navigation: data?.requires_clarification ? null : nav,
        },
      ]);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "FAM could not answer right now. Please try again.";
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mt-8 mb-12" aria-label="Ask FAM Anything">
      <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 max-w-3xl mx-auto">
        <h2 className="text-lg Livvic-Bold text-[#001243] mb-1">Ask FAM Anything</h2>
        {!chatEnabled ? (
          <p className="text-sm text-gray-500 mb-4">
            Chat unlocks after you complete the short form above (initial onboarding).
          </p>
        ) : (
          <p className="text-sm text-gray-500 mb-4">
            Ask about nanny shares
            {profileType ? ` — tailored to your profile` : ""}.
          </p>
        )}

        <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-2xl px-4 py-3 text-sm ${
                m.role === "user"
                  ? "bg-[#EEF2FF] text-[#001243] ml-8"
                  : "bg-[#F6F3EE] text-gray-800 mr-8"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.role === "assistant" && m.navigation?.path && (
                <div className="mt-3">
                  <Button
                    btnText={m.navigation.label}
                    className="bg-[#AEC4FF] !px-4 !py-2 !rounded-xl !text-sm"
                    action={() => navigate(m.navigation.path)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

        <div className="flex gap-2 items-end">
          <label className="sr-only" htmlFor="fam-landing-input">
            Ask FAM Anything
          </label>
          <textarea
            id="fam-landing-input"
            rows={2}
            disabled={!chatEnabled || sending}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={
              chatEnabled
                ? "Ask FAM Anything…"
                : "Complete initial onboarding to unlock chat"
            }
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
          />
          <Button
            btnText={sending ? "…" : "Send"}
            className="bg-[#AEC4FF] !px-5 !py-2 !rounded-xl disabled:opacity-50"
            action={send}
            disabled={!chatEnabled || sending || !input.trim()}
          />
        </div>
      </div>
    </section>
  );
}
