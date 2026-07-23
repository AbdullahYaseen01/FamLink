import User from "../Schema/user.js";
import nannyProfile from "../Schema/nannyProfile.js";
import {
  ensureReferralCode,
  hasActiveReferralMatching,
  daysOfMatchingLeft,
  referralLinkFor,
  isReferralGatedCaregiver,
} from "../Services/utils/referral.js";

// Everything the "Refer a friend" UI needs in one call: the user's own code and
// link, how many friends have joined, and whether their free matching is live.
//
// Also mints a code on first read, so accounts created before referrals shipped
// get one the moment they open the screen.
export const getMyReferral = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ message: "Access denied" });
    }

    const code = await ensureReferralCode(user);

    // hasFamily lives on the profile, not the user, and drives whether this
    // account is gated at all. A caregiver who hasn't built a profile yet reads
    // as ungated — the match endpoint blocks them on nannyProfileCompleted
    // before referrals ever come into it.
    const profile = await nannyProfile
      .findOne({ userId: user._id })
      .select("hasFamily")
      .lean();

    // Friends who signed up but haven't finished a profile yet, so haven't paid
    // out. referralCount only counts the ones that did.
    const pendingCount = await User.countDocuments({
      referredBy: user._id,
      referralCreditedAt: null,
    });

    return res.status(200).json({
      data: {
        code,
        link: referralLinkFor(code),
        referralCount: user.referralCount || 0,
        pendingCount,
        matchingUntil: user.referralMatchingUntil || null,
        hasActiveMatching: hasActiveReferralMatching(user),
        daysLeft: daysOfMatchingLeft(user),
        // True when this user is on the referral model rather than a
        // subscription — the UI branches its paywall copy on this.
        isReferralGated: isReferralGatedCaregiver(user, profile),
        // Whether the one free match request has been spent.
        freeMatchUsed: (user.matchRequestsSent || 0) > 0,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// The friends who have joined through this user's link. Small, self-scoped
// list — a caregiver only ever sees the people they personally referred.
//
// Each carries its payout state, because the two differ and the difference
// matters to the referrer: a friend who signed up but hasn't finished their
// profile has earned them nothing yet, and the honest thing is to say so (and
// give them something to chase) rather than quietly showing a name that didn't
// count.
export const getMyReferredFriends = async (req, res) => {
  try {
    const friends = await User.find({ referredBy: req.userId })
      .select("name imageUrl createdAt referralCreditedAt")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      data: friends.map(({ referralCreditedAt, ...friend }) => ({
        ...friend,
        credited: Boolean(referralCreditedAt),
        creditedAt: referralCreditedAt || null,
      })),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
