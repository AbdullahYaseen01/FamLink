import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Check, Star, Loader2, User } from "lucide-react";
import {
  getSubscriptionStatusThunk,
  cancelSubscriptionThunk,
  createCheckoutThunk,
} from "../Components/Redux/cardSlice";
import { fireToastMessage } from "../toastContainer";
import { SwalFireDelete } from "../swalFire";
import { PLAN, FREE_PLAN } from "../Config/subscriptionPlan";
import { BTN_SECONDARY } from "../Config/buttonStyles";
import TermsNotice from "./TermsNotice";
import { Link } from "react-router-dom";

/* Settings → Subscription. Shown to nannies and families alike: there is a
   single plan, so nothing here branches on the user's profile type. */
export default function SubscriptionSettings() {
  const dispatch = useDispatch();
  const subscription = useSelector((s) => s.cardData.subscriptionStatus);

  const [fetching, setFetching] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setFetching(true);
      await dispatch(getSubscriptionStatusThunk());
      if (mounted) setFetching(false);
    })();
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  const isActive = subscription?.active;
  const isCanceling = subscription?.cancelAtPeriodEnd;
  const periodEnd = subscription?.periodEnd
    ? new Date(subscription.periodEnd * 1000).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  const handleUpgrade = async () => {
    setBusy(true);
    try {
      const { data, status } = await dispatch(
        createCheckoutThunk({ priceId: PLAN.priceId })
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
      setBusy(false);
    }
  };

  const handleCancel = () => {
    SwalFireDelete({
      title: `Cancel your ${PLAN.name} subscription?`,
      handleDelete: async () => {
        setBusy(true);
        try {
          const result = await dispatch(cancelSubscriptionThunk());
          if (cancelSubscriptionThunk.fulfilled.match(result)) {
            fireToastMessage({
              message: "Subscription cancelled successfully",
              type: "success",
            });
            dispatch(getSubscriptionStatusThunk());
          } else {
            fireToastMessage({
              message: result.payload?.message || "Failed to cancel subscription",
              type: "error",
            });
          }
        } catch (err) {
          console.error(err);
          fireToastMessage({ message: "Something went wrong", type: "error" });
        } finally {
          setBusy(false);
        }
      },
    });
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="Livvic-Medium">Loading subscription…</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <h2 className="Livvic-Bold text-[28px] text-[#001243] mb-1">Choose your plan</h2>
      <p className="Livvic text-sm text-gray-500 mb-6">Change or cancel whenever you like.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="bg-[#E8EEFF] text-center Livvic-Bold text-[11px] tracking-wide text-[#001243] py-2">
            {isActive ? "INCLUDED" : "YOUR CURRENT PLAN"}
          </div>
          <div className="p-5">
            <p className="Livvic-Bold text-[22px] text-[#001243] mb-4">Free</p>
            <div className="space-y-2.5">
              {FREE_PLAN.features.map((f) => (
                <div key={f} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#D6FB9A] flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} className="text-[#025747]" strokeWidth={3} />
                  </span>
                  <span className="Livvic text-sm text-[#001243]">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#AEC4FF] shadow-lg p-5 relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-[#D6FB9A] text-[#025747] Livvic-Bold text-[11px] rounded-full px-3 py-1 whitespace-nowrap">
            <Star size={11} fill="#025747" strokeWidth={0} /> MOST POPULAR
          </span>
          <p className="Livvic-Bold text-[13px] tracking-wide text-[#001243] mt-2">FAMLINK PLUS</p>
          <p className="Livvic-Bold text-[28px] text-[#001243] mt-1">${PLAN.price} <span className="text-base font-medium text-gray-500">/month</span></p>
          <p className="Livvic-Bold text-sm text-[#001243] mb-3">{PLAN.tagline}</p>
          <p className="Livvic-Bold text-sm text-[#001243] mb-2">With Plus, you can:</p>
          <div className="space-y-2.5 mb-4">
            {PLAN.features.map((f) => (
              <div key={f} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#D6FB9A] flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={12} className="text-[#025747]" strokeWidth={3} />
                </span>
                <span className="Livvic-Bold text-sm text-[#001243]">{f}</span>
              </div>
            ))}
          </div>
          {isActive ? (
            isCanceling ? (
              <p className="Livvic-SemiBold text-sm text-red-600">Cancels on {periodEnd}</p>
            ) : (
              <button type="button" onClick={handleCancel} disabled={busy} className={`w-full ${BTN_SECONDARY}`}>
                {busy ? "Please wait…" : "Cancel Subscription"}
              </button>
            )
          ) : (
            <button type="button" onClick={handleUpgrade} disabled={busy} className="w-full bg-[#AEC4FF] hover:bg-[#9db4f7] text-[#001243] Livvic-Bold py-3 rounded-xl">
              {busy ? "Redirecting…" : "Upgrade to FamLink Plus →"}
            </button>
          )}
          <p className="text-center Livvic text-xs text-gray-400 mt-2">Cancel anytime.</p>
        </div>

        <div className="bg-[#FBF6EE] rounded-2xl p-5">
          <User className="w-8 h-8 text-[#001243] mb-3" strokeWidth={1.5} />
          <p className="Livvic-Bold text-[#001243] mb-2">Don&apos;t have time to search? ✨</p>
          <span className="inline-block bg-[#AEC4FF] text-[#001243] Livvic-Bold text-[10px] tracking-wide uppercase rounded-full px-2.5 py-0.5 mb-3">Concierge</span>
          <p className="Livvic text-sm text-gray-500 mb-4">We personally search on and outside FamLink to help you find the right Share.</p>
          <Link to="/concierge" className="Livvic-Bold text-sm text-[#6B8AFF]">Learn about FamLink Concierge →</Link>
        </div>
      </div>

      <p className="Livvic text-xs text-gray-400 mt-6">
        By upgrading, you authorize recurring monthly charges until you cancel.{" "}
        <Link to="/terms-and-conditions" className="underline text-[#6B8AFF]">Terms &amp; Conditions</Link>
        {" "}and{" "}
        <span className="underline text-[#6B8AFF]">Privacy Policy</span>.
      </p>
      <TermsNotice action="subscribing" className="mt-3" />
    </div>
  );
}
