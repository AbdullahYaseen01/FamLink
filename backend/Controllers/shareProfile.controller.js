import nannyProfile from "../Schema/nannyProfile.js";
import {
  ensureShareToken,
  shareLinkFor,
  toPublicSharedProfile,
} from "../Services/utils/shareProfile.js";

// Fields the public serializer needs on the owner. `name` and `imageUrl` are
// deliberately absent: the shared page never shows them, and not selecting them
// means they cannot leak through a serializer bug either.
const OWNER_FIELDS = "type location noOfChildren additionalInfo";

// The signed-in user's own share link, minting the token on first ask.
//
// Everyone gets one — all four share types have something worth posting — but
// a profile has to exist first, so a user who hasn't finished onboarding is
// told that rather than handed a link to an empty page.
export const getMyShareLink = async (req, res) => {
  try {
    const profile = await nannyProfile
      .findOne({ userId: req.userId })
      .populate("userId", OWNER_FIELDS);

    if (!profile) {
      return res.status(404).json({
        message: "Finish your nanny share profile to get a shareable link",
      });
    }

    const token = await ensureShareToken(profile);
    if (!token) {
      return res.status(500).json({ message: "Could not create a share link" });
    }

    return res.status(200).json({
      data: {
        token,
        url: shareLinkFor(token),
        // The owner's own preview of what strangers will see, so the share
        // sheet can show the real headline and card rather than a guess.
        profile: toPublicSharedProfile({ ...profile.toObject(), shareToken: token }),
      },
    });
  } catch (err) {
    console.error("❌ getMyShareLink ERROR:", err.name, err.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// The public page behind a shared link. No auth: this is what someone finds
// after a friend pastes the URL into a Facebook group, and requiring a login to
// see it would break the loop the feature exists to create.
//
// Only ever returns the privacy-safe projection — see toPublicSharedProfile.
export const getPublicSharedProfile = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ message: "Share link is missing its token" });
    }

    const profile = await nannyProfile
      .findOne({ shareToken: token })
      .populate("userId", OWNER_FIELDS);

    // Same response for a malformed token and one whose profile is gone, so the
    // endpoint can't be used to probe which tokens exist.
    if (!profile || !profile.userId) {
      return res.status(404).json({ message: "This share is no longer available" });
    }

    return res.status(200).json({ data: toPublicSharedProfile(profile) });
  } catch (err) {
    console.error("❌ getPublicSharedProfile ERROR:", err.name, err.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
