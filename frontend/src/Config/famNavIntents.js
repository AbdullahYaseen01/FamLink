/** Mirror of backend famNavRegistry for FE fallbacks. */
export const FAM_NAV_INTENTS = {
  how_nanny_shares_work: {
    label: "See How Nanny Shares Work",
    path: "/resources/how-does-a-nanny-share-work",
  },
  nanny_share_resources: {
    label: "Open Nanny-Share Resources",
    path: "/nanny-share-resources",
  },
  find_nanny_share: {
    label: "Find a Nanny Share",
    path: "/find-nanny-share",
  },
  find_family_to_share: {
    label: "Find a Family to Share With",
    path: "/find-nanny-share",
  },
  explore_nanny_opportunities: {
    label: "Explore Nanny-Share Opportunities",
    path: "/jobSeekers",
  },
  find_second_family: {
    label: "Find a Second Family",
    path: "/caregiver/nannyshare",
  },
  create_free_account: {
    label: "Create a Free Account",
    path: "/joinNow",
  },
  sign_in: {
    label: "Sign In",
    path: "/login",
  },
  explore_resources: {
    label: "Explore Resources",
    path: "/resources",
  },
};

export const resolveFamNav = (intent, label) => {
  const entry = FAM_NAV_INTENTS[intent];
  if (!entry) return null;
  return { label: label || entry.label, path: entry.path };
};
