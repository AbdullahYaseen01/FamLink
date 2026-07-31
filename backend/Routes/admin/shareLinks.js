import express from "express";
import mongoose from "mongoose";

import nannyProfile from "../../Schema/nannyProfile.js";
import User from "../../Schema/user.js";

import { adminOnly, parsePaging, pagingMeta, escapeRegex } from "../../Services/utils/adminAuth.js";
import { logAdminAction } from "../../Services/utils/adminAudit.js";
import {
  ensureShareToken,
  shareLinkFor,
  toPublicSharedProfile,
} from "../../Services/utils/shareProfile.js";

const router = express.Router();
router.use(adminOnly);

// Admin control over the public "Share Profile" links.
//
// The links themselves already exist (Services/utils/shareProfile.js): every
// member can mint one for their own profile at /share/<token>, and it renders a
// privacy-safe version of their listing with no login required — built to be
// pasted into a Facebook group or a neighbourhood thread.
//
// What was missing is the console side: seeing every link in one place,
// generating one on a member's behalf, and switching an individual link off.
// That last one is the important addition. Until now the only way to take a
// shared listing down was to delete the profile behind it, which is a far
// bigger hammer than "this person asked me to unlist them for a fortnight".

// The owner fields the public serializer needs. `name` and `imageUrl` are
// deliberately absent — the shared page never shows them, and not selecting
// them means they cannot leak through a serializer bug either.
const OWNER_FIELDS = "type location noOfChildren additionalInfo";

/* ═════════════════════════════════ LIST ═══════════════════════════════════ */

// GET /admin/share-links?search=&enabled=true|false&hasLink=true|false&page=&limit=
router.get("/", async (req, res) => {
  try {
    const paging = parsePaging(req.query);
    const { search, enabled, hasLink } = req.query;

    // The filterable identity (name, email, type) lives on the user and the
    // link lives on the profile, so a search has to resolve users first and
    // then scope the profile query to them. Done in two steps rather than an
    // aggregation $lookup because the user side is the selective one — this
    // way mongo uses the index on `email` instead of scanning every profile.
    const profileQuery = {};

    if (enabled === "true") profileQuery.shareEnabled = { $ne: false };
    if (enabled === "false") profileQuery.shareEnabled = false;
    if (hasLink === "true") profileQuery.shareToken = { $nin: [null, ""] };
    if (hasLink === "false") profileQuery.shareToken = { $in: [null, ""] };

    if (search) {
      const term = new RegExp(escapeRegex(String(search).trim()), "i");
      const matched = await User.find({ $or: [{ name: term }, { email: term }] })
        .select("_id")
        .limit(500)
        .lean();
      profileQuery.userId = { $in: matched.map((u) => u._id) };
    }

    const [profiles, totalRecords] = await Promise.all([
      nannyProfile
        .find(profileQuery)
        .select(
          "userId shareToken shareEnabled shareViewCount shareLastViewedAt " +
            "shareDisabledAt createdAt nannyShareType hasNanny hasFamily"
        )
        .populate("userId", "name email type status location.city")
        .sort({ shareViewCount: -1, createdAt: -1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .lean(),
      nannyProfile.countDocuments(profileQuery),
    ]);

    const data = profiles
      // A profile whose owner has been deleted has nothing to show and no link
      // worth toggling.
      .filter((profile) => profile.userId)
      .map((profile) => ({
        profileId: profile._id,
        user: {
          _id: profile.userId._id,
          name: profile.userId.name,
          email: profile.userId.email,
          type: profile.userId.type,
          status: profile.userId.status,
          city: profile.userId.location?.city || null,
        },
        token: profile.shareToken || null,
        url: profile.shareToken ? shareLinkFor(profile.shareToken) : null,
        // `!== false` rather than a truthy test: the field defaults to true and
        // every profile that predates it has no value at all, so those must
        // read as enabled.
        enabled: profile.shareEnabled !== false,
        views: profile.shareViewCount || 0,
        lastViewedAt: profile.shareLastViewedAt || null,
        disabledAt: profile.shareDisabledAt || null,
        createdAt: profile.createdAt,
      }));

    return res.status(200).json({ data, pagination: pagingMeta(totalRecords, paging) });
  } catch (error) {
    console.error("admin/share-links list failed:", error);
    return res.status(500).json({ message: "Could not load share links", error: error.message });
  }
});

/* ══════════════════════════ GENERATE / PREVIEW ════════════════════════════ */

// POST /admin/share-links/:userId/generate
//
// Mints the link for a member who hasn't asked for one yet, so an admin can
// post a listing on their behalf. Idempotent: ensureShareToken returns the
// existing token rather than rotating it, because a rotated token breaks every
// URL already out in the world.
router.post("/:userId/generate", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const profile = await nannyProfile.findOne({ userId }).populate("userId", OWNER_FIELDS);
    if (!profile) {
      return res.status(404).json({
        message: "This member has no share profile yet, so there is nothing to link to.",
      });
    }

    const existing = profile.shareToken;
    const token = await ensureShareToken(profile);
    if (!token) {
      return res.status(500).json({ message: "Could not create a share link" });
    }

    // Generating also switches the link on. An admin who asked for a link and
    // got a dead one would reasonably call that a bug.
    if (profile.shareEnabled === false) {
      await nannyProfile.updateOne(
        { _id: profile._id },
        { $set: { shareEnabled: true, shareDisabledAt: null, shareToggledBy: req.admin._id } }
      );
    }

    if (!existing) {
      await logAdminAction({
        req, action: "share_link.generate", targetUserId: userId,
        targetType: "nannyProfile", targetId: profile._id,
        reason: "Share link generated from admin console",
      });
    }

    return res.status(200).json({
      data: {
        token,
        url: shareLinkFor(token),
        enabled: true,
        alreadyExisted: Boolean(existing),
      },
    });
  } catch (error) {
    console.error("admin share link generate failed:", error);
    return res.status(500).json({ message: "Could not generate the link", error: error.message });
  }
});

// GET /admin/share-links/:userId/preview
//
// Exactly what a stranger following the link sees — the same serializer the
// public route uses, not a reimplementation. An admin about to paste this into
// a community board needs to see the real thing, and a second copy of the
// redaction logic would be the copy that drifts and leaks a name.
router.get("/:userId/preview", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const profile = await nannyProfile.findOne({ userId }).populate("userId", OWNER_FIELDS);
    if (!profile || !profile.userId) {
      return res.status(404).json({ message: "No share profile for this member" });
    }

    return res.status(200).json({
      data: {
        profile: toPublicSharedProfile(profile.toObject()),
        token: profile.shareToken || null,
        url: profile.shareToken ? shareLinkFor(profile.shareToken) : null,
        enabled: profile.shareEnabled !== false,
      },
    });
  } catch (error) {
    console.error("admin share link preview failed:", error);
    return res.status(500).json({ message: "Could not load the preview", error: error.message });
  }
});

/* ═══════════════════════════════ TOGGLE ═══════════════════════════════════ */

// PUT /admin/share-links/:userId/toggle   { enabled: boolean, reason? }
//
// The visibility switch. Turning it off makes the public route 404 while
// leaving the token in place, so switching it back on revives the SAME url —
// every link already pasted into a group chat starts working again. Revoking by
// deleting the token would make that impossible.
router.put("/:userId/toggle", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const enabled = req.body?.enabled === true;

    const profile = await nannyProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          shareEnabled: enabled,
          shareDisabledAt: enabled ? null : new Date(),
          shareToggledBy: req.admin._id,
        },
      },
      { new: true }
    ).select("shareToken shareEnabled");

    if (!profile) {
      return res.status(404).json({ message: "No share profile for this member" });
    }

    await logAdminAction({
      req, action: "share_link.toggle", targetUserId: userId,
      targetType: "nannyProfile", targetId: profile._id,
      reason: req.body?.reason || (enabled ? "Share link enabled" : "Share link disabled"),
      metadata: { enabled },
    });

    return res.status(200).json({
      message: enabled ? "Share link is live." : "Share link is switched off.",
      data: {
        enabled,
        token: profile.shareToken || null,
        url: profile.shareToken ? shareLinkFor(profile.shareToken) : null,
      },
    });
  } catch (error) {
    console.error("admin share link toggle failed:", error);
    return res.status(500).json({ message: "Could not update the link", error: error.message });
  }
});

export default router;
