export const FAM_NAV_INTENTS = {
  how_nanny_shares_work: {
    label: "See How Nanny Shares Work",
    route: "/resources/how-does-a-nanny-share-work",
  },
  nanny_share_resources: {
    label: "Open Nanny-Share Resources",
    route: "/nanny-share-resources",
  },
  find_nanny_share: {
    label: "Find a Nanny Share",
    route: "/find-nanny-share",
  },
  find_family_to_share: {
    label: "Find a Family to Share With",
    route: "/find-nanny-share",
  },
  explore_opportunities: {
    label: "Explore Nanny-Share Opportunities",
    route: "/jobSeekers",
  },
  find_second_family: {
    label: "Find a Second Family",
    route: "/caregiver/nannyshare",
  },
  create_account: {
    label: "Create a Free Account",
    route: "/joinNow",
  },
  sign_in: {
    label: "Sign In",
    route: "/login",
  },
  explore_resources: {
    label: "Explore Resources",
    route: "/resources",
  },
};

export function resolveNavIntent(intent) {
  return FAM_NAV_INTENTS[intent] || null;
}

export function profileTypeFromAnswers(answers = {}) {
  if (answers.role === "Nanny") {
    if (answers.nannySituation === "I already work with a family and want to add a share") {
      return "nannyHasFamily";
    }
    if (answers.nannySituation === "I'm looking for a nanny share position") {
      return "nannyLooking";
    }
    return null;
  }
  if (answers.role === "Family") {
    const has = String(answers.alreadyHaveNanny || "").toLowerCase().startsWith("yes");
    return has ? "familyHasNanny" : "familyLooking";
  }
  return null;
}

export function isInitialOnboardingComplete(answers = {}) {
  if (!answers.role || !answers.fullName || !answers.email || !answers.location) return false;
  if (answers.role === "Family") {
    return Boolean(answers.alreadyHaveNanny && answers.childAges && answers.careNeeded);
  }
  if (answers.role === "Nanny") {
    return Boolean(answers.nannySituation);
  }
  return false;
}
