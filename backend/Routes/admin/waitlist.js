import express from "express";
import mongoose from "mongoose";

import WaitlistEntry from "../../Schema/waitlistEntry.js";
import User from "../../Schema/user.js";
import OnboardingLead from "../../Schema/onboardingLead.js";

import { adminOnly, parsePaging, pagingMeta, parseSort, escapeRegex } from "../../Services/utils/adminAuth.js";
import { logAdminAction } from "../../Services/utils/adminAudit.js";
import { recordWaitlistEntry, pendingLaunchRecipients } from "../../Services/utils/waitlist.js";
import { isInsideLaunchRadius } from "../../Services/utils/serviceArea.js";
import {
  sendPlatformLaunchEmail,
  sendCustomLaunchEmail,
  renderLaunchEmailPreview,
} from "../../Services/email/email.js";
import LaunchEmail from "../../Schema/launchEmail.js";
import { sanitizeHtml, htmlToText } from "../../Services/utils/sanitizeHtml.js";

const router = express.Router();
router.use(adminOnly);

/* ═════════════════════════════════ LIST ═══════════════════════════════════ */

// GET /admin/waitlist
//   ?search= &city= &region= &userType=Parents|Nanny &consent=true|false
//   &radius=inside|outside &notified=true|false &converted=true|false
//   &answerLabel= &answerValue=   (filter by an intake answer)
//   &sort=-onboardingCompletedAt &page= &limit=
router.get("/", async (req, res) => {
  try {
    const paging = parsePaging(req.query);
    const query = {};

    const {
      search, city, region, userType, consent, radius, notified, converted,
      answerLabel, answerValue,
    } = req.query;

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

    // Filter by what someone answered on the way in — "everyone who needs
    // full-time care", "everyone with an infant". $elemMatch rather than two
    // dotted paths, which would match a row whose label came from one answer
    // and value from another.
    if (answerLabel) {
      const match = { label: new RegExp(`^${escapeRegex(String(answerLabel))}$`, "i") };
      if (answerValue) {
        // Substring, not anchored: "Children" holds "2 years, 5 years", so
        // asking for "5 years" has to match inside the list.
        match.value = new RegExp(escapeRegex(String(answerValue)), "i");
      }
      query["onboarding.answers"] = { $elemMatch: match };
    }

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

// GET /admin/waitlist/answers
//
// Every intake question that has been answered, with its distinct values and
// how many people gave each — the raw material for "detect similarities
// between waitlist users".
//
// Built from the data rather than from a hardcoded question list, because the
// intake forms have changed over time and a fixed list would silently hide
// every answer to a question added after this file was written.
router.get("/answers", async (req, res) => {
  try {
    const city = String(req.query.city || "").trim();

    const match = { "onboarding.answers.0": { $exists: true } };
    if (city) match["location.city"] = new RegExp(`^${escapeRegex(city)}$`, "i");

    const facets = await WaitlistEntry.aggregate([
      { $match: match },
      { $unwind: "$onboarding.answers" },
      {
        $group: {
          _id: {
            label: "$onboarding.answers.label",
            value: "$onboarding.answers.value",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.label",
          total: { $sum: "$count" },
          // Capped per question: "Children" is close to unique per person, and
          // a dropdown of four hundred single-use values is not a filter. The
          // most common ones are the ones that reveal a pattern.
          values: { $push: { value: "$_id.value", count: "$count" } },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 30 },
    ]);

    const data = facets.map((facet) => ({
      label: facet._id,
      total: facet.total,
      values: facet.values
        .sort((a, b) => b.count - a.count)
        .slice(0, 40),
      distinctValues: facet.values.length,
    }));

    return res.status(200).json({ data });
  } catch (error) {
    console.error("admin/waitlist answers failed:", error);
    return res.status(500).json({ message: "Could not load intake answers", error: error.message });
  }
});

/* ═══════════════════════ LAUNCH EMAIL, WRITTEN PER CITY ═══════════════════ */

// The default announcement says "FamLink just launched near you" — true
// everywhere, specific nowhere. Opening one city at a time only pays off if the
// message can name the neighbourhoods and speak to what those families asked
// for, so each city gets its own draft.

const DEFAULT_SUBJECTS = {
  member: "FamLink is now live in your area 🎉",
  guest: "FamLink just launched near you — come join 🎉",
};

// GET /admin/waitlist/launch-email?city=Oakland
router.get("/launch-email", async (req, res) => {
  try {
    const city = String(req.query.city || "").trim();
    if (!city) return res.status(400).json({ message: "A city is required." });

    const draft = await LaunchEmail.findOne({ city: city.toLowerCase() })
      .populate("updatedBy", "name email")
      .lean();

    return res.status(200).json({
      data: {
        city,
        hasDraft: Boolean(draft),
        subject: draft?.subject || DEFAULT_SUBJECTS.guest,
        bodyHtml: draft?.bodyHtml || "",
        heroEyebrow: draft?.heroEyebrow || "",
        heroHeadline: draft?.heroHeadline || "",
        heroSub: draft?.heroSub || "",
        ctaLabel: draft?.ctaLabel || "",
        ctaNote: draft?.ctaNote || "",
        updatedAt: draft?.updatedAt || null,
        updatedBy: draft?.updatedBy || null,
        defaultSubjects: DEFAULT_SUBJECTS,
      },
    });
  } catch (error) {
    console.error("admin/waitlist launch-email read failed:", error);
    return res.status(500).json({ message: "Could not load the draft", error: error.message });
  }
});

// PUT /admin/waitlist/launch-email   { city, subject, bodyHtml }
//
// Saving is separate from sending on purpose: composing an announcement to
// several hundred strangers should be something you can do, close, and come
// back to — not something that only exists while a dialog is open.
router.put("/launch-email", async (req, res) => {
  try {
    const {
      city, subject, bodyHtml, heroEyebrow, heroHeadline, heroSub, ctaLabel, ctaNote,
    } = req.body || {};
    const label = String(city || "").trim();
    if (!label) return res.status(400).json({ message: "A city is required." });

    // Same allow-list as the legal documents. This is admin-authored HTML that
    // lands in strangers' inboxes, so it gets the same treatment as anything
    // else an admin writes for other people to read.
    const clean = sanitizeHtml(bodyHtml || "");
    if (bodyHtml && !htmlToText(clean).trim()) {
      return res.status(400).json({
        message: "After sanitising, the body was empty. Check for unsupported markup.",
      });
    }

    const draft = await LaunchEmail.findOneAndUpdate(
      { city: label.toLowerCase() },
      {
        $set: {
          cityLabel: label,
          subject: String(subject || "").trim().slice(0, 200),
          bodyHtml: clean,
          // Plain text: tags are stripped rather than escaped, because the
          // headline is rendered inside a fixed structure and any markup an
          // admin pasted in would show up as literal &lt;b&gt; on screen.
          heroEyebrow: String(heroEyebrow || "").replace(/<[^>]*>/g, "").trim().slice(0, 80),
          heroHeadline: String(heroHeadline || "").replace(/<[^>]*>/g, "").trim().slice(0, 160),
          heroSub: String(heroSub || "").replace(/<[^>]*>/g, "").trim().slice(0, 240),
          ctaLabel: String(ctaLabel || "").replace(/<[^>]*>/g, "").trim().slice(0, 60),
          ctaNote: String(ctaNote || "").replace(/<[^>]*>/g, "").trim().slice(0, 120),
          updatedBy: req.admin._id,
          updatedAt: new Date(),
        },
        $setOnInsert: { city: label.toLowerCase(), createdAt: new Date() },
      },
      { upsert: true, new: true }
    ).lean();

    return res.status(200).json({
      message: `Saved the launch email for ${label}. Nothing has been sent.`,
      data: {
        city: label, subject: draft.subject, bodyHtml: draft.bodyHtml, hasDraft: true,
        heroEyebrow: draft.heroEyebrow, heroHeadline: draft.heroHeadline, heroSub: draft.heroSub,
        ctaLabel: draft.ctaLabel, ctaNote: draft.ctaNote,
      },
    });
  } catch (error) {
    console.error("admin/waitlist launch-email save failed:", error);
    return res.status(500).json({ message: "Could not save the draft", error: error.message });
  }
});

// POST /admin/waitlist/launch-email/preview   { bodyHtml?, hasAccount? }
//
// The whole email as a recipient sees it, without sending or saving anything.
//
// Sanitises first, so what is previewed is what would be STORED — not what the
// admin typed. Showing the unsanitised draft would preview markup that the save
// step is about to strip, which is the one way a preview can actively mislead.
router.post("/launch-email/preview", async (req, res) => {
  try {
    const {
      bodyHtml, hasAccount = false, name, editable = false,
      heroEyebrow, heroHeadline, heroSub, ctaLabel, ctaNote,
    } = req.body || {};
    const clean = sanitizeHtml(bodyHtml || "");

    return res.status(200).json({
      data: {
        html: renderLaunchEmailPreview({
          bodyHtml: clean,
          hasAccount: hasAccount === true,
          name: String(name || "Ada").slice(0, 60),
          editable: editable === true,
          hero: { heroEyebrow, heroHeadline, heroSub, ctaLabel, ctaNote },
        }),
        // A visible signal that markup was dropped, rather than the admin
        // noticing a missing paragraph after the send.
        modified: Boolean(bodyHtml) && clean !== String(bodyHtml).trim(),
        usingStockCopy: !clean,
      },
    });
  } catch (error) {
    console.error("admin/waitlist launch-email preview failed:", error);
    return res.status(500).json({ message: "Could not render the preview", error: error.message });
  }
});

// DELETE /admin/waitlist/launch-email?city=Oakland — back to the stock copy.
router.delete("/launch-email", async (req, res) => {
  try {
    const city = String(req.query.city || "").trim();
    if (!city) return res.status(400).json({ message: "A city is required." });

    await LaunchEmail.deleteOne({ city: city.toLowerCase() });
    return res.status(200).json({
      message: `${city} is back to the standard launch email.`,
    });
  } catch (error) {
    console.error("admin/waitlist launch-email delete failed:", error);
    return res.status(500).json({ message: "Could not reset the draft", error: error.message });
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
    const draft = await LaunchEmail.findOne({ city: String(city).trim().toLowerCase() }).lean();

    if (dryRun !== false || confirm !== true) {
      return res.status(200).json({
        dryRun: true,
        message: `${recipients.length} people would be emailed. Re-send with dryRun:false and confirm:true to go ahead.`,
        data: {
          count: recipients.length,
          // Which email they would get — the thing an admin most needs to
          // confirm before firing, and previously invisible from here.
          usingDraft: Boolean(draft?.bodyHtml),
          subject: draft?.subject || null,
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
        // Members who already registered get the "your area is now open" copy;
        // everyone else gets the "come and join" version. Sending the wrong one
        // asks a long-standing member to sign up again — which is why the
        // city's draft replaces the body but never the shell that carries that
        // distinction.
        const hasAccount = Boolean(recipient.userId);

        if (
      draft?.bodyHtml || draft?.heroHeadline || draft?.heroEyebrow ||
      draft?.heroSub || draft?.ctaLabel || draft?.ctaNote
    ) {
          await sendCustomLaunchEmail(recipient.email, recipient.name, {
            subject: draft.subject || undefined,
            bodyHtml: draft.bodyHtml,
            hasAccount,
            campaign,
            triggeredBy: req.admin._id,
          });
        } else {
          await sendPlatformLaunchEmail(recipient.email, recipient.name, {
            hasAccount,
            campaign,
            triggeredBy: req.admin._id,
          });
        }
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
      metadata: {
        city, sent: notified.length, failed, campaign,
        usingDraft: Boolean(draft?.bodyHtml),
        subject: draft?.subject || null,
      },
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

/* ═══════════════════════════ ONE PERSON AT A TIME ═════════════════════════ */

// POST /admin/waitlist/:id/notify   { confirm?: boolean }
//
// Send the launch announcement to a single person.
//
// The city-wide action is all-or-nothing, which is wrong for the cases that
// actually come up: someone replied asking to be told, a send failed for one
// address, a city is being opened to a handful of people first. Doing any of
// those previously meant mailing everyone.
//
// The same three guarantees as the bulk send, checked per person rather than
// assumed: consented, not unsubscribed, and — unless explicitly overridden —
// not already told. `resend: true` is the deliberate override, because "email
// this person again" is a real request and quietly refusing it is worse than
// letting an admin repeat themselves on purpose.
router.post("/:id/notify", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const { confirm = false, resend = false } = req.body || {};

    const entry = await WaitlistEntry.findById(id).lean();
    if (!entry) return res.status(404).json({ message: "Not on the waitlist" });

    if (!entry.notifyConsent) {
      return res.status(400).json({
        message: `${entry.email} hasn't agreed to be emailed about a launch.`,
      });
    }
    if (entry.unsubscribedAt) {
      return res.status(400).json({
        message: `${entry.email} has unsubscribed. They cannot be emailed.`,
      });
    }
    if (entry.launchNotifiedAt && resend !== true) {
      return res.status(409).json({
        message: `${entry.email} was already told on ${new Date(entry.launchNotifiedAt).toDateString()}. Send again with resend:true if that is intended.`,
        code: "ALREADY_NOTIFIED",
      });
    }

    const city = entry.location?.city || "";
    const draft = city
      ? await LaunchEmail.findOne({ city: city.toLowerCase() }).lean()
      : null;

    if (confirm !== true) {
      return res.status(200).json({
        message: `Would email ${entry.email}. Send again with confirm:true to go ahead.`,
        data: {
          dryRun: true,
          email: entry.email,
          name: entry.name,
          city,
          hasAccount: Boolean(entry.userId),
          usingDraft: Boolean(draft?.bodyHtml),
          alreadyNotified: Boolean(entry.launchNotifiedAt),
        },
      });
    }

    const hasAccount = Boolean(entry.userId);
    const campaign = `launch:${(city || "individual").toLowerCase()}`;

    if (
      draft?.bodyHtml || draft?.heroHeadline || draft?.heroEyebrow ||
      draft?.heroSub || draft?.ctaLabel || draft?.ctaNote
    ) {
      await sendCustomLaunchEmail(entry.email, entry.name, {
        subject: draft.subject || undefined,
        bodyHtml: draft.bodyHtml,
        hero: draft,
        hasAccount,
        campaign,
        triggeredBy: req.admin._id,
      });
    } else {
      await sendPlatformLaunchEmail(entry.email, entry.name, {
        hasAccount,
        campaign,
        triggeredBy: req.admin._id,
      });
    }

    await WaitlistEntry.updateOne(
      { _id: entry._id },
      { $set: { launchNotifiedAt: new Date() } }
    );

    await logAdminAction({
      req, action: "waitlist.notify", targetType: "waitlist", targetId: entry._id,
      targetUserId: entry.userId || null,
      reason: `Launch email sent individually to ${entry.email}`,
      metadata: { email: entry.email, city, usingDraft: Boolean(draft?.bodyHtml), resend: resend === true },
    });

    return res.status(200).json({
      message: `Sent to ${entry.email}.`,
      data: { sent: 1, email: entry.email },
    });
  } catch (error) {
    console.error("admin/waitlist individual notify failed:", error);
    return res.status(500).json({ message: "Could not send the email", error: error.message });
  }
});

/* ═════════════════════════════════ BACKFILL ═══════════════════════════════ */

// POST /admin/waitlist/consent-backfill   { confirm?: boolean, sources?: string[] }
//
// Records consent for people who joined the waitlist and were never marked as
// having done so.
//
// ── Why these rows are consented and the flag says otherwise ──────────────
//
// Both waitlist flows end in a button that reads "Join Waitlist" or "Notify me
// when you're here", above copy promising to email when we launch nearby. That
// IS the consent — it is the entire thing the person clicked.
//
// But the form posts to /waitlist/confirmation through sendWaitlistConfirmation,
// which only ever sent { email, name, city }. The route reads `notifyConsent`
// from the body, never received it, and recorded false. So every one of these
// rows understates what the person actually agreed to.
//
// ── What this deliberately does NOT touch ─────────────────────────────────
//
//   • Onboarding leads (source "family-match" and the caregiver funnels). Those
//     are captured silently part-way through a questionnaire. Nobody was shown
//     a waitlist prompt, so there is nothing to record.
//   • Anyone with `unsubscribedAt` set. Withdrawal outranks every other signal;
//     re-consenting someone who opted out is the one thing this must never do.
//   • Rows already marked true — the update is scoped to false ones, so
//     re-running changes nothing.
//
// Defaults to a dry run. Sending needs `confirm: true`.
router.post("/consent-backfill", async (req, res) => {
  try {
    const { confirm = false, sources } = req.body || {};

    // Only the sources where a person actively asked to be told. Overridable so
    // an admin can widen it deliberately, never by accident.
    const targetSources =
      Array.isArray(sources) && sources.length
        ? sources.map(String)
        : ["waitlist-form"];

    const query = {
      source: { $in: targetSources },
      notifyConsent: { $ne: true },
      unsubscribedAt: null,
    };

    // What is out there right now, by source, so the numbers below can be
    // checked against the data rather than taken on trust — and so a source
    // value nobody remembered shows up instead of being silently skipped.
    const breakdown = await WaitlistEntry.aggregate([
      { $match: { notifyConsent: { $ne: true }, unsubscribedAt: null } },
      { $group: { _id: "$source", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const eligible = await WaitlistEntry.countDocuments(query);

    if (confirm !== true) {
      return res.status(200).json({
        message:
          `${eligible} waitlist ${eligible === 1 ? "row" : "rows"} would be marked as consented. ` +
          "Nothing has changed — send confirm: true to apply.",
        data: {
          dryRun: true,
          eligible,
          sources: targetSources,
          withoutConsentBySource: breakdown.map((row) => ({
            source: row._id || "(none)",
            count: row.count,
            included: targetSources.includes(row._id),
          })),
        },
      });
    }

    const result = await WaitlistEntry.updateMany(query, {
      $set: { notifyConsent: true, updatedAt: new Date() },
    });

    await logAdminAction({
      req,
      action: "waitlist.consent_backfill",
      targetType: "waitlist",
      reason:
        `Recorded consent for ${result.modifiedCount} waitlist signups ` +
        `(sources: ${targetSources.join(", ")})`,
      metadata: { sources: targetSources, eligible, modified: result.modifiedCount },
    });

    return res.status(200).json({
      message:
        `${result.modifiedCount} ${result.modifiedCount === 1 ? "person is" : "people are"} ` +
        "now marked as consented and will be included in launch emails.",
      data: { dryRun: false, modified: result.modifiedCount, sources: targetSources },
    });
  } catch (error) {
    console.error("admin/waitlist consent-backfill failed:", error);
    return res.status(500).json({ message: "Could not update consent", error: error.message });
  }
});

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
        // A launch announcement is marketing, so it rides on the newsletter
        // opt-in — the one consent on file that covers this kind of mail.
        // Anyone who switched it off is not opted in by this.
        notifyConsent: user.notifications?.email?.newsletter !== false,
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
        // The lead row already holds the questionnaire summary — this is the
        // only place the historical answers still exist for people who never
        // registered.
        details: lead.details,
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
