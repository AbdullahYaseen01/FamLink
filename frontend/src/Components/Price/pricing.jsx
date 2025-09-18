import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import {
  saveCardThunk,
  createSubscriptionThunk,
  cancelSubscriptionThunk,
  getSubscriptionStatusThunk,
} from "../Redux/cardSlice";
import { fireToastMessage } from "../../toastContainer";
import { NavLink } from "react-router-dom";

const Card = ({ head, price, data, buy, nanny, showBuyButton, cancelAt }) => {
  const dispatch = useDispatch();
  const stripe = useStripe();
  const elements = useElements();
  const [showPayment, setShowPayment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePaymentToggle = () => {
    setShowPayment(!showPayment);
  };

  const handleBuyNow = async () => {
    if (!stripe || !elements) {
      fireToastMessage({ 
        message: "Payment system not ready. Please try again.", 
        type: "error" 
      });
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      fireToastMessage({ 
        message: "Please enter your card details.", 
        type: "error" 
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (error) {
        fireToastMessage({ 
          message: error.message || "Payment failed", 
          type: "error" 
        });
        setIsLoading(false);
        return;
      }

      const saveResult = await dispatch(saveCardThunk(paymentMethod));
      if (saveCardThunk.fulfilled.match(saveResult)) {
        const createResult = await dispatch(
          createSubscriptionThunk({
            paymentMethodId: paymentMethod.id,
            priceId: nanny
              ? import.meta.env.VITE_STRIPE_NANNY_PREMIUM_PRICE_ID
              : import.meta.env.VITE_STRIPE_FAMILY_PREMIUM_PRICE_ID,
          })
        );

        if (createSubscriptionThunk.fulfilled.match(createResult)) {
          fireToastMessage({
            message: "Subscription activated successfully!",
            type: "success",
          });
          setShowPayment(false);
          // Refresh subscription status
          dispatch(getSubscriptionStatusThunk());
        } else {
          fireToastMessage({
            message: createResult.payload?.message || "Subscription failed",
            type: "error",
          });
        }
      } else {
        fireToastMessage({
          message: saveResult.payload?.error || "Failed to save payment method",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      fireToastMessage({
        message: "An unexpected error occurred",
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

  const isCurrentPlan = head !== "Free" && !showBuyButton;
  const isFree = head === "Free";

  return (
    <div className={`lg:w-96 w-full min-h-[600px] bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col ${
      isCurrentPlan ? 'ring-2 ring-blue-500 relative' : ''
    }`}>
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            Current Plan
          </span>
        </div>
      )}
      
      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-6 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{head}</h3>
          <div className="flex items-baseline justify-center">
            <span className="text-5xl font-bold text-blue-600">${price}</span>
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
              <p className="text-gray-700 text-base leading-relaxed">{feature}</p>
            </div>
          ))}
        </div>

        {/* Payment Form */}
        {showBuyButton && showPayment && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Payment Details</h4>
            <div className="mb-4">
              <CardElement 
                className="p-4 border border-gray-300 rounded-lg bg-white"
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                  },
                }}
              />
            </div>
            <div className="flex gap-3">
              <button
                disabled={isLoading || !stripe}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                onClick={handleBuyNow}
              >
                {isLoading ? "Processing..." : `Subscribe for $${price}/month`}
              </button>
              <button
                onClick={handlePaymentToggle}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-auto">
          {showBuyButton && !showPayment && (
            <button
              onClick={handlePaymentToggle}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Upgrade Now
            </button>
          )}

          {!showBuyButton && !isFree && (
            <>
              {cancelAt ? (
                <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 font-medium">
                    Scheduled to cancel on {cancelAt}
                  </p>
                  <p className="text-red-600 text-sm mt-1">
                    You'll continue to have access until this date
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleCancelSubscription}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? "Cancelling..." : "Cancel Subscription"}
                </button>
              )}
            </>
          )}

          {isFree && !showBuyButton && (
            <button
              disabled
              className="w-full bg-gray-100 text-gray-500 font-semibold py-3 px-6 rounded-lg cursor-not-allowed border border-gray-200"
            >
              Current Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Pricing({ nanny }) {
  const dispatch = useDispatch();
  const subscription = useSelector(
    (state) => state.cardData.subscriptionStatus
  );
  const isActive = subscription?.active;
  const isCanceling = subscription?.cancelAtPeriodEnd;
  const periodEnd = subscription?.periodEnd;

  useEffect(() => {
    dispatch(getSubscriptionStatusThunk());
  }, [dispatch]);

  const cardData = [
    {
      head: "Free",
      price: 0,
      data: nanny
        ? [
            "Create a profile",
            "Search for jobs",
            "Apply for jobs",
            "Receive and reply to messages",
            "Join the Famlink Community",
          ]
        : [
            "Connect, share advice and build relationships in the Famlink Community",
            "Browse a limited list of caregiver profiles",
            "Browse a limited list of families for nanny share",
          ],
      buy: true,
      showBuyButton: false,
    },
    {
      head: nanny ? "Premium" : "Family Plus",
      price: nanny ? 4.99 : 12.99,
      data: nanny
        ? [
            "Unlimited job applications",
            "Unlock messaging with families",
            "Boost profile visibility in searches",
            "Priority customer support",
            "Advanced filtering options",
          ]
        : [
            "Post unlimited jobs",
            "Post nanny share opportunities", 
            "Browse all caregiver profiles",
            "Message any caregiver",
            "Priority customer support",
            "Advanced search filters",
          ],
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
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {nanny 
              ? "Find the perfect families and grow your childcare career"
              : "Connect with trusted caregivers and find the support you need"
            }
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
              nanny={nanny}
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
