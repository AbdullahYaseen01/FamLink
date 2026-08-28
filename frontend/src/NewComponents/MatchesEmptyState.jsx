import { Inbox, MessageCircle, Send } from "lucide-react";

const ICONS = {
  requests: Inbox,
  messages: MessageCircle,
  sent: Send,
};

export default function MatchesEmptyState({
  variant = "requests",
  headline,
  description,
  line,
  ctaLabel,
  cta,
  onCta,
}) {
  const Icon = ICONS[variant] || Inbox;
  const copy = description || line;
  const button = ctaLabel || cta;
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="w-12 h-12 rounded-[10px] bg-[#EEF3FF] text-[#001243] flex items-center justify-center mb-4">
        <Icon size={22} strokeWidth={1.8} />
      </div>
      <h3 className="Livvic-Bold text-xl text-[#0D134C] mb-2">{headline}</h3>
      {copy ? (
        <p className="Livvic text-sm text-gray-500 max-w-sm leading-relaxed">{copy}</p>
      ) : null}
      {button && onCta && (
        <button
          type="button"
          onClick={onCta}
          className="mt-6 bg-[#001243] hover:bg-[#0a1d5c] text-white Livvic-Bold text-sm px-5 py-2.5 rounded-full transition-colors"
        >
          {button}
        </button>
      )}
    </div>
  );
}
