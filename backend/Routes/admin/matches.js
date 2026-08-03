import express from "express";

import MatchRequest from "../../Schema/matchRequest.js";
import User from "../../Schema/user.js";

import { adminOnly, parsePaging, pagingMeta, parseSort, escapeRegex } from "../../Services/utils/adminAuth.js";

const router = express.Router();
router.use(adminOnly);

const DAY_MS = 24 * 60 * 60 * 1000;

// Match & connection overview: every match request on the platform, who asked
// whom, where it got to, and when.
//
// The status vocabulary differs between the database and the console, and the
// mapping is worth stating once because everything below depends on it. Stored
// values are pending / accepted / rejected / blocked. What the founder asked
// for is Pending / Mutual / Connected. Those are not three states of one thing:
//
//   Pending   — sent, not yet answered.       (status: pending)
//   Connected — accepted, so a chat exists.   (status: accepted)
//   Mutual    — BOTH people independently sent each other a request. That is
//               not a stored status at all; it is a pair of rows pointing in
//               opposite directions, and it has to be derived.
//
// So `connectionType` is computed rather than read, and the derivation is done
// in one query for the whole page rather than per row.

// Identity only. An admin looking at a list of who-requested-whom needs names,
// not two complete user documents per row including the other party's contact
// details and Stripe id.
const PARTY_FIELDS = "name email type imageUrl status location.city";

/* ═════════════════════════════════ LIST ═══════════════════════════════════ */

// GET /admin/matches
//   ?status=pending|accepted|rejected|blocked &connection=pending|mutual|connected
//   &search= &from= &to= &sort=-createdAt &page= &limit=
router.get("/", async (req, res) => {
  try {
    const paging = parsePaging(req.query);
    const query = {};

    const { status, search, from, to, connection } = req.query;

    if (status && ["pending", "accepted", "rejected", "blocked"].includes(status)) {
      query.status = status;
    }

    // The console's vocabulary, mapped onto storage. "mutual" can't be
    // expressed as a filter here — it is a property of a pair — so it is
    // applied after the derivation below, and the response flags that the
    // filter was page-local rather than quietly returning a wrong total.
    if (connection === "pending") query.status = "pending";
    if (connection === "connected") query.status = "accepted";

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Searching by person means resolving users first, then matching either
    // side of the request against them.
    if (search) {
      const term = new RegExp(escapeRegex(String(search).trim()), "i");
      const users = await User.find({ $or: [{ name: term }, { email: term }] })
        .select("_id")
        .limit(500)
        .lean();
      const ids = users.map((u) => u._id);
      query.$or = [{ senderId: { $in: ids } }, { receiverId: { $in: ids } }];
    }

    const sort = parseSort(req.query.sort, ["createdAt"], { createdAt: -1 });

    const [requests, totalRecords] = await Promise.all([
      MatchRequest.find(query)
        .populate("senderId", PARTY_FIELDS)
        .populate("receiverId", PARTY_FIELDS)
        .sort(sort)
        .skip(paging.skip)
        .limit(paging.limit)
        .lean(),
      MatchRequest.countDocuments(query),
    ]);

    // Derive "mutual". One query for the whole page: fetch every request whose
    // sender/receiver pair is the REVERSE of a row on this page, then look each
    // row's reverse up in a set.
    const reversePairs = requests
      .filter((r) => r.senderId && r.receiverId)
      .map((r) => ({ senderId: r.receiverId._id, receiverId: r.senderId._id }));

    const reverses = reversePairs.length
      ? await MatchRequest.find({ $or: reversePairs })
          .select("senderId receiverId status createdAt")
          .lean()
      : [];

    const reverseKeys = new Map(
      reverses.map((r) => [`${r.senderId}:${r.receiverId}`, r])
    );

    let data = requests.map((request) => {
      const senderId = request.senderId?._id;
      const receiverId = request.receiverId?._id;
      const reverse = senderId && receiverId
        ? reverseKeys.get(`${receiverId}:${senderId}`)
        : null;

      // Order matters: a pair who both reached out AND connected is reported as
      // connected, because that is the outcome, and "mutual" only adds
      // information while they are still separate requests.
      const connectionType =
        request.status === "accepted" ? "connected"
          : reverse ? "mutual"
            : request.status === "pending" ? "pending"
              : request.status;

      return {
        _id: request._id,
        sender: request.senderId || null,
        receiver: request.receiverId || null,
        status: request.status,
        connectionType,
        isMutual: Boolean(reverse),
        message: request.message || null,
        blockedBy: request.blockedBy || null,
        createdAt: request.createdAt,
        // How long it has been waiting, for the pending queue. Null once
        // answered — the age of a settled request is not a number anyone acts
        // on.
        pendingForDays:
          request.status === "pending"
            ? Math.floor((Date.now() - new Date(request.createdAt).getTime()) / DAY_MS)
            : null,
      };
    });

    let pageFiltered = false;
    if (connection === "mutual") {
      data = data.filter((row) => row.isMutual);
      pageFiltered = true;
    }

    return res.status(200).json({
      data,
      pagination: pagingMeta(totalRecords, paging),
      pageFiltered,
    });
  } catch (error) {
    console.error("admin/matches list failed:", error);
    return res.status(500).json({ message: "Could not load matches", error: error.message });
  }
});

/* ═════════════════════════════ MATCH QUALITY ══════════════════════════════ */

// GET /admin/matches/insights?days=90
//
// Search & match quality: how many people are getting matches, how many
// requests go unanswered, and how long a mutual match takes to happen.
router.get("/insights", async (req, res) => {
  try {
    const days = Math.min(365, Math.max(7, parseInt(req.query.days, 10) || 90));
    const since = new Date(Date.now() - days * DAY_MS);

    const [statusCounts, senders, receivers, accepted, activeUsers, daily] = await Promise.all([
      MatchRequest.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      MatchRequest.distinct("senderId", { createdAt: { $gte: since } }),
      MatchRequest.distinct("receiverId", { createdAt: { $gte: since } }),
      // Only rows carrying `respondedAt` can contribute a response time. Every
      // request that predates that field has none, and treating a missing
      // timestamp as an instant response would report a time-to-match of zero
      // for the entire back catalogue.
      MatchRequest.aggregate([
        {
          $match: {
            status: "accepted",
            createdAt: { $gte: since },
            respondedAt: { $ne: null },
          },
        },
        {
          $group: {
            _id: null,
            avgMs: { $avg: { $subtract: ["$respondedAt", "$createdAt"] } },
            measured: { $sum: 1 },
          },
        },
      ]),
      User.countDocuments({
        status: "Active",
        type: { $in: ["Parents", "Nanny"] },
      }),
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

    const counts = Object.fromEntries(statusCounts.map((s) => [s._id, s.count]));
    const total = statusCounts.reduce((sum, s) => sum + s.count, 0);

    // Everyone who received at least one request. The denominator that matters
    // for "is the marketplace working" — a platform where 90% of requests are
    // aimed at the same 10 profiles has a discovery problem that a headline
    // acceptance rate hides completely.
    const receivedSomething = new Set(receivers.map(String));
    const sentSomething = new Set(senders.map(String));

    return res.status(200).json({
      data: {
        windowDays: days,
        totalRequests: total,
        pending: counts.pending || 0,
        accepted: counts.accepted || 0,
        rejected: counts.rejected || 0,
        blocked: counts.blocked || 0,

        // Of everything sent, the share that turned into a connection.
        successRate: total ? Math.round(((counts.accepted || 0) / total) * 100) : 0,
        // Still waiting, as a share of everything sent. The number that says
        // whether the other side of the marketplace is responsive.
        unansweredRate: total ? Math.round(((counts.pending || 0) / total) * 100) : 0,

        usersSendingRequests: sentSomething.size,
        usersReceivingRequests: receivedSomething.size,
        activeUsers,
        // What share of active members are getting any inbound interest.
        reachRate: activeUsers ? Math.round((receivedSomething.size / activeUsers) * 100) : 0,

        // Average hours between a request being sent and accepted.
        //
        // Measured only over requests that carry `respondedAt`, which was added
        // with this console — so it is null until some requests have been
        // answered since. `avgTimeToMatchSample` is returned alongside it so
        // the console can say "based on 12 matches" rather than presenting an
        // average of three as if it were settled.
        avgTimeToMatchHours: accepted[0]?.avgMs
          ? Math.round((accepted[0].avgMs / (1000 * 60 * 60)) * 10) / 10
          : null,
        avgTimeToMatchSample: accepted[0]?.measured || 0,
        avgTimeToMatchNote: accepted[0]?.measured
          ? null
          : "No matches with a recorded response time yet — this starts filling in as requests are answered.",

        daily,
      },
    });
  } catch (error) {
    console.error("admin/matches insights failed:", error);
    return res.status(500).json({ message: "Could not load insights", error: error.message });
  }
});

export default router;
