// The one and only FamLink subscription plan.
//
// Every user gets the same plan, whatever their profile type: there is no
// separate Nanny / Family tier and no per-role Stripe price. The upgrade modal
// (SubscriptionModal.jsx), the settings page (SubscriptionSettings.jsx), the
// pricing page (Price/pricing.jsx) and the card form (subComponents/Billings.jsx)
// all read the name, price, features and priceId from here, so a change here is
// a change everywhere. Do not reintroduce a `nanny ? … : …` branch around any
// of these values.

export const PLAN = {
  name: "FamLink Plus",
  price: 49,
  tagline: "Find your Share Partner",
  features: [
    "View full profile details",
    "Review and approve compatible matches",
    "Send your own match requests",
  ],
  // Single Stripe price, shared by nannies and families.
  priceId: import.meta.env.VITE_STRIPE_PLUS_PRICE_ID,
};

export const FREE_PLAN = {
  name: "Free",
  price: 0,
  features: [
    "Automatic compatible matches",
    "Matches with new users",
    "Browse nearby profiles",
    "Limited profile access",
  ],
};
