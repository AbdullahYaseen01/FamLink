import User from "../Schema/user.js";
import NannyProfile from "../Schema/nannyProfile.js";
import { isInsideLaunchRadius } from "../Services/utils/serviceArea.js";
import { PUBLIC_USER_SELECT, toPublicUsers } from "../Services/utils/userPrivacy.js";
import {
  FAM_NAV_INTENTS,
  isInitialOnboardingComplete,
  profileTypeFromAnswers,
  resolveNavIntent,
} from "../Services/utils/famNavRegistry.js";

const PROFILE_COPY = {
  familyLooking: "your child, your family, and potential nanny-share matches",
  familyHasNanny: "your child, your nanny, and potential share families",
  nannyLooking: "your availability, experience, and potential share positions",
  nannyHasFamily: "your current family, schedule, and a potential second family",
};

const TOPIC_RULES = [
  { intent: "sign_in", keys: ["sign in", "login", "log in", "existing account"] },
  { intent: "create_account", keys: ["create an account", "join now", "sign up", "register"] },
  { intent: "nanny_share_resources", keys: ["cost", "price", "pricing", "savings", "payroll", "agreement", "how much"] },
  { intent: "how_nanny_shares_work", keys: ["how nanny share", "how does a nanny", "what is a nanny share", "how it works"] },
  {
    intentByType: {
      familyLooking: "find_nanny_share",
      familyHasNanny: "find_family_to_share",
      nannyLooking: "explore_opportunities",
      nannyHasFamily: "find_second_family",
    },
    keys: ["find a share", "find a family", "find a nanny", "match me", "looking for"],
  },
];

function defaultIntent(profileType) {
  if (profileType === "familyHasNanny") return "find_family_to_share";
  if (profileType === "nannyLooking") return "explore_opportunities";
  if (profileType === "nannyHasFamily") return "find_second_family";
  if (profileType === "familyLooking") return "find_nanny_share";
  return "explore_resources";
}

function detectIntent(message, profileType) {
  const q = String(message || "").toLowerCase();
  if (q.trim().length < 4) {
    return { intent: null, requiresClarification: true };
  }
  for (const rule of TOPIC_RULES) {
    if (rule.keys.some((k) => q.includes(k))) {
      return {
        intent: rule.intent || rule.intentByType?.[profileType] || "explore_resources",
        requiresClarification: false,
      };
    }
  }
  if (/\?$/.test(q.trim()) === false && q.split(/\s+/).length < 3) {
    return { intent: null, requiresClarification: true };
  }
  return { intent: "explore_resources", requiresClarification: false };
}

function safeAnswer(profileType, intent, requiresClarification) {
  const who = PROFILE_COPY[profileType] || "your nanny-share search";
  if (requiresClarification) {
    return `I can help with ${who}. What would you like to know — how shares work, next steps, or resources?`;
  }
  if (intent === "nanny_share_resources") {
    return `I don’t invent prices or local availability. For cost, savings, and agreements, use FamLink’s approved nanny-share resources.`;
  }
  if (intent === "how_nanny_shares_work") {
    return `A nanny share is two families sharing one caregiver. For ${who}, the resources page explains how that works on FamLink.`;
  }
  if (intent === "create_account" || intent === "sign_in") {
    return `Create a free account or sign in to continue. I can’t change your profile from this chat.`;
  }
  return `Here’s a short next step for ${who}. I won’t invent matches, pricing, or guarantees — FamLink’s approved pages have the details.`;
}

function gate(req) {
  const answers = req.body?.answers || {};
  if (!isInitialOnboardingComplete(answers)) {
    return { error: { status: 403, chat_enabled: false, message: "Complete initial onboarding before using FAM chat." } };
  }
  const profileType = profileTypeFromAnswers(answers);
  if (!profileType) {
    return { error: { status: 403, chat_enabled: false, message: "Profile type is not established yet." } };
  }
  return { answers, profileType };
}

export async function landingMatches(req, res) {
  const gated = gate(req);
  if (gated.error) return res.status(gated.error.status).json(gated.error);

  const { answers, profileType } = gated;
  const location = answers.location;
  const cityStatus = isInsideLaunchRadius(location) ? "active" : "waitlist";

  if (cityStatus === "waitlist") {
    return res.json({
      chat_enabled: true,
      profileType,
      cityStatus,
      profiles: [],
    });
  }

  const wantsNanny = profileType === "familyLooking" || profileType === "familyHasNanny";
  const targetType = wantsNanny ? "Nanny" : "Parents";
  const users = await User.find({ type: targetType, status: "Active" })
    .select(PUBLIC_USER_SELECT)
    .limit(8)
    .lean();

  const ids = users.map((u) => u._id);
  const profiles = await NannyProfile.find({ userId: { $in: ids } }).limit(8).lean();
  const eligible = [];
  for (const user of users) {
    const share = profiles.find((p) => String(p.userId) === String(user._id));
    if (share) {
      if (profileType === "familyLooking" && share.hasFamily === true) continue;
      if (profileType === "nannyLooking" && share.hasNanny === true) continue;
    }
    eligible.push({ ...(share || {}), userId: user, userType: user.type });
    if (eligible.length === 2) break;
  }

  return res.json({
    chat_enabled: true,
    profileType,
    cityStatus,
    profiles: toPublicUsers(eligible.map((p) => p.userId)),
  });
}

export function landingFamChat(req, res) {
  if (req.body?.mode === "full-onboarding") {
    return res.status(403).json({ chat_enabled: false, message: "FAM chat is disabled during full onboarding." });
  }
  const gated = gate(req);
  if (gated.error) return res.status(gated.error.status).json(gated.error);

  const { profileType } = gated;
  const message = req.body?.message;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ message: "Message is required." });
  }

  const { intent, requiresClarification } = detectIntent(message, profileType);
  if (requiresClarification) {
    return res.json({
      chat_enabled: true,
      profileType,
      answer: safeAnswer(profileType, null, true),
      navigation_intent: null,
      primary_button_label: null,
      requires_clarification: true,
    });
  }

  const resolved = resolveNavIntent(intent) || FAM_NAV_INTENTS[defaultIntent(profileType)];
  const finalIntent = resolveNavIntent(intent) ? intent : defaultIntent(profileType);

  return res.json({
    chat_enabled: true,
    profileType,
    answer: safeAnswer(profileType, finalIntent, false),
    navigation_intent: finalIntent,
    primary_button_label: resolved.label,
    requires_clarification: false,
  });
}

export function landingProgress(req, res) {
  if (req.body?.mode === "full-onboarding") {
    const answers = req.body?.answers || {};
    const current = Number(req.body?.currentQuestion) || 1;
    const total = Number(req.body?.totalQuestions) || 1;
    return res.json({
      chat_enabled: false,
      currentQuestion: current,
      totalQuestions: total,
      remaining: Math.max(total - current, 0),
      profileType: profileTypeFromAnswers(answers),
    });
  }
  const gated = gate(req);
  if (gated.error) return res.status(gated.error.status).json(gated.error);
  return res.json({ chat_enabled: true, profileType: gated.profileType });
}
