import { useState, useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  cancelSubscriptionThunk,
  getSubscriptionStatusThunk,
  createCheckoutThunk,
} from "../Redux/cardSlice";
import { fireToastMessage } from "../../toastContainer";
import { useSearchParams } from "react-router-dom";
import { PLAN, FREE_PLAN } from "../../Config/subscriptionPlan";

const PostCheckoutDialogBox = ({ status, onClose }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dialogRef.current && dialogRef.current === e.target) {
        onClose?.();
      }
    };

    // Freeze scrolling when modal is mounted
    document.body.style.overflow = "hidden";
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50"
    >
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-sm w-full mx-4">
        <div className="flex justify-center mb-4">
          {status === "success" ? (
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="text-white w-7 h-7" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
              <X className="text-white w-7 h-7" />
            </div>
          )}
        </div>
        <h2 className="Livvic-SemiBold text-primary text-lg md:text-xl mb-1">
          {status === "success"
            ? `You're now a ${PLAN.name} member!`
            : "Payment Failed"}
        </h2>
        <p className="text-gray-600">
          {status === "success"
            ? `Congrats🎉. You are successfully subscribed to ${PLAN.name}.`
            : "Your payment couldn’t be processed."}
        </p>
      </div>
    </div>
  );
};

const Card = ({ head, price, data, buy, showBuyButton, cancelAt }) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgradeNow = async () => {
    setIsLoading(true);
    try {
      const { data, status } = await dispatch(
        createCheckoutThunk({ priceId: PLAN.priceId })
      ).unwrap(); // <-- unwrap() here
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
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    try {
      const result = await dispatch(cancelSubscriptionThunk());
      if (cancelSubscriptionThunk.fulfilled.match(result)) {
        fireToastMessage({
          message: "Subscription cancelled successfully",
          type: "success",
        });
        // Refresh subscription status
        dispatch(getSubscriptionStatusThunk());
      } else {
        fireToastMessage({
          message: result.payload?.message || "Failed to cancel subscription",
          type: "error",
        });
      }
    } catch (err) {
      fireToastMessage({
        message: "Something went wrong",
        type: "error",
      });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const isFree = head === FREE_PLAN.name;
  const isCurrentPlan = !isFree && !showBuyButton;

  return (
    <div
      className={`lg:w-96 w-full min-h-[600px] bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col ${
        isCurrentPlan ? "ring-2 ring-blue-500 relative" : ""
      }`}
    >
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm Livvic-Medium">
            Current Plan
          </span>
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-6 text-center">
          <h3 className="text-2xl Livvic-Bold text-gray-800 mb-2">{head}</h3>
          <div className="flex items-baseline justify-center">
            <span className="text-5xl Livvic-Bold text-blue-600">${price}</span>
            <span className="text-xl text-gray-500 ml-1">/month</span>
          </div>
        </div>

        <div className="w-full h-px bg-gray-200 mb-6"></div>

        {/* Features List */}
        <div className="flex-1 space-y-4 mb-8">
          {data?.map((feature, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                <Check className="text-white w-4 h-4" />
              </div>
              <p className="text-gray-700 text-base leading-relaxed">
                {feature}
              </p>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-auto">
          {showBuyButton && (
            <button
              onClick={handleUpgradeNow}
              disabled={isLoading}
              className="w-full bg-[#D6FB9A] disabled:bg-[#eeffd2] disabled:cursor-not-allowed text-[#025747] Livvic-SemiBold py-3 px-6 rounded-full"
            >
              {isLoading ? "Redirecting..." : "Upgrade Now"}
            </button>
          )}

          {!showBuyButton && !isFree && (
            <>
              {cancelAt ? (
                <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 Livvic-Medium">
                    Scheduled to cancel on {cancelAt}
                  </p>
                  <p className="text-red-600 text-sm mt-1">
                    You'll continue to have access until this date
                  </p>
                </div>
              ) : (
                <div className="flex justify-center">
                  <button
                    onClick={handleCancelSubscription}
                    className="w-fit disabled:cursor-not-allowed hover:underline text-[#666565]"
                    disabled={isLoading}
                  >
                    {isLoading ? "Cancelling..." : "Cancel Subscription"}
                  </button>
                </div>
              )}
            </>
          )}

          {isFree && !showBuyButton && (
            <button
              disabled
              className="w-full bg-gray-100 text-gray-500 Livvic-SemiBold py-3 px-6 rounded-lg cursor-not-allowed border border-gray-200"
            >
              Current Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* Pricing page. Nannies and families see the identical plan — there is only
   one, and both check out with the same Stripe price (see Config/subscriptionPlan). */
export default function Pricing() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  console.log("Status", status);
  const [showDialog, setShowDialog] = useState(true);
  const dispatch = useDispatch();
  const subscription = useSelector(
    (state) => state.cardData.subscriptionStatus
  );
  const isActive = subscription?.active ?? false;
  const isCanceling = subscription?.cancelAtPeriodEnd;
  const periodEnd = subscription?.periodEnd;

  useEffect(() => {
    dispatch(getSubscriptionStatusThunk());
  }, [dispatch]);

  const cardData = [
    {
      head: FREE_PLAN.name,
      price: FREE_PLAN.price,
      data: FREE_PLAN.features,
      buy: true,
      showBuyButton: false,
    },
    {
      head: PLAN.name,
      price: PLAN.price,
      data: PLAN.features,
      buy: isActive,
      showBuyButton: !isActive,
      cancelAt: isCanceling
        ? new Date(periodEnd * 1000).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : null,
    },
  ];

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Post Check Out Dialog*/}
        {showDialog && status && (
          <PostCheckoutDialogBox
            status={status}
            onClose={() => setShowDialog(false)}
          />
        )}
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl Livvic-Bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {PLAN.tagline}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="flex flex-wrap justify-center gap-8 lg:gap-6">
          {cardData.map((plan, index) => (
            <Card
              key={index}
              head={plan.head}
              price={plan.price}
              data={plan.data}
              buy={plan.buy}
              showBuyButton={plan.showBuyButton}
              cancelAt={plan.cancelAt}
            />
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm mb-4">
            Trusted by thousands of families and caregivers
          </p>
          <div className="flex justify-center items-center gap-6 text-gray-400">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Secure payments
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              24/7 support
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
