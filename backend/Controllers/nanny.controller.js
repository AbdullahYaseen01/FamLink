import nannyProfile from "../Schema/nannyProfile.js";
import User from "../Schema/user.js";
import uploadImage from "../Services/utils/uplaodImage.js";
import { creditReferrerForProfileCompletion } from "../Services/utils/referral.js";
import { sendReferralRewardEmail } from "../Services/email/email.js";

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

    const parseIfJson = (field) => {
      try {
        return JSON.parse(field);
      } catch {
        return field;
      }
    };

    const data = {
      ...req.body,
      availability: parseIfJson(req.body.availability),
      preferredAges: parseIfJson(req.body.preferredAges),
      responsibilities: parseIfJson(req.body.responsibilities),
      certifications: parseIfJson(req.body.certifications),
      specificDays: parseIfJson(req.body.specificDays),
      budget: parseIfJson(req.body.budget),  // ← add this
      hourlyBudget: parseIfJson(req.body.hourlyBudget),
      childrenAges: parseIfJson(req.body.childrenAges),
    };
    // hasFamily / hasNanny arrive as strings when the profile is submitted via
    // FormData (the onboarding + edit flows), and this create path — unlike
    // updateProfile — used to store them verbatim. That left some profiles with
    // hasFamily: "false" (a string), which silently defeats the referral gate in
    // match.controller.js (it compares against the boolean false). Coerce here so
    // the flag is always a real boolean, however the profile was created.
    if (data.hasFamily !== undefined) {
      data.hasFamily = data.hasFamily === "true" || data.hasFamily === true;
    }
    if (data.hasNanny !== undefined) {
      data.hasNanny = data.hasNanny === "true" || data.hasNanny === true;
    }

    const document = data;

    let imageUrl = "";

    if (req.file) {
      imageUrl = await uploadImage(
        req.file.buffer,   // ✅ directly from multer
        req.userId,
        "new_user"
      );
      await User.findByIdAndUpdate(userId, { imageUrl });
    }

    document["imageFile"] = imageUrl;

    const profile = await nannyProfile.findOneAndUpdate(
      { userId },
      document,
      { upsert: true, new: true }
    );

    if (!req.body["careType"]) {
      await User.findByIdAndUpdate(userId, {
        nannyProfileCompleted: true,
      });
    }

    // Pay out the referrer (if any). Fired on every save rather than only in the
    // completion branch above, because that `!careType` heuristic doesn't hold
    // across every onboarding flow — and a referred friend must reliably credit
    // their referrer once they've built a profile. Non-blocking + idempotent.
    creditReferralOnProfileSave(userId);

    res.status(200).json({ ...profile, message: "Profile created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const parseIfJson = (field) => {
      if (!field) return field;
      try {
        return JSON.parse(field);
      } catch {
        return field;
      }
    };

    const data = { ...req.body };

    // Parse JSON fields safely if they exist in the payload
    if (data.availability !== undefined) data.availability = parseIfJson(data.availability);
    if (data.preferredAges !== undefined) data.preferredAges = parseIfJson(data.preferredAges);
    if (data.responsibilities !== undefined) data.responsibilities = parseIfJson(data.responsibilities);
    if (data.certifications !== undefined) data.certifications = parseIfJson(data.certifications);
    if (data.specificDays !== undefined) data.specificDays = parseIfJson(data.specificDays);
    if (data.languages !== undefined) data.languages = parseIfJson(data.languages);
    if (data.ageGroupsExp !== undefined) data.ageGroupsExp = parseIfJson(data.ageGroupsExp);
    if (data.additionalDetails !== undefined) data.additionalDetails = parseIfJson(data.additionalDetails);
    if (data.agesCare !== undefined) data.agesCare = parseIfJson(data.agesCare);
    if (data.childrenAges !== undefined) data.childrenAges = parseIfJson(data.childrenAges);
    if (data.hourlyBudget !== undefined) data.hourlyBudget = parseIfJson(data.hourlyBudget);
    if (data.budget !== undefined) data.budget = parseIfJson(data.budget);
    if (data.hourlyRate !== undefined) data.hourlyRate = parseIfJson(data.hourlyRate);
    if (data.salaryExp !== undefined) data.salaryExp = parseIfJson(data.salaryExp);
    if (data.salaryRange !== undefined) data.salaryRange = parseIfJson(data.salaryRange);

    if (data.hasFamily !== undefined) {
      data.hasFamily = data.hasFamily === "true" || data.hasFamily === true;
    }
    if (data.hasNanny !== undefined) {
      data.hasNanny = data.hasNanny === "true" || data.hasNanny === true;
    }

    // If a new image was uploaded
    if (req.file) {
      data.imageFile = await uploadImage(
        req.file.buffer,
        req.userId,
        "nanny_profile"
      );
      await User.findByIdAndUpdate(userId, { imageUrl: data.imageFile });
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
      profile: updatedProfile
    });
  } catch (err) {
    console.error("Error updating nanny profile:", err);
    res.status(500).json({ error: err.message });
  }
};