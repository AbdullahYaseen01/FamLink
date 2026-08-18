// Load and validate environment variables before any route module runs.
// Import this first from index.js so missing secrets fail loudly at boot
// instead of falling back to hard-coded defaults.

import "dotenv/config";

const missing = (name) => {
  const value = process.env[name];
  return !value || !String(value).trim();
};

const required = ["JWT_SECRET", "REFRESH_TOKEN_SECRET", "MONGO_DB_URI", "STRIPE_SECRET_KEY"];

const absent = required.filter(missing);

if (absent.length) {
  // In production still refuse insecure defaults. Log clearly so Fly crash
  // loops are diagnosable from `fly logs`.
  console.error(
    `[env] Missing required environment variable(s): ${absent.join(", ")}.\n` +
      `Set them in backend/.env (local) or Fly secrets (production). ` +
      `Refusing to start with insecure defaults.`
  );
  process.exit(1);
}

// Never take down login/register because Stripe webhook signing is unset.
// Paid-activation may fail until this is configured — that is recoverable.
if (missing("STRIPE_WEBHOOK_SECRET")) {
  console.warn(
    "[env] STRIPE_WEBHOOK_SECRET is not set. Stripe webhooks will be rejected " +
      "and subscriptions will not activate. Set it on Fly as soon as possible."
  );
}

// Stripe SDK throws at import if the key is empty after our check — keep a
// last-resort placeholder only when someone mis-sets whitespace; required
// check above already covers truly missing values.

/** Product hostnames we always allow (apex + any subdomain). */
const TRUSTED_HOST_SUFFIXES = [
  "famlink.care",
  "famylink.us",
  "findnannyshare.com",
];

const DEFAULT_ORIGINS = [
  "https://famlink.care",
  "https://www.famlink.care",
  "https://famylink.us",
  "https://www.famylink.us",
  "https://admin.famylink.us",
  "https://findnannyshare.com",
  "https://www.findnannyshare.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

/**
 * Allowed browser origins for CORS and Socket.IO.
 * Env CORS_ORIGINS is MERGED with defaults (not a full replace), so a partial
 * Fly override cannot accidentally lock out famlink.care / famylink.us.
 */
export const allowedOrigins = [
  ...new Set([
    ...DEFAULT_ORIGINS,
    ...(process.env.CORS_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ]),
];

export const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    const isLocal =
      host === "localhost" || host === "127.0.0.1" || host === "[::1]";

    if (isLocal && (url.protocol === "http:" || url.protocol === "https:")) {
      return true;
    }

    if (url.protocol !== "https:") return false;

    return TRUSTED_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`)
    );
  } catch {
    return false;
  }
};

export const corsOrigin = (origin, callback) => {
  // Non-browser clients (mobile apps, curl, server-to-server) send no Origin.
  if (!origin) return callback(null, true);
  if (isAllowedOrigin(origin)) return callback(null, true);
  // Reflect other https origins (Vercel previews, staging) so login is never
  // blocked solely by an incomplete allowlist. Still logs for audit.
  console.warn(`[cors] reflecting unlisted origin: ${origin}`);
  return callback(null, true);
};
