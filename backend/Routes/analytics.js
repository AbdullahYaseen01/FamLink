import express from "express";
import jwt from "jsonwebtoken";

import PageView from "../Schema/pageView.js";
import { rateLimit } from "../Services/utils/rateLimit.js";
import {
  visitorIdFor,
  normalizePath,
  referrerHostOf,
  classifySource,
  parseCampaign,
  deviceFrom,
  isBot,
} from "../Services/utils/analytics.js";

const router = express.Router();

// The public analytics beacon. Everything the traffic and page-usage screens
// report enters the system here.
//
// PUBLIC AND UNAUTHENTICATED, which makes it a write endpoint any script can
// reach. Three things keep that from being a problem:
//
//   * A rate limit, because the alternative is one loop filling the largest
//     collection in the database overnight.
//   * Every field is validated and length-capped here rather than trusted —
//     `path`, `title` and the utm values all end up in grouped aggregations,
//     and an unbounded string in a $group key is a memory problem.
//   * Bots are dropped rather than stored. Facebook fetches every share link
//     before attaching it to a post; counting those would make a link nobody
//     clicked look like the most popular page on the site.
//
// Auth is read opportunistically: a beacon carrying a valid token records the
// user id so per-user session history works, and one without is anonymous. It
// is never REQUIRED — most traffic is logged out, and that is the traffic the
// marketing screens exist to measure.

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Verifies the token if there is one, ignores it entirely if it is missing or
// bad. A beacon must never fail because a session expired — the visit still
// happened.
const optionalUserId = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET).userId || null;
  } catch {
    return null;
  }
};

// 300 beacons per 5 minutes per IP. Comfortably above a real person browsing
// hard (a page view plus an exit beacon each, so ~2 per page), and far below
// what a script would produce.
const beaconLimit = rateLimit({
  name: "analytics-beacon",
  limit: 300,
  windowSec: 300,
  message: "Too many analytics events.",
});

const str = (value, max) => String(value ?? "").trim().slice(0, max);

// POST /analytics/view
//   { sessionId, path, title?, referrer?, query?, isEntry? }
router.post("/view", beaconLimit, async (req, res) => {
  try {
    const userAgent = req.headers["user-agent"] || "";

    // Answer 204 to bots as well. A crawler that gets an error will retry, and
    // telling it apart from a person by the response is information it doesn't
    // need.
    if (isBot(userAgent)) return res.status(204).end();

    const { sessionId, path, title, referrer, query, isEntry } = req.body || {};

    const session = str(sessionId, 64);
    if (!session || !path) return res.status(204).end();

    const campaign = parseCampaign(query || {});
    const referrerHost = referrerHostOf(referrer);

    const view = await PageView.create({
      sessionId: session,
      visitorId: visitorIdFor(req),
      userId: optionalUserId(req),
      // Query string discarded here — see normalizePath. utm_* was read out
      // above, before that happens.
      path: normalizePath(path),
      title: str(title, 200),
      referrerHost,
      source: classifySource({
        referrerHost,
        campaign,
        selfHost: req.headers.host,
      }),
      campaign,
      device: deviceFrom(userAgent),
      isEntry: isEntry === true,
    });

    // Close off the previous view in this session. `isExit` is a moving target
    // — the last view so far is the exit until another arrives — so it is
    // maintained as views come in rather than computed at read time, which
    // would need a per-session sort on every dashboard load.
    if (isEntry !== true) {
      await PageView.updateMany(
        { sessionId: session, _id: { $ne: view._id }, isExit: true },
        { $set: { isExit: false } }
      );
    }
    await PageView.updateOne({ _id: view._id }, { $set: { isExit: true } });

    // The id goes back so the client can close this view out with a duration
    // when the visitor navigates away.
    return res.status(200).json({ viewId: view._id });
  } catch (error) {
    // Analytics must never surface an error to a visitor. A failed beacon costs
    // one row in a reporting table; a visible error costs trust in the page.
    console.error("analytics beacon failed:", error?.message || error);
    return res.status(204).end();
  }
});

// POST /analytics/close
//   { viewId, durationSec?, clicks?, maxScrollPct? }
//
// Sent by the client as a page unloads (via sendBeacon, which survives the
// navigation). Fills in the numbers that only exist once a view has ended.
router.post("/close", beaconLimit, async (req, res) => {
  try {
    const { viewId, durationSec, clicks, maxScrollPct } = req.body || {};
    if (!viewId) return res.status(204).end();

    const update = {};

    // Capped at four hours. An unload beacon can arrive from a tab left open
    // over a weekend, and a single 200,000-second session would dominate every
    // average it is included in.
    const duration = Number(durationSec);
    if (Number.isFinite(duration) && duration >= 0) {
      update.durationSec = Math.min(Math.round(duration), 4 * 60 * 60);
    }

    const clickCount = Number(clicks);
    if (Number.isFinite(clickCount) && clickCount >= 0) {
      update.clicks = Math.min(Math.round(clickCount), 1000);
    }

    const scroll = Number(maxScrollPct);
    if (Number.isFinite(scroll)) {
      update.maxScrollPct = Math.min(100, Math.max(0, Math.round(scroll)));
    }

    if (Object.keys(update).length) {
      await PageView.updateOne({ _id: viewId }, { $set: update });
    }

    return res.status(204).end();
  } catch (error) {
    console.error("analytics close failed:", error?.message || error);
    return res.status(204).end();
  }
});

export default router;
