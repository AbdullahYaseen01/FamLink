import nannyProfile from "../Schema/nannyProfile.js";
import User from "../Schema/user.js";
import uploadImage from "../Services/utils/uplaodImage.js";
import { creditReferrerForProfileCompletion } from "../Services/utils/referral.js";
import { sendReferralRewardEmail } from "../Services/email/email.js";

// Every profile field that travels as JSON inside a multipart body.
//
// Both onboarding flows and both edit forms submit FormData (they carry a photo),
// and FormData stringifies everything — so an array or object arrives as the text
// "[\"Group chat\"]" and lands in Mongo that way unless it is parsed back here.
//
// One shared list rather than a per-field line in each handler: this used to be
// two hand-maintained sequences that had already drifted apart (createProfile
// parsed `preferredAges`, updateProfile also parsed `languages`, `agesCare` and
// six others), and the family questionnaire adds nine more array questions. A
// field missing from one list is invisible until someone reads the document.
//
// Deliberately an explicit list, not a "parse anything that starts with [" rule,
// which would mangle a bio or openNotes that happens to begin with a bracket.
const JSON_FIELDS = [
  // caregiver side
  "availability",
  "preferredAges",
  "responsibilities",
  "certifications",
  "languages",
  "ageGroupsExp",
  "additionalDetails",
  "agesCare",
  "hourlyRate",
  "salaryExp",
  "salaryRange",
  // shared
  "specificDays",
  "childrenAges",
  "budget",
  "hourlyBudget",
  // family questionnaire (Q7, Q10-Q12, Q14-Q18, Q20, Q21)
  "allergiesHealth",
  "childResponsibilities",
  "dailyRoutine",
  "householdAddOns",
  "pets",
  "parentingStyle",
  "preferredNannyLanguages",
  "houseRules",
  "shareLocation",
  "communicationPreference",
  "backupCare",
];

const parseIfJson = (field) => {
  if (field === undefined || field === null || field === "") return field;
  try {
    return JSON.parse(field);
  } catch {
    return field;
  }
};

// Parses in place, leaving absent keys absent so a PATCH never resurrects a
// field the caller didn't send.
const parseJsonFields = (data) => {
  JSON_FIELDS.forEach((field) => {
    if (data[field] !== undefined) data[field] = parseIfJson(data[field]);
  });
  return data;
};

// hasFamily / hasNanny arrive as the strings "true"/"false" through FormData.
// Storing them verbatim left profiles with hasFamily: "false", which silently
// defeats the referral gate in match.controller.js — it compares against the
// boolean.
const coerceBooleans = (data) => {
  ["hasFamily", "hasNanny"].forEach((field) => {
    if (data[field] !== undefined) {
      data[field] = data[field] === "true" || data[field] === true;
    }
  });
  return data;
};

// Pay out the referrer of `userId`, if any, now that they've saved a profile.
//
// Fire-and-forget and safe to call on every profile save: the underlying claim
// is atomic and only pays when the user was actually referred and hasn't been
// credited yet, so repeated saves (or calling from both create and update) can
// never double-credit. Previously this was buried inside createProfile's
// `!careType` completion branch, so a referred friend whose profile save didn't
// happen to match that heuristic never credited their referrer — which is why a
// completed referral could silently pay nothing. Logs the outcome so the flow
// can be traced.
const creditReferralOnProfileSave = (userId) => {
  creditReferrerForProfileCompletion(userId)
    .then((result) => {
      if (!result) {
        console.log(
          `[referral] no payout for ${userId} — not referred, or already credited`
        );
        return;
      }
      const { referrer, referred } = result;
      console.log(
        `[referral] +1 month to referrer ${referrer._id} (count ${referrer.referralCount}, until ${referrer.referralMatchingUntil}) for ${referred._id} saving their profile`
      );
      return sendReferralRewardEmail(referrer.email, referrer.name, {
        friendName: referred.name,
        monthsEarned: referrer.referralCount,
        matchingUntil: referrer.referralMatchingUntil,
      });
    })
    .catch((err) =>
      console.error("Failed to credit referral on profile save:", err)
    );
};

export const createProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "Access denied" });
    }

    // onboardingFlow / onboardingStep steer the completion signal further down;
    // they are not profile data. This schema carries { strict: false }, so
    // anything left in the body is written to the document verbatim — pull them
    // out here rather than storing two stray fields on every profile.
    const { onboardingFlow, onboardingStep, ...profileBody } = req.body;

    const document = coerceBooleans(parseJsonFields(profileBody));

    // The photo is the questionnaire's last and only optional question; the 23
    // answers in front of it are not optional. This upload used to be awaited
    // inline, so anything Cloudinary rejected — a misconfigured api_secret, a
    // network blip, a file it disliked — rejected the whole request and the
    // profile was never written. A family answered every question and got back
    // {"error":"Must supply api_secret"} with nothing saved.
    //
    // So the upload is isolated: the answers land either way, and the failure is
    // logged and returned as a warning for the caller to surface, rather than
    // being swallowed as if the photo had uploaded.
    let photoWarning = null;
    if (req.file) {
      try {
        const imageUrl = await uploadImage(
          req.file.buffer,   // ✅ directly from multer
          req.userId,
          "new_user"
        );
        document.imageFile = imageUrl;
        // Both, deliberately: imageFile is what the cards and the public share page
        // read, profilePhoto is the questionnaire's own field. Writing only the
        // latter would upload a photo that never renders.
        document.profilePhoto = imageUrl;
        await User.findByIdAndUpdate(userId, { imageUrl });
      } catch (uploadError) {
        photoWarning = uploadError?.message || "Photo upload failed";
        console.error(
          `[profile] photo upload failed for ${userId} — saving answers without it:`,
          photoWarning
        );
      }
    }
    // Only assign imageFile when a file actually arrived. This used to run
    // unconditionally, so any save without a photo overwrote the stored URL with
    // "" — a profile could lose the picture on its own card just by being saved
    // again from a form that has no upload field. The photo question is optional,
    // so that path is easy to hit.

    const profile = await nannyProfile.findOneAndUpdate(
      { userId },
      document,
      { upsert: true, new: true }
    );

    // onboarding.completed is what Routes/admin/activity.js sums for its
    // "onboarding complete" figure, and onboarding.step existed in the user
    // schema with nothing ever writing it — so that figure read zero for every
    // family. Set both alongside the flag the app actually gates on.
    //
    // The signal used to be the ABSENCE of careType, which is a heuristic, not a
    // statement: it happens to hold for the flows that exist today only because
    // none of them send that field, and the nanny wizard for a caregiver who is
    // already with a family has to send it. That flow would silently stop
    // recording a completed profile. So a questionnaire now says so outright and
    // reports its own step count — 6 was the family's, hardcoded. The old branch
    // stays as the fallback for callers that predate the flag.
    if (onboardingFlow || !req.body["careType"]) {
      await User.findByIdAndUpdate(userId, {
        nannyProfileCompleted: true,
        "onboarding.completed": true,
        "onboarding.step": Number(onboardingStep) || 6,
        // user.js declares onboarding.intent with exactly this enum and had no
        // writer anywhere — it was built for the two nanny flows.
        ...(onboardingFlow === "nanny-share"
          ? { "onboarding.intent": "looking_for_job" }
          : {}),
      });
    }

    // Pay out the referrer (if any). Fired on every save rather than only in the
    // completion branch above, because that `!careType` heuristic doesn't hold
    // across every onboarding flow — and a referred friend must reliably credit
    // their referrer once they've built a profile. Non-blocking + idempotent.
    creditReferralOnProfileSave(userId);

    res.status(200).json({
      ...profile,
      message: "Profile created successfully",
      ...(photoWarning ? { photoWarning } : {}),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const data = coerceBooleans(parseJsonFields({ ...req.body }));

    // If a new image was uploaded. Isolated for the same reason as createProfile:
    // a rejected upload must not discard the edits the user came here to make.
    let photoWarning = null;
    if (req.file) {
      try {
        data.imageFile = await uploadImage(
          req.file.buffer,
          req.userId,
          "nanny_profile"
        );
        data.profilePhoto = data.imageFile;
        await User.findByIdAndUpdate(userId, { imageUrl: data.imageFile });
      } catch (uploadError) {
        photoWarning = uploadError?.message || "Photo upload failed";
        console.error(
          `[profile] photo upload failed for ${userId} — saving edits without it:`,
          photoWarning
        );
        // Leave imageFile untouched so the existing avatar survives.
        delete data.imageFile;
        delete data.profilePhoto;
      }
    } else {
      const existingProfile = await nannyProfile.findOne({ userId });
      if (existingProfile && existingProfile.imageFile) {
        await User.findByIdAndUpdate(userId, { imageUrl: existingProfile.imageFile });
      }
    }

    const updatedProfile = await nannyProfile.findOneAndUpdate(
      { userId },
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: "Nanny profile not found. Please create it first." });
    }

    // Same reliable referral payout as createProfile — completion can arrive via
    // either endpoint, so both credit the referrer (idempotent, so no double-pay).
    creditReferralOnProfileSave(userId);

    res.status(200).json({
      message: "Profile updated successfully",
      profile: updatedProfile,
      ...(photoWarning ? { photoWarning } : {}),
    });
  } catch (err) {
    console.error("Error updating nanny profile:", err);
    res.status(500).json({ error: err.message });
  }
};