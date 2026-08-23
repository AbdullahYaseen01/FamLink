import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { canSeeMatchInsights } from "../Config/matchGate";
import { formatDisplayName } from "./matchesHelpers";
import "./MatchesFamBanner.css";

export default function MatchesFamBanner({
  pendingMatches = [],
  outgoingCount = 0,
  unreadCount = 0,
  user,
  currentProfile,
  subscription,
}) {
  const [open, setOpen] = useState(true);
  const [draft, setDraft] = useState("");
  const isPlusView = canSeeMatchInsights(user, currentProfile, subscription);

  const message = useMemo(() => {
    if (!isPlusView) {
      return "Browse profiles and send a match request — your incoming requests and replies will appear here once you're active.";
    }
    const incoming = pendingMatches.length;
    const firstName = formatDisplayName(pendingMatches[0]?.userId?.name) || "Someone";
    if (incoming > 0) {
      return (
        <>
          You have <strong>{incoming} new request{incoming === 1 ? "" : "s"}</strong>
          {" — "}
          {firstName} looks like a strong fit.
          {outgoingCount > 0 && (
            <>
              {" "}I also sent <strong>{outgoingCount} request{outgoingCount === 1 ? "" : "s"}</strong> on your behalf this week.
            </>
          )}
        </>
      );
    }
    if (outgoingCount > 0) {
      return (
        <>
          I sent <strong>{outgoingCount} request{outgoingCount === 1 ? "" : "s"}</strong> on your behalf this week. Replies will show up here.
        </>
      );
    }
    if (unreadCount > 0) {
      return `You have ${unreadCount} unread conversation${unreadCount === 1 ? "" : "s"}.`;
    }
    return "No new notifications — I'll flag strong fits as they come in.";
  }, [isPlusView, pendingMatches, outgoingCount, unreadCount]);

  const send = () => setDraft("");

  return (
    <div className={`fl-fam-strip${open ? "" : " is-collapsed"}`}>
      <div className="fl-fam-strip__top">
        <button type="button" className="fl-fam-strip__badge" onClick={() => setOpen(true)}>
          <img src="/logo3.png" alt="" className="fl-fam-strip__logo" />
          <span className="fl-fam-strip__name">Fam</span>
          <span className="fl-fam-strip__dot" />
        </button>
        {open && (
          <button type="button" className="fl-fam-strip__close" onClick={() => setOpen(false)} aria-label="Collapse Fam">
            ✕
          </button>
        )}
      </div>
      <div className="fl-fam-strip__body">
        <p className="fl-fam-strip__msg">{message}</p>
        <div className="fl-fam-strip__input-wrap">
          <input
            className="fl-fam-strip__input"
            type="text"
            placeholder="Message Fam..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button type="button" className="fl-fam-strip__send" onClick={send} aria-label="Send">
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
