import User from "../Schema/user.js";
import NannyProfile from "../Schema/nannyProfile.js";
import { getLaunchStatusForUser } from "../Services/utils/neighborhoodLaunch.js";
import { PUBLIC_USER_SELECT, toPublicUser } from "../Services/utils/userPrivacy.js";
import { isBrowseReadyProfile } from "../Services/utils/profileCompleteness.js";
import {
  isInitialOnboardingComplete,
  profileTypeFromAnswers,
} from "../Services/utils/famNavRegistry.js";
import {
  audienceFromAnswers,
  guidedQuestionButtons,
  resolveGuidedQuestion,
} from "../Services/utils/famGuidedQa.js";

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
  const launchStatus = await getLaunchStatusForUser({ location: answers.location });
  const cityStatus = launchStatus.status === "active" || launchStatus.status === "activeGrowing" ? "active" : "waitlist";

  if (cityStatus === "waitlist") {
    return res.json({
      chat_enabled: false,
      guided_qa: true,
      profileType,
      cityStatus,
      profiles: [],
    });
  }

  const asBool = (v) => v === true || v === "true";
  const cardVariant = (userType, share) =>
    userType === "Parents"
      ? asBool(share?.hasNanny) ? "familyHasNanny" : "familyLooking"
      : asBool(share?.hasFamily) ? "nannyHasFamily" : "nannyLooking";
  const canMatch = (viewer, card) =>
    viewer === "familyLooking" ? true : card === "familyLooking";

  const users = await User.find({
    type: { $in: ["Parents", "Nanny"] },
    status: "Active",
    nannyProfileCompleted: true,
  })
    .select(PUBLIC_USER_SELECT)
    .limit(48)
    .lean();

  const ids = users.map((u) => u._id);
  const profiles = await NannyProfile.find({ userId: { $in: ids } }).lean();
  const shareByUser = new Map(profiles.map((p) => [String(p.userId), p]));
  const eligible = [];
  for (const user of users) {
    const share = shareByUser.get(String(user._id));
    if (!share) continue;
    if (!isBrowseReadyProfile(share, user)) continue;
    if (!canMatch(profileType, cardVariant(user.type, share))) continue;
    eligible.push({ ...(share || {}), userId: user, userType: user.type });
    if (eligible.length === 3) break;
  }

  // Primary padding: from the already fetched `users` that didn't pass strict matching
  if (eligible.length < 3) {
    for (const user of users) {
      if (eligible.length >= 3) break;
      const alreadyIncluded = eligible.some(e => String(e.userId._id) === String(user._id));
      
      // Ensure we only pad with the opposing type
      const targetType = profileType.startsWith("family") ? "Nanny" : "Parents";
      if (!alreadyIncluded && user.type === targetType) {
        const share = profiles.find((p) => String(p.userId) === String(user._id)) || {};
        eligible.push({
          ...share,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          location: user.location || { city: "Bay Area" },
          experience: share.careExperience || share.experience || "Childcare Experience",
          ageGroupsExp: share.ageGroupsExp || share.ages || ["Infant"],
          avaiForWorking: share.careType || share.schedule || "Full-Time",
          careType: share.nannyShareType || share.careType || "Full-Time",
          childrenCount: share.numberOfChildren || share.childrenCount || 1,
          specificDays: share.specificDays || { monday: { checked: true } },
          userId: user,
          userType: user.type
        });
      }
    }
  }

  // Secondary padding: Fetch active users of the opposing type to fill remaining slots
  if (eligible.length < 3) {
    const existingIds = eligible.map(e => e.userId._id);
    const targetType = profileType.startsWith("family") ? "Nanny" : "Parents";

    const fallbackUsers = await User.find({
      type: targetType,
      status: "Active",
      _id: { $nin: existingIds }
    })
      .select(PUBLIC_USER_SELECT)
      .limit(3 - eligible.length)
      .lean();

    if (fallbackUsers.length > 0) {
      const fallbackIds = fallbackUsers.map((u) => u._id);
      const fallbackProfiles = await NannyProfile.find({ userId: { $in: fallbackIds } }).lean();

      for (const user of fallbackUsers) {
        let share = fallbackProfiles.find((p) => String(p.userId) === String(user._id)) || {};
        
        eligible.push({
          ...share,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          location: user.location || { city: "Bay Area" },
          // Frontend 'convertRealProfileToMatchCardProps' looks for these exact keys:
          experience: share.careExperience || share.experience || "Childcare Experience",
          ageGroupsExp: share.ageGroupsExp || share.ages || ["Infant"],
          avaiForWorking: share.careType || share.schedule || "Full-Time",
          careType: share.nannyShareType || share.careType || "Full-Time",
          childrenCount: share.numberOfChildren || share.childrenCount || 1,
          specificDays: share.specificDays || { monday: { checked: true } },
          userId: user,
          userType: user.type,
        });
        
        if (eligible.length >= 3) break;
      }
    }
  }

  return res.json({
    chat_enabled: false,
    guided_qa: true,
    profileType,
    cityStatus,
    profiles: eligible,
  });
}

export function landingGuidedQa(req, res) {
  if (req.body?.mode === "full-onboarding") {
    return res.status(403).json({ chat_enabled: false, message: "FAM chat is disabled during full onboarding." });
  }
  const gated = gate(req);
  if (gated.error) return res.status(gated.error.status).json(gated.error);

  const audience = audienceFromAnswers(gated.answers);
  if (!audience) {
    return res.status(400).json({ message: "Family or Nanny audience is required." });
  }

  const questionId = req.body?.question_id;
  if (!questionId) {
    return res.json({
      audience,
      questions: guidedQuestionButtons(audience),
    });
  }

  const response = resolveGuidedQuestion(audience, questionId);
  if (!response) {
    return res.status(400).json({ message: "Unknown approved question." });
  }

  return res.json(response);
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
  return res.json({ chat_enabled: false, guided_qa: true, profileType: gated.profileType });
}
