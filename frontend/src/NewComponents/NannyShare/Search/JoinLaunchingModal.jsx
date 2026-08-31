import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { UserPlus, Mail, X } from "lucide-react";
import { joinNeighborhoodLaunch } from "../../../Config/neighborhoodLaunch";
import { api } from "../../../Config/api";
import { fireToastMessage } from "../../../toastContainer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CTA_CLASS =
  "w-full inline-flex items-center justify-center gap-2 Livvic-Bold text-[14px] text-[#001243] bg-[#C5CAF4] border border-[#ABB4ED] rounded-2xl px-5 py-3.5 hover:brightness-[0.98] transition-[filter] disabled:opacity-60 disabled:cursor-not-allowed";

function shortNeighborhood(neighborhood, city) {
  return neighborhood && neighborhood !== city ? neighborhood : neighborhood || city || "";
}

function OptionCard({ icon, iconClassName, title, description, children, cardClassName = "" }) {
  return (
    <div className={`rounded-2xl border p-5 ${cardClassName}`}>
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconClassName}`}
        >
          {icon}
        </div>
        <h3 className="Livvic-Bold text-[15px] text-[#001243] leading-snug min-w-0">{title}</h3>
      </div>
      <p className="text-sm text-[#6B7280] mt-2 Livvic-Medium leading-relaxed">{description}</p>
      {children}
    </div>
  );
}

export default function JoinLaunchingModal({ neighborhood, city, variant = "landing", onClose }) {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const isLoggedIn = Boolean(user?.type);

  const knownType =
    user?.type === "Parents" ? "Family" : user?.type === "Nanny" ? "Nanny" : null;
  const [accountType, setAccountType] = useState(knownType || "Family");
  const [email, setEmail] = useState(user?.email || "");
  const [submitting, setSubmitting] = useState(false);

  const hoodLabel = shortNeighborhood(neighborhood, city);
  const locationLabel =
    city && neighborhood && neighborhood !== city ? `${neighborhood}, ${city}` : neighborhood || city;

  const accountTypeForApi = () => {
    const type = knownType || accountType;
    return type === "Nanny" ? "Nanny" : "Parents";
  };

  const handleCreateAccount = async () => {
    if (isLoggedIn) {
      setSubmitting(true);
      try {
        await joinNeighborhoodLaunch({
          city,
          neighborhood,
          accountType: knownType || accountType,
        });
        fireToastMessage({ message: `You've joined the ${hoodLabel} launch!` });
        onClose();
      } catch {
        fireToastMessage({ type: "error", message: "Something went wrong. Please try again." });
      } finally {
        setSubmitting(false);
      }
      return;
    }
    onClose();
    navigate("/joinNow");
  };

  const handleNotify = async () => {
    const notifyEmail = isLoggedIn ? user.email : email.trim();
    if (!notifyEmail || !EMAIL_RE.test(notifyEmail)) {
      fireToastMessage({ type: "error", message: "Please enter a valid email address." });
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/waitlist/confirmation", {
        email: notifyEmail,
        name: user?.name,
        userType: accountTypeForApi(),
        location: { city, neighborhood },
        notifyConsent: true,
      });
      fireToastMessage({ message: `We'll notify you when ${hoodLabel} is active!` });
      onClose();
    } catch {
      fireToastMessage({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-launching-title"
        className="relative w-full max-w-lg bg-[#F7F9FA] rounded-[24px] shadow-[0_8px_40px_rgba(0,18,67,0.12)] overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] tracking-[0.14em] text-[#9CA3AF] uppercase Livvic-Bold mb-2">
                Join a launching neighborhood
              </p>
              <h2
                id="join-launching-title"
                className="Livvic-Bold text-[22px] text-[#001243] leading-tight break-words"
              >
                {locationLabel}
              </h2>
              <p className="text-sm text-[#6B7280] mt-1.5 Livvic-Medium leading-relaxed">
                Choose how you&apos;d like to help launch this neighborhood.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#E8E8E8] bg-white text-[#6B7280] hover:bg-[#FAFAFA] shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <OptionCard
            cardClassName="border-[#D1D9FF] bg-white"
            icon={<UserPlus size={18} className="text-[#001243]" strokeWidth={2} />}
            iconClassName="bg-[#C5CAF4] border border-[#ABB4ED]"
            title={`I live in ${hoodLabel}`}
            description={
              isLoggedIn
                ? `Join the ${hoodLabel} launch and help bring matching to your neighborhood.`
                : `Create an account and join the ${hoodLabel} launch.`
            }
          >
            <button
              type="button"
              disabled={submitting}
              onClick={handleCreateAccount}
              className={`${CTA_CLASS} mt-4`}
            >
              {isLoggedIn ? "Join launch" : "Create account & join"}
            </button>
          </OptionCard>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-[#E8ECF4]" />
            </div>
            <p className="relative flex justify-center">
              <span className="bg-[#F7F9FA] px-3 text-[11px] Livvic-Bold text-[#9CA3AF] uppercase tracking-wider">
                Or
              </span>
            </p>
          </div>

          <OptionCard
            cardClassName="border-[#E8E8E8] bg-white"
            icon={<Mail size={18} className="text-[#001243]" strokeWidth={2} />}
            iconClassName="bg-white border border-[#E8E8E8]"
            title="Notify me when it launches"
            description={`Not ready to join? Get an email when matching becomes active in ${hoodLabel}. No account needed.`}
          >
            {!isLoggedIn && (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-[11px] tracking-[0.1em] text-[#9CA3AF] uppercase Livvic-Bold mb-2">
                    Are you a family or nanny?
                  </p>
                  <div className="flex gap-5">
                    {["Family", "Nanny"].map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="joinLaunchAccountType"
                          value={type}
                          checked={accountType === type}
                          onChange={() => setAccountType(type)}
                          className="w-4 h-4 text-[#A9B4F2] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-sm text-[#001243] Livvic-Medium">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <label className="block">
                  <span className="text-[11px] tracking-[0.1em] text-[#9CA3AF] uppercase Livvic-Bold">
                    Email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="mt-2 w-full px-4 py-2.5 rounded-xl border border-[#E8ECF4] bg-white text-sm focus:outline-none focus:border-[#AEC4FF] transition-colors"
                  />
                </label>
              </div>
            )}

            <button
              type="button"
              disabled={submitting}
              onClick={handleNotify}
              className={`${CTA_CLASS} mt-4`}
            >
              Notify me
            </button>
          </OptionCard>
        </div>
      </div>
      <style>{`
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.94); } 100% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
