import express from "express";
import mongoose from "mongoose";

import User from "../../Schema/user.js";

import { adminOnly, parsePaging, pagingMeta, escapeRegex } from "../../Services/utils/adminAuth.js";
import { referralLinkFor } from "../../Services/utils/referral.js";
import { subscriptionTier, referralSummary } from "../../Services/utils/subscriptionTier.js";

const router = express.Router();
router.use(adminOnly);

// Referral tracking.
//
// ────────────────────────────────────────────────────────────────────────────
// WHAT THIS SCREEN IS FOR
//
// Caregivers don't pay. They get one free match request, and after that they
// keep matching by referring a friend: each friend who signs up with their code
// AND finishes a profile grants one calendar month (Services/utils/referral.js).
//
// That makes referrals a billing mechanism, not a growth vanity metric, and it
// gives the funnel exactly three states worth separating:
//
//   1. LINK CREATED    — a code exists. Costs nothing, proves nothing.
//   2. SIGNED UP       — somebody registered with it. Still pays out nothing.
//   3. COMPLETED       — they finished a profile. THIS is when the referrer's
//                        month is granted and their due date moves.
//
// Steps 2 and 3 are deliberately distinct in the data (`referredBy` set at
// registration, `referralCreditedAt` stamped at completion) because the gap
// between them is the whole story: a referrer with eight signups and one
// completion has not earned eight months, and a screen that showed one number
// would hide the reason their matching lapsed.
//
// Nothing here writes. Months are granted by profile completion and by nothing
// else — an admin hand-crediting a month would be a payout with no referral
// behind it, and the one guarantee this scheme rests on is that a month always
// corresponds to a real person who joined and finished.
// ────────────────────────────────────────────────────────────────────────────

const PARTY_FIELDS =
  "name email type status imageUrl createdAt referralCode referralCodeCreatedAt " +
  "referralCount referralMatchingUntil referredBy referralCreditedAt " +
  "premium subscriptionStatus";

// The tier/benefit block every row carries, built from the SAME helpers the
// Users and Subscriptions screens use. A referrer reading "Referral · free
// until 3 Sep" there and something else here would be a support ticket about a
// bug that doesn't exist.
const benefitFor = (user) => ({
  tier: subscriptionTier(user),
  ...referralSummary(user),
});

/* ════════════════════════════════ REFERRERS ═══════════════════════════════ */

// GET /admin/referrals?search=&scope=active|all&page=&limit=
//
// One row per person who holds a referral link. `scope=active` (the default)
// narrows to the ones who have actually had a signup — a list of every account
// with a code is a list of every account, which is not referral activity.
router.get("/", async (req, res) => {
  try {
    const paging = parsePaging(req.query);
    const { search, scope } = req.query;

    const query = { referralCode: { $nin: [null, ""] } };

    // Who has ever been credited as somebody's referrer. Used both to scope the
    // default view and, below, to attach counts.
    const referrerIds = await User.distinct("referredBy", { referredBy: { $ne: null } });

    if (scope !== "all") {
      query._id = { $in: referrerIds };
    }

    if (search) {
      const term = new RegExp(escapeRegex(String(search).trim()), "i");
      // The code itself is searchable: an admin chasing a specific link has the
      // code in front of them, not the owner's name.
      query.$or = [{ name: term }, { email: term }, { referralCode: term }];
    }

    const [referrers, totalRecords] = await Promise.all([
      User.find(query)
        .select(PARTY_FIELDS)
        // Most active first. `referralCount` is the credited count, so this
        // ranks by months actually earned rather than by links handed out.
        .sort({ referralCount: -1, referralCodeCreatedAt: -1, createdAt: -1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .lean(),
      User.countDocuments(query),
    ]);

    // Signup and completion counts for this page, in one aggregate rather than
    // two queries per row.
    const ids = referrers.map((r) => r._id);
    const counts = ids.length
      ? await User.aggregate([
          { $match: { referredBy: { $in: ids } } },
          {
            $group: {
              _id: "$referredBy",
              signups: { $sum: 1 },
              completed: {
                $sum: { $cond: [{ $ne: ["$referralCreditedAt", null] }, 1, 0] },
              },
              lastSignupAt: { $max: "$createdAt" },
              lastCreditedAt: { $max: "$referralCreditedAt" },
            },
          },
        ])
      : [];
    const countMap = new Map(counts.map((c) => [String(c._id), c]));

    const data = referrers.map((user) => {
      const stats = countMap.get(String(user._id)) || {};
      const signups = stats.signups || 0;
      const completed = stats.completed || 0;
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        type: user.type,
        status: user.status,

        // ── the link ──
        code: user.referralCode,
        link: referralLinkFor(user.referralCode),
        // Null for codes minted before this was recorded. Reported as null so
        // the console can say so rather than substituting the signup date,
        // which would be wrong for every account that was backfilled.
        linkCreatedAt: user.referralCodeCreatedAt || null,

        // ── the funnel ──
        signups,
        completed,
        // Signed up but haven't finished a profile, so have paid out nothing
        // yet. The number that explains a referrer's disappointment.
        pending: Math.max(0, signups - completed),
        lastSignupAt: stats.lastSignupAt || null,
        lastCreditedAt: stats.lastCreditedAt || null,

        // ── the reward ──
        // Months earned, per the referrer's own counter. Kept alongside
        // `completed` rather than assumed equal to it: they diverge when a
        // referred account is deleted after paying out, and a mismatch is worth
        // being able to see instead of silently reconciling.
        monthsEarned: user.referralCount || 0,
        ...benefitFor(user),
      };
    });

    return res.status(200).json({ data, pagination: pagingMeta(totalRecords, paging) });
  } catch (error) {
    console.error("admin/referrals list failed:", error);
    return res.status(500).json({ message: "Could not load referrals", error: error.message });
  }
});

/* ═════════════════════════════════ FUNNEL ═════════════════════════════════ */

// GET /admin/referrals/stats
router.get("/stats", async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      linksCreated, activeReferrers, signups, completed,
      activeBenefit, recentSignups, monthsGranted,
    ] = await Promise.all([
      User.countDocuments({ referralCode: { $nin: [null, ""] } }),
      // Distinct referrers with at least one signup — the denominator that
      // matters, since "links created" is essentially the user count.
      User.distinct("referredBy", { referredBy: { $ne: null } }).then((ids) => ids.length),
      User.countDocuments({ referredBy: { $ne: null } }),
      User.countDocuments({ referredBy: { $ne: null }, referralCreditedAt: { $ne: null } }),
      User.countDocuments({ referralMatchingUntil: { $gt: now } }),
      User.countDocuments({ referredBy: { $ne: null }, createdAt: { $gte: thirtyDaysAgo } }),
      User.aggregate([
        { $match: { referralCount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: "$referralCount" } } },
      ]),
    ]);

    return res.status(200).json({
      data: {
        linksCreated,
        activeReferrers,
        signups,
        completed,
        pending: Math.max(0, signups - completed),
        // The number that says whether the scheme works. A referral that never
        // completes costs a month of nobody's time and grants nothing, so the
        // signup count on its own overstates the programme substantially.
        completionRate: signups > 0 ? Math.round((completed / signups) * 100) : null,
        monthsGranted: monthsGranted[0]?.total || 0,
        // Caregivers currently matching for free off referrals.
        activeBenefit,
        signupsLast30Days: recentSignups,
      },
    });
  } catch (error) {
    console.error("admin/referrals stats failed:", error);
    return res.status(500).json({ message: "Could not load referral stats", error: error.message });
  }
});

/* ═════════════════════════════════ SIGNUPS ════════════════════════════════ */

// GET /admin/referrals/signups?status=pending|completed&search=&page=&limit=
//
// One row per person who joined through somebody's link — the other side of the
// same funnel. Answers "who came in through referrals and did they stick",
// which the referrer-shaped view above cannot: there, ten signups from one
// person are a single number.
router.get("/signups", async (req, res) => {
  try {
    const paging = parsePaging(req.query);
    const { status, search } = req.query;

    const query = { referredBy: { $ne: null } };

    if (status === "pending") query.referralCreditedAt = null;
    if (status === "completed") query.referralCreditedAt = { $ne: null };

    if (search) {
      const term = new RegExp(escapeRegex(String(search).trim()), "i");
      query.$or = [{ name: term }, { email: term }];
    }

    const [rows, totalRecords] = await Promise.all([
      User.find(query)
        .select("name email type status createdAt referredBy referralCreditedAt")
        .populate("referredBy", "name email referralCode referralCodeCreatedAt")
        .sort({ createdAt: -1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .lean(),
      User.countDocuments(query),
    ]);

    const data = rows.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      type: user.type,
      status: user.status,

      // When they joined through the link.
      joinedAt: user.createdAt,
      // When they finished their profile and the referrer's month was granted.
      // Null while still pending — the referral exists but has paid nothing.
      completedAt: user.referralCreditedAt || null,
      credited: Boolean(user.referralCreditedAt),

      referrer: user.referredBy
        ? {
            _id: user.referredBy._id,
            name: user.referredBy.name,
            email: user.referredBy.email,
            code: user.referredBy.referralCode || null,
            linkCreatedAt: user.referredBy.referralCodeCreatedAt || null,
          }
        // The referrer's account was deleted after the referral was made. The
        // row is kept rather than filtered out: the signup genuinely happened,
        // and dropping it would quietly change the funnel's denominator.
        : null,

      // How long they took to complete. The lag that decides whether "pending"
      // means "still onboarding" or "never coming back".
      daysToComplete: user.referralCreditedAt
        ? Math.max(
            0,
            Math.round(
              (new Date(user.referralCreditedAt) - new Date(user.createdAt)) /
                (24 * 60 * 60 * 1000)
            )
          )
        : null,
    }));

    return res.status(200).json({ data, pagination: pagingMeta(totalRecords, paging) });
  } catch (error) {
    console.error("admin/referrals signups failed:", error);
    return res.status(500).json({ message: "Could not load referral signups", error: error.message });
  }
});

/* ══════════════════════════════ ONE REFERRER ══════════════════════════════ */

// GET /admin/referrals/:userId — one referrer's link, benefit and every person
// who joined through them. What an admin opens when a caregiver writes in
// asking why their free matching stopped.
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(userId).select(PARTY_FIELDS).lean();
    if (!user) return res.status(404).json({ message: "Account not found" });

    const referred = await User.find({ referredBy: userId })
      .select("name email type status createdAt referralCreditedAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      data: {
        referrer: {
          _id: user._id,
          name: user.name,
          email: user.email,
          type: user.type,
          status: user.status,
          code: user.referralCode || null,
          link: referralLinkFor(user.referralCode),
          linkCreatedAt: user.referralCodeCreatedAt || null,
          monthsEarned: user.referralCount || 0,
          ...benefitFor(user),
        },
        referred: referred.map((r) => ({
          _id: r._id,
          name: r.name,
          email: r.email,
          type: r.type,
          status: r.status,
          joinedAt: r.createdAt,
          completedAt: r.referralCreditedAt || null,
          credited: Boolean(r.referralCreditedAt),
        })),
      },
    });
  } catch (error) {
    console.error("admin/referrals detail failed:", error);
    return res.status(500).json({ message: "Could not load the referrer", error: error.message });
  }
});

export default router;
