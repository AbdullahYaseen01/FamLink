import nodemailer from "nodemailer";
import dns from "node:dns";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import User from "../../Schema/user.js";
import nannyProfile from "../../Schema/nannyProfile.js";
import { signUnsubscribe } from "../utils/unsubscribeToken.js";

// Prefer IPv4 for outbound connections. On dual-stack machines Node may connect
// over IPv6, whose address often rotates — which trips provider IP allow-lists
// (e.g. Brevo "Authorised IPs" → 525 5.7.1 Unauthorized IP address). Forcing
// IPv4 makes the source IP predictable so it can be authorized.
if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first");
}

// Load environment variables
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_USER = process.env.EMAIL_USER || ""; // Your Email address
const EMAIL_PASS = process.env.EMAIL_PASS || ""; // Your Email app password
const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 587; // 587 = STARTTLS, 465 = implicit SSL
// `secure` must be true for port 465 and false for 587/25 (STARTTLS).
// Set EMAIL_SECURE=true/false to override the port-based default explicitly.
const EMAIL_SECURE = process.env.EMAIL_SECURE
    ? process.env.EMAIL_SECURE === "true"
    : EMAIL_PORT === 465;

// Default "From" address. Must be a sender/domain you've verified with your
// email provider (e.g. Brevo). Format: "Display Name <address@domain>".
const EMAIL_FROM = process.env.EMAIL_FROM || "Famlink <noreply@famlink.care>";

// From / Reply-To for automated (transactional) emails. Falls back to
// EMAIL_FROM so deliverability is never worse than before when the dedicated
// mailbox isn't verified with the provider yet.
// NOTE: Founder emails (templates 07, 08, 14, 15, 16) are NOT sent from the
// backend — they go out through the email campaign app. Their .html files live
// in Automated Emails/ purely as the design source of truth.
const FROM_AUTOMATED = process.env.EMAIL_FROM_AUTOMATED || EMAIL_FROM;
const REPLY_SUPPORT = process.env.EMAIL_REPLY_SUPPORT || "support@famlink.care";

// Base URLs for links/assets used in transactional emails.
// Host the `Automated Emails/images` folder somewhere public and point
// EMAIL_ASSET_BASE at it so the hero images resolve in the email.
const APP_URL = process.env.APP_URL || process.env.CLIENT_URL || "https://www.famlink.care";
const EMAIL_ASSET_BASE = process.env.EMAIL_ASSET_BASE || `${APP_URL}/email-assets`;

// Folder holding the canonical HTML email templates. These files are the single
// source of truth for transactional email markup — edit the .html, not JS.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, "../../Automated Emails");

// ── Auth mode: Microsoft 365 OAuth2 (app-only) with basic-auth fallback ──
// When the OAuth2 env vars are present, authenticate to Office 365 SMTP with an
// Entra ID app via the client-credentials flow (no password). Otherwise fall
// back to basic auth using EMAIL_USER / EMAIL_PASS.
const OAUTH_TENANT_ID = process.env.EMAIL_OAUTH_TENANT_ID || "";
const OAUTH_CLIENT_ID = process.env.EMAIL_OAUTH_CLIENT_ID || "";
const OAUTH_CLIENT_SECRET = process.env.EMAIL_OAUTH_CLIENT_SECRET || "";
const USE_OAUTH2 = Boolean(OAUTH_TENANT_ID && OAUTH_CLIENT_ID && OAUTH_CLIENT_SECRET);

// Cached Office 365 access token (valid ~60 min); refreshed on demand.
let tokenCache = { accessToken: null, expiresAt: 0 };

const fetchM365Token = async () => {
    const now = Date.now();
    // Reuse the cached token until 5 minutes before it expires.
    if (tokenCache.accessToken && tokenCache.expiresAt - now > 5 * 60 * 1000) {
        return tokenCache.accessToken;
    }
    const tokenUrl = `https://login.microsoftonline.com/${OAUTH_TENANT_ID}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
        client_id: OAUTH_CLIENT_ID,
        client_secret: OAUTH_CLIENT_SECRET,
        grant_type: "client_credentials",
        scope: "https://outlook.office365.com/.default",
    });
    const response = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    });
    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Microsoft 365 OAuth2 token request failed (${response.status}): ${detail}`);
    }
    const data = await response.json();
    tokenCache = {
        accessToken: data.access_token,
        expiresAt: now + Number(data.expires_in || 3600) * 1000,
    };
    return tokenCache.accessToken;
};

// Build (and memoize) the underlying nodemailer transport. For OAuth2 we
// recreate it whenever the access token changes.
let _transport = null;
let _transportToken = null;

const getTransport = async () => {
    if (!USE_OAUTH2) {
        if (!_transport) {
            _transport = nodemailer.createTransport({
                host: EMAIL_HOST,
                port: EMAIL_PORT,
                secure: EMAIL_SECURE,
                auth: { user: EMAIL_USER, pass: EMAIL_PASS },
                tls: { rejectUnauthorized: false },
            });
        }
        return _transport;
    }

    const accessToken = await fetchM365Token();
    if (!_transport || _transportToken !== accessToken) {
        _transport = nodemailer.createTransport({
            host: EMAIL_HOST,
            port: EMAIL_PORT,
            secure: EMAIL_SECURE,
            auth: {
                type: "OAuth2",
                user: EMAIL_USER,
                accessToken,
            },
            tls: { rejectUnauthorized: false },
        });
        _transportToken = accessToken;
    }
    return _transport;
};

// Thin proxy so every existing sender (callback- or promise-based) keeps working
// unchanged while auth/token is resolved lazily on each send.
const transporter = {
    async sendMail(mailOptions, callback) {
        try {
            const transport = await getTransport();
            const info = await transport.sendMail(mailOptions);
            if (callback) return callback(null, info);
            return info;
        } catch (error) {
            if (callback) return callback(error);
            throw error;
        }
    },
    async verify(callback) {
        try {
            const transport = await getTransport();
            const result = await transport.verify();
            if (callback) return callback(null, result);
            return result;
        } catch (error) {
            if (callback) return callback(error);
            throw error;
        }
    },
};

// Verify the connection/credentials at startup, so a misconfiguration is
// obvious in the logs instead of failing silently on the first send.
transporter.verify((error) => {
    if (error) {
        console.error(
            `❌ Email transporter failed to connect/authenticate ` +
            `(mode=${USE_OAUTH2 ? "OAuth2" : "basic"}, host=${EMAIL_HOST}, port=${EMAIL_PORT}, secure=${EMAIL_SECURE}, user=${EMAIL_USER || "<empty>"}). ` +
            (USE_OAUTH2
                ? `Check EMAIL_OAUTH_TENANT_ID / EMAIL_OAUTH_CLIENT_ID / EMAIL_OAUTH_CLIENT_SECRET, that the app has the Office 365 "SMTP.SendAsApp" application permission with admin consent, that a service principal for it has been granted access to ${EMAIL_USER}, and that SMTP AUTH is enabled for that mailbox. `
                : `Check EMAIL_HOST / EMAIL_PORT / EMAIL_SECURE / EMAIL_USER / EMAIL_PASS. `) +
            `Reason:`,
            error.message
        );
    } else {
        console.log(
            `✅ Email transporter ready (mode=${USE_OAUTH2 ? "OAuth2" : "basic"}, host=${EMAIL_HOST}, port=${EMAIL_PORT}, secure=${EMAIL_SECURE}).`
        );
    }
});

// Function to send OTP email
export const sendOtpEmail = (email, otp) => {
    const mailOptions = {
        from: EMAIL_FROM, // sender (must be verified with your email provider)
        to: email,
        subject: "🔐 Verify Your Email - OTP Inside!",
        html: `
            <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; text-align: center;">
                <div style="max-width: 500px; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #4A90E2; font-size: 22px; margin-bottom: 10px;">🔒 Email Verification</h2>
                    <p style="font-size: 16px; color: #333;">Hey there! You're one step away from unlocking full access.</p>
                    <p style="font-size: 18px; font-weight: bold; color: #ff6b6b;">Your OTP Code:</p>
                    <p style="font-size: 24px; font-weight: bold; color: #4A90E2; background: #f0f0f0; padding: 10px 20px; border-radius: 8px; display: inline-block;">
                        ${otp}
                    </p>
                    <p style="font-size: 14px; color: #666;">This code expires in 2 minutes. Please do not share it with anyone.</p>
                    <p style="font-size: 12px; color: #999; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
                </div>
            </div>
        `
    };


    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
        } else {
            console.log("Email sent: " + info.response);
        }
    });
};

// ── Shared template emails (see backend/Automated Emails/) ───────────────────

const firstNameOf = (name) =>
    (name || "there").toString().trim().split(" ")[0] || "there";

// Escape user-provided values interpolated into HTML (names, etc.).
const escapeHtml = (value) =>
    (value === undefined || value === null ? "" : String(value))
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

// Read a template from backend/Automated Emails/ once and cache it.
const TEMPLATE_CACHE = new Map();
const loadTemplate = (fileName) => {
    let html = TEMPLATE_CACHE.get(fileName);
    if (html === undefined) {
        html = readFileSync(path.join(TEMPLATES_DIR, fileName), "utf8");
        TEMPLATE_CACHE.set(fileName, html);
    }
    return html;
};

// Render a template: substitute every {{token}} from `values`, then rewrite the
// templates' relative `images/...` hero paths to the hosted EMAIL_ASSET_BASE so
// they resolve in email clients (relative paths don't work in email).
// Escape a string for safe use inside a RegExp.
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Render a template: substitute every {{ token }} (whitespace inside the braces
// is tolerated, so both {{first_name}} and {{ first_name }} match) from `values`,
// then rewrite any relative `images/...` asset paths to the hosted
// EMAIL_ASSET_BASE so they resolve in email clients. A function replacer is used
// so a literal `$` inside a value is never treated as a RegExp back-reference.
const renderTemplate = (fileName, values) => {
    let html = loadTemplate(fileName);
    for (const [token, value] of Object.entries(values)) {
        const re = new RegExp(`\\{\\{\\s*${escapeRegExp(token)}\\s*\\}\\}`, "g");
        html = html.replace(re, () => (value == null ? "" : String(value)));
    }
    return html
        .split("url('images/").join(`url('${EMAIL_ASSET_BASE}/`)
        .split('src="images/').join(`src="${EMAIL_ASSET_BASE}/`);
};

// Footer links shared by every template. Each points at a route that exists in
// frontend/src/App.jsx. The unsubscribe link is signed with an HMAC of the
// recipient's address so /unsubscribe works with one click and no login, as
// CAN-SPAM requires — see Routes/unsubscribe.js for the matching verification.
const footerLinks = (email) => ({
    unsubscribe_url: email
        ? `${APP_URL}/unsubscribe?email=${encodeURIComponent(
              email
          )}&token=${signUnsubscribe(email)}`
        : `${APP_URL}/dashboard/setting`,
    privacy_url: `${APP_URL}/terms-and-conditions`,
    // Automated emails point at the system mailbox; founder emails (sent from
    // the campaign app) use ari@famlink.care instead.
    contact_url: "mailto:system@famlink.care",
});

// ── Avatar + family-preview-card helpers ─────────────────────────────────────
// Several templates show contact "cards" (a sender/match card, or a list of
// nearby families). These helpers turn raw user/profile records into the exact
// markup the templates expect. Everything is defensive: any missing field falls
// back to a sensible default and any query error yields an empty section rather
// than a broken email.

const AVATAR_COLORS = ["avatar-lavender", "avatar-mint", "avatar-coral", "avatar-sky"];

// Deterministically pick one of the four avatar tints from a seed (id or name)
// so the same person always gets the same colour.
const pickAvatarColor = (seed) => {
    const s = String(seed || "");
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

// First visible character of a name, uppercased (for the avatar circle).
const initialOf = (name) => (String(name || "").trim().charAt(0) || "F").toUpperCase();

// "Jane Doe" -> "The Doe Family". Falls back gracefully for single-word names.
const familyLabelFrom = (name) => {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "A FamLink Family";
    return `The ${parts[parts.length - 1]} Family`;
};

// Truncate a message body to a short preview for the new-message email.
const previewOf = (text, max = 100) => {
    const s = String(text || "").replace(/\s+/g, " ").trim();
    if (!s) return "You've got a new message";
    return s.length > max ? s.slice(0, max) : s;
};

// Build a "1 child, age 2" / "2 children, ages 1 & 3" summary from a nanny
// profile (preferred) or the user's noOfChildren field. Returns "" if unknown.
const childSummaryFrom = (profile, user) => {
    const ages = profile?.childrenAges;
    if (Array.isArray(ages) && ages.length) {
        const label = ages.length === 1 ? "1 child" : `${ages.length} children`;
        const ageStrs = ages
            .map((a) =>
                a?.value != null
                    ? `${a.value}${a.unit === "months" ? "mo" : ""}`
                    : null
            )
            .filter(Boolean);
        if (ageStrs.length === 1) return `${label}, age ${ageStrs[0]}`;
        if (ageStrs.length > 1) return `${label}, ages ${ageStrs.join(" & ")}`;
        return label;
    }
    const num = profile?.numberOfChildren;
    if (num) return Number(num) === 1 ? "1 child" : `${num} children`;
    const raw = user?.noOfChildren;
    const n = typeof raw === "number" ? raw : parseInt(raw, 10);
    if (n && !Number.isNaN(n)) return n === 1 ? "1 child" : `${n} children`;
    return "";
};

// Find up to `limit` other active, complete family profiles near the recipient.
// Prefers a geo ($near) query and falls back to same-city; returns [] on any
// problem (no location, query error, etc.).
const getNearbyFamilies = async (recipient, limit = 3) => {
    try {
        if (!recipient?._id) return [];
        const baseFilter = {
            _id: { $ne: recipient._id },
            type: "Parents",
            status: "Active",
            nannyProfileCompleted: true,
        };
        const coords = recipient?.location?.coordinates;
        let users = [];
        if (Array.isArray(coords) && coords.length === 2) {
            users = await User.find({
                ...baseFilter,
                location: {
                    $near: {
                        $geometry: { type: "Point", coordinates: coords },
                        $maxDistance: 40000, // ~25 miles
                    },
                },
            })
                .limit(limit)
                .lean();
        }
        const city = recipient?.location?.city;
        if ((!users || users.length === 0) && city) {
            users = await User.find({ ...baseFilter, "location.city": city })
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean();
        }
        return users || [];
    } catch (err) {
        console.error("getNearbyFamilies failed:", err?.message || err);
        return [];
    }
};

// Render a single family card matching the templates' markup.
const renderFamilyCard = (user, profile, { showLock = false, showNewBadge = false } = {}) => {
    const color = pickAvatarColor(user?._id || user?.name);
    const initial = escapeHtml(initialOf(user?.name));
    const name = escapeHtml(familyLabelFrom(user?.name));
    const hood = escapeHtml(
        user?.location?.neighborhood || user?.location?.city || "Nearby"
    );
    const kids = escapeHtml(childSummaryFrom(profile, user));
    const meta = kids ? `${hood} &middot; ${kids}` : hood;
    const schedule = escapeHtml(profile?.nannyShareType || "");
    const hasNanny = profile?.hasNanny === true;
    const statusText = hasNanny ? "Has a nanny" : "Looking for nanny";
    const statusClass = hasNanny ? "pill-green" : "pill-beige";

    const pills = [];
    if (schedule) pills.push(`<span class="pill pill-blue">${schedule}</span>`);
    pills.push(`<span class="pill ${statusClass}">${statusText}</span>`);
    if (showNewBadge) pills.push(`<span class="new-badge">New</span>`);
    const lock = showLock ? `<div class="family-lock">🔒</div>` : "";

    return `
        <div class="family-card">
          <div class="family-avatar ${color}">${initial}</div>
          <div class="family-info">
            <div class="family-name">${name}</div>
            <div class="family-meta">${meta}</div>
            <div class="family-pills">${pills.join("")}</div>
          </div>${lock}
        </div>`;
};

// Build the full "families near you" section (label + cards + optional note) for
// the {{ family_preview_section }} token. Returns "" when there are no nearby
// families so the surrounding email renders cleanly with nothing missing.
const buildFamilyPreviewSection = async (
    recipient,
    { label, showLock = false, showNote = false, showNewBadge = false } = {}
) => {
    const users = await getNearbyFamilies(recipient, 3);
    if (!users.length) return "";
    let byUser = new Map();
    try {
        const profiles = await nannyProfile
            .find({ userId: { $in: users.map((u) => u._id) } })
            .lean();
        byUser = new Map(profiles.map((p) => [String(p.userId), p]));
    } catch (err) {
        console.error("buildFamilyPreviewSection profile lookup failed:", err?.message || err);
    }
    const cards = users
        .map((u) => renderFamilyCard(u, byUser.get(String(u._id)), { showLock, showNewBadge }))
        .join("\n");
    const note = showNote
        ? `<div class="preview-blur-note">Complete your profile to see full details and connect.</div>`
        : "";
    return `
    <div class="preview-section">
      <div class="preview-section-label">${escapeHtml(label || "Families near you")}</div>
      <div class="family-cards">${cards}
      </div>
      ${note}
    </div>`;
};

// Build + send a template email. Returns a Promise that resolves with send info.
const sendTemplateEmail = ({ email, subject, fileName, values, from, replyTo }) =>
    new Promise((resolve, reject) => {
        let html;
        try {
            html = renderTemplate(fileName, { ...footerLinks(email), ...values });
        } catch (error) {
            console.error(`Error rendering email template "${fileName}":`, error);
            return reject(error);
        }
        const mailOptions = {
            from: from || FROM_AUTOMATED,
            to: email,
            subject,
            html,
            replyTo: replyTo || REPLY_SUPPORT,
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(`Error sending email "${subject}":`, error);
                reject(error);
            } else {
                console.log(`Email sent ("${subject}"): ` + info.response);
                resolve(info);
            }
        });
    });

// 01. Welcome — after sign up / email verification.
// `recipient` (the full user doc, optional) powers the "families near you" cards.
export const sendWelcomeEmail = async (email, name, recipient) =>
    sendTemplateEmail({
        email,
        subject: "Welcome to FamLink! 🎉",
        fileName: "01_welcome.html",
        values: {
            first_name: escapeHtml(firstNameOf(name)),
            family_preview_section: await buildFamilyPreviewSection(recipient, {
                label: "🏠 Families near you already on FamLink",
                showLock: true,
                showNote: true,
            }),
        },
    });

// 02. Complete your profile (reminder — sent by the cron job in
// Services/cron/completeProfileReminder.js). `recipient` powers the cards.
export const sendCompleteProfileEmail = async (email, name, recipient) =>
    sendTemplateEmail({
        email,
        subject: "You're almost there — finish your profile",
        fileName: "02_complete_profile.html",
        values: {
            first_name: escapeHtml(firstNameOf(name)),
            family_preview_section: await buildFamilyPreviewSection(recipient, {
                label: "🏠 Families near you waiting to connect",
                showLock: true,
                showNote: true,
            }),
        },
    });

// 03. Subscription confirmed (FamLink Plus).
export const sendSubscriptionConfirmedEmail = (email, name) =>
    sendTemplateEmail({
        email,
        subject: "You're all set! Your FamLink Plus membership is active 🎉",
        fileName: "03_famlink_plus.html",
        values: { first_name: escapeHtml(firstNameOf(name)) },
    });

// 04. New match request received. `sender` = { name, location, summary, id }
// describes the person who sent the request (shown on the sender card).
export const sendMatchRequestEmail = (email, name, sender = {}) =>
    sendTemplateEmail({
        email,
        subject: "Someone wants to connect with you on FamLink 👋",
        fileName: "04_match_request.html",
        values: {
            first_name: escapeHtml(firstNameOf(name)),
            sender_name: escapeHtml(sender.name || "A FamLink member"),
            sender_location: escapeHtml(sender.location || "Nearby"),
            sender_summary: escapeHtml(
                sender.summary || "Exploring a nanny share on FamLink."
            ),
            sender_avatar_initial: escapeHtml(initialOf(sender.name)),
            sender_avatar_color: pickAvatarColor(sender.id || sender.name),
            request_url: `${APP_URL}/dashboard/requests`,
        },
    });

// 05. Match request accepted ("It's a match"). `match` = { name, location,
// summary, id } describes the person who accepted (shown on the match card).
export const sendMatchAcceptedEmail = (email, name, matchName, match = {}) => {
    const displayMatch = matchName || match.name || "Someone";
    return sendTemplateEmail({
        email,
        subject: `It's a match! 🎉 ${displayMatch} accepted your request`,
        fileName: "05_match_accepted.html",
        values: {
            first_name: escapeHtml(firstNameOf(name)),
            match_name: escapeHtml(displayMatch),
            match_location: escapeHtml(match.location || "Nearby"),
            match_summary: escapeHtml(
                match.summary || "You're now connected on FamLink."
            ),
            match_avatar_initial: escapeHtml(initialOf(displayMatch)),
            match_avatar_color: pickAvatarColor(match.id || displayMatch),
            message_url: `${APP_URL}/dashboard/message`,
        },
    });
};

// 06. New message received (recipient offline). `messagePreview` is the raw
// message body; it's truncated to ~100 chars for the preview card.
export const sendNewMessageEmail = (email, name, senderName, messagePreview = "", sender = {}) =>
    sendTemplateEmail({
        email,
        subject: `${senderName || "Someone"} sent you a message on FamLink 💬`,
        fileName: "06_new_message.html",
        values: {
            first_name: escapeHtml(firstNameOf(name)),
            sender_name: escapeHtml(senderName || "Someone"),
            sender_avatar_initial: escapeHtml(initialOf(senderName)),
            sender_avatar_color: pickAvatarColor(sender.id || senderName),
            message_preview: escapeHtml(previewOf(messagePreview)),
            reply_url: `${APP_URL}/dashboard/message`,
        },
    });

// Templates 07 & 08 (platform-launch founder broadcasts) are sent from the
// email campaign app, not from here.

// 09. Oakland awareness / city campaign (no per-user variables).
export const sendOaklandAwarenessEmail = (email) =>
    sendTemplateEmail({
        email,
        subject: "The childcare option most Oakland families overlook",
        fileName: "09_oakland_awareness.html",
        values: {},
    });

// 10. Password reset. `resetUrl` is the one-time reset-link (expires 1h).
export const sendPasswordResetEmail = (email, name, resetUrl, requestTime) =>
    sendTemplateEmail({
        email,
        subject: "Reset your FamLink password",
        fileName: "10_password_reset.html",
        values: {
            first_name: escapeHtml(firstNameOf(name)),
            reset_url: resetUrl,
            request_time: escapeHtml(
                requestTime ||
                    new Date().toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                    })
            ),
        },
    });

// 11. Profile updated confirmation. `updatedFields` is a human-readable list.
export const sendProfileUpdatedEmail = (email, name, updatedFields) =>
    sendTemplateEmail({
        email,
        subject: "Your FamLink profile has been updated",
        fileName: "11_profile_updated.html",
        values: {
            first_name: escapeHtml(firstNameOf(name)),
            updated_fields: escapeHtml(updatedFields || "your profile details"),
            profile_url: `${APP_URL}/dashboard/edit`,
        },
    });

// 12. Weekly nanny-share resources digest. `resources` is an array of up to 3
// { title, desc, url, tag } objects. Call from a weekly cron when ready.
export const sendWeeklyResourcesEmail = (email, name, { weekOf, resources = [] } = {}) => {
    const r = (i) => resources[i] || {};
    return sendTemplateEmail({
        email,
        subject: `This week on FamLink: ${r(0).title || "new resources"} + more`,
        fileName: "12_weekly_resources.html",
        values: {
            first_name: escapeHtml(firstNameOf(name)),
            week_of: escapeHtml(weekOf || ""),
            resource_1_title: escapeHtml(r(0).title || ""),
            resource_1_desc: escapeHtml(r(0).desc || ""),
            resource_1_url: r(0).url || `${APP_URL}/resources`,
            resource_1_tag: escapeHtml(r(0).tag || "Guide"),
            resource_2_title: escapeHtml(r(1).title || ""),
            resource_2_desc: escapeHtml(r(1).desc || ""),
            resource_2_url: r(1).url || `${APP_URL}/resources`,
            resource_2_tag: escapeHtml(r(1).tag || "Tip"),
            resource_3_title: escapeHtml(r(2).title || ""),
            resource_3_desc: escapeHtml(r(2).desc || ""),
            resource_3_url: r(2).url || `${APP_URL}/resources`,
            resource_3_tag: escapeHtml(r(2).tag || "Guide"),
        },
    });
};

// 13. New users in the recipient's area (weekly digest). `recipient` powers the
// new-user cards. Call from a weekly cron when ready.
export const sendNewUsersInAreaEmail = async (email, name, { city, newCount, recipient } = {}) =>
    sendTemplateEmail({
        email,
        subject: "New families just joined FamLink in your area 👋",
        fileName: "13_new_users_in_area.html",
        values: {
            first_name: escapeHtml(firstNameOf(name)),
            city: escapeHtml(city || "your area"),
            new_count: escapeHtml(String(newCount ?? "")),
            family_word: Number(newCount) === 1 ? "family" : "families",
            family_preview_section: await buildFamilyPreviewSection(recipient, {
                label: `🆕 New this week in ${city || "your area"}`,
                showNewBadge: true,
            }),
        },
    });

// Templates 14 (waitlist), 15 (feedback) and 16 (re-engagement) are founder
// emails — sent from the email campaign app, not from here.

// 17. Account deactivated / suspended. Keep `reason` vague for admin actions.
export const sendAccountDeactivatedEmail = (email, name, reason) =>
    sendTemplateEmail({
        email,
        subject: "Your FamLink account has been deactivated",
        fileName: "17_account_deactivated.html",
        values: {
            first_name: escapeHtml(firstNameOf(name)),
            reason: escapeHtml(reason || "a change to your account status"),
            // A deactivated user can't reach /dashboard, and this is an
            // automated email — so the appeal goes to the system mailbox.
            appeal_url: "mailto:system@famlink.care",
        },
    });

export const sendEmail = (email, subject, text) => {
    const mailOptions = {
        from: EMAIL_FROM,
        to: email,
        subject,
        html: text,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
        } else {
            console.log("Email sent: " + info.response);
        }
    });
};

export const sendAutoEmail = (from, email, subject, text) => {
    return new Promise((resolve, reject) => {
        const mailOptions = {
            from: from || EMAIL_FROM,
            to: email,
            subject,
            html: text,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                reject(error);
            } else {
                console.log("Email sent: " + info.response);
                resolve(info);
            }
        });
    });
};

export const sendEmailConfirmation = (email, subject, text) => {
    const mailOptions = {
        from: EMAIL_FROM,
        to: email,
        subject,
        html: text,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
        } else {
            console.log("Email sent: " + info.response);
        }
    });
};

// Queue-based sender with feedback loop
export const sendWithLimit = async (emails, subject, html, batchSize = 2, delayMs = 1500) => {
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);

        // Send batch in parallel (small batch to avoid throttling)
        const results = await Promise.allSettled(
            batch.map(email =>
                transporter.sendMail({
                    from: EMAIL_FROM,
                    to: email,
                    subject,
                    html,
                })
            )
        );

        results.forEach(result => {
            if (result.status === "fulfilled") successCount++;
            else {
                failCount++;
                console.error("Email failed:", result.reason);
            }
        });

        // Delay before next batch
        if (i + batchSize < emails.length) await new Promise(r => setTimeout(r, delayMs));
    }

    console.log(`✅ Emails sent: ${successCount}, Failed: ${failCount}`);
};

