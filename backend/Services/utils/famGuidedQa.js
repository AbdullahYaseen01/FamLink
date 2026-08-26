import { resolveNavIntent } from "./famNavRegistry.js";

export const GUIDED_QUESTIONS = {
  family: [
    {
      id: "how_nanny_shares_work",
      label: "How does a nanny share actually work?",
      answer:
        "Two families share one trusted nanny. You split the schedule and the pay, so each family usually spends less than hiring alone — and your child still gets consistent care. FamLink finds families and nannies that actually fit.",
      navigation_intent: "how_nanny_shares_work",
    },
    {
      id: "how_much_save",
      label: "How much could my family save?",
      answer:
        "Many families save up to about 50% compared with hiring a nanny on their own, depending on hours, location, and how you split the week. We don’t invent local rates here — FamLink’s resources walk through cost, payroll, and agreements.",
      navigation_intent: "nanny_share_resources",
    },
    {
      id: "already_have_nanny",
      label: "I already have a nanny. Can I still share?",
      answer:
        "Yes. Keep your nanny and add a second family to the week. FamLink looks for a compatible family so your nanny can work with both of you — and you both share the cost.",
      navigation_intent: "find_family_to_share",
    },
    {
      id: "how_find_matches",
      label: "How does FamLink find my matches?",
      answer:
        "Tell Fam your location, schedule, and share type. We surface families and caregivers that fit. Create a free account to see full matches.",
      navigation_intent: "create_account",
    },
  ],
  nanny: [
    {
      id: "how_nanny_shares_work",
      label: "How does a nanny share work for nannies?",
      answer:
        "You work with two families on a shared schedule. They split your pay, so you keep one role — and typically earn more than a single-family job. FamLink matches you with families ready to share.",
      navigation_intent: "how_nanny_shares_work",
    },
    {
      id: "nanny_share_pay",
      label: "How much more can I get paid as a nanny share nanny?",
      answer:
        "Two families share your hours and your rate, so combined pay is often higher than a single-family role. The exact bump depends on your schedule and local rates. FamLink’s resources explain share pay — we don’t invent numbers in chat.",
      navigation_intent: "nanny_share_resources",
    },
    {
      id: "already_work_family",
      label: "I already work with a family. Can I add a share?",
      answer:
        "Yes. Keep your current family and add a second one to your week. FamLink helps you find a compatible second family so you can earn more without starting over.",
      navigation_intent: "find_second_family",
    },
    {
      id: "how_find_positions",
      label: "How does FamLink find share positions for me?",
      answer:
        "Find nanny share partners near you. Whether you already care for a child or are looking for a nanny share job, Fam helps you find compatible families.",
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
