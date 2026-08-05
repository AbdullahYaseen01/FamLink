import EmailLog from "../../Schema/emailLog.js";
import User from "../../Schema/user.js";

// Recording layer for outbound automated email.
//
// The senders in email.js each build a mailOptions object and hand it to
// nodemailer. Rather than adding a log write to all twenty of them — and to
// every one added afterwards, by an author who has to remember — the send is
// wrapped once here and email.js calls the wrapper.
//
// The wrapper is what guarantees the log matches reality: a row is written on
// the success path and on the failure path, from the same place, so the log
// cannot claim a send that didn't happen.

// Cache of address → userId. The senders are handed an email address, not a
// user, so linking the row to an account means a lookup per send; the weekly
// digests send hundreds in a loop and would otherwise do hundreds of identical
// queries. Bounded so a long-running process can't grow it without limit.
const userIdCache = new Map();
const CACHE_MAX = 5000;

const resolveUserId = async (email) => {
  const address = String(email || "").trim().toLowerCase();
  if (!address) return null;

  if (userIdCache.has(address)) return userIdCache.get(address);

  let id = null;
  try {
    const user = await User.findOne({ email: address }).select("_id").lean();
    id = user?._id || null;
  } catch {
    // A lookup failure must not stop the email being logged — an orphan row
    // with a recipient and no userId is still the answer to "did we send it".
    return null;
  }

  if (userIdCache.size >= CACHE_MAX) userIdCache.clear();
  userIdCache.set(address, id);
  return id;
};

// Write a row. Never throws, for the same reason the audit logger doesn't: this
// runs after the mail has already gone, and a logging failure must not turn a
// delivered email into an error the caller retries.
export const recordEmail = async ({
  recipient,
  type,
  subject = "",
  status = "accepted",
  messageId = null,
  error = null,
  campaign = null,
  triggeredBy = null,
  userId,
}) => {
  try {
    await EmailLog.create({
      recipient: String(recipient || "").trim().toLowerCase(),
      type,
      subject: String(subject || "").slice(0, 500),
      status,
      messageId,
      // Provider errors can be kilobytes of SMTP transcript; the first few
      // hundred characters carry the code and the reason, which is the part
      // anyone reads.
      error: error ? String(error).slice(0, 500) : null,
      campaign,
      triggeredBy,
      userId: userId !== undefined ? userId : await resolveUserId(recipient),
      sentAt: new Date(),
    });
  } catch (err) {
    console.error("Email log write failed:", err?.message || err);
  }
};

// ── Retrying a transient failure ────────────────────────────────────────────
// A send that failed for a reason that will have passed a moment later — a
// throttled mailbox, a dropped socket, a provider hiccup — used to lose the
// message outright: sendMail threw, a "failed" row was written, and nothing
// ever tried again. On 2026-08-05 that cost all 72 recipients of the weekly
// digest, none of whom will ever receive it.
//
// Permanent rejections are deliberately not retried. A malformed address or a
// refused sender fails identically the second time, and the attempt spends
// submission rate that the messages behind it need.
const MAX_ATTEMPTS = Number(process.env.EMAIL_SEND_ATTEMPTS) || 3;
const BASE_BACKOFF_MS = Number(process.env.EMAIL_SEND_BACKOFF_MS) || 2000;

const RETRYABLE_CODES = new Set([
  "EAUTH",        // throttle or lockout — see isAuthFailure below
  "ECONNECTION",
  "ESOCKET",
  "ETIMEDOUT",
  "EDNS",
]);

// 535 is nominally a permanent refusal, but Exchange Online returns it for a
// mailbox that is temporarily throttled or locked out, wording it as though the
// password were wrong. That is the case most worth retrying, so it is counted
// as transient rather than taken at its word.
const isAuthFailure = (error) =>
  error?.code === "EAUTH" || Number(error?.responseCode) === 535;

const isRetryable = (error) => {
  if (!error) return false;
  if (RETRYABLE_CODES.has(error.code)) return true;
  const status = Number(error.responseCode);
  // 4xx is SMTP's own "try again later"; 5xx means it will never work.
  return (status >= 400 && status < 500) || status === 535;
};

// A throttled mailbox does not recover inside one message's backoff, and every
// further attempt extends the lockout — retrying is what deepens the hole the
// digest fell into. After a run of consecutive auth failures, stop: the
// remaining recipients are recorded as failed straight away instead of spending
// twelve seconds each to learn the same thing, and the provider gets the quiet
// it is asking for. Any success closes the breaker again.
const BREAKER_THRESHOLD = Number(process.env.EMAIL_BREAKER_THRESHOLD) || 5;
const BREAKER_COOLDOWN_MS = Number(process.env.EMAIL_BREAKER_COOLDOWN_MS) || 10 * 60 * 1000;

let consecutiveAuthFailures = 0;
let breakerOpenUntil = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendWithRetry = async (transporter, mailOptions) => {
  if (Date.now() < breakerOpenUntil) {
    const seconds = Math.ceil((breakerOpenUntil - Date.now()) / 1000);
    const error = new Error(
      `SMTP auth circuit open after ${consecutiveAuthFailures} consecutive ` +
      `authentication failures — not attempting for another ${seconds}s`
    );
    error.code = "ECIRCUITOPEN";
    throw error;
  }

  for (let attempt = 1; ; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      consecutiveAuthFailures = 0;
      return info;
    } catch (error) {
      // Guarded: this file is a module, so it is strict mode, and a thrown
      // primitive would turn an SMTP failure into a confusing TypeError here.
      if (error && typeof error === "object") error.smtpAttempts = attempt;

      if (isAuthFailure(error)) {
        consecutiveAuthFailures++;
        if (consecutiveAuthFailures >= BREAKER_THRESHOLD) {
          breakerOpenUntil = Date.now() + BREAKER_COOLDOWN_MS;
          const cooldown =
            BREAKER_COOLDOWN_MS < 60000
              ? `${Math.round(BREAKER_COOLDOWN_MS / 1000)}s`
              : `${Math.round(BREAKER_COOLDOWN_MS / 60000)} min`;
          console.error(
            `[email] ${consecutiveAuthFailures} consecutive SMTP auth failures — ` +
            `pausing sends for ${cooldown}. Last error: ${error.message}`
          );
          throw error;
        }
      }

      if (attempt >= MAX_ATTEMPTS || !isRetryable(error)) throw error;

      // Exponential, with jitter so a batch that stalled together does not
      // resume in lockstep and re-trip the same limit.
      const backoff = BASE_BACKOFF_MS * 4 ** (attempt - 1);
      await sleep(Math.round(backoff * (0.75 + Math.random() * 0.5)));
    }
  }
};

// Record a send that was deliberately not made — an unsubscribed address, a
// notification preference switched off, a user already emailed this week.
//
// Worth a row of its own. Without one, "she never got the digest" looks
// identical to a bug, and the honest answer (she turned it off in March) is not
// recoverable from anywhere.
export const recordSkipped = (recipient, type, reason) =>
  recordEmail({ recipient, type, status: "skipped", error: reason });

/**
 * Send through `transporter` and log the outcome either way.
 *
 * @param {object} transporter  the nodemailer proxy from email.js
 * @param {object} mailOptions  what nodemailer is given
 * @param {object} meta
 * @param {string} meta.type       stable template name, e.g. "waitlist_confirmation"
 * @param {string} [meta.campaign] groups a bulk send
 * @param {*}      [meta.triggeredBy] admin who started it, for manual sends
 * @returns {Promise<object>} nodemailer's info object
 */
export const sendAndLog = async (transporter, mailOptions, meta = {}) => {
  const { type = "unknown", campaign = null, triggeredBy = null } = meta;
  const recipient = Array.isArray(mailOptions.to)
    ? mailOptions.to.join(", ")
    : mailOptions.to;

  try {
    const info = await sendWithRetry(transporter, mailOptions);
    await recordEmail({
      recipient,
      type,
      subject: mailOptions.subject,
      status: "accepted",
      messageId: info?.messageId || null,
      campaign,
      triggeredBy,
    });
    return info;
  } catch (error) {
    // The log keeps one row per email, so it records the outcome after the
    // retries rather than one row per attempt. The attempt count is folded into
    // the reason — "gave up after 3" and "refused outright" are the same status
    // otherwise, and they call for different responses.
    const attempts = error?.smtpAttempts || 1;
    const reason = error?.message || String(error);
    await recordEmail({
      recipient,
      type,
      subject: mailOptions.subject,
      status: "failed",
      error: attempts > 1 ? `[${attempts} attempts] ${reason}` : reason,
      campaign,
      triggeredBy,
    });
    // Rethrown: the caller's own error handling still runs exactly as it did
    // before this wrapper existed. Logging observes the send, it doesn't
    // swallow it.
    throw error;
  }
};
