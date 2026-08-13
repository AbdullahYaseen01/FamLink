import express from "express";
import {
  LANDING_PROFILE_TYPES,
  landingAuthFromRequest,
  mintLandingSessionToken,
} from "../Services/landing/landingSession.js";
import { isActiveServiceZip } from "../Services/landing/allowedZips.js";
import { getLandingMatches } from "../Services/landing/landingMatches.js";
import { runLandingFamChat } from "../Services/landing/famChat.js";
import { resolveNavIntent } from "../Services/landing/famNavRegistry.js";

const router = express.Router();

const mapAlreadyHaveNanny = (alreadyHaveNanny) => {
  const v = String(alreadyHaveNanny || "").toLowerCase();
  if (v === "no" || v === "false") return "familyLooking";
  return "familyHasNanny";
};

/**
 * POST /landing/complete-initial
 * Called after existing match-form success (no new questions).
 * Body: { profileType? , alreadyHaveNanny?, zip?, role?: "family"|"nanny", hasFamily? }
 */
router.post("/complete-initial", (req, res) => {
  try {
    const {
      profileType: rawType,
      alreadyHaveNanny,
      zip,
      role,
      hasFamily,
      areaMode: areaModeBody,
    } = req.body || {};

    let profileType = rawType;
    if (!profileType) {
      if (role === "nanny") {
        profileType =
          hasFamily === true || hasFamily === "true" || hasFamily === "yes"
            ? "nannyHasFamily"
            : "nannyLooking";
      } else {
        profileType = mapAlreadyHaveNanny(alreadyHaveNanny);
      }
    }

    if (!LANDING_PROFILE_TYPES.includes(profileType)) {
      return res.status(400).json({
        message: "Invalid profile type",
        chat_enabled: false,
      });
    }

    const zipStr = zip ? String(zip).trim() : null;
    const areaMode =
      areaModeBody === "waitlist" || areaModeBody === "active"
        ? areaModeBody
        : isActiveServiceZip(zipStr)
          ? "active"
          : "waitlist";

    const landingSessionToken = mintLandingSessionToken({
      profileType,
      zip: zipStr,
      areaMode,
    });

    return res.status(200).json({
      chat_enabled: true,
      onboardingComplete: true,
      profileType,
      zip: zipStr,
      areaMode,
      landingSessionToken,
    });
  } catch (error) {
    console.error("[landing/complete-initial]", error?.message || error);
    return res.status(500).json({
      message: "Could not complete landing onboarding session",
      chat_enabled: false,
    });
  }
});

/** GET /landing/fam-status */
router.get("/fam-status", (req, res) => {
  if (req.query?.mode === "full_onboarding") {
    return res.status(200).json({
      chat_enabled: false,
      onboardingComplete: false,
      reason: "full_onboarding",
    });
  }

  const session = landingAuthFromRequest(req);
  if (!session) {
    return res.status(200).json({
      chat_enabled: false,
      onboardingComplete: false,
    });
  }

  return res.status(200).json({
    chat_enabled: true,
    onboardingComplete: true,
    profileType: session.profileType,
    zip: session.zip,
    areaMode: session.areaMode,
  });
});

/** GET /landing/matches */
router.get("/matches", async (req, res) => {
  try {
    const session = landingAuthFromRequest(req);
    if (!session) {
      return res.status(401).json({
        message: "Landing onboarding not complete",
        areaMode: "waitlist",
        profiles: [],
        chat_enabled: false,
      });
    }

    const result = await getLandingMatches({
      profileType: session.profileType,
      zip: session.zip,
      areaModeHint: session.areaMode,
    });

    return res.status(200).json({
      ...result,
      chat_enabled: true,
      profileType: session.profileType,
    });
  } catch (error) {
    console.error("[landing/matches]", error?.message || error);
    return res.status(500).json({
      message: "Could not load matches",
      areaMode: "waitlist",
      profiles: [],
    });
  }
});

/**
 * POST /landing/fam-chat
 * Body: { message, history?, mode? }
 */
router.post("/fam-chat", async (req, res) => {
  try {
    if (req.body?.mode === "full_onboarding") {
      return res.status(403).json({
        message: "Chat is disabled during full onboarding",
        chat_enabled: false,
      });
    }

    const session = landingAuthFromRequest(req);
    if (!session?.profileType) {
      return res.status(403).json({
        message: "Chat unlocks after initial onboarding",
        chat_enabled: false,
      });
    }

    const message = String(req.body?.message || "").trim();
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const result = await runLandingFamChat({
      profileType: session.profileType,
      message,
      history: Array.isArray(req.body?.history) ? req.body.history : [],
    });

    const nav = result.navigation_intent
      ? resolveNavIntent(result.navigation_intent)
      : null;

    return res.status(200).json({
      chat_enabled: true,
      profileType: session.profileType,
      answer: result.answer,
      navigation_intent: result.navigation_intent,
      primary_button_label: result.primary_button_label,
      requires_clarification: result.requires_clarification,
      navigation: nav
        ? { label: result.primary_button_label || nav.label, path: nav.path }
        : null,
    });
  } catch (error) {
    console.error("[landing/fam-chat]", error?.message || error);
    return res.status(500).json({
      message: "FAM could not answer right now. Please try again.",
      chat_enabled: true,
    });
  }
});

export default router;
