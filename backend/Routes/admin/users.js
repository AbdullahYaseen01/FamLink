import express from "express";
import mongoose from "mongoose";

import User from "../../Schema/user.js";
import nannyProfile from "../../Schema/nannyProfile.js";
import MatchRequest from "../../Schema/matchRequest.js";
import Chat from "../../Schema/chat.js";
import Message from "../../Schema/message.js";
import Report from "../../Schema/report.js";
import EmailLog from "../../Schema/emailLog.js";
import AdminAction from "../../Schema/adminAction.js";

import { adminOnly, parsePaging, pagingMeta, parseSort, escapeRegex } from "../../Services/utils/adminAuth.js";
import { logAdminAction, requireReason } from "../../Services/utils/adminAudit.js";
import { scoreProfile } from "../../Services/utils/profileCompleteness.js";
import { subscriptionTier, referralSummary } from "../../Services/utils/subscriptionTier.js";
import { sendAccountDeactivatedEmail } from "../../Services/email/email.js";

const router = express.Router();
router.use(adminOnly);

/* ─────────────────────────────── projections ─────────────────────────────── */

// What the user table shows. Named explicitly rather than excluded, for the
// reason userPrivacy.js gives at length: an exclusion list silently ships every
// field added to the schema afterwards, and this response is the one that
// carries email addresses and phone numbers for every user at once.
//
// `location.coordinates` is absent. An admin has no screen that plots homes,
// and the console is a browser tab like any other — the exact address of every
// family on the platform should not be sitting in its network log.
const LIST_FIELDS = [
  "_id", "name", "email", "type", "status", "createdAt",
  "location.city", "location.neighborhood", "location.format_location",
  "zipCode", "premium", "subscriptionStatus", "subscriptionId",
  "lastLogin", "loginCount", "activeDays", "ActiveAt", "online",
  "onboarding", "nannyProfileCompleted", "shareSetupCompleted",
  "termsAcceptedAt", "termsAcceptedVersion",
  "suspendedUntil", "suspendedAt", "moderationReason",
  "profileDeletedAt", "deletedAt",
  "suspiciousFlaggedAt", "suspiciousReason",
  "imageUrl", "verified", "phoneNo", "referralCode", "referralCount",
  "referralMatchingUntil",
].join(" ");

/* ──────────────────────────── derived columns ────────────────────────────── */

const DAY_MS = 24 * 60 * 60 * 1000;

// Logins per week since the account was created.
//
// Derived on read rather than stored, so it stays correct without a nightly job
// and cannot drift from `loginCount`. The floor of one week stops a
// three-day-old account with two logins reporting an absurd rate.
const activityFrequency = (user) => {
  const created = user.createdAt ? new Date(user.createdAt).getTime() : null;
  if (!created) return null;
  const weeks = Math.max(1, (Date.now() - created) / (7 * DAY_MS));
  return Math.round(((user.loginCount || 0) / weeks) * 10) / 10;
};

// The label the table renders. Based on lastLogin, which is refreshed on token
// refresh as well as login — so it stays fresh for anyone actually using the
// app and only goes stale once they genuinely stop.
//
// "unknown" is a real answer, not a fallback: `lastLogin` is null for every
// account that predates the field, and showing those as "inactive" would put
// long-standing members at the top of a churn list they don't belong on.
const activityStatus = (user) => {
  if (!user.lastLogin) return "unknown";
  const days = (Date.now() - new Date(user.lastLogin).getTime()) / DAY_MS;
  if (days <= 7) return "active";
  if (days <= 30) return "recent";
  if (days <= 90) return "lapsed";
  return "inactive";
};


const decorate = (user, completeness = null) => ({
  ...user,
  subscriptionTier: subscriptionTier(user),
  // How a "Referral" account earned its benefits, and when they run out. The
  // expiry is the point of the label — a tier with no date is just a word.
  ...referralSummary(user),
  activityFrequency: activityFrequency(user),
  activityStatus: activityStatus(user),
  profileCompletion: completeness,
});

/* ═══════════════════════════════ LIST USERS ═══════════════════════════════ */

// GET /admin/users
//   ?search= &type=Parents|Nanny|Admin &status=Active|Block|Suspended|Deleted
//   &tier=free|plus|referral &activity=active|recent|lapsed|inactive|unknown
//   &city= &completion=complete|almost|partial|barely-started
//   &sort=-createdAt &page= &limit=
router.get("/", async (req, res) => {
  try {
    const paging = parsePaging(req.query);
    const query = {};

    const { search, type, status, tier, city, activity, flagged } = req.query;

    if (search) {
      const term = new RegExp(escapeRegex(String(search).trim()), "i");
      query.$or = [{ name: term }, { email: term }, { zipCode: term }, { "location.city": term }];
    }

    if (type && ["Parents", "Nanny", "Admin"].includes(type)) query.type = type;

    // No status filter means "everyone except deleted accounts". A soft-deleted
    // user is still a row, and defaulting to showing them would make the table
    // grow forever with accounts that no longer exist as far as anyone is
    // concerned. They stay reachable via ?status=Deleted.
    if (status && ["Active", "Block", "Suspended", "Deleted"].includes(status)) {
      query.status = status;
    } else {
      query.status = { $ne: "Deleted" };
    }

    if (tier === "plus") query.premium = true;
    // "Free" means no benefits at all, so an active referrer is excluded — they
    // are listed under `referral` instead. Without this they appear in both.
    //
    // Written as `$not` rather than an `$or` over null/past dates because the
    // search filter below also assigns `query.$or`, and the second assignment
    // would silently drop this one — turning "free accounts matching Jane" into
    // "any account matching Jane".
    if (tier === "free") {
      query.premium = { $ne: true };
      query.referralMatchingUntil = { $not: { $gt: new Date() } };
    }
    if (tier === "referral") query.referralMatchingUntil = { $gt: new Date() };

    if (city) query["location.city"] = new RegExp(`^${escapeRegex(city)}$`, "i");

    if (flagged === "true") query.suspiciousFlaggedAt = { $ne: null };

    // Activity is a range over lastLogin, so it becomes a date filter rather
    // than a post-filter — filtering after pagination would return short pages
    // and a wrong total.
    if (activity) {
      const now = Date.now();
      const ago = (days) => new Date(now - days * DAY_MS);
      if (activity === "active") query.lastLogin = { $gte: ago(7) };
      else if (activity === "recent") query.lastLogin = { $gte: ago(30), $lt: ago(7) };
      else if (activity === "lapsed") query.lastLogin = { $gte: ago(90), $lt: ago(30) };
      else if (activity === "inactive") query.lastLogin = { $lt: ago(90) };
      else if (activity === "unknown") query.lastLogin = null;
    }

    const sort = parseSort(
      req.query.sort,
      ["createdAt", "lastLogin", "name", "email", "loginCount", "termsAcceptedAt"],
      { createdAt: -1 }
    );

    const [users, totalRecords] = await Promise.all([
      User.find(query).select(LIST_FIELDS).sort(sort).skip(paging.skip).limit(paging.limit).lean(),
      User.countDocuments(query),
    ]);

    // Profile completion needs each user's share profile. One query for the
    // whole page keyed by userId, not one per row — the N+1 version is
    // invisible on a seed database and takes 25 round trips per page in
    // production.
    const profiles = await nannyProfile
      .find({ userId: { $in: users.map((u) => u._id) } })
      .lean();
    const byUser = new Map(profiles.map((p) => [String(p.userId), p]));

    let data = users.map((user) =>
      decorate(user, scoreProfile(user, byUser.get(String(user._id))))
    );

    // Completion is computed rather than stored, so it cannot be a mongo filter
    // and is applied here. That makes it a filter over the current page only —
    // the response says so explicitly rather than letting the console show a
    // total that doesn't match the rows.
    const { completion } = req.query;
    let pageFiltered = false;
    if (completion) {
      const inBucket = (percent) =>
        completion === "complete" ? percent >= 100
          : completion === "almost" ? percent >= 75 && percent < 100
            : completion === "partial" ? percent >= 40 && percent < 75
              : percent < 40;
      data = data.filter((u) => inBucket(u.profileCompletion?.percent ?? 0));
      pageFiltered = true;
    }

    return res.status(200).json({
      data,
      pagination: pagingMeta(totalRecords, paging),
      pageFiltered,
    });
  } catch (error) {
    console.error("admin/users list failed:", error);
    return res.status(500).json({ message: "Could not load users", error: error.message });
  }
});

/* ═════════════════════════════ USER DETAIL ════════════════════════════════ */

// GET /admin/users/:id — everything the detail drawer shows, in one round trip.
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id).select(LIST_FIELDS).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const [profile, matchesSent, matchesReceived, mutualMatches, chatCount, messageCount,
      reportsAgainst, reportsBy, recentEmails, adminHistory] = await Promise.all([
      nannyProfile.findOne({ userId: id }).lean(),
      MatchRequest.countDocuments({ senderId: id }),
      MatchRequest.countDocuments({ receiverId: id }),
      MatchRequest.countDocuments({
        $or: [{ senderId: id }, { receiverId: id }],
        status: "accepted",
      }),
      Chat.countDocuments({ participants: id }),
      Message.countDocuments({ sender: id }),
      Report.countDocuments({ reportedUserId: id }),
      Report.countDocuments({ reporterId: id }),
      EmailLog.find({ userId: id }).sort({ sentAt: -1 }).limit(20).lean(),
      AdminAction.find({ targetUserId: id })
        .sort({ createdAt: -1 })
        .limit(50)
        .select("action adminEmail reason createdAt metadata")
        .lean(),
    ]);

    return res.status(200).json({
      data: {
        user: decorate(user, scoreProfile(user, profile)),
        profile: profile || null,
        shareLink: profile?.shareToken
          ? {
              token: profile.shareToken,
              enabled: profile.shareEnabled !== false,
              views: profile.shareViewCount || 0,
              lastViewedAt: profile.shareLastViewedAt || null,
            }
          : null,
        activity: {
          matchesSent,
          matchesReceived,
          mutualMatches,
          conversations: chatCount,
          messagesSent: messageCount,
          reportsAgainst,
          reportsBy,
        },
        recentEmails,
        // The audit trail for this user. Deliberately part of the detail view:
        // an admin about to delete an account should see that someone already
        // suspended it twice this month.
        adminHistory,
      },
    });
  } catch (error) {
    console.error("admin/users detail failed:", error);
    return res.status(500).json({ message: "Could not load user", error: error.message });
  }
});

/* ═══════════════════════════════ MODERATION ═══════════════════════════════ */

// Guard shared by every state-changing route below.
//
// An admin acting on their own account is the failure mode worth stopping: it
// is always a mistake (there is no reason to block yourself from the console
// you are using), and the result is a platform nobody can administer.
const loadTarget = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Invalid user id" });
    return null;
  }
  if (String(id) === String(req.admin._id)) {
    res.status(400).json({ message: "You cannot perform this action on your own account." });
    return null;
  }
  const user = await User.findById(id).select("_id name email type status premium");
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return null;
  }
  return user;
};

// PUT /admin/users/:id/block   { reason }
// Indefinite. Only an admin lifts it.
router.put("/:id/block", async (req, res) => {
  try {
    const user = await loadTarget(req, res);
    if (!user) return;

    const reason = requireReason(req.body?.reason);
    if (!reason) {
      return res.status(400).json({
        message: "A reason of at least 10 characters is required to block an account.",
      });
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          status: "Block",
          moderationReason: reason,
          suspendedUntil: null,
          suspendedAt: new Date(),
        },
      }
    );

    await logAdminAction({
      req, action: "user.block", targetUserId: user._id,
      targetType: "user", reason,
      metadata: { previousStatus: user.status },
    });

    // The email is generic on purpose — `reason` is the moderator's own wording
    // and can identify whoever reported them. Non-blocking: a mail failure must
    // not leave the account unblocked after the write already succeeded.
    if (user.email) {
      sendAccountDeactivatedEmail(
        user.email, user.name, "a violation of our community guidelines"
      ).catch((err) => console.error("Deactivation email failed:", err?.message || err));
    }

    return res.status(200).json({ message: "Account blocked." });
  } catch (error) {
    console.error("admin block failed:", error);
    return res.status(500).json({ message: "Could not block the account", error: error.message });
  }
});

// PUT /admin/users/:id/suspend   { days, reason }
// A timed pause. The login path lifts it automatically once `suspendedUntil`
// passes, so nobody has to remember to undo it.
router.put("/:id/suspend", async (req, res) => {
  try {
    const user = await loadTarget(req, res);
    if (!user) return;

    const reason = requireReason(req.body?.reason);
    if (!reason) {
      return res.status(400).json({
        message: "A reason of at least 10 characters is required to suspend an account.",
      });
    }

    const days = Number(req.body?.days);
    if (!Number.isFinite(days) || days < 1 || days > 365) {
      return res.status(400).json({ message: "Suspension length must be between 1 and 365 days." });
    }

    const until = new Date(Date.now() + days * DAY_MS);

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          status: "Suspended",
          suspendedUntil: until,
          suspendedAt: new Date(),
          moderationReason: reason,
        },
      }
    );

    await logAdminAction({
      req, action: "user.suspend", targetUserId: user._id,
      targetType: "user", reason,
      metadata: { days, until, previousStatus: user.status },
    });

    return res.status(200).json({ message: `Account suspended until ${until.toDateString()}.`, until });
  } catch (error) {
    console.error("admin suspend failed:", error);
    return res.status(500).json({ message: "Could not suspend the account", error: error.message });
  }
});

// PUT /admin/users/:id/reinstate   { reason? }
// Undoes a block or a suspension. One route for both, because "make this
// account work again" is one intent and two buttons that do it differently is
// how an admin lifts a suspension and leaves a block in place.
router.put("/:id/reinstate", async (req, res) => {
  try {
    const user = await loadTarget(req, res);
    if (!user) return;

    if (user.status === "Deleted") {
      return res.status(400).json({
        message: "This account was deleted. Use restore instead.",
      });
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: { status: "Active", suspendedUntil: null, suspendedAt: null, moderationReason: null },
      }
    );

    await logAdminAction({
      req,
      action: user.status === "Suspended" ? "user.unsuspend" : "user.unblock",
      targetUserId: user._id, targetType: "user",
      reason: req.body?.reason || "Reinstated by admin",
      metadata: { previousStatus: user.status },
    });

    return res.status(200).json({ message: "Account reinstated." });
  } catch (error) {
    console.error("admin reinstate failed:", error);
    return res.status(500).json({ message: "Could not reinstate the account", error: error.message });
  }
});

// DELETE /admin/users/:id/profile   { reason }
//
// "Take my listing down." Removes the nanny share profile and kills the public
// share link. The ACCOUNT SURVIVES: they can still sign in, their chats and
// match history are intact, and they can build a new profile.
//
// Distinct from deleting the account, and the console keeps them as two
// separate buttons with two separate confirmations, because conflating them is
// how a "please hide my listing" request becomes a data-loss incident.
router.delete("/:id/profile", async (req, res) => {
  try {
    const user = await loadTarget(req, res);
    if (!user) return;

    const reason = requireReason(req.body?.reason);
    if (!reason) {
      return res.status(400).json({
        message: "A reason of at least 10 characters is required to delete a profile.",
      });
    }

    const profile = await nannyProfile.findOne({ userId: user._id }).lean();

    await nannyProfile.deleteOne({ userId: user._id });
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          profileDeletedAt: new Date(),
          nannyProfileCompleted: false,
          shareSetupCompleted: false,
        },
      }
    );

    await logAdminAction({
      req, action: "user.delete_profile", targetUserId: user._id,
      targetType: "nannyProfile", targetId: profile?._id || null, reason,
      // The token is recorded so it is knowable afterwards which public URL
      // stopped resolving, if someone asks why a link in a Facebook group
      // went dead.
      metadata: { hadProfile: Boolean(profile), shareToken: profile?.shareToken || null },
    });

    return res.status(200).json({ message: "Profile deleted. The account is still active." });
  } catch (error) {
    console.error("admin delete profile failed:", error);
    return res.status(500).json({ message: "Could not delete the profile", error: error.message });
  }
});

// DELETE /admin/users/:id   { reason, purgeContent? }
//
// Account deletion. SOFT by design.
//
// The row stays and `status` becomes "Deleted". A hard delete would leave every
// message, match request and review that references this user pointing at a
// missing id — and those records belong to the OTHER party as much as to this
// one. The family who spent three weeks arranging a share should not find their
// half of the conversation broken because the caregiver closed their account.
//
// What actually stops: sign-in, appearing in browse or match results, the
// public share link, and all future email. The personal data that is no longer
// needed to keep those other records coherent is cleared.
router.delete("/:id", async (req, res) => {
  try {
    const user = await loadTarget(req, res);
    if (!user) return;

    const reason = requireReason(req.body?.reason);
    if (!reason) {
      return res.status(400).json({
        message: "A reason of at least 10 characters is required to delete an account.",
      });
    }

    const now = new Date();

    // The address is released rather than kept. It is unique-indexed, and
    // holding it would stop the same person signing up again — which is not a
    // sanction anyone chose, just a side effect of the index. Tombstoned rather
    // than nulled because `email` is required, and the original is preserved in
    // the audit row.
    const tombstone = `deleted+${user._id}@famlink.invalid`;

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          status: "Deleted",
          deletedAt: now,
          moderationReason: reason,
          email: tombstone,
          phoneNo: null,
          password: null,
          imageUrl: null,
          aboutMe: null,
          dob: null,
          stripeId: null,
          subscriptionId: null,
          subscriptionStatus: null,
          premium: false,
          online: false,
          // Belt and braces: every email path filters on unsubscribe or on
          // status, but a deleted account must not be mailed even if one of
          // them is missed.
          "notifications.email.newMessage": false,
          "notifications.email.safetyNoti": false,
          "notifications.email.newRecoLists": false,
          "notifications.email.tipsAndTricks": false,
          "notifications.email.ref": false,
          "notifications.email.disAccInfo": false,
          "notifications.email.newSubInArea": false,
          "notifications.sms": false,
        },
        $unset: { location: "", resetPasswordToken: "", resetPasswordExpires: "", otp: "" },
      }
    );

    // The profile is theirs alone — nothing else references it — so it goes.
    await nannyProfile.deleteOne({ userId: user._id });

    // Pending match requests are cancelled so the other side stops seeing an
    // invitation from an account that no longer exists. Accepted ones are left:
    // they are the history of a real connection.
    const cancelled = await MatchRequest.deleteMany({
      $or: [{ senderId: user._id }, { receiverId: user._id }],
      status: "pending",
    });

    await logAdminAction({
      req, action: "user.delete_account", targetUserId: user._id,
      targetType: "user", reason,
      metadata: {
        originalEmail: user.email,
        name: user.name,
        cancelledRequests: cancelled.deletedCount,
        softDelete: true,
      },
    });

    return res.status(200).json({
      message: "Account deleted.",
      details: {
        softDelete: true,
        cancelledPendingRequests: cancelled.deletedCount,
        note: "Message and match history is preserved for the other people involved.",
      },
    });
  } catch (error) {
    console.error("admin delete account failed:", error);
    return res.status(500).json({ message: "Could not delete the account", error: error.message });
  }
});

// PUT /admin/users/:id/flag   { suspicious: boolean, reason? }
// Marks an account for review without sanctioning it. Feeds the moderation
// queue's "flagged" filter.
router.put("/:id/flag", async (req, res) => {
  try {
    const user = await loadTarget(req, res);
    if (!user) return;

    const suspicious = req.body?.suspicious !== false;
    const reason = String(req.body?.reason || "").trim().slice(0, 500);

    await User.updateOne(
      { _id: user._id },
      suspicious
        ? { $set: { suspiciousFlaggedAt: new Date(), suspiciousReason: reason } }
        : { $set: { suspiciousFlaggedAt: null, suspiciousReason: null } }
    );

    return res.status(200).json({
      message: suspicious ? "Account flagged for review." : "Flag cleared.",
    });
  } catch (error) {
    console.error("admin flag failed:", error);
    return res.status(500).json({ message: "Could not update the flag", error: error.message });
  }
});

export default router;
