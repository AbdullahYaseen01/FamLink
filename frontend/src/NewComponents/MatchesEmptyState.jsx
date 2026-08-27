import { Inbox, MessageCircle, Send } from "lucide-react";
import "./matchesTab.css";

const ICONS = {
  requests: Inbox,
  messages: MessageCircle,
  sent: Send,
};

const MatchesEmptyState = ({
  variant,
  headline,
  line,
  description,
  cta,
  ctaLabel,
  onCta,
}) => {
  const Icon = ICONS[variant] || Inbox;
  const text = line || description;
  const button = cta || ctaLabel;
  return (
    <div className="fl-matches-empty">
      <div className="fl-matches-empty__icon" aria-hidden="true">
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <h3 className="fl-matches-empty__title Livvic-Bold">{headline}</h3>
      <p className="fl-matches-empty__text Livvic">{text}</p>
      {button && (
        <button type="button" className="fl-matches-empty__cta Livvic-SemiBold" onClick={onCta}>
          {button}
        </button>
      )}
    </div>
  );
};

export default MatchesEmptyState;
