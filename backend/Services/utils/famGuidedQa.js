import { resolveNavIntent } from "./famNavRegistry.js";

export const GUIDED_QUESTIONS = {
  family: [
    {
      id: "how_nanny_shares_work",
      label: "How do nanny shares work?",
      answer:
        "A nanny share is two families sharing one caregiver. You split the nanny’s time and pay, so each family typically pays less than hiring alone. FamLink matches compatible families and caregivers in your area.",
      navigation_intent: "how_nanny_shares_work",
    },
    {
      id: "how_much_save",
      label: "How much could I save?",
      answer:
        "Families often save up to about 50% versus hiring a nanny on their own, depending on schedule, location, and how hours are split. FamLink does not invent local prices. Use approved nanny-share resources for cost, payroll, and agreements.",
      navigation_intent: "nanny_share_resources",
    },
    {
      id: "already_have_nanny",
      label: "I already have a nanny",
      answer:
        "If you already have a nanny, you can still start a share by finding a second family to join. FamLink looks for a compatible family so your nanny can work with both of you.",
      navigation_intent: "find_family_to_share",
    },
    {
      id: "how_find_matches",
      label: "How does FamLink find matches?",
      answer:
        "FamLink uses your location, schedule, and share type to surface compatible families and caregivers. Create a free account to see full matches and continue in the product.",
      navigation_intent: "create_account",
    },
  ],
  nanny: [
    {
      id: "how_nanny_shares_work",
      label: "How do nanny shares work?",
      answer:
        "A nanny share is two families sharing one caregiver. You work with both families on a shared schedule, and they split your pay. FamLink matches you with compatible share families.",
      navigation_intent: "how_nanny_shares_work",
    },
    {
      id: "nanny_share_pay",
      label: "How does nanny-share pay work?",
      answer:
        "In a share, two families typically split your pay. Combined earnings are often higher than a single-family role. Exact amounts depend on hours and local rates. See FamLink’s approved resources rather than chat estimates.",
      navigation_intent: "nanny_share_resources",
    },
    {
      id: "already_work_family",
      label: "I already work with a family",
      answer:
        "If you already work with a family, you can add a second family to your current role. FamLink helps you find a compatible second family so you can earn more through a share.",
      navigation_intent: "find_second_family",
    },
    {
      id: "how_find_positions",
      label: "How does FamLink find positions?",
      answer:
        "FamLink matches you with families looking for a share, based on your schedule, location, and experience. Create a free account to see positions and continue matching.",
      navigation_intent: "create_account",
    },
  ],
};

export function audienceFromAnswers(answers = {}) {
  return answers.role === "Nanny" ? "nanny" : answers.role === "Family" ? "family" : null;
}

export function resolveGuidedQuestion(audience, questionId) {
  const item = GUIDED_QUESTIONS[audience]?.find((q) => q.id === questionId);
  if (!item) return null;
  const nav = resolveNavIntent(item.navigation_intent);
  return {
    audience,
    question_id: item.id,
    answer: item.answer,
    navigation_intent: item.navigation_intent,
    primary_button_label: nav?.label || null,
  };
}

export function guidedQuestionButtons(audience) {
  return (GUIDED_QUESTIONS[audience] || []).map(({ id, label }) => ({ id, label }));
}
