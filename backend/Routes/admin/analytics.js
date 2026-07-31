import express from "express";

import User from "../../Schema/user.js";
import MatchRequest from "../../Schema/matchRequest.js";
import Message from "../../Schema/message.js";
import nannyProfile from "../../Schema/nannyProfile.js";
import WaitlistEntry from "../../Schema/waitlistEntry.js";
import Report from "../../Schema/report.js";
import Feedback from "../../Schema/feedback.js";

import { adminOnly } from "../../Services/utils/adminAuth.js";
import { scoreProfile, completenessBucket } from "../../Services/utils/profileCompleteness.js";

const router = express.Router();
router.use(adminOnly);

const DAY_MS = 24 * 60 * 60 * 1000;
const ago = (days) => new Date(Date.now() - days * DAY_MS);

// The at-a-glance platform dashboard, plus the profile-completeness monitor.

/* ═════════════════════════════ OVERVIEW ═══════════════════════════════════ */

// GET /admin/analytics/overview
router.get("/overview", async (req, res) => {
  try {
    const weekAgo = ago(7);
    const monthAgo = ago(30);
    const prevWeek = ago(14);
    const prevMonth = ago(60);

    const members = { status: { $ne: "Deleted" }, type: { $in: ["Parents", "Nanny"] } };

    const [
      totalUsers, families, caregivers,
      newThisWeek, newLastWeek, newThisMonth, newPrevMonth,
      activeMatches, totalRequests, acceptedRequests,
      premiumUsers, waitlistTotal, waitlistPending,
      openReports, openFeedback, messagesThisWeek, profilesComplete,
    ] = await Promise.all([
      User.countDocuments(members),
      User.countDocuments({ ...members, type: "Parents" }),
      User.countDocuments({ ...members, type: "Nanny" }),
      User.countDocuments({ ...members, createdAt: { $gte: weekAgo } }),
      // The week before this one, so the headline can show a real trend rather
      // than a bare count that means nothing on its own.
      User.countDocuments({ ...members, createdAt: { $gte: prevWeek, $lt: weekAgo } }),
      User.countDocuments({ ...members, createdAt: { $gte: monthAgo } }),
      User.countDocuments({ ...members, createdAt: { $gte: prevMonth, $lt: monthAgo } }),
      MatchRequest.countDocuments({ status: "accepted" }),
      MatchRequest.countDocuments({}),
      MatchRequest.countDocuments({ status: "accepted" }),
      User.countDocuments({ ...members, premium: true }),
      WaitlistEntry.countDocuments({}),
      WaitlistEntry.countDocuments({ notifyConsent: true, launchNotifiedAt: null }),
      Report.countDocuments({ status: { $ne: "resolved" } }),
      Feedback.countDocuments({ status: { $in: ["new", "in_progress"] } }),
      Message.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments({ ...members, nannyProfileCompleted: true }),
    ]);

    // Percentage change, guarding the zero-denominator case. Growing from 0 to
    // 5 is reported as null rather than "+500%", which is a number that means
    // nothing and looks like a metric.
    const change = (current, previous) => {
      if (!previous) return current > 0 ? null : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return res.status(200).json({
      data: {
        users: {
          total: totalUsers,
          families,
          caregivers,
          newThisWeek,
          newThisMonth,
          weekOverWeekPct: change(newThisWeek, newLastWeek),
          monthOverMonthPct: change(newThisMonth, newPrevMonth),
        },
        matches: {
          activeMatches,
          totalRequests,
          // Of everything ever sent, the share that became a connection. The
          // headline "is this marketplace working" number.
          successRate: totalRequests ? Math.round((acceptedRequests / totalRequests) * 100) : 0,
        },
        subscriptions: {
          premiumUsers,
          conversionRate: totalUsers ? Math.round((premiumUsers / totalUsers) * 100) : 0,
        },
        waitlist: { total: waitlistTotal, awaitingNotification: waitlistPending },
        engagement: {
          messagesThisWeek,
          profilesComplete,
          profileCompletionRate: totalUsers ? Math.round((profilesComplete / totalUsers) * 100) : 0,
        },
        // The two queues with work in them. Surfaced on the front page because
        // an unread harassment report is the one thing here that shouldn't wait
        // for someone to go looking.
        needsAttention: { openReports, openFeedback },
      },
    });
  } catch (error) {
    console.error("admin/analytics overview failed:", error);
    return res.status(500).json({ message: "Could not load the dashboard", error: error.message });
  }
});

/* ═════════════════════════════ GROWTH TREND ═══════════════════════════════ */

// GET /admin/analytics/growth?days=90
router.get("/growth", async (req, res) => {
  try {
    const days = Math.min(365, Math.max(7, parseInt(req.query.days, 10) || 90));
    const since = ago(days);

    const [signups, matches] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: since }, type: { $in: ["Parents", "Nanny"] } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: 1 },
            families: { $sum: { $cond: [{ $eq: ["$type", "Parents"] }, 1, 0] } },
            caregivers: { $sum: { $cond: [{ $eq: ["$type", "Nanny"] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      MatchRequest.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            requests: { $sum: 1 },
            accepted: { $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Days with no signups are absent from an aggregation, and a chart that
    // simply skips them draws a straight line across a quiet week — which reads
    // as steady growth rather than as nothing happening. Fill the gaps.
    const byDate = new Map(signups.map((s) => [s._id, s]));
    const matchByDate = new Map(matches.map((m) => [m._id, m]));

    const series = [];
    let cumulative = await User.countDocuments({
      createdAt: { $lt: since },
      type: { $in: ["Parents", "Nanny"] },
    });

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10);
      const signup = byDate.get(date);
      const match = matchByDate.get(date);
      cumulative += signup?.total || 0;
      series.push({
        date,
        signups: signup?.total || 0,
        families: signup?.families || 0,
        caregivers: signup?.caregivers || 0,
        totalUsers: cumulative,
        matchRequests: match?.requests || 0,
        matchesAccepted: match?.accepted || 0,
      });
    }

    return res.status(200).json({ data: { series, windowDays: days } });
  } catch (error) {
    console.error("admin/analytics growth failed:", error);
    return res.status(500).json({ message: "Could not load growth data", error: error.message });
  }
});

/* ══════════════════════ PROFILE COMPLETENESS MONITOR ══════════════════════ */

// GET /admin/analytics/completeness?limit=500
//
// The distribution, plus the specific people worth chasing.
//
// Scored in application code rather than by an aggregation because the rules
// live in Services/utils/profileCompleteness.js and differ by role — expressing
// them twice, once in JS and once in a pipeline, guarantees the two answers
// eventually disagree. The cost is that this reads a bounded slice of users
// rather than the whole table, which the response states.
router.get("/completeness", async (req, res) => {
  try {
    const limit = Math.min(5000, Math.max(50, parseInt(req.query.limit, 10) || 1000));

    const users = await User.find({
      status: { $ne: "Deleted" },
      type: { $in: ["Parents", "Nanny"] },
    })
      .select("_id name email type createdAt imageUrl aboutMe location verified lastLogin nannyProfileCompleted")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const profiles = await nannyProfile
      .find({ userId: { $in: users.map((u) => u._id) } })
      .lean();
    const byUser = new Map(profiles.map((p) => [String(p.userId), p]));

    const buckets = { complete: 0, almost: 0, partial: 0, "barely-started": 0 };
    // How often each individual field is the missing one. This is the actionable
    // output: "412 people have no photo" points at a product fix, where a list
    // of 412 individuals to email does not.
    const missingCounts = new Map();
    const incomplete = [];
    let totalPercent = 0;

    for (const user of users) {
      const score = scoreProfile(user, byUser.get(String(user._id)));
      buckets[completenessBucket(score.percent)] += 1;
      totalPercent += score.percent;

      for (const field of score.missing) {
        missingCounts.set(field, (missingCounts.get(field) || 0) + 1);
      }

      if (score.percent < 100) {
        incomplete.push({
          _id: user._id, name: user.name, email: user.email, type: user.type,
          createdAt: user.createdAt, lastLogin: user.lastLogin,
          percent: score.percent, missing: score.missing,
        });
      }
    }

    incomplete.sort((a, b) => b.percent - a.percent);

    return res.status(200).json({
      data: {
        scanned: users.length,
        scanLimited: users.length >= limit,
        averagePercent: users.length ? Math.round(totalPercent / users.length) : 0,
        buckets,
        commonlyMissing: [...missingCounts.entries()]
          .map(([field, count]) => ({
            field,
            count,
            pct: users.length ? Math.round((count / users.length) * 100) : 0,
          }))
          .sort((a, b) => b.count - a.count),
        // Nearest to done first — the cheapest people to convert with a nudge.
        incomplete: incomplete.slice(0, 200),
      },
    });
  } catch (error) {
    console.error("admin/analytics completeness failed:", error);
    return res.status(500).json({ message: "Could not load completeness", error: error.message });
  }
});

export default router;
