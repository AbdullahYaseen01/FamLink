import { rateLimit } from "./rateLimit.js";

/**
 * Shared-secret gate for inbound webhooks that have no other auth.
 * Expects header `x-webhook-secret` (or `?secret=` for providers that can't set headers).
 * Fails closed when PHANTOMBUSTER_WEBHOOK_SECRET is unset.
 */
export const requireWebhookSecret = (envName) => (req, res, next) => {
  const expected = process.env[envName];
  if (!expected || !String(expected).trim()) {
    console.error(`[webhook] ${envName} is not set — rejecting request`);
    return res.status(503).json({ message: "Webhook not configured" });
  }

  const provided =
    req.headers["x-webhook-secret"] ||
    req.headers["x-phantombuster-secret"] ||
    (typeof req.query?.secret === "string" ? req.query.secret : null);

  if (!provided || provided !== expected) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  return next();
};

export const phantombusterWebhookLimit = rateLimit({
  name: "phantombuster-webhook",
  limit: 30,
  windowSec: 60,
  message: "Too many webhook requests. Please try again shortly.",
});
