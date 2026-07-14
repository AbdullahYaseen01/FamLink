import { useEffect } from "react";
import { Check, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getSubscriptionStatusThunk } from "../Components/Redux/cardSlice";
import { PLAN } from "../Config/subscriptionPlan";

/* Post-checkout result dialog.
   After Stripe Checkout the user is sent back to /dashboard?status=success
   (or ?status=cancelled). This reads that param, shows the matching
   success / failure modal, refreshes the subscription status on success,
   and strips the param from the URL when dismissed. */
export default function PostCheckoutDialog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status");
  const dispatch = useDispatch();
  const success = status === "success";

  useEffect(() => {
    if (status) document.body.style.overflow = "hidden";
    if (status === "success") dispatch(getSubscriptionStatusThunk());
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [status, dispatch]);

  if (!status) return null;

  const close = () => {
    document.body.style.overflow = "unset";
    const params = new URLSearchParams(searchParams);
    params.delete("status");
    setSearchParams(params, { replace: true });
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && close()}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#0D134C]/25 backdrop-blur-sm"
    >
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm px-8 py-9 text-center animate-[popIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)_both]">
        {/* Close */}
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X size={16} className="text-gray-500" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              success ? "bg-[#4CAF50]" : "bg-red-500"
            }`}
          >
            {success ? (
              <Check className="text-white w-7 h-7" strokeWidth={3} />
            ) : (
              <X className="text-white w-7 h-7" strokeWidth={3} />
            )}
          </div>
        </div>

        {/* Heading */}
        <h2 className="Livvic-Bold text-xl text-[#0D134C] mb-1.5">
          {success
            ? `You're now a ${PLAN.name} member!`
            : "Payment not completed"}
        </h2>

        {/* Body */}
        <p className="Livvic text-gray-500 text-sm mb-6">
          {success
            ? `Congrats 🎉 You're successfully subscribed to ${PLAN.name}.`
            : "Your payment wasn't completed. You can try again anytime."}
        </p>

        <button
          type="button"
          onClick={close}
          className="w-full bg-[#AEC4FF] hover:bg-[#9db4f7] text-[#0D134C] Livvic-Bold py-3 rounded-xl transition-colors"
        >
          {success ? "Continue" : "Close"}
        </button>
      </div>

      <style>{`@keyframes popIn { 0% { opacity:0; transform:scale(0.9) } 100% { opacity:1; transform:scale(1) } }`}</style>
    </div>
  );
}
