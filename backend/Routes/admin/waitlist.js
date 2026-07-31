import express from "express";

import WaitlistEntry from "../../Schema/waitlistEntry.js";
import User from "../../Schema/user.js";
import OnboardingLead from "../../Schema/onboardingLead.js";

import { adminOnly, parsePaging, pagingMeta, parseSort, escapeRegex } from "../../Services/utils/adminAuth.js";
import { logAdminAction } from "../../Services/utils/adminAudit.js";
import { recordWaitlistEntry, pendingLaunchRecipients } from "../../Services/utils/waitlist.js";
import { isInsideLaunchRadius } from "../../Services/utils/serviceArea.js";
import { sendPlatformLaunchEmail } from "../../Services/email/email.js";

const router = express.Router();
router.use(adminOnly);

/* ═════════════════════════════════ LIST ═══════════════════════════════════ */

// GET /admin/waitlist
//   ?search= &city= &region= &userType=Parents|Nanny &consent=true|false
//   &radius=inside|outside &notified=true|false &converted=true|false
//   &sort=-onboardingCompletedAt &page= &limit=
router.get("/", async (req, res) => {
  try {
    const paging = parsePaging(req.query);
    const query = {};

    const { search, city, region, userType, consent, radius, notified, converted } = req.query;

    if (search) {
      const term = new RegExp(escapeRegex(String(search).trim()), "i");
      query.$or = [{ name: term }, { email: term }, { "location.city": term }, { "location.zip": term }];
    }

    // Anchored match, not a substring: filtering to "Oakland" must not also
    // pull in "North Oakland Estates", because this same filter is what the
    // launch-email action is scoped by.
    if (city) query["location.city"] = new RegExp(`^${escapeRegex(city)}$`, "i");
    if (region) query["location.region"] = new RegExp(escapeRegex(region), "i");

    if (userType === "Parents" || userType === "Nanny") query.userType = userType;

    if (consent === "true") query.notifyConsent = true;
    if (consent === "false") query.notifyConsent = { $ne: true };

    if (radius === "inside") query.insideLaunchRadius = true;
    if (radius === "outside") query.insideLaunchRadius = { $ne: true };

    if (notified === "true") query.launchNotifiedAt = { $ne: null };
    if (notified === "false") query.launchNotifiedAt = null;

    if (converted === "true") query.userId = { $ne: null };
    if (converted === "false") query.userId = null;

    const sort = parseSort(
      req.query.sort,
      ["onboardingCompletedAt", "createdAt", "name", "email"],
      { onboardingCompletedAt: -1 }
    );

    const [entries, totalRecords] = await Promise.all([
      WaitlistEntry.find(query).sort(sort).skip(paging.skip).limit(paging.limit).lean(),
      WaitlistEntry.countDocuments(query),
    ]);

    return res.status(200).json({
      data: entries.map((entry) => ({
        ...entry,
        // The flag stored at capture time answers "were they inside when they
        // signed up"; this answers "are they inside now". They differ exactly
        // when the radius has expanded since — which is the moment the launch
        // email exists to handle, so both are surfaced rather than one
        // silently overwriting the other.
        insideLaunchRadiusNow: isInsideLaunchRadius(entry.location),
      })),
      pagination: pagingMeta(totalRecords, paging),
    });
  } catch (error) {
    console.error("admin/waitlist list failed:", error);
    return res.status(500).json({ message: "Could not load the waitlist", error: error.message });
  }
});

/* ═════════════════════════════ CITY SUMMARY ═══════════════════════════════ */

// GET /admin/waitlist/cities
// Where demand actually is — the table that decides which city opens next.
router.get("/cities", async (req, res) => {
  try {
    const cities = await WaitlistEntry.aggregate([
      { $match: { "location.city": { $nin: [null, ""] } } },
      {
        $group: {
          _id: { $toLower: "$location.city" },
          city: { $first: "$location.city" },
          region: { $first: "$location.region" },
          total: { $sum: 1 },
          families: { $sum: { $cond: [{ $eq: ["$userType", "Parents"] }, 1, 0] } },
          caregivers: { $sum: { $cond: [{ $eq: ["$userType", "Nanny"] }, 1, 0] } },
          consented: { $sum: { $cond: ["$notifyConsent", 1, 0] } },
          notified: { $sum: { $cond: [{ $ne: ["$launchNotifiedAt", null] }, 1, 0] } },
          converted: { $sum: { $cond: [{ $ne: ["$userId", null] }, 1, 0] } },
          insideRadius: { $sum: { $cond: ["$insideLaunchRadius", 1, 0] } },
          latestSignup: { $max: "$onboardingCompletedAt" },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 200 },
    ]);

    return res.status(200).json({
      data: cities.map((c) => ({
        ...c,
        // Pending is what the "notify this city" button will actually send, so
        // it is computed here rather than left as (consented − notified) for
        // the frontend to get wrong.
        pendingNotification: Math.max(0, c.consented - c.notified),
      })),
    });
  } catch (error) {
    console.error("admin/waitlist cities failed:", error);
    return res.status(500).json({ message: "Could not load city summary", error: error.message });
  }
});

/* ═════════════════════════════════ EXPORT ═════════════════════════════════ */

// GET /admin/waitlist/export?city=&consent=true
//
// CSV, streamed as a download. Capped at 50,000 rows: this builds the whole
// body in memory, and an uncapped export of a table that only grows is a
// reliable way to run the server out of heap.
router.get("/export", async (req, res) => {
  try {
    const query = {};
    const { city, userType, consent, radius } = req.query;

    if (city) query["location.city"] = new RegExp(`^${escapeRegex(city)}$`, "i");
    if (userType === "Parents" || userType === "Nanny") query.userType = userType;
    if (consent === "true") query.notifyConsent = true;
    if (radius === "inside") query.insideLaunchRadius = true;
    if (radius === "outside") query.insideLaunchRadius = { $ne: true };

    const entries = await WaitlistEntry.find(query)
      .sort({ onboardingCompletedAt: -1 })
      .limit(50000)
      .lean();

    // Excel interprets a leading =, +, - or @ in a cell as a formula. A field
    // an anonymous visitor typed into a public form therefore becomes code the
    // moment someone opens the export — CSV injection. Prefixing with a
    // single quote neutralises it, and the quotes around every value keep
    // commas and newlines from breaking the row.
    const cell = (value) => {
      const str = String(value ?? "");
      const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
      return `"${safe.replace(/"/g, '""')}"`;
    };

    const header = [
      "Name", "Email", "User Type", "City", "Region", "Zip",
      "Inside Launch Radius", "Email Consent", "Onboarding Completed",
      "Launch Notified", "Has Account", "Source",
    ];

    const rows = entries.map((e) =>
      [
        e.name, e.email, e.userType,
        e.location?.city, e.location?.region, e.location?.zip,
        e.insideLaunchRadius ? "Yes" : "No",
        e.notifyConsent ? "Yes" : "No",
        e.onboardingCompletedAt ? new Date(e.onboardingCompletedAt).toISOString().slice(0, 10) : "",
        e.launchNotifiedAt ? new Date(e.launchNotifiedAt).toISOString().slice(0, 10) : "",
        e.userId ? "Yes" : "No",
        e.source,
      ].map(cell).join(",")
    );

    // The BOM makes Excel read the file as UTF-8; without it, accented names in
    // an export opened on Windows come out mojibake.
    const csv = `﻿${header.map(cell).join(",")}\n${rows.join("\n")}`;

    const stamp = new Date().toISOString().slice(0, 10);
    const label = city ? String(city).replace(/[^a-z0-9]+/gi, "-").toLowerCase() : "all";

    await logAdminAction({
      req, action: "waitlist.notify", targetType: "waitlist",
      reason: "Waitlist exported",
      metadata: { exported: entries.length, filters: { city, userType, consent, radius } },
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="waitlist-${label}-${stamp}.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error("admin/waitlist export failed:", error);
    return res.status(500).json({ message: "Could not export the waitlist", error: error.message });
  }
});

/* ══════════════════════════ LAUNCH NOTIFICATION ═══════════════════════════ */

// POST /admin/waitlist/notify   { city, dryRun?, confirm? }
//
// The launch announcement. This is the single most dangerous button in the
// console — it sends real email to real strangers and cannot be recalled — so
// it is built to be hard to fire by accident:
//
//   * `dryRun: true` (the default) returns exactly who WOULD be mailed and
//     sends nothing. The console shows that list first.
//   * Actually sending requires `confirm: true` AND `dryRun: false`. Two
//     independent flags, so a single mistyped field can't trigger a send.
//   * Recipients are only ever those who ticked the consent box, have not
//     unsubscribed since, and have not already been told (see
//     pendingLaunchRecipients) — so re-running it is safe by construction
//     rather than by the admin remembering who they already mailed.
router.post("/notify", async (req, res) => {
  try {
    const { city, dryRun = true, confirm = false } = req.body || {};

    if (!city || !String(city).trim()) {
      return res.status(400).json({
        message: "A city is required. Sending to the entire waitlist at once is not supported.",
      });
    }

    const recipients = await pendingLaunchRecipients(String(city).trim());

    if (dryRun !== false || confirm !== true) {
      return res.status(200).json({
        dryRun: true,
        message: `${recipients.length} people would be emailed. Re-send with dryRun:false and confirm:true to go ahead.`,
        data: {
          count: recipients.length,
          preview: recipients.slice(0, 25).map((r) => ({
            email: r.email, name: r.name, userType: r.userType, hasAccount: Boolean(r.userId),
          })),
        },
      });
    }

    if (!recipients.length) {
      return res.status(200).json({
        message: "Nobody in that city is waiting to be notified.",
        data: { sent: 0, failed: 0 },
      });
    }

    const campaign = `launch:${String(city).trim().toLowerCase()}`;
    const notified = [];
    let failed = 0;

    // Sent serially with a small gap rather than in one Promise.all. The
    // provider throttles bursts, and a rejected batch here means real people on
    // the waitlist never hear that their city opened.
    for (const recipient of recipients) {
      try {
        await sendPlatformLaunchEmail(recipient.email, recipient.name, {
          // Members who already registered get the "your area is now open"
          // copy; everyone else gets the "come and join" version. Sending the
          // wrong one asks a long-standing member to sign up again.
          hasAccount: Boolean(recipient.userId),
          campaign,
          triggeredBy: req.admin._id,
        });
        notified.push(recipient._id);
      } catch (error) {
        failed += 1;
        console.error(`Launch email to ${recipient.email} failed:`, error?.message || error);
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    // Only the addresses that actually got one are stamped. A failed send stays
    // pending so the next run retries it, instead of being silently written off.
    if (notified.length) {
      await WaitlistEntry.updateMany(
        { _id: { $in: notified } },
        { $set: { launchNotifiedAt: new Date() } }
      );
    }

    await logAdminAction({
      req, action: "waitlist.notify", targetType: "waitlist",
      reason: `Launch notification sent for ${city}`,
      metadata: { city, sent: notified.length, failed, campaign },
    });

    return res.status(200).json({
      message: `Launch notification sent to ${notified.length} of ${recipients.length}.`,
      data: { sent: notified.length, failed, total: recipients.length, campaign },
    });
  } catch (error) {
    console.error("admin/waitlist notify failed:", error);
    return res.status(500).json({ message: "Could not send the notification", error: error.message });
  }
});

/* ═════════════════════════════════ BACKFILL ═══════════════════════════════ */

// POST /admin/waitlist/backfill
//
// Populates the waitlist from the data that predates it.
//
// The capture hooks only run for people who complete onboarding from now on,
// which would leave the screen empty on the day it ships despite the platform
// already having the records. This walks the two collections that hold them —
// registered users who completed onboarding, and onboarding leads who never
// did — and upserts one row per address.
//
// Idempotent: recordWaitlistEntry is an upsert keyed on email, so running this
// twice produces the same table. Safe to re-run after importing anything.
router.post("/backfill", async (req, res) => {
  try {
    const [users, leads] = await Promise.all([
      User.find({
        status: { $ne: "Deleted" },
        type: { $in: ["Parents", "Nanny"] },
      })
        .select("name email type location createdAt onboarding notifications zipCode")
        .limit(50000)
        .lean(),
      OnboardingLead.find({}).limit(50000).lean(),
    ]);

    let usersAdded = 0;
    let leadsAdded = 0;

    for (const user of users) {
      const ok = await recordWaitlistEntry({
        email: user.email,
        name: user.name,
        userType: user.type,
        // The user's own location subdocument. recordWaitlistEntry keeps only
        // the coarse parts and drops the coordinates, which is what makes this
        // safe to copy into a collection the console reads back.
        location: { ...user.location, zip: user.zipCode },
        source: "backfill",
        // An existing member's standing consent to "new subscribers in my area"
        // is the closest thing on file to consent for a launch announcement.
        // Anyone who switched it off is not opted in by this.
        notifyConsent: user.notifications?.email?.newSubInArea === true,
        userId: user._id,
        onboardingCompletedAt: user.createdAt,
      });
      if (ok) usersAdded += 1;
    }

    for (const lead of leads) {
      const ok = await recordWaitlistEntry({
        email: lead.email,
        name: lead.name,
        userType: lead.source === "family-match" ? "Parents" : "Nanny",
        location: lead.location,
        source: lead.source || "backfill",
        // A lead never saw a consent checkbox, so they are NOT opted in. They
        // appear on the waitlist — which is what the screen was asked for — but
        // the notify action will not mail them. Inferring consent that was
        // never given is the one shortcut not worth taking here.
        notifyConsent: false,
        onboardingCompletedAt: lead.createdAt,
      });
      if (ok) leadsAdded += 1;
    }

    const total = await WaitlistEntry.countDocuments();

    return res.status(200).json({
      message: "Backfill complete.",
      data: {
        usersProcessed: users.length,
        usersAdded,
        leadsProcessed: leads.length,
        leadsAdded,
        waitlistTotal: total,
        note: "Onboarding leads are listed but not opted in — they were never shown a consent checkbox.",
      },
    });
  } catch (error) {
    console.error("admin/waitlist backfill failed:", error);
    return res.status(500).json({ message: "Backfill failed", error: error.message });
  }
});

export default router;
