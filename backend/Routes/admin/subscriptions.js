import express from "express";
import mongoose from "mongoose";
import Stripe from "stripe";

import User from "../../Schema/user.js";
import { adminOnly, parsePaging, pagingMeta, escapeRegex } from "../../Services/utils/adminAuth.js";
import { logAdminAction } from "../../Services/utils/adminAudit.js";
import { subscriptionTier, referralSummary } from "../../Services/utils/subscriptionTier.js";

const router = express.Router();
router.use(adminOnly);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });

// Subscription and plan management.
//
// The important distinction here, because getting it wrong silently loses
// money: THIS CONSOLE DOES NOT CHANGE ANYTHING IN STRIPE. Stripe is the system
// of record for what a customer is actually billed. What an admin can change is
// the ENTITLEMENT — whether this account gets Plus features — and that is a
// separate fact that happens to usually agree with the billing state.
//
// They come apart in exactly the cases an admin needs a manual override for: a
// comped account for a founding member, access restored after a card failure
// while the customer sorts their bank out, a refund already issued out of band.
// Writing to Stripe from here would turn "give this family a free month" into a
// real charge, or a real cancellation, on a customer's card.
//
// So every override is recorded as a manual grant, is attributable in the audit
// log, and never touches the subscription itself.

const LIST_FIELDS =
  "_id name email type premium subscriptionStatus subscriptionId stripeId " +
  "createdAt lastLogin status referralMatchingUntil referralCount";

/* ═════════════════════════════════ LIST ═══════════════════════════════════ */

// GET /admin/subscriptions?tier=free|plus|past_due|canceled&search=&page=&limit=
router.get("/", async (req, res) => {
  try {
    const paging = parsePaging(req.query);
    const query = { status: { $ne: "Deleted" }, type: { $in: ["Parents", "Nanny"] } };

    const { tier, search } = req.query;

    if (tier === "plus") query.premium = true;
    if (tier === "free") {
      query.premium = { $ne: true };
      query.subscriptionStatus = { $in: [null, "", "canceled", "cancelled"] };
      // An active referrer is not on the free plan — they are listed under
      // `referral`. Without this they show up under both filters.
      query.referralMatchingUntil = { $not: { $gt: new Date() } };
    }
    if (tier === "past_due") query.subscriptionStatus = { $in: ["past_due", "unpaid"] };
    if (tier === "canceled") query.subscriptionStatus = { $in: ["canceled", "cancelled"] };
    // Caregivers who keep matching free by referring friends. A real tier in
    // practice — they pay nothing and are not on the free plan either — so the
    // console can filter for them.
    if (tier === "referral") query.referralMatchingUntil = { $gt: new Date() };

    if (search) {
      const term = new RegExp(escapeRegex(String(search).trim()), "i");
      query.$or = [{ name: term }, { email: term }];
    }

    const [users, totalRecords] = await Promise.all([
      User.find(query).select(LIST_FIELDS).sort({ createdAt: -1 })
        .skip(paging.skip).limit(paging.limit).lean(),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      data: users.map((user) => ({
        ...user,
        // Shared with /admin/users so an account cannot read "Free" on one
        // screen and "Referral" on the other.
        tier: subscriptionTier(user),
        // Whether the entitlement and the billing state agree. When they don't,
        // it is usually a deliberate manual grant — but it is also what a
        // failed webhook looks like, so the console surfaces it rather than
        // picking one of the two to display.
        billingMatchesEntitlement:
          user.premium === ["active", "trialing"].includes((user.subscriptionStatus || "").toLowerCase()),
        ...referralSummary(user),
      })),
      pagination: pagingMeta(totalRecords, paging),
    });
  } catch (error) {
    console.error("admin/subscriptions list failed:", error);
    return res.status(500).json({ message: "Could not load subscriptions", error: error.message });
  }
});

// GET /admin/subscriptions/stats
router.get("/stats", async (req, res) => {
  try {
    const members = { status: { $ne: "Deleted" }, type: { $in: ["Parents", "Nanny"] } };

    const [total, premium, byStatus, referralFree, mismatched] = await Promise.all([
      User.countDocuments(members),
      User.countDocuments({ ...members, premium: true }),
      User.aggregate([
        { $match: { ...members, subscriptionStatus: { $nin: [null, ""] } } },
        { $group: { _id: "$subscriptionStatus", count: { $sum: 1 } } },
      ]),
      User.countDocuments({ ...members, referralMatchingUntil: { $gt: new Date() } }),
      // Entitlement and billing out of step. Small numbers are normal (manual
      // grants); a jump means webhooks have stopped landing, which is worth
      // seeing on the dashboard rather than discovering from a support ticket.
      User.countDocuments({
        ...members,
        $or: [
          { premium: true, subscriptionStatus: { $in: ["canceled", "cancelled", "unpaid", null] } },
          { premium: { $ne: true }, subscriptionStatus: "active" },
        ],
      }),
    ]);

    return res.status(200).json({
      data: {
        totalMembers: total,
        premium,
        free: total - premium,
        conversionRate: total ? Math.round((premium / total) * 100) : 0,
        byStripeStatus: byStatus,
        referralFreeActive: referralFree,
        entitlementMismatches: mismatched,
      },
    });
  } catch (error) {
    console.error("admin/subscriptions stats failed:", error);
    return res.status(500).json({ message: "Could not load stats", error: error.message });
  }
});

/* ═══════════════════════════ STRIPE DETAIL ════════════════════════════════ */

// GET /admin/subscriptions/:userId/stripe
//
// The live billing state, read straight from Stripe. Read-only, and separate
// from the list on purpose: it is a network call per user, so it happens when
// an admin opens one record rather than for every row of a table.
router.get("/:userId/stripe", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(userId).select("stripeId subscriptionId email name").lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.stripeId) {
      return res.status(200).json({
        data: { hasStripeCustomer: false, note: "This member has never started a checkout." },
      });
    }

    const [subscriptions, invoices] = await Promise.all([
      stripe.subscriptions.list({ customer: user.stripeId, limit: 10, status: "all" }),
      stripe.invoices.list({ customer: user.stripeId, limit: 10 }),
    ]);

    return res.status(200).json({
      data: {
        hasStripeCustomer: true,
        customerId: user.stripeId,
        subscriptions: subscriptions.data.map((s) => ({
          id: s.id,
          status: s.status,
          currentPeriodEnd: s.current_period_end ? new Date(s.current_period_end * 1000) : null,
          cancelAtPeriodEnd: s.cancel_at_period_end,
          amount: s.items?.data?.[0]?.price?.unit_amount ?? null,
          currency: s.currency,
          interval: s.items?.data?.[0]?.price?.recurring?.interval ?? null,
        })),
        invoices: invoices.data.map((i) => ({
          id: i.id,
          status: i.status,
          amountPaid: i.amount_paid,
          currency: i.currency,
          created: new Date(i.created * 1000),
          hostedUrl: i.hosted_invoice_url,
        })),
      },
    });
  } catch (error) {
    console.error("admin/subscriptions stripe failed:", error);
    // A Stripe outage or a bad key must not read as "this member has no
    // subscription", which is what a generic 500 would look like on the screen.
    return res.status(502).json({
      message: "Could not reach Stripe. The entitlement shown elsewhere is unaffected.",
      error: error.message,
    });
  }
});

/* ═══════════════════════════ MANUAL OVERRIDE ══════════════════════════════ */

// PUT /admin/subscriptions/:userId/plan   { plan: "plus"|"free", reason, months? }
//
// Grants or revokes the Plus entitlement by hand. Does NOT touch Stripe — see
// the note at the top of this file.
router.put("/:userId/plan", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const { plan } = req.body || {};
    if (!["plus", "free"].includes(plan)) {
      return res.status(400).json({ message: 'Plan must be "plus" or "free".' });
    }

    const reason = String(req.body?.reason || "").trim();
    if (reason.length < 10) {
      return res.status(400).json({
        message: "A reason of at least 10 characters is required for a manual plan change.",
      });
    }

    const user = await User.findById(userId).select("premium subscriptionStatus name email").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    // `subscriptionStatus` is deliberately left alone. It mirrors what Stripe
    // last told us, and overwriting it here would make the next webhook look
    // like a change that never happened — and would destroy the evidence that
    // this account's access is a manual grant rather than a paid subscription.
    await User.updateOne({ _id: userId }, { $set: { premium: plan === "plus" } });

    await logAdminAction({
      req, action: "user.plan_change", targetUserId: userId, targetType: "subscription",
      reason,
      metadata: {
        from: user.premium ? "plus" : "free",
        to: plan,
        stripeStatusAtTime: user.subscriptionStatus || null,
        manualGrant: true,
        note: "Entitlement only — Stripe billing was not modified.",
      },
    });

    return res.status(200).json({
      message:
        plan === "plus"
          ? "FamLink Plus granted. Stripe billing was not changed — if they should be charged, they need to check out normally."
          : "FamLink Plus removed. Any active Stripe subscription is still billing — cancel it in Stripe if that is intended.",
      data: { plan },
    });
  } catch (error) {
    console.error("admin/subscriptions plan change failed:", error);
    return res.status(500).json({ message: "Could not change the plan", error: error.message });
  }
});

export default router;
