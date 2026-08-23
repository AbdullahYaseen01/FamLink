import crypto from "crypto";

/**
 * PhantomBuster and Make.com must send header:
 *   x-webhook-secret: <WEBHOOK_SECRET>
 */
export function verifyWebhookSecret(req, res, next) {
  const expected =
    process.env.WEBHOOK_SECRET || process.env.PHANTOMBUSTER_WEBHOOK_SECRET;
  if (!expected) {
    console.error("WEBHOOK_SECRET is not configured — failing closed");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const provided = req.headers["x-webhook-secret"];
  if (!provided || typeof provided !== "string") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}
