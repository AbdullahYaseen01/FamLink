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
  console.error(
    `[env] Missing required environment variable(s): ${absent.join(", ")}.\n` +
      `Set them in backend/.env (local) or Fly secrets (production). ` +
      `Refusing to start with insecure defaults.`
  );
  process.exit(1);
}

// Webhook signing secret is required in production; without it paid users never
// get activated. In local/dev we only warn so Stripe CLI can be wired later.
if (missing("STRIPE_WEBHOOK_SECRET")) {
  const msg =
    "[env] STRIPE_WEBHOOK_SECRET is not set. Stripe webhooks will be rejected " +
    "and subscriptions will not activate.";
  if (process.env.NODE_ENV === "production") {
    console.error(msg);
    process.exit(1);
  }
  console.warn(msg);
}

/**
 * Allowed browser origins for CORS and Socket.IO.
 * Override with CORS_ORIGINS=https://a.com,https://b.com
 */
export const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  [
    "https://famlink.care",
    "https://www.famlink.care",
    "https://admin.famylink.us",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ].join(",")
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const corsOrigin = (origin, callback) => {
  // Non-browser clients (mobile apps, curl, server-to-server) send no Origin.
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  console.warn(`[cors] blocked origin: ${origin}`);
  return callback(null, false);
};
