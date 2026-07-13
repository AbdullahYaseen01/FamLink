import nodemailer from "nodemailer";
import dns from "node:dns";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
const renderTemplate = (fileName, values) => {
    let html = loadTemplate(fileName);
    for (const [token, value] of Object.entries(values)) {
        html = html.split(`{{${token}}}`).join(value);
    }
    return html
        .split("url('images/").join(`url('${EMAIL_ASSET_BASE}/`)
        .split('src="images/').join(`src="${EMAIL_ASSET_BASE}/`);
};

// Footer links shared by every template.
const footerLinks = () => ({
    unsubscribe_url: `${APP_URL}/unsubscribe`,
    privacy_url: `${APP_URL}/privacy-policy`,
    contact_url: `${APP_URL}/contact`,
});

// Build + send a template email. Returns a Promise that resolves with send info.
const sendTemplateEmail = ({ email, subject, fileName, values }) =>
    new Promise((resolve, reject) => {
        let html;
        try {
            html = renderTemplate(fileName, { ...footerLinks(), ...values });
        } catch (error) {
            console.error(`Error rendering email template "${fileName}":`, error);
            return reject(error);
        }
        const mailOptions = { from: EMAIL_FROM, to: email, subject, html };
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

// 1. Welcome — after sign up
export const sendWelcomeEmail = (email, name) =>
    sendTemplateEmail({
        email,
        subject: "Welcome to FamLink! 🎉",
        fileName: "01-welcome-after-signup.html",
        values: {
            first_name: escapeHtml(firstNameOf(name)),
            cta_url: `${APP_URL}/login`,
        },
    });

// 2. Subscription confirmed (FamLink Plus)
export const sendSubscriptionConfirmedEmail = (email, name) =>
    sendTemplateEmail({
        email,
        subject: "Welcome to FamLink Plus! 🎉",
        fileName: "02-subscription-confirmed.html",
        values: {
            first_name: escapeHtml(firstNameOf(name)),
            cta_url: `${APP_URL}/dashboard`,
        },
    });

// 3. New match request received
export const sendMatchRequestEmail = (email, name) =>
    sendTemplateEmail({
        email,
        subject: "Someone wants to connect on FamLink",
        fileName: "03-new-match-request.html",
        values: {
            first_name: escapeHtml(firstNameOf(name)),
            cta_url: `${APP_URL}/dashboard/requests`,
        },
    });

// 4. Match request accepted ("It's a match")
export const sendMatchAcceptedEmail = (email, name, matchName) =>
    sendTemplateEmail({
        email,
        subject: "It's a match on FamLink! 🎉",
        fileName: "04-match-request-accepted.html",
        values: {
            first_name: escapeHtml(firstNameOf(name)),
            match_name: escapeHtml(matchName) || "Someone",
            cta_url: `${APP_URL}/dashboard/message`,
        },
    });

// 5. New message received
export const sendNewMessageEmail = (email, name, senderName) =>
    sendTemplateEmail({
        email,
        subject: "You have a new message on FamLink",
        fileName: "05-new-message-received.html",
        values: {
            first_name: escapeHtml(firstNameOf(name)),
            sender_name: escapeHtml(senderName) || "Someone",
            cta_url: `${APP_URL}/dashboard/message`,
        },
    });

// 6. Complete your profile (reminder — sent by the cron job in
// Services/cron/completeProfileReminder.js)
export const sendCompleteProfileEmail = (email, name) =>
    sendTemplateEmail({
        email,
        subject: "Complete your FamLink profile",
        fileName: "06-complete-your-profile.html",
        values: {
            first_name: escapeHtml(firstNameOf(name)),
            cta_url: `${APP_URL}/dashboard`,
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

