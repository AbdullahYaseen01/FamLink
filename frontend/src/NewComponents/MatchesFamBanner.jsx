import { useMemo } from "react";

export default function MatchesFamBanner({
  pendingMatches = [],
  outgoingCount = 0,
  unreadCount = 0,
}) {
  const notification = useMemo(() => {
    const incoming = pendingMatches.length;
    if (incoming > 0) {
      return `You have ${incoming} incoming Match Request${incoming === 1 ? "" : "s"} waiting for a reply!`;
    }
    if (unreadCount > 0) {
      return `You have ${unreadCount} unread conversation${unreadCount === 1 ? "" : "s"}.`;
    }
    if (outgoingCount > 0) {
      return `You have ${outgoingCount} sent request${outgoingCount === 1 ? "" : "s"} waiting for a reply.`;
    }
    return "No new notifications";
  }, [pendingMatches, outgoingCount, unreadCount]);

  return (
    <div className="flex items-center gap-2 mb-4 px-1">
      <img src="/logo3.png" alt="" className="w-5 h-5 object-contain" />
      <p className="Livvic text-sm text-[#0D134C] leading-relaxed">
        <span className="Livvic-Bold">Fam</span>
        <span className="text-gray-400 mx-1.5">•</span>
        <span>{notification}</span>
      </p>
    </div>
  );
}
