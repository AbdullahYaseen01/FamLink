import nodemailer from "nodemailer";
import dns from "node:dns";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import User from "../../Schema/user.js";
import nannyProfile from "../../Schema/nannyProfile.js";
import NannyShare from "../../Schema/nannyShare.js";
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
// NOTE: Founder emails (templates 07, 08, 15, 16) are NOT sent from the
// backend — they go out through the email campaign app. Their .html files live
// in Automated Emails/ purely as the design source of truth.
const FROM_AUTOMATED = process.env.EMAIL_FROM_AUTOMATED || EMAIL_FROM;
const REPLY_SUPPORT = process.env.EMAIL_REPLY_SUPPORT || "support@famlink.care";

// Template 14 (waitlist confirmation) IS sent from here, but it is written in
// the founder's voice and signed by her, so replies must reach her mailbox.
//
// Reply-To can be any address — the provider doesn't verify it — so it points
// at the founder unconditionally. The From address is the opposite: sending as
// ari@famlink.care only works once that mailbox is verified with the provider,
// and an unverified sender is rejected outright. So From defaults to the
// already-verified automated sender and is opted into via EMAIL_FROM_FOUNDER
// ("Ari Parker <ari@famlink.care>") once the mailbox is set up.
const REPLY_FOUNDER = process.env.EMAIL_REPLY_FOUNDER || "ari@famlink.care";
const FROM_FOUNDER = process.env.EMAIL_FROM_FOUNDER || FROM_AUTOMATED;

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

// Render a template:
//
//  1. Strip HTML comments. The templates carry extensive developer notes in
//     their header comment (trigger, sender config, DB query hints). Those are
//     for us, not for recipients — without this they'd ship inside every email's
//     source. Stripping first also prevents a subtle bug: those notes *document*
//     token names like {{ family_preview_section }}, and substitution would
//     otherwise inject the generated markup into the comment as well as the body.
//  2. Substitute every {{ token }} (whitespace inside the braces is tolerated,
//     so both {{first_name}} and {{ first_name }} match).
//  3. Rewrite relative `images/...` asset paths to the hosted EMAIL_ASSET_BASE
//     so they resolve in email clients.
//
// A function replacer is used throughout so a literal `$` inside a value is
// never treated as a RegExp back-reference.
const renderTemplate = (fileName, values) => {
    let html = loadTemplate(fileName).replace(/<!--[\s\S]*?-->/g, "");
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

// Surnames are stored however the user typed them ("Gabriele muratori"), so a
// raw surname would ship as "The muratori Family".
const titleCase = (s) =>
    String(s || "")
        .trim()
        .replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));

const surnameOf = (name) => {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : "";
};

// "Jane doe" -> "The Doe Family". Falls back gracefully for single-word names.
const familyLabelFrom = (name) => {
    const surname = surnameOf(name);
    if (!surname) return "A FamLink Family";
    return `The ${titleCase(surname)} Family`;
};

// Avatar letter — the surname's initial, so it matches the family label.
const initialOf = (name) => (surnameOf(name).charAt(0) || "F").toUpperCase();

// Where a family is, in words a neighbour would recognise.
//
// Only 8 of 140 families have location.city set, but 136 have a Google-style
// `format_location` ("Jackson St, Hayward, CA 94541, USA"). We parse the
// locality out of it and deliberately NEVER fall back to the raw string: it
// begins with a street address, and these cards show strangers to each other.
const STREET_RE = /\b(st|street|ave|avenue|rd|road|blvd|dr|drive|ln|lane|way|ct|court|pl|place|hwy|highway|pkwy|terrace|circle|cir)\.?$/i;

// "Downtown San Jose, San Jose, CA, USA" -> { neighborhood, city }
const parseFormattedAddress = (formatted) => {
    const parts = String(formatted || "")
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
    if (parts.length < 2) return {};
    // The state sits as "CA" or "CA 94541"; the city is just before it.
    const stateIdx = parts.findIndex((p) => /^[A-Z]{2}(\s+\d{5}(-\d{4})?)?$/.test(p));
    if (stateIdx < 1) return {};
    const city = parts[stateIdx - 1];
    if (STREET_RE.test(city) || /^\d/.test(city)) return {};
    // The part before the city is a neighbourhood ("Downtown San Jose") — unless
    // it's a street, which we must not reveal.
    const finer = stateIdx >= 2 ? parts[stateIdx - 2] : "";
    const neighborhood =
        finer && !STREET_RE.test(finer) && !/^\d/.test(finer) ? finer : "";
    return { city, neighborhood };
};

// The most specific place worth printing on a card.
const localityFrom = (user) => {
    const parsed = parseFormattedAddress(user?.location?.format_location);
    return (
        user?.location?.neighborhood ||
        user?.location?.city ||
        parsed.neighborhood ||
        parsed.city ||
        "Nearby"
    );
};

// City only — used to group people into an "area" and to fill {{ city }}.
// Never a neighbourhood, or "3 new families joined Rockridge" would fragment
// one city into several.
export const cityOf = (user) =>
    user?.location?.city ||
    parseFormattedAddress(user?.location?.format_location).city ||
    "";

// Truncate a message body to a short preview for the new-message email.
const previewOf = (text, max = 100) => {
    const s = String(text || "").replace(/\s+/g, " ").trim();
    if (!s) return "You've got a new message";
    return s.length > max ? s.slice(0, max) : s;
};

// A family's share details live in one of two collections, with different
// shapes. Both are live, so the card has to read either:
//
//   nannyprofiles (userId) — current: hasNanny Boolean,
//                            childrenAges [{ label, value, unit }]
//   nannyshares   (user)   — legacy:  hasNanny String ("yes – we already
//                            have a nanny"), childrenAges ["2 yrs"]
//
// Everything below normalises across the two. `value` is stored in YEARS in
// both, even when `unit` is "months".

// One child's age, as a person would write it: "3 yrs", "1 yr", "9 mo".
//
// The stored labels can't be trusted verbatim — the platform writes "1 yrs"
// (wrong plural) and "0.75 yrs" (a 9-month-old) — so we always re-derive from
// the number. `value` is in YEARS in both collections, even when unit is
// "months"; the string form ("2 yrs") is parsed the same way.
const ageLabelOf = (entry) => {
    if (entry == null) return "";
    const raw = String(typeof entry === "string" ? entry : entry.label ?? "").trim();

    let years =
        typeof entry === "object" && entry.value != null ? Number(entry.value) : NaN;
    if (!Number.isFinite(years) && raw) {
        const m = raw.match(/^([\d.]+)\s*(mo|mos|month|months|yr|yrs|year|years)?\b/i);
        if (m) {
            const n = parseFloat(m[1]);
            years = /^mo/i.test(m[2] || "yr") ? n / 12 : n;
        }
    }
    if (!Number.isFinite(years) || years <= 0) return raw; // unparseable → as stored

    // Babies and toddlers are counted in months, as parents actually speak:
    // 0.75 → "9 mo", 1.5 → "18 mo". Exactly 1 stays "1 yr".
    if (years < 1 || (years > 1 && years < 2)) return `${Math.round(years * 12)} mo`;
    const whole = Math.round(years);
    return `${whole} ${whole === 1 ? "yr" : "yrs"}`;
};

// "1 child, 3 yrs" / "2 children, 3 yrs & 13 months". "" when unknown.
const childSummaryFrom = (profile, user) => {
    const ages = profile?.childrenAges;
    if (Array.isArray(ages) && ages.length) {
        const label = ages.length === 1 ? "1 child" : `${ages.length} children`;
        const ageStrs = ages.map(ageLabelOf).filter(Boolean);
        if (ageStrs.length) return `${label}, ${ageStrs.join(" & ")}`;
        return label;
    }
    const num = profile?.numberOfChildren;
    if (num) return Number(num) === 1 ? "1 child" : `${num} children`;
    const raw = user?.noOfChildren;
    const n = typeof raw === "number" ? raw : parseInt(raw, 10);
    if (n && !Number.isNaN(n)) return n === 1 ? "1 child" : `${n} children`;
    return "";
};

// true / false / null — null means "we don't know", and an email must not
// guess: telling a family that already has a nanny they're "Looking for nanny"
// is worse than showing no pill at all.
const hasNannyFrom = (profile) => {
    const v = profile?.hasNanny;
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
        if (/^\s*yes/i.test(v)) return true;
        if (/^\s*no\b/i.test(v)) return false;
        return null; // "not sure / open to either"
    }
    return null;
};

// "full-time care" / "Full-time care" / "pickup/drop-off (carpool style)"
// all reach the pill as a tidy "Full-time" / "Pickup/drop-off".
const shareTypeLabel = (profile) => {
    const raw = String(profile?.nannyShareType || "").trim();
    if (!raw) return "";
    const cleaned = raw
        .replace(/\s*\([^)]*\)\s*/g, " ")
        .replace(/\s+care\s*$/i, "")
        .trim();
    if (!cleaned) return "";
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
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

// Load each family's share details, whichever collection they live in.
// nannyprofiles is the current one, so it wins when a user somehow has both.
const loadFamilyProfiles = async (userIds) => {
    const byUser = new Map();
    if (!userIds.length) return byUser;
    const [legacy, current] = await Promise.all([
        NannyShare.find({ user: { $in: userIds } })
            .lean()
            .catch((err) => {
                console.error("nannyshares lookup failed:", err?.message || err);
                return [];
            }),
        nannyProfile
            .find({ userId: { $in: userIds } })
            .lean()
            .catch((err) => {
                console.error("nannyprofiles lookup failed:", err?.message || err);
                return [];
            }),
    ]);
    for (const p of legacy) byUser.set(String(p.user), p);
    for (const p of current) byUser.set(String(p.userId), p);
    return byUser;
};

// Render a single family card matching the templates' markup.
const renderFamilyCard = (user, profile, { showLock = false, showNewBadge = false } = {}) => {
    const color = pickAvatarColor(user?._id || user?.name);
    const initial = escapeHtml(initialOf(user?.name));
    const name = escapeHtml(familyLabelFrom(user?.name));
    const hood = escapeHtml(localityFrom(user));
    const kids = escapeHtml(childSummaryFrom(profile, user));
    const meta = kids ? `${hood} &middot; ${kids}` : hood;
    const schedule = escapeHtml(shareTypeLabel(profile));
    const hasNanny = hasNannyFrom(profile);

    const pills = [];
    if (schedule) pills.push(`<span class="pill pill-blue">${schedule}</span>`);
    if (hasNanny !== null) {
        pills.push(
            hasNanny
                ? `<span class="pill pill-green">Has a nanny</span>`
                : `<span class="pill pill-beige">Looking for nanny</span>`
        );
    }
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
    // Pull a wider pool than we need: most "completed" families still have no
    // share details on file, and a card with no schedule/children on it is a
    // weak advert. Nearest-first is preserved within each group, so this
    // promotes the richest cards without ever showing a family who is further
    // away when a fully-detailed nearer one exists.
    const pool = await getNearbyFamilies(recipient, 12);
    if (!pool.length) return "";
    const byUser = await loadFamilyProfiles(pool.map((u) => u._id));
    const withProfile = pool.filter((u) => byUser.has(String(u._id)));
    const without = pool.filter((u) => !byUser.has(String(u._id)));
    const users = [...withProfile, ...without].slice(0, 3);

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
// Sends are batched over a 15-minute window (see messageDigest.js), so
// `sender.moreCount` is how many further messages arrived in that window — the
// card shows the most recent one and the subject reflects the total.
export const sendNewMessageEmail = (email, name, senderName, messagePreview = "", sender = {}) => {
    const more = Number(sender.moreCount) || 0;
    return sendTemplateEmail({
        email,
        subject:
            more > 0
                ? `You have ${more + 1} new messages on FamLink 💬`
                : `${senderName || "Someone"} sent you a message on FamLink 💬`,
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
};

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

// Render 1–3 resource cards for the weekly digest. The template no longer has
// fixed _1/_2/_3 slots, so a light week (2 resources, or even 1) renders exactly
// that many cards instead of leaving empty ones behind.
const renderResourceCards = (resources) =>
    resources
        .map(
            (r) => `
      <a href="${r.url}" class="resource-card">
        <div class="resource-tag">${escapeHtml(r.tag || "Guide")}</div>
        <div class="resource-title">${escapeHtml(r.title || "")}</div>
        <div class="resource-desc">${escapeHtml(r.desc || "")}</div>
        <div class="resource-link">Read more →</div>
      </a>`
        )
        .join("\n");

// 12. Weekly nanny-share resources digest. `resources` is an array of 1–3
// { title, desc, url, tag } objects, newest first — see
// Services/cron/weeklyResources.js, which pulls them from the blogs collection.
export const sendWeeklyResourcesEmail = (email, name, { weekOf, resources = [] } = {}) => {
    const list = resources.slice(0, 3);
    const lead = list[0]?.title;
    return sendTemplateEmail({
        email,
        subject: lead
            ? `This week on FamLink: ${lead}${list.length > 1 ? " + more" : ""}`
            : "This week's nanny share resources from FamLink",
        fileName: "12_weekly_resources.html",
        values: {
            first_name: escapeHtml(firstNameOf(name)),
            week_of: escapeHtml(weekOf || ""),
            resource_cards: renderResourceCards(list),
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

// 14. Waitlist confirmation — sent the moment someone joins the waitlist from
// any of the frontend's waitlist forms (see Routes/waitlist.js). Written in the
// founder's voice, so it goes out with her Reply-To; see FROM_FOUNDER above.
//
// `name` and `city` are both optional: two of the four waitlist forms only ask
// for an email address, and a city is only known when the visitor picked a
// place from the Google autocomplete.
export const sendWaitlistConfirmationEmail = (email, name, city) =>
    sendTemplateEmail({
        email,
        subject: "You're on the FamLink waitlist 🎉",
        fileName: "14_waitlist_confirmation.html",
        values: {
            // "Hi there," rather than a stranded "Hi ," when no name was asked for.
            first_name: escapeHtml(firstNameOf(name)) || "there",
            city: escapeHtml(city || "your area"),
            // Founder email — replies go to her, not the system mailbox that
            // footerLinks() defaults to.
            contact_url: `mailto:${REPLY_FOUNDER}`,
        },
        from: FROM_FOUNDER,
        replyTo: REPLY_FOUNDER,
    });

// 18. Resource Center download — sent when a top-of-funnel visitor requests a
// free guide/template from the Resource Center (Category 4.2). Delivers the
// download link and nudges them toward finding a match. Automated voice.
export const sendResourceDownloadEmail = (email, name, { resourceTitle, downloadUrl } = {}) =>
    sendTemplateEmail({
        email,
        subject: `Your download: ${resourceTitle || "your FamLink resource"}`,
        fileName: "18_resource_download.html",
        values: {
            // Falls back to "there" — the capture form only requires an email.
            first_name: escapeHtml(firstNameOf(name)) || "there",
            resource_title: escapeHtml(resourceTitle || "your resource"),
            download_url: downloadUrl || APP_URL,
            find_share_url: `${APP_URL}/find-nanny-share`,
        },
    });

// Templates 15 (feedback) and 16 (re-engagement) are founder emails — sent from
// the email campaign app, not from here.

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

