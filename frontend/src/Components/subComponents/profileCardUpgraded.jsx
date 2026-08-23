import { Heart, Users } from "lucide-react";
import "./profileCardUpgraded.css";

// Stub levels only — compatibility logic is not implemented yet.
export const MATCH_LEVELS = {
  great: { key: "great", label: "Great Match" },
  possible: { key: "possible", label: "Possible Match" },
  none: { key: "none", label: "Not a Match" },
};

export const FAM_SAYS_STUB = {
  great:
    "Your schedules and location are a strong fit. Both families are looking for a share and have similar-aged children — great foundation for a nanny share.",
  possible:
    "Melissa’s experience with infants is a great fit for your child’s age. Her schedule and rate align well with what you’re looking for in a share.",
  none:
    "You both already have a nanny, so this user isn’t compatible with the type of share you’re looking for.",
};

export const normalizeMatchLevel = (level) => {
  if (level === "great" || level === "possible" || level === "none") return level;
  return "possible";
};

export function stubMatchLevelFromId(id) {
  if (!id) return "possible";
  const n = String(id).split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return ["great", "possible", "none"][n % 3];
}

export function stubFamSaysFor(level) {
  return FAM_SAYS_STUB[normalizeMatchLevel(level)];
}

export function formatRelativeTime(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function MatchBadge({ level }) {
  if (level !== "great" && level !== "possible" && level !== "none") return null;
  return (
    <span className={`fl-match-badge fl-match-badge--${level}`}>
      <span className="fl-match-badge__dot" />
      {MATCH_LEVELS[level].label}
    </span>
  );
}

export function FamSays({ level, text }) {
  if (!text) return null;
  const key = level === "none" || level === "great" || level === "possible" ? level : "possible";
  return (
    <div className={`fl-fam-says fl-fam-says--${key}`}>
      <div className="fl-fam-says__copy">
        <div className="fl-fam-says__brand">
          <img src="/logo3.png" alt="" className="fl-fam-says__logo" />
          <span className="fl-fam-says__name">Fam</span>
          <span className={`fl-fam-says__dot fl-fam-says__dot--${key}`} />
        </div>
        <p className="fl-fam-says__body">{text}</p>
      </div>
    </div>
  );
}

export function UpgradedHeart({ isFavorited, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isFavorited ? "Remove from favourites" : "Add to favourites"}
      className={`fl-upgraded-heart${isFavorited ? " is-favorited" : ""}`}
    >
      <Heart
        size={18}
        className={isFavorited ? "fill-current" : ""}
      />
    </button>
  );
}

export function UpgradedRequestButton({ onClick }) {
  return (
    <button type="button" className="fl-upgraded-request" onClick={onClick}>
      <Users size={13} />
      Request a Match
    </button>
  );
}

export function UpgradedIncomingActions({
  created,
  onDecline,
  onAccept,
  acceptLoading,
  declineLoading,
}) {
  return (
    <>
      <span className="fl-upgraded-timestamp">{formatRelativeTime(created)}</span>
      <button
        type="button"
        className="fl-upgraded-decline"
        disabled={declineLoading}
        onClick={onDecline}
      >
        {declineLoading ? "Waiting..." : "Decline"}
      </button>
      <button
        type="button"
        className="fl-upgraded-accept"
        disabled={acceptLoading}
        onClick={onAccept}
      >
        {acceptLoading ? "Accepting..." : "Accept & Message →"}
      </button>
    </>
  );
}
