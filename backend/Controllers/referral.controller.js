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

    // Rewards earned since the user last dismissed the celebratory popup. > 0
    // means "show it"; acknowledging it (POST /referral/seen-reward) bumps the
    // seen count up so it never shows twice for the same referral.
    const unseenReferralRewards = Math.max(
      0,
      (user.referralCount || 0) - (user.referralRewardSeenCount || 0)
    );

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
        // Drives the one-time "you earned a free month" dashboard popup.
        unseenReferralRewards,
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

// Mark all earned rewards as seen, so the one-time "you earned a free month"
// dashboard popup doesn't fire again. Fired when the user dismisses the popup.
// Idempotent — setting seen = count is safe to repeat.
export const seenReferralRewards = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("referralCount");
    if (!user) return res.status(401).json({ message: "Access denied" });

    // Catch the seen count up to whatever's been earned so far. If a fresh
    // reward happens to land between this read and write, it stays unseen — the
    // right call, since it means a genuinely new month still gets celebrated.
    const seen = user.referralCount || 0;
    await User.updateOne({ _id: req.userId }, { $set: { referralRewardSeenCount: seen } });

    return res.status(200).json({ data: { referralRewardSeenCount: seen } });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
