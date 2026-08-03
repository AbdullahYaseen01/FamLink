import express from "express";

import Terms from "../Schema/terms.js";
import User from "../Schema/user.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";

const router = express.Router();

// The public face of the legal documents.
//
// THIS IS THE PROPAGATION MECHANISM. The requirement — "once the terms are
// updated, make sure they change everywhere on the platform that has terms
// integrated" — is satisfied by every one of those surfaces reading this
// endpoint instead of holding its own copy. There is no push, no cache
// invalidation, no list of places to update: change the published row and the
// next render of any surface shows the new text, because there is only one
// place for any of them to read.
//
// The surfaces that must use this:
//   * the standalone terms page
//   * the signup / onboarding acceptance checkbox
//   * the subscription checkout consent
//   * every questionnaire footer that links to or quotes the terms
//
// A screen that hardcodes the copy is outside this guarantee, which is the bug
// this endpoint exists to remove.

const SLUGS = ["terms", "privacy", "community-guidelines"];

// Small in-process cache. The terms page is anonymous traffic and the text
// changes a few times a year, so serving it from a database read per visitor is
// pure waste. Short TTL rather than explicit invalidation: a publish becomes
// visible within a minute everywhere, which is well inside what "immediately"
// means for a legal document, and it needs no coordination between the fly.io
// machines — which is exactly the kind of coordination that goes wrong and
// leaves one machine serving superseded terms indefinitely.
const CACHE_TTL_MS = 60 * 1000;
const cache = new Map(); // slug -> { at, payload }

const readPublished = async (slug) => {
  const hit = cache.get(slug);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.payload;

  let doc = await Terms.findOne({ slug, isPublished: true })
    .select("slug version title content effectiveDate requiresReacceptance createdAt")
    .lean();

  // Fallback to the highest version if nothing is marked published. That state
  // is only reachable if a publish crashed between demoting the incumbent and
  // promoting its replacement — rare, but the failure mode without this is a
  // blank terms page, which is worse than showing the most recent text.
  if (!doc) {
    doc = await Terms.findOne({ slug })
      .sort({ version: -1 })
      .select("slug version title content effectiveDate requiresReacceptance createdAt")
      .lean();
  }

  cache.set(slug, { at: Date.now(), payload: doc || null });
  return doc || null;
};

// GET /legal/:slug — public, no auth. The document itself.
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    if (!SLUGS.includes(slug)) {
      return res.status(404).json({ message: "Unknown document" });
    }

    const doc = await readPublished(slug);
    if (!doc) {
      // Nothing has been published yet. An explicit, machine-readable answer so
      // the frontend can fall back to its bundled copy rather than rendering an
      // empty legal page.
      return res.status(404).json({
        message: "No published version of this document yet.",
        code: "NOT_PUBLISHED",
      });
    }

    // Content is sanitised at write time (Services/utils/sanitizeHtml.js), so
    // what is stored is what is safe to render.
    res.setHeader("Cache-Control", "public, max-age=60");
    return res.status(200).json({ data: doc });
  } catch (error) {
    console.error("legal fetch failed:", error);
    return res.status(500).json({ message: "Could not load the document", error: error.message });
  }
});

// GET /legal/:slug/version — just the version and date.
//
// What the acceptance checkbox and the "you need to re-accept" banner poll.
// Separate from the full document so a screen that only needs to know whether
// the user is current doesn't transfer several kilobytes of legal text to find
// out.
router.get("/:slug/version", async (req, res) => {
  try {
    const { slug } = req.params;
    if (!SLUGS.includes(slug)) return res.status(404).json({ message: "Unknown document" });

    const doc = await readPublished(slug);
    if (!doc) return res.status(404).json({ message: "Not published", code: "NOT_PUBLISHED" });

    return res.status(200).json({
      data: {
        slug: doc.slug,
        version: doc.version,
        effectiveDate: doc.effectiveDate,
        requiresReacceptance: doc.requiresReacceptance,
      },
    });
  } catch (error) {
    console.error("legal version failed:", error);
    return res.status(500).json({ message: "Could not load the version", error: error.message });
  }
});

// POST /legal/accept   { slug?, version? }
//
// Records that the signed-in user has accepted the current terms. Called by the
// signup flow and by the re-acceptance banner.
//
// The version is read from the SERVER's published document, not from the
// client's request body. A client that could name the version it was accepting
// could claim to have agreed to any text at all, including one that was never
// published — the body's `version` is only used to detect that the user was
// looking at a stale page.
router.post("/accept", authMiddleware, async (req, res) => {
  try {
    const slug = SLUGS.includes(req.body?.slug) ? req.body.slug : "terms";
    const doc = await readPublished(slug);

    if (!doc) {
      return res.status(409).json({
        message: "There is no published version to accept yet.",
        code: "NOT_PUBLISHED",
      });
    }

    // The page they were reading is older than what is live. Told to refresh
    // rather than silently recorded as accepting text they never saw.
    if (req.body?.version != null && Number(req.body.version) !== doc.version) {
      return res.status(409).json({
        message: "The terms have changed since this page loaded. Please review the current version.",
        code: "VERSION_MISMATCH",
        data: { currentVersion: doc.version },
      });
    }

    if (slug === "terms") {
      await User.updateOne(
        { _id: req.userId },
        { $set: { termsAcceptedAt: new Date(), termsAcceptedVersion: doc.version } }
      );
    }

    return res.status(200).json({
      message: "Recorded.",
      data: { version: doc.version, acceptedAt: new Date() },
    });
  } catch (error) {
    console.error("legal accept failed:", error);
    return res.status(500).json({ message: "Could not record acceptance", error: error.message });
  }
});

// GET /legal/status/me — does the signed-in user need to accept again?
router.get("/status/me", authMiddleware, async (req, res) => {
  try {
    const [doc, user] = await Promise.all([
      readPublished("terms"),
      User.findById(req.userId).select("termsAcceptedAt termsAcceptedVersion").lean(),
    ]);

    if (!doc || !user) {
      return res.status(200).json({ data: { needsAcceptance: false, currentVersion: null } });
    }

    const accepted = user.termsAcceptedVersion;

    // Someone who has never accepted anything is prompted regardless of the
    // `requiresReacceptance` flag — that flag governs whether an EXISTING
    // acceptance is invalidated by a change, not whether consent is needed at
    // all.
    const needsAcceptance =
      accepted == null || (accepted < doc.version && doc.requiresReacceptance);

    return res.status(200).json({
      data: {
        needsAcceptance,
        currentVersion: doc.version,
        acceptedVersion: accepted,
        acceptedAt: user.termsAcceptedAt,
        effectiveDate: doc.effectiveDate,
      },
    });
  } catch (error) {
    console.error("legal status failed:", error);
    return res.status(500).json({ message: "Could not load status", error: error.message });
  }
});

export default router;
