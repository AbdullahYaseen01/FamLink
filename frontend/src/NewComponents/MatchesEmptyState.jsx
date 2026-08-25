import { Inbox, MessageCircle, Send } from "lucide-react";
import "./matchesTab.css";

const ICONS = {
  requests: Inbox,
  messages: MessageCircle,
  sent: Send,
};

const MatchesEmptyState = ({ variant, headline, line, cta, onCta }) => {
  const Icon = ICONS[variant] || Inbox;
  return (
    <div className="fl-matches-empty">
      <div className="fl-matches-empty__icon" aria-hidden="true">
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <h3 className="fl-matches-empty__title Livvic-Bold">{headline}</h3>
      <p className="fl-matches-empty__text Livvic">{line}</p>
      {cta && (
        <button type="button" className="fl-matches-empty__cta Livvic-SemiBold" onClick={onCta}>
          {cta}
        </button>
      )}
    </div>
  );
};

export default MatchesEmptyState;
