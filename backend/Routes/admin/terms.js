import express from "express";
import mongoose from "mongoose";

import Terms from "../../Schema/terms.js";
import User from "../../Schema/user.js";

import { adminOnly } from "../../Services/utils/adminAuth.js";
import { logAdminAction } from "../../Services/utils/adminAudit.js";
import { sanitizeHtml, htmlToText } from "../../Services/utils/sanitizeHtml.js";

const router = express.Router();
router.use(adminOnly);

const SLUGS = ["terms", "privacy", "community-guidelines"];

// Admin editing for the legal documents.
//
// The requirement is that changing the terms changes them everywhere the
// platform shows them. That works because there is exactly one published row
// per slug and every surface reads it from the public endpoint
// (Routes/legal.js) — so propagation isn't a mechanism that has to run, it is
// the only thing that can happen. Nothing here pushes an update anywhere.
//
// Publishing APPENDS. It writes a new version and demotes the incumbent rather
// than editing it in place, because `User.termsAcceptedVersion` points at the
// text someone agreed to, and an UPDATE would destroy the only record of what
// that text said.

/* ═══════════════════════════════ READ ═════════════════════════════════════ */

// GET /admin/terms?slug=terms — the live version plus the full history.
router.get("/", async (req, res) => {
  try {
    const slug = SLUGS.includes(req.query.slug) ? req.query.slug : "terms";

    const [current, history] = await Promise.all([
      Terms.findOne({ slug, isPublished: true }).populate("publishedBy", "name email").lean(),
      Terms.find({ slug })
        .select("version title effectiveDate isPublished requiresReacceptance changeSummary createdAt publishedBy")
        .populate("publishedBy", "name email")
        .sort({ version: -1 })
        .limit(50)
        .lean(),
    ]);

    // How many people have accepted the live version, and how many are still on
    // an older one. The number an admin needs before deciding whether a change
    // is worth re-prompting everybody for.
    let acceptance = null;
    if (current) {
      const [accepted, outdated, never] = await Promise.all([
        User.countDocuments({ termsAcceptedVersion: current.version, status: { $ne: "Deleted" } }),
        User.countDocuments({
          termsAcceptedVersion: { $ne: null, $lt: current.version },
          status: { $ne: "Deleted" },
        }),
        User.countDocuments({ termsAcceptedVersion: null, status: { $ne: "Deleted" } }),
      ]);
      acceptance = { onCurrentVersion: accepted, onOlderVersion: outdated, neverRecorded: never };
    }

    return res.status(200).json({ data: { slug, current: current || null, history, acceptance } });
  } catch (error) {
    console.error("admin/terms read failed:", error);
    return res.status(500).json({ message: "Could not load the terms", error: error.message });
  }
});

// GET /admin/terms/version/:id — one historical version in full.
router.get("/version/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid version id" });
    }
    const version = await Terms.findById(id).populate("publishedBy", "name email").lean();
    if (!version) return res.status(404).json({ message: "Version not found" });
    return res.status(200).json({ data: version });
  } catch (error) {
    console.error("admin/terms version failed:", error);
    return res.status(500).json({ message: "Could not load the version", error: error.message });
  }
});

/* ═════════════════════════════ PUBLISH ════════════════════════════════════ */

// POST /admin/terms
//   { slug?, title, content, effectiveDate?, requiresReacceptance?, changeSummary? }
//
// Publishes a new version. Live the instant this returns — every surface reads
// the published row.
router.post("/", async (req, res) => {
  try {
    const slug = SLUGS.includes(req.body?.slug) ? req.body.slug : "terms";
    const rawContent = req.body?.content;

    if (typeof rawContent !== "string" || !rawContent.trim()) {
      return res.status(400).json({ message: "The document body cannot be empty." });
    }

    // Sanitised on the way IN, once, rather than at every read. The public page
    // renders this with dangerouslySetInnerHTML, so a stored script tag would
    // run in the browser of every visitor.
    const content = sanitizeHtml(rawContent);
    if (!htmlToText(content).trim()) {
      return res.status(400).json({
        message: "After sanitising, the document was empty. Check for unsupported markup.",
      });
    }

    const current = await Terms.findOne({ slug, isPublished: true }).lean();

    // Publishing an identical document would burn a version number and reset
    // everyone's acceptance for nothing, which is the fastest way to train
    // users to click through a consent prompt without reading it.
    if (current && current.content === content && current.title === (req.body?.title || current.title)) {
      return res.status(400).json({
        message: "This is identical to the published version — nothing to publish.",
      });
    }

    // Version numbers must never be reused, so the next one comes from the
    // highest that has EVER existed for this slug, not from the published one.
    // Reading the published row would reuse a number after a rollback.
    const latest = await Terms.findOne({ slug }).sort({ version: -1 }).select("version").lean();
    const version = (latest?.version || 0) + 1;

    // Demote first, promote second. The partial unique index allows only one
    // published row per slug, so doing it the other way round would be rejected
    // — and this ordering means a crash between the two leaves NO published
    // document rather than two, which the public endpoint handles by falling
    // back to the latest version instead of serving contradictory text.
    if (current) {
      await Terms.updateOne({ _id: current._id }, { $set: { isPublished: false } });
    }

    let published;
    try {
      published = await Terms.create({
        slug,
        version,
        title: String(req.body?.title || "Terms & Conditions").slice(0, 200),
        content,
        effectiveDate: req.body?.effectiveDate ? new Date(req.body.effectiveDate) : new Date(),
        isPublished: true,
        requiresReacceptance: req.body?.requiresReacceptance === true,
        changeSummary: String(req.body?.changeSummary || "").slice(0, 500),
        publishedBy: req.admin._id,
      });
    } catch (error) {
      // Put the previous version back rather than leaving the platform with no
      // published terms at all.
      if (current) {
        await Terms.updateOne({ _id: current._id }, { $set: { isPublished: true } }).catch(() => {});
      }
      throw error;
    }

    // Re-acceptance is achieved by comparison, not by a bulk write.
    //
    // Every user's `termsAcceptedVersion` is compared against the live version
    // at read time, so a user who accepted v3 is automatically out of date when
    // v4 publishes. Clearing 20,000 users' acceptance timestamps would destroy
    // the record of what they previously agreed to — the exact thing these
    // fields exist to preserve.
    await logAdminAction({
      req, action: "terms.publish", targetType: "terms", targetId: published._id,
      reason: req.body?.changeSummary || `Published ${slug} v${version}`,
      metadata: {
        slug, version,
        previousVersion: current?.version || null,
        requiresReacceptance: published.requiresReacceptance,
        contentLength: content.length,
      },
    });

    return res.status(201).json({
      message: `Published version ${version}. It is live everywhere on the platform.`,
      data: published,
    });
  } catch (error) {
    console.error("admin/terms publish failed:", error);
    return res.status(500).json({ message: "Could not publish", error: error.message });
  }
});

/* ═════════════════════════════ ROLLBACK ═══════════════════════════════════ */

// POST /admin/terms/:id/restore
//
// Re-publishes a historical version as a NEW version rather than flipping the
// old row back to published. The history stays a strictly increasing record of
// what was live and when — "we reverted to the March wording on 5 June" is
// itself a fact worth keeping, and reactivating the old row would erase it.
router.post("/:id/restore", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid version id" });
    }

    const source = await Terms.findById(id).lean();
    if (!source) return res.status(404).json({ message: "Version not found" });
    if (source.isPublished) {
      return res.status(400).json({ message: "That version is already live." });
    }

    const [current, latest] = await Promise.all([
      Terms.findOne({ slug: source.slug, isPublished: true }).lean(),
      Terms.findOne({ slug: source.slug }).sort({ version: -1 }).select("version").lean(),
    ]);

    if (current) {
      await Terms.updateOne({ _id: current._id }, { $set: { isPublished: false } });
    }

    const restored = await Terms.create({
      slug: source.slug,
      version: (latest?.version || 0) + 1,
      title: source.title,
      content: source.content,
      effectiveDate: new Date(),
      isPublished: true,
      requiresReacceptance: false,
      changeSummary: `Restored from version ${source.version}`,
      publishedBy: req.admin._id,
    });

    await logAdminAction({
      req, action: "terms.publish", targetType: "terms", targetId: restored._id,
      reason: `Restored ${source.slug} from v${source.version}`,
      metadata: { slug: source.slug, restoredFrom: source.version, newVersion: restored.version },
    });

    return res.status(200).json({
      message: `Restored version ${source.version} as version ${restored.version}.`,
      data: restored,
    });
  } catch (error) {
    console.error("admin/terms restore failed:", error);
    return res.status(500).json({ message: "Could not restore", error: error.message });
  }
});

// POST /admin/terms/preview   { content }
// Runs the sanitiser without saving, so an admin can see what will actually be
// stored before they publish it — including anything the filter strips out.
router.post("/preview", async (req, res) => {
  try {
    const clean = sanitizeHtml(req.body?.content || "");
    return res.status(200).json({
      data: {
        html: clean,
        text: htmlToText(clean),
        // A visible signal that markup was removed. Silently dropping a table
        // an admin pasted from a Word document, with no indication, is how a
        // clause goes missing from a contract.
        modified: clean !== String(req.body?.content || "").trim(),
      },
    });
  } catch (error) {
    console.error("admin/terms preview failed:", error);
    return res.status(500).json({ message: "Could not render the preview", error: error.message });
  }
});

export default router;
