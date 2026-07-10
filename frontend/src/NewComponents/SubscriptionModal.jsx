import { useEffect, useState } from "react";
import { Star, Check, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { createCheckoutThunk } from "../Components/Redux/cardSlice";
import { fireToastMessage } from "../toastContainer";

/* Subscription upgrade modal ("FamLink Plus").
   Opens from the navbar "Upgrade" button. The CTA runs the same Stripe
   Checkout flow as the pricing page (createCheckoutThunk → redirect). */
export default function SubscriptionModal({ onClose, nanny }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  // Lock body scroll + close on Escape while mounted.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data, status } = await dispatch(
        createCheckoutThunk({
          priceId: nanny
            ? import.meta.env.VITE_STRIPE_NANNY_PREMIUM_PRICE_ID
            : import.meta.env.VITE_STRIPE_FAMILY_PREMIUM_PRICE_ID,
        })
      ).unwrap();
      if (status === 200 && data?.url) {
        window.location.href = data.url;
      } else {
        fireToastMessage({
          message: "Sorry, we are unable to create checkout",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      fireToastMessage({
        message: "Sorry, we are unable to create checkout",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0D134C]/25 backdrop-blur-sm"
    >
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md px-8 py-9 animate-[popIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)_both]">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X size={16} className="text-gray-500" />
        </button>

        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 bg-[#D6FB9A] text-[#025747] rounded-full px-3 py-1 mb-5 Livvic-Bold text-xs tracking-wide">
          <Star size={12} fill="#025747" strokeWidth={0} />
          FAMLINK PLUS
        </span>

        {/* Heading */}
        <h2 className="Livvic-Bold text-2xl text-[#0D134C] mb-1.5">
          Upgrade to FamLink Plus
        </h2>
        <p className="Livvic text-gray-500 text-sm mb-6">
          Keep matching until you find the right nanny share.
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-6">
          <span className="Livvic-Bold text-5xl text-[#0D134C]">$35</span>
          <span className="Livvic-Medium text-gray-500 text-base">/month</span>
        </div>

        {/* Feature */}
        <div className="flex items-center gap-3 mb-7">
          <span className="w-6 h-6 rounded-full bg-[#D6FB9A] flex items-center justify-center shrink-0">
            <Check size={14} className="text-[#025747]" strokeWidth={3} />
          </span>
          <span className="Livvic-Bold text-[#0D134C] text-[15px]">
            Unlimited match requests
          </span>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full bg-[#AEC4FF] hover:bg-[#9db4f7] disabled:opacity-60 disabled:cursor-not-allowed text-[#0D134C] Livvic-Bold py-3 rounded-xl transition-colors"
        >
          {loading ? "Redirecting…" : "Upgrade to FamLink Plus"}
        </button>

        {/* Footer */}
        <p className="text-center Livvic text-xs text-gray-400 mt-4">
          Cancel anytime. No long-term commitment.
        </p>
      </div>

      <style>{`@keyframes popIn { 0% { opacity:0; transform:scale(0.9) } 100% { opacity:1; transform:scale(1) } }`}</style>
    </div>
  );
}
