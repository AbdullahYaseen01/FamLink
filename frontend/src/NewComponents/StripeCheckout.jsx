import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Pricing from "../Components/Price/pricing";

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISABLE_KEY;
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export default function StripeCheckout() {
  return (
    <Elements stripe={stripePromise}>
      <Pricing />
    </Elements>
  );
}
