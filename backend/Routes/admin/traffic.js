import express from "express";

import PageView from "../../Schema/pageView.js";
import TrafficDaily from "../../Schema/trafficDaily.js";

import { adminOnly } from "../../Services/utils/adminAuth.js";

const router = express.Router();
router.use(adminOnly);

const DAY_MS = 24 * 60 * 60 * 1000;
const ago = (days) => new Date(Date.now() - days * DAY_MS);

// Website traffic and page-usage reporting, over Schema/pageView.js.
//
// Two caveats that the responses repeat rather than hide, because a dashboard
// that quietly reports a wrong number is worse than one that reports none:
//
//  1. UNIQUE VISITORS ARE PER DAY. The visitor hash is salted with a daily
//     rotating value (Services/utils/analytics.js) so that a stored row cannot
//     be linked to a person across days. That is a deliberate privacy property
//     and its cost is that "unique visitors this month" is not computable —
//     what is reported is the sum of daily uniques, which double-counts anyone
//     who returns. Every response naming that figure says so.
//
//  2. DURATION AND BOUNCE ONLY COVER MEASURED SESSIONS. A view whose duration
//     never arrived (the tab was closed mid-request, the beacon was blocked)
//     has `durationSec: null`. Those are excluded rather than counted as zero —
//     treating them as instant departures is what makes a bounce rate read 90%
//     on a site that doesn't have one.

/* ═════════════════════════════ OVERVIEW ═══════════════════════════════════ */

// GET /admin/traffic/overview?days=30
router.get("/overview", async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 30));
    const since = ago(days);
    const prevSince = ago(days * 2);

    const [totals, prevTotals, sources, devices, sessionStats] = await Promise.all([
      PageView.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: null,
            visits: { $sum: 1 },
            visitors: { $addToSet: "$visitorId" },
            sessions: { $addToSet: "$sessionId" },
          },
        },
      ]),
      PageView.aggregate([
        { $match: { createdAt: { $gte: prevSince, $lt: since } } },
        { $group: { _id: null, visits: { $sum: 1 }, sessions: { $addToSet: "$sessionId" } } },
      ]),
      PageView.aggregate([
        { $match: { createdAt: { $gte: since }, isEntry: true } },
        { $group: { _id: "$source", visits: { $sum: 1 } } },
        { $sort: { visits: -1 } },
      ]),
      PageView.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: "$device", visits: { $sum: 1 } } },
      ]),
      // Session-level stats: roll views up per session first, then average.
      // Averaging per-view durations instead would weight a session with twenty
      // pages twenty times as heavily as one with a single page.
      PageView.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: "$sessionId",
            pageViews: { $sum: 1 },
            duration: { $sum: { $ifNull: ["$durationSec", 0] } },
            measured: { $sum: { $cond: [{ $ne: ["$durationSec", null] }, 1, 0] } },
          },
        },
        {
          $group: {
            _id: null,
            sessions: { $sum: 1 },
            // A session with exactly one page view. The standard definition,
            // and the reason `isEntry`/`isExit` exist on the schema.
            bounces: { $sum: { $cond: [{ $eq: ["$pageViews", 1] }, 1, 0] } },
            totalDuration: { $sum: "$duration" },
            measuredSessions: { $sum: { $cond: [{ $gt: ["$measured", 0] }, 1, 0] } },
            totalPageViews: { $sum: "$pageViews" },
          },
        },
      ]),
    ]);

    const now = totals[0] || {};
    const prev = prevTotals[0] || {};
    const s = sessionStats[0] || {};

    const change = (current, previous) => {
      if (!previous) return current > 0 ? null : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const sourceTotal = sources.reduce((sum, x) => sum + x.visits, 0);

    return res.status(200).json({
      data: {
        windowDays: days,
        visits: now.visits || 0,
        visitsChangePct: change(now.visits || 0, prev.visits || 0),

        // Distinct hashes in the window. Because the salt rotates daily, a
        // returning visitor produces a different hash each day and is counted
        // again — so for any window longer than one day this is an upper bound,
        // not a true unique count.
        uniqueVisitors: (now.visitors || []).length,
        uniqueVisitorsNote:
          days > 1
            ? "Counted per day — a returning visitor is counted once per day they visit."
            : null,

        sessions: (now.sessions || []).length,
        sessionsChangePct: change((now.sessions || []).length, (prev.sessions || []).length),

        pagesPerSession: s.sessions
          ? Math.round((s.totalPageViews / s.sessions) * 10) / 10
          : 0,

        avgSessionDurationSec: s.measuredSessions
          ? Math.round(s.totalDuration / s.measuredSessions)
          : null,
        durationSample: s.measuredSessions || 0,

        bounceRate: s.sessions ? Math.round((s.bounces / s.sessions) * 100) : 0,

        sources: sources.map((x) => ({
          source: x._id || "direct",
          visits: x.visits,
          pct: sourceTotal ? Math.round((x.visits / sourceTotal) * 100) : 0,
        })),

        devices: devices.map((d) => ({ device: d._id || "unknown", visits: d.visits })),
      },
    });
  } catch (error) {
    console.error("admin/traffic overview failed:", error);
    return res.status(500).json({ message: "Could not load traffic", error: error.message });
  }
});

/* ═══════════════════════════════ TREND ════════════════════════════════════ */

// GET /admin/traffic/trend?days=90
//
// Reads the nightly rollup, falling back to raw views for the recent days the
// rollup hasn't covered yet. Raw views are deleted after 180 days by a TTL
// index, so anything older than that can ONLY come from the rollup.
router.get("/trend", async (req, res) => {
  try {
    const days = Math.min(730, Math.max(7, parseInt(req.query.days, 10) || 90));
    const since = ago(days);

    const rolled = await TrafficDaily.find({ date: { $gte: since } })
      .sort({ date: 1 })
      .lean();

    const covered = new Set(rolled.map((r) => r.date.toISOString().slice(0, 10)));

    // Today and any other day the rollup hasn't processed.
    const live = await PageView.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          visits: { $sum: 1 },
          visitors: { $addToSet: "$visitorId" },
          sessions: { $addToSet: "$sessionId" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const series = [
      ...rolled.map((r) => ({
        date: r.date.toISOString().slice(0, 10),
        visits: r.visits,
        uniqueVisitors: r.uniqueVisitors,
        sessions: r.sessions,
        bounceRate: r.sessions ? Math.round((r.bounces / r.sessions) * 100) : 0,
        avgDurationSec: r.measuredSessions
          ? Math.round(r.totalDurationSec / r.measuredSessions)
          : null,
        newSignups: r.newSignups,
        source: "rollup",
      })),
      ...live
        .filter((l) => !covered.has(l._id))
        .map((l) => ({
          date: l._id,
          visits: l.visits,
          uniqueVisitors: l.visitors.length,
          sessions: l.sessions.length,
          bounceRate: null,
          avgDurationSec: null,
          newSignups: 0,
          source: "live",
        })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    return res.status(200).json({ data: { series, windowDays: days } });
  } catch (error) {
    console.error("admin/traffic trend failed:", error);
    return res.status(500).json({ message: "Could not load the trend", error: error.message });
  }
});

/* ══════════════════════════════ PAGE USAGE ════════════════════════════════ */

// GET /admin/traffic/pages?days=30&limit=50
//
// Which pages people visit, how long they stay, what they click, and where they
// leave. `exitRate` is the drop-off signal: a high exit rate on a checkout step
// is a problem, the same number on the contact page is the page working.
router.get("/pages", async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 30));
    const limit = Math.min(200, Math.max(5, parseInt(req.query.limit, 10) || 50));
    const since = ago(days);

    const pages = await PageView.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: "$path",
          title: { $first: "$title" },
          views: { $sum: 1 },
          uniqueSessions: { $addToSet: "$sessionId" },
          // Only measured views contribute to the average — see the note at the
          // top of this file.
          totalDuration: { $sum: { $ifNull: ["$durationSec", 0] } },
          measured: { $sum: { $cond: [{ $ne: ["$durationSec", null] }, 1, 0] } },
          clicks: { $sum: "$clicks" },
          avgScroll: { $avg: "$maxScrollPct" },
          entries: { $sum: { $cond: ["$isEntry", 1, 0] } },
          exits: { $sum: { $cond: ["$isExit", 1, 0] } },
        },
      },
      { $sort: { views: -1 } },
      { $limit: limit },
    ]);

    return res.status(200).json({
      data: pages.map((p) => ({
        path: p._id,
        title: p.title || null,
        views: p.views,
        uniqueSessions: p.uniqueSessions.length,
        avgDurationSec: p.measured ? Math.round(p.totalDuration / p.measured) : null,
        durationSample: p.measured,
        clicks: p.clicks,
        clicksPerView: p.views ? Math.round((p.clicks / p.views) * 100) / 100 : 0,
        avgScrollPct: Math.round(p.avgScroll || 0),
        entries: p.entries,
        exits: p.exits,
        // Of the people who saw this page, how many left the site from it.
        exitRate: p.views ? Math.round((p.exits / p.views) * 100) : 0,
      })),
      windowDays: days,
    });
  } catch (error) {
    console.error("admin/traffic pages failed:", error);
    return res.status(500).json({ message: "Could not load page usage", error: error.message });
  }
});

// GET /admin/traffic/referrers?days=30 — where referral traffic comes from.
router.get("/referrers", async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 30));
    const since = ago(days);

    const [referrers, campaigns] = await Promise.all([
      PageView.aggregate([
        { $match: { createdAt: { $gte: since }, referrerHost: { $nin: [null, ""] }, isEntry: true } },
        {
          $group: {
            _id: "$referrerHost",
            visits: { $sum: 1 },
            sessions: { $addToSet: "$sessionId" },
            source: { $first: "$source" },
          },
        },
        { $sort: { visits: -1 } },
        { $limit: 50 },
      ]),
      PageView.aggregate([
        { $match: { createdAt: { $gte: since }, "campaign.source": { $ne: null } } },
        {
          $group: {
            _id: { source: "$campaign.source", medium: "$campaign.medium", name: "$campaign.name" },
            visits: { $sum: 1 },
            sessions: { $addToSet: "$sessionId" },
          },
        },
        { $sort: { visits: -1 } },
        { $limit: 50 },
      ]),
    ]);

    return res.status(200).json({
      data: {
        referrers: referrers.map((r) => ({
          host: r._id, visits: r.visits, sessions: r.sessions.length, source: r.source,
        })),
        campaigns: campaigns.map((c) => ({
          source: c._id.source, medium: c._id.medium, name: c._id.name,
          visits: c.visits, sessions: c.sessions.length,
        })),
      },
    });
  } catch (error) {
    console.error("admin/traffic referrers failed:", error);
    return res.status(500).json({ message: "Could not load referrers", error: error.message });
  }
});

/* ═════════════════════════════ ROLLUP TRIGGER ═════════════════════════════ */

// POST /admin/traffic/rollup   { date? }
//
// Runs the daily rollup by hand. Normally the cron does it; this exists so a
// missed night can be recovered without waiting a day. Idempotent — the upsert
// is keyed on the date, so re-running corrects a day rather than doubling it.
router.post("/rollup", async (req, res) => {
  try {
    const { rollupDay } = await import("../../Services/cron/trafficRollup.js");
    const target = req.body?.date ? new Date(req.body.date) : new Date(Date.now() - DAY_MS);
    const result = await rollupDay(target);
    return res.status(200).json({ message: "Rollup complete.", data: result });
  } catch (error) {
    console.error("admin/traffic rollup failed:", error);
    return res.status(500).json({ message: "Rollup failed", error: error.message });
  }
});

export default router;
