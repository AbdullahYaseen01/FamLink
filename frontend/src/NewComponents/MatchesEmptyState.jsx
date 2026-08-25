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
  ctaLabel,
  onCta,
}) {
  const Icon = ICONS[variant] || Inbox;
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="w-12 h-12 rounded-2xl bg-[#EBF0FF] flex items-center justify-center mb-4">
        <Icon size={22} color="#0D134C" strokeWidth={1.8} />
      </div>
      <h3 className="Livvic-Bold text-xl text-[#0D134C] mb-2">{headline}</h3>
      <p className="Livvic text-sm text-gray-500 max-w-sm leading-relaxed">{description}</p>
      {ctaLabel && onCta && (
        <button
          type="button"
          onClick={onCta}
          className="mt-6 bg-[#AEC4FF] hover:bg-[#9db4f7] text-[#0D134C] Livvic-Bold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
