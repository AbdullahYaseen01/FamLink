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
    const info = await transporter.sendMail(mailOptions);
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
    await recordEmail({
      recipient,
      type,
      subject: mailOptions.subject,
      status: "failed",
      error: error?.message || String(error),
      campaign,
      triggeredBy,
    });
    // Rethrown: the caller's own error handling still runs exactly as it did
    // before this wrapper existed. Logging observes the send, it doesn't
    // swallow it.
    throw error;
  }
};
