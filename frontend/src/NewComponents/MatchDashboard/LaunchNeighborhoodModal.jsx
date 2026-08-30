import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { X, MapPin, Send, ArrowRight, Hourglass, Bell, Loader2 } from "lucide-react";
import Autocomplete from "react-google-autocomplete";
import StatusPill from "../StatusPill";
import { resolveNeighborhood, joinNeighborhoodLaunch } from "../../Config/neighborhoodLaunch";
import { api } from "../../Config/api";
import { fireToastMessage } from "../../toastContainer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_KEY;

function displayName(city, neighborhood) {
  if (city && neighborhood && neighborhood !== city) {
    return `${neighborhood}, ${city}`;
  }
  return neighborhood || city || "";
}

function shortNeighborhood(neighborhood, city) {
  return neighborhood && neighborhood !== city ? neighborhood : neighborhood || city || "";
}

function ProgressRow({ label, current, total, remaining, fractionLabel }) {
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  const statusText =
    fractionLabel ||
    (remaining === 0 ? "Ready to launch" : `${remaining} more to launch`);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <span className="Livvic-Bold text-[13px] leading-none text-[#001243]">{label}</span>
        <span className="Livvic-Bold text-[13px] leading-none text-[#6B7280] whitespace-nowrap">
          {statusText}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[#E5E7F5] overflow-hidden">
        <div className="h-full rounded-full bg-[#B9CFFD]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatusCard({ uiState, resolved, accountType, previewJoin, error }) {
  if (uiState === "loading") {
    return (
      <div className="rounded-2xl border border-[#E8ECF4] bg-[#FAFBFC] px-5 py-10 flex flex-col items-center justify-center gap-3">
        <Loader2 size={24} className="text-[#AEC4FF] animate-spin" />
        <p className="text-sm text-[#6B7280] Livvic-Medium">Looking up neighborhood…</p>
      </div>
    );
  }

  if (uiState === "initial") {
    return (
      <div className="rounded-2xl border border-[#CFD4F7] bg-[#EFF0FC] px-5 py-8 text-center">
        <p className="text-sm text-[#6B7280] leading-relaxed">
          Your neighborhood and its launch progress will show up here once you enter an address
          above.
        </p>
      </div>
    );
  }

  if (uiState === "error" || error) {
    return (
      <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-5 py-6 text-center">
        <p className="text-sm text-[#B91C1C] leading-relaxed">{error}</p>
      </div>
    );
  }

  if (uiState === "out-of-area") {
    const cityLabel = resolved?.city || "your area";
    return (
      <div className="rounded-2xl border border-[#E8ECF4] bg-[#FAFBFC] px-5 py-6">
        <p className="text-sm text-[#001243] leading-relaxed Livvic-Medium">
          FamLink isn&apos;t available in {cityLabel} yet. Enter your email and we&apos;ll let you
          know when we expand to your area.
        </p>
      </div>
    );
  }

  const { city, neighborhood, families, nannies, familyNeed, nannyNeed } = resolved;
  const name = displayName(city, neighborhood);
  const hoodLabel = shortNeighborhood(neighborhood, city).toUpperCase();

  let familiesCount = families;
  let nanniesCount = nannies;
  if (uiState === "new-launch" && previewJoin) {
    if (accountType === "Family") familiesCount = 1;
    else nanniesCount = 1;
  }

  const familiesLeft = Math.max(0, familyNeed - familiesCount);
  const nanniesLeft = Math.max(0, nannyNeed - nanniesCount);

  if (uiState === "active") {
    return (
      <div className="rounded-2xl border border-[#D2E6BA] bg-[#E6EBEA] px-5 py-5">
        <p className="text-[11px] tracking-[0.14em] text-[#075B49] uppercase Livvic-Bold mb-2">
          This neighborhood is already active
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="Livvic-Bold text-xl text-[#001243]">{name}</h3>
          <StatusPill status="active" />
        </div>
      </div>
    );
  }

  const eyebrow =
    uiState === "new-launch" ? "Neighborhood" : "This neighborhood already exists";

  return (
    <div className="rounded-2xl border border-[#CFD4F7] bg-[#EFF0FC] px-5 py-5">
      <p className="text-[11px] tracking-[0.14em] text-gray-500 uppercase Livvic-Bold mb-2">
        {eyebrow}
      </p>
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <h3 className="Livvic-Bold text-xl text-[#001243]">{name}</h3>
        <StatusPill status="launching" />
      </div>
      <p className="text-[11px] tracking-[0.14em] text-gray-500 uppercase Livvic-Bold mb-3">
        {hoodLabel} launch progress
      </p>
      <div className="space-y-4">
        <ProgressRow
          label="Families"
          current={familiesCount}
          total={familyNeed}
          remaining={familiesLeft}
          fractionLabel={
            uiState === "new-launch" && previewJoin && accountType === "Family"
              ? `${familiesCount} of ${familyNeed}`
              : null
          }
        />
        <ProgressRow
          label="Nannies"
          current={nanniesCount}
          total={nannyNeed}
          remaining={nanniesLeft}
          fractionLabel={
            uiState === "new-launch" && previewJoin && accountType === "Nanny"
              ? `${nanniesCount} of ${nannyNeed}`
              : null
          }
        />
      </div>
    </div>
  );
}

export default function LaunchNeighborhoodModal({ onClose }) {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const accessToken = useSelector((s) => s.auth.accessToken);
  const isLoggedIn = Boolean(accessToken && user?._id);
  const knownType =
    user?.type === "Parents" ? "Family" : user?.type === "Nanny" ? "Nanny" : null;
  const userLocation = typeof user?.location === "object" ? user.location : null;

  const [address, setAddress] = useState("");
  const [resolved, setResolved] = useState(null);
  const [resolvedLocation, setResolvedLocation] = useState(null);
  const [accountType, setAccountType] = useState(knownType || "Family");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const uiState = loading
    ? "loading"
    : !resolved
      ? error
        ? "error"
        : "initial"
      : resolved.status === "active" || resolved.status === "activeGrowing"
        ? "active"
        : resolved.insideServiceArea === false
          ? "out-of-area"
          : resolved.families === 0 && resolved.nannies === 0
            ? "new-launch"
            : "existing-launching";

  const showSelector =
    !knownType && uiState !== "active" && uiState !== "loading" && uiState !== "out-of-area";
  // Landing page visitors need email before launch/join; logged-in users use account email.
  const showEmail =
    !isLoggedIn &&
    (uiState === "new-launch" || uiState === "existing-launching" || uiState === "out-of-area");
  const needsEmailToSubmit = showEmail;

  const hoodName = resolved ? shortNeighborhood(resolved.neighborhood, resolved.city) : "";
  const cityName = resolved?.city || "";

  const hasExistingLocation = isLoggedIn && userLocation?.neighborhood;
  const isChangingNeighborhood =
    hasExistingLocation &&
    resolved?.neighborhood &&
    resolved.neighborhood.toLowerCase() !== userLocation.neighborhood.toLowerCase();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handlePlaceSelected = async (place) => {
    if (!place?.geometry) return;
    setAddress(place.formatted_address || "");
    setLoading(true);
    setError(null);
    setResolved(null);

    try {
      const components = place?.address_components || [];
      const get = (type) =>
        components.find((c) => c.types.includes(type))?.long_name || "";

      const city = get("locality") || get("administrative_area_level_2");
      const neighborhood =
        get("neighborhood") ||
        get("sublocality_level_1") ||
        get("sublocality") ||
        city ||
        "";
      const zip = get("postal_code") || "";
      const formattedAddress = place.formatted_address || "";

      if (!city && !neighborhood) {
        setError("Could not identify a city from that address. Try a more specific location.");
        fireToastMessage({
          type: "error",
          message: "Could not identify a city from that address.",
        });
        return;
      }

      setResolvedLocation({ zip, formattedAddress });

      const data = await resolveNeighborhood(city, neighborhood, zip);
      setResolved(data);
    } catch {
      setError("Could not look up that neighborhood. Please try again.");
      fireToastMessage({
        type: "error",
        message: "Could not look up that neighborhood.",
      });
    } finally {
      setLoading(false);
    }
  };

  const accountTypeForApi = () => {
    const type = knownType || accountType;
    return type === "Nanny" ? "Nanny" : "Parents";
  };

  const handleJoin = async () => {
    if (!resolved) return;
    setSubmitting(true);
    try {
      const result = await joinNeighborhoodLaunch({
        city: resolved.city,
        neighborhood: resolved.neighborhood,
        accountType: knownType || accountType,
        zip: resolvedLocation?.zip,
        formattedAddress: resolvedLocation?.formattedAddress,
      });

      const label = shortNeighborhood(resolved.neighborhood, resolved.city);
      if (result.alreadyMember) {
        fireToastMessage({ message: `You're already in ${label}!` });
      } else if (uiState === "new-launch") {
        fireToastMessage({ message: `You've launched ${label}!` });
      } else {
        fireToastMessage({ message: `You've joined the ${label} launch!` });
      }
      onClose();
    } catch {
      fireToastMessage({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinAnonymous = async () => {
    if (!resolved) return;
    if (!email.trim() || !EMAIL_RE.test(email.trim())) {
      fireToastMessage({ type: "error", message: "Please enter a valid email address." });
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/waitlist/confirmation", {
        email: email.trim(),
        userType: accountTypeForApi(),
        location: {
          city: resolved.city,
          neighborhood: resolved.neighborhood,
        },
        notifyConsent: true,
      });
      const label = shortNeighborhood(resolved.neighborhood, resolved.city);
      const msg =
        uiState === "new-launch"
          ? `We'll notify you when ${label} launches!`
          : `We'll notify you when ${label} is active!`;
      fireToastMessage({ message: msg });
      onClose();
    } catch {
      fireToastMessage({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWaitlist = async () => {
    if (isLoggedIn) {
      setSubmitting(true);
      try {
        await api.post("/waitlist/confirmation", {
          email: user.email,
          name: user.name,
          userType: user.type,
          location: { city: resolved.city, neighborhood: resolved.neighborhood },
          notifyConsent: true,
        });
        fireToastMessage({ message: "We'll notify you when we expand to your area!" });
        onClose();
      } catch {
        fireToastMessage({ type: "error", message: "Something went wrong." });
      } finally {
        setSubmitting(false);
      }
    } else {
      handleJoinAnonymous();
    }
  };

  const handleSubmit = () => {
    if (uiState === "active") {
      onClose();
      navigate("/nannyShare");
      return;
    }
    if (uiState === "out-of-area") {
      handleWaitlist();
      return;
    }
    if (isLoggedIn) {
      handleJoin();
    } else {
      handleJoinAnonymous();
    }
  };

  const ctaDisabled =
    uiState === "initial" ||
    loading ||
    submitting ||
    (needsEmailToSubmit && !email.trim());

  let ctaLabel = "Enter an address to continue";
  let CtaIcon = null;

  if (loading) {
    ctaLabel = "Looking up…";
  } else if (submitting) {
    ctaLabel =
      uiState === "new-launch"
        ? "Launching…"
        : uiState === "out-of-area"
          ? "Submitting…"
          : "Joining…";
  } else if (uiState === "new-launch") {
    ctaLabel = `Launch ${hoodName}${cityName ? `, ${cityName}` : ""}`;
    CtaIcon = Send;
  } else if (uiState === "existing-launching") {
    ctaLabel = `Join ${hoodName}`;
    CtaIcon = Hourglass;
  } else if (uiState === "active") {
    ctaLabel = "Go to Find a Match";
    CtaIcon = ArrowRight;
  } else if (uiState === "out-of-area") {
    ctaLabel = "Notify me when available";
    CtaIcon = Bell;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="launch-neighborhood-title"
        className="relative w-full max-w-md bg-[#F7F9FA] rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 shrink-0">
          <h2 id="launch-neighborhood-title" className="Livvic-Bold text-xl text-[#001243]">
            Launch a Neighborhood
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg bg-white transition-colors text-gray-500 shrink-0"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6">
          <p className="text-sm text-[#6B7280] mt-0.5">
            Help bring nanny share matching to your area.
          </p>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm Livvic-SemiBold text-[#001243] mb-1">
              Where would you like to launch?
            </label>
            <p className="text-sm text-[#6B7280] mb-2">
              Enter an address. We&apos;ll identify the neighborhood.
            </p>
            <div className="relative">
              <MapPin
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E8873A] pointer-events-none z-10"
              />
              {GOOGLE_KEY ? (
                <Autocomplete
                  apiKey={GOOGLE_KEY}
                  libraries={["places"]}
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (!e.target.value) {
                      setResolved(null);
                      setError(null);
                    }
                  }}
                  onPlaceSelected={handlePlaceSelected}
                  options={{ types: ["geocode"], componentRestrictions: { country: "us" } }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8ECF4] text-sm focus:outline-none transition-colors"
                  placeholder="Enter your street address"
                />
              ) : (
                <input
                  type="text"
                  disabled
                  placeholder="Address search unavailable (missing API key)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8ECF4] text-sm bg-[#FAFBFC] text-[#9CA3AF]"
                />
              )}
            </div>
            {!GOOGLE_KEY && (
              <p className="text-xs text-[#B91C1C] mt-2">
                Set VITE_GOOGLE_KEY in frontend/.env to enable address search.
              </p>
            )}
          </div>

          <StatusCard
            uiState={uiState}
            resolved={resolved}
            accountType={accountType}
            previewJoin={uiState === "new-launch"}
            error={error}
          />

          {showSelector && (
            <div>
              <label className="block text-sm Livvic-SemiBold text-[#001243] mb-2">
                I am a…
              </label>
              <div className="flex gap-4">
                {["Family", "Nanny"].map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="accountType"
                      value={type}
                      checked={accountType === type}
                      onChange={() => setAccountType(type)}
                      className="w-4 h-4 text-[#A9B4F2] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-[#001243]">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {showEmail && (
            <div>
              <label className="block text-sm Livvic-SemiBold text-[#001243] mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8ECF4] text-sm focus:outline-none focus:border-[#AEC4FF] transition-colors"
              />
            </div>
          )}

          {isChangingNeighborhood &&
            (uiState === "new-launch" || uiState === "existing-launching") && (
              <p className="text-xs text-[#B45309] bg-[#FFF7ED] border border-[#FED7AA] rounded-xl px-4 py-3 leading-relaxed">
                You&apos;re currently in {displayName(userLocation.city, userLocation.neighborhood)}.
                Joining {hoodName} will update your neighborhood.
              </p>
            )}
          <div className="w-full text-center">
            <button
              type="button"
              disabled={ctaDisabled}
              onClick={handleSubmit}
              className={`inline-flex items-center justify-center gap-2 Livvic-SemiBold px-4 py-3 rounded-2xl transition-colors ${
                ctaDisabled
                  ? "bg-[#E8ECF4] text-[#9CA3AF] cursor-not-allowed"
                  : "bg-[#C5CAF4] border border-[#ABB4ED] text-[#001243]"
              }`}
            >
              {loading && <Loader2 size={16} className="animate-spin shrink-0" />}
              {!loading && uiState === "existing-launching" && !isLoggedIn ? (
                <span className="flex flex-col items-center gap-0.5 leading-tight">
                  <span className="inline-flex items-center gap-2">
                    <Hourglass size={16} className="shrink-0" />
                    {submitting ? "Joining…" : `Join ${hoodName}`}
                  </span>
                  {!submitting && (
                    <span className="text-xs Livvic-Medium font-normal">
                      Get notified when it&apos;s active
                    </span>
                  )}
                </span>
              ) : (
                <>
                  {!loading && CtaIcon && uiState !== "active" && (
                    <CtaIcon size={16} className="shrink-0" />
                  )}
                  <span className="Livvic-Bold text-[13px] text-[#001243]">
                    {ctaLabel}
                  </span>
                  {uiState === "active" && !ctaDisabled && (
                    <ArrowRight size={16} className="shrink-0" />
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.92); } 100% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
