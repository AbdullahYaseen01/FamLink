import OpenAI from "openai";
import {
  FAM_NAV_REGISTRY,
  isApprovedNavIntent,
  resolveNavIntent,
} from "./famNavRegistry.js";

const PROFILE_GUIDANCE = {
  familyLooking:
    "Speak to a family looking for a nanny share: child, family, care needs, potential families, caregivers, nanny-share matches.",
  familyHasNanny:
    "Speak to a family that already has a nanny and wants to share: child, nanny, current arrangement, potential share families.",
  nannyLooking:
    "Speak to a nanny looking for a share position: availability, preferred ages, rate, experience, potential families, share positions.",
  nannyHasFamily:
    "Speak to a nanny who already works with a family and wants a second family: current family, existing schedule, current child, potential second families.",
};

const DEFAULT_INTENT_BY_PROFILE = {
  familyLooking: "find_nanny_share",
  familyHasNanny: "find_family_to_share",
  nannyLooking: "explore_nanny_opportunities",
  nannyHasFamily: "find_second_family",
};

let openai;
const getOpenAI = () => {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

const SYSTEM = (profileType) => `You are FAM, FamLink's helpful nanny-share assistant on the public landing page.
Profile type: ${profileType}. ${PROFILE_GUIDANCE[profileType] || ""}

Rules:
- Answer directly in short, natural language.
- Use only general FamLink / nanny-share knowledge. Never invent pricing, availability, profiles, policies, or local matches.
- Never claim to change profile or account info.
- Never promise a match, guarantee safety, or guarantee an arrangement works.
- Do not force account creation when a resource answer is better.
- Never output raw URLs. Choose navigation_intent from this approved list only:
${Object.entries(FAM_NAV_REGISTRY)
  .map(([k, v]) => `- ${k}: "${v.label}" → ${v.path}`)
  .join("\n")}

Respond with JSON only:
{
  "answer": "string",
  "navigation_intent": "approved_intent_or_null_if_clarifying",
  "primary_button_label": "string matching registry label when intent set",
  "requires_clarification": boolean
}
If you must ask a clarifying question first, set requires_clarification true and navigation_intent null.
Otherwise set requires_clarification false and a valid navigation_intent.`;

/**
 * @returns {Promise<{ answer: string, navigation_intent: string|null, primary_button_label: string|null, requires_clarification: boolean }>}
 */
export const runLandingFamChat = async ({ profileType, message, history = [] }) => {
  if (!process.env.OPENAI_API_KEY) {
    const intent = DEFAULT_INTENT_BY_PROFILE[profileType] || "explore_resources";
    const nav = resolveNavIntent(intent);
    return {
      answer:
        "Thanks for your question. FamLink helps families and caregivers form nanny shares nearby. Explore resources or create a free account to continue.",
      navigation_intent: intent,
      primary_button_label: nav?.label || "Explore Resources",
      requires_clarification: false,
    };
  }

  const messages = [
    { role: "system", content: SYSTEM(profileType) },
    ...history.slice(-6).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 2000),
    })),
    { role: "user", content: String(message || "").slice(0, 2000) },
  ];

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages,
  });

  let parsed;
  try {
    parsed = JSON.parse(response.choices?.[0]?.message?.content || "{}");
  } catch {
    parsed = {};
  }

  const requiresClarification = Boolean(parsed.requires_clarification);
  let intent = parsed.navigation_intent || null;
  if (requiresClarification) {
    return {
      answer:
        typeof parsed.answer === "string" && parsed.answer.trim()
          ? parsed.answer.trim()
          : "Could you share a bit more so I can point you to the right place?",
      navigation_intent: null,
      primary_button_label: null,
      requires_clarification: true,
    };
  }

  if (!isApprovedNavIntent(intent)) {
    intent = DEFAULT_INTENT_BY_PROFILE[profileType] || "explore_resources";
  }
  const nav = resolveNavIntent(intent);

  return {
    answer:
      typeof parsed.answer === "string" && parsed.answer.trim()
        ? parsed.answer.trim()
        : "Here's how FamLink can help with nanny shares.",
    navigation_intent: intent,
    primary_button_label:
      (typeof parsed.primary_button_label === "string" &&
        parsed.primary_button_label.trim()) ||
      nav.label,
    requires_clarification: false,
  };
};
