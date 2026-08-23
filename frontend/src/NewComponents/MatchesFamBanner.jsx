import { useMemo } from "react";
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

  return (
    <div className="fl-fam-strip">
      <div className="fl-fam-strip__top">
        <div className="fl-fam-strip__badge">
          <img src="/logo3.png" alt="" className="fl-fam-strip__logo" />
          <span className="fl-fam-strip__name">Fam</span>
          <span className="fl-fam-strip__dot" />
        </div>
      </div>
      <p className="fl-fam-strip__msg">{message}</p>
    </div>
  );
}
