import express from "express";
import mongoose from "mongoose";

import User from "../../Schema/user.js";
import MatchRequest from "../../Schema/matchRequest.js";
import Message from "../../Schema/message.js";
import Report from "../../Schema/report.js";
import PageView from "../../Schema/pageView.js";

import { adminOnly, parsePaging, pagingMeta } from "../../Services/utils/adminAuth.js";

const router = express.Router();
router.use(adminOnly);

const DAY_MS = 24 * 60 * 60 * 1000;
const ago = (days) => new Date(Date.now() - days * DAY_MS);

// User activity tracking: who is engaged, who has gone quiet, and who looks
// wrong.
//
// The per-user numbers are on the user detail endpoint; this file is the
// aggregate view — the distribution, the lists an admin acts on, and the
// suspicious-signal scan.

/* ═════════════════════════════ OVERVIEW ═══════════════════════════════════ */

// GET /admin/activity/overview
router.get("/overview", async (req, res) => {
  try {
    const notDeleted = { status: { $ne: "Deleted" }, type: { $ne: "Admin" } };

    const [buckets, totals, profileStats] = await Promise.all([
      // One pass over the collection producing every activity bucket, rather
      // than five countDocuments round trips that can also disagree with each
      // other if a login lands between them.
      User.aggregate([
        { $match: notDeleted },
        {
          $group: {
            _id: null,
            active7: { $sum: { $cond: [{ $gte: ["$lastLogin", ago(7)] }, 1, 0] } },
            active30: { $sum: { $cond: [{ $gte: ["$lastLogin", ago(30)] }, 1, 0] } },
            lapsed: {
              $sum: {
                $cond: [
                  { $and: [{ $gte: ["$lastLogin", ago(90)] }, { $lt: ["$lastLogin", ago(30)] }] },
                  1, 0,
                ],
              },
            },
            inactive: {
              $sum: {
                $cond: [
                  { $and: [{ $ne: ["$lastLogin", null] }, { $lt: ["$lastLogin", ago(90)] }] },
                  1, 0,
                ],
              },
            },
            // Accounts predating the lastLogin field. Reported separately
            // rather than folded into "inactive": we genuinely don't know, and
            // calling them inactive would put long-standing members on a churn
            // list they may not belong on.
            neverRecorded: { $sum: { $cond: [{ $eq: ["$lastLogin", null] }, 1, 0] } },
            totalLogins: { $sum: "$loginCount" },
            total: { $sum: 1 },
          },
        },
      ]),
      User.countDocuments(notDeleted),
      User.aggregate([
        { $match: notDeleted },
        {
          $group: {
            _id: null,
            profileComplete: { $sum: { $cond: ["$nannyProfileCompleted", 1, 0] } },
            onboardingComplete: { $sum: { $cond: ["$onboarding.completed", 1, 0] } },
            flagged: { $sum: { $cond: [{ $ne: ["$suspiciousFlaggedAt", null] }, 1, 0] } },
            suspended: { $sum: { $cond: [{ $eq: ["$status", "Suspended"] }, 1, 0] } },
            blocked: { $sum: { $cond: [{ $eq: ["$status", "Block"] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const b = buckets[0] || {};
    const p = profileStats[0] || {};

    return res.status(200).json({
      data: {
        totalUsers: totals,
        activity: {
          activeLast7Days: b.active7 || 0,
          activeLast30Days: b.active30 || 0,
          lapsed30to90Days: b.lapsed || 0,
          inactiveOver90Days: b.inactive || 0,
          neverRecorded: b.neverRecorded || 0,
          // Logins per user, over the lifetime of the account. A blunt number,
          // but it is the one that moves when the product gets stickier.
          avgLoginsPerUser: totals ? Math.round(((b.totalLogins || 0) / totals) * 10) / 10 : 0,
        },
        profiles: {
          completed: p.profileComplete || 0,
          onboardingCompleted: p.onboardingComplete || 0,
          completionRate: totals ? Math.round(((p.profileComplete || 0) / totals) * 100) : 0,
        },
        moderation: {
          flaggedSuspicious: p.flagged || 0,
          suspended: p.suspended || 0,
          blocked: p.blocked || 0,
        },
      },
    });
  } catch (error) {
    console.error("admin/activity overview failed:", error);
    return res.status(500).json({ message: "Could not load activity", error: error.message });
  }
});

/* ═════════════════════════════ SESSIONS ═══════════════════════════════════ */

// GET /admin/activity/sessions/:userId
//
// Session frequency for one user, from the analytics beacons their signed-in
// visits produced. Distinct from `loginCount`, which counts authentications: a
// user who stays signed in for a month has one login and thirty sessions, and
// the second number is the one that describes engagement.
//
// Empty for anyone who was only ever active before analytics shipped, and the
// response says so rather than reporting zero as if they never visited.
router.get("/sessions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 90));
    const since = ago(days);

    // An aggregation pipeline gets no schema casting, unlike find() — the id
    // has to be a real ObjectId or the $match silently returns nothing.
    const oid = new mongoose.Types.ObjectId(String(userId));

    const sessions = await PageView.aggregate([
      { $match: { userId: oid, createdAt: { $gte: since } } },
      {
        $group: {
          _id: "$sessionId",
          startedAt: { $min: "$createdAt" },
          endedAt: { $max: "$createdAt" },
          pageViews: { $sum: 1 },
          durationSec: { $sum: { $ifNull: ["$durationSec", 0] } },
        },
      },
      { $sort: { startedAt: -1 } },
      { $limit: 200 },
    ]);

    const totalDuration = sessions.reduce((sum, s) => sum + (s.durationSec || 0), 0);
    const weeks = Math.max(1, days / 7);

    return res.status(200).json({
      data: {
        sessions,
        summary: {
          sessionCount: sessions.length,
          sessionsPerWeek: Math.round((sessions.length / weeks) * 10) / 10,
          avgDurationSec: sessions.length ? Math.round(totalDuration / sessions.length) : 0,
          avgPagesPerSession: sessions.length
            ? Math.round((sessions.reduce((s, x) => s + x.pageViews, 0) / sessions.length) * 10) / 10
            : 0,
          windowDays: days,
          // Analytics only started recording when the beacon shipped, so an
          // empty result is ambiguous. Say which it is.
          hasData: sessions.length > 0,
        },
      },
    });
  } catch (error) {
    console.error("admin/activity sessions failed:", error);
    return res.status(500).json({ message: "Could not load sessions", error: error.message });
  }
});

/* ══════════════════════════ SUSPICIOUS SIGNALS ════════════════════════════ */

// GET /admin/activity/suspicious
//
// Accounts worth a human look. Every signal here is circumstantial — none of
// them means someone is acting in bad faith, and the endpoint is careful to
// return REASONS rather than a verdict, so the admin decides.
//
// The signals, and why each one is on the list:
//
//   never_logged_in_after_signup — a real signup that never came back. Usually
//       a broken funnel rather than a bad actor, and worth knowing either way.
//   high_outbound_no_replies     — sent many match requests, none accepted. The
//       shape of someone spraying every profile on the platform.
//   rapid_messaging              — a burst of messages far above normal use.
//   already_reported             — has an open report against them.
//   unverified_but_active        — using the product heavily without ever
//       confirming an email address.
router.get("/suspicious", async (req, res) => {
  try {
    const paging = parsePaging(req.query);

    const candidates = await User.find({
      status: { $nin: ["Deleted"] },
      type: { $ne: "Admin" },
    })
      .select(
        "_id name email type createdAt lastLogin loginCount verified " +
          "matchRequestsSent suspiciousFlaggedAt suspiciousReason status"
      )
      .sort({ createdAt: -1 })
      .limit(2000)
      .lean();

    const ids = candidates.map((u) => u._id);

    // Three grouped queries over the whole candidate set, then joined in
    // memory. The per-user alternative is 2,000 round trips.
    const [sent, accepted, recentMessages, openReports] = await Promise.all([
      MatchRequest.aggregate([
        { $match: { senderId: { $in: ids } } },
        { $group: { _id: "$senderId", count: { $sum: 1 } } },
      ]),
      MatchRequest.aggregate([
        { $match: { senderId: { $in: ids }, status: "accepted" } },
        { $group: { _id: "$senderId", count: { $sum: 1 } } },
      ]),
      Message.aggregate([
        { $match: { sender: { $in: ids }, createdAt: { $gte: ago(7) } } },
        { $group: { _id: "$sender", count: { $sum: 1 } } },
      ]),
      Report.aggregate([
        { $match: { reportedUserId: { $in: ids }, status: { $ne: "resolved" } } },
        { $group: { _id: "$reportedUserId", count: { $sum: 1 } } },
      ]),
    ]);

    const toMap = (rows) => new Map(rows.map((r) => [String(r._id), r.count]));
    const sentMap = toMap(sent);
    const acceptedMap = toMap(accepted);
    const messageMap = toMap(recentMessages);
    const reportMap = toMap(openReports);

    const flagged = [];

    for (const user of candidates) {
      const key = String(user._id);
      const reasons = [];

      const sentCount = sentMap.get(key) || 0;
      const acceptedCount = acceptedMap.get(key) || 0;
      const messageCount = messageMap.get(key) || 0;
      const reportCount = reportMap.get(key) || 0;

      if (reportCount > 0) {
        reasons.push({
          code: "already_reported",
          detail: `${reportCount} open report${reportCount === 1 ? "" : "s"}`,
          weight: 40,
        });
      }

      // Ten is a deliberately high bar. Sending a handful of requests that go
      // unanswered is the ordinary experience of a new member on a small
      // platform, and flagging that would bury the real signal.
      if (sentCount >= 10 && acceptedCount === 0) {
        reasons.push({
          code: "high_outbound_no_replies",
          detail: `${sentCount} requests sent, none accepted`,
          weight: 25,
        });
      }

      if (messageCount >= 100) {
        reasons.push({
          code: "rapid_messaging",
          detail: `${messageCount} messages in the last 7 days`,
          weight: 20,
        });
      }

      if (!user.verified?.emailVer && (user.loginCount || 0) >= 5) {
        reasons.push({
          code: "unverified_but_active",
          detail: `${user.loginCount} logins, email never verified`,
          weight: 15,
        });
      }

      // Only counts once the account has had a fair chance to come back.
      const ageDays = user.createdAt ? (Date.now() - new Date(user.createdAt).getTime()) / DAY_MS : 0;
      if (!user.lastLogin && ageDays > 7) {
        reasons.push({
          code: "never_logged_in_after_signup",
          detail: `Signed up ${Math.round(ageDays)} days ago, never returned`,
          weight: 5,
        });
      }

      if (reasons.length) {
        flagged.push({
          user: {
            _id: user._id, name: user.name, email: user.email,
            type: user.type, status: user.status, createdAt: user.createdAt,
            lastLogin: user.lastLogin,
          },
          reasons,
          // A sort key, not a probability. Named "score" and never rendered as
          // a percentage, because presenting a heuristic as a confidence level
          // is how a circumstantial signal turns into an account ban.
          score: reasons.reduce((sum, r) => sum + r.weight, 0),
          alreadyFlagged: Boolean(user.suspiciousFlaggedAt),
        });
      }
    }

    flagged.sort((a, b) => b.score - a.score);

    const pageRows = flagged.slice(paging.skip, paging.skip + paging.limit);

    return res.status(200).json({
      data: pageRows,
      pagination: pagingMeta(flagged.length, paging),
      // The scan covers the 2,000 most recent accounts rather than the whole
      // table. Said out loud so the console can show it instead of implying
      // the list is exhaustive.
      scanned: candidates.length,
      scanLimited: candidates.length >= 2000,
    });
  } catch (error) {
    console.error("admin/activity suspicious failed:", error);
    return res.status(500).json({ message: "Could not run the scan", error: error.message });
  }
});

export default router;
