# FamLink Email Templates

All transactional and marketing email templates for FamLink.
Built on a single shared design system — consistent branding, no hero image required.

These `.html` files are the **single source of truth** for email markup.

- **Automated emails** are rendered and sent from `backend/Services/email/email.js`
  (one exported function per template). Tokens like `{{first_name}}` are substituted
  server-side; whitespace inside the braces is tolerated (`{{ first_name }}` works too).
- **Founder emails (07, 08, 14, 15, 16)** are NOT sent from the backend — they go out
  through the email campaign app. Copy the HTML into the campaign tool and map the
  `{{ ... }}` placeholders to its merge fields.

---

## Quick Reference

| File | Email Name | Sender | Trigger | Wired? |
|------|-----------|--------|---------|--------|
| `01_welcome.html` | Welcome to FamLink | Automated | Account created / email verified | ✅ auto |
| `02_complete_profile.html` | Complete Your Profile | Automated | 24h after signup, profile incomplete (cron) | ✅ auto |
| `03_famlink_plus.html` | FamLink Plus Activated | Automated | Successful subscription payment | ✅ auto |
| `04_match_request.html` | New Match Request | Automated | Match request received | ✅ auto |
| `05_match_accepted.html` | Match Request Accepted | Automated | Match request accepted | ✅ auto |
| `06_new_message.html` | New Message Received | Automated | New message received (recipient offline) | ✅ auto |
| `07_platform_launch_new_account.html` | Platform Launch – New Account | Founder | One-time migration broadcast | 📣 campaign app |
| `08_platform_launch_update.html` | Platform Launch – Update | Founder | One-time migration broadcast | 📣 campaign app |
| `09_oakland_awareness.html` | Oakland Awareness | Automated / Campaign | City campaign | 🔌 function ready |
| `10_password_reset.html` | Password Reset | Automated | User requests password reset | ✅ auto |
| `11_profile_updated.html` | Profile Updated | Automated | User saves profile changes | ✅ auto |
| `12_weekly_resources.html` | Weekly Resources | Automated | Weekly digest of resources | 🔌 function ready |
| `13_new_users_in_area.html` | New Users in Area | Automated | Weekly digest of new local users | 🔌 function ready |
| `14_waitlist_confirmation.html` | Waitlist Confirmation | Founder | User joins waitlist | 📣 campaign app |
| `15_feedback.html` | Feedback Request | Founder | 30 days active / post-match | 📣 campaign app |
| `16_reengagement.html` | Re-engagement | Founder | 30 days inactive (complete profile) | 📣 campaign app |
| `17_account_deactivated.html` | Account Deactivated | Automated | Account suspended / blocked | ✅ auto |

**Legend:** ✅ auto = sent automatically by the backend at an in-app trigger · 🔌 function ready = exported sender exists in `email.js`, call it from a cron/route when you want it live · 📣 campaign app = founder email, sent from the email campaign app (no backend sender).

---

## Sender Configuration

- **Automated emails (backend):** envelope `from` is `EMAIL_FROM_AUTOMATED` (falls back
  to `EMAIL_FROM`), Reply-To `EMAIL_REPLY_SUPPORT` (default `support@famlink.care`).
  Set `EMAIL_FROM_AUTOMATED` once `hello@famlink.care` is verified with your provider.
- **Founder emails (campaign app):** configure `Ari Parker <ari@famlink.care>` /
  Reply-To `ari@famlink.care` in the campaign app itself. Do NOT send these from a
  no-reply or team@ address — they're meant to feel personal.

---

## Family Preview Cards

**Backend-rendered (emails 01, 02, 13):** these templates contain a single
`{{ family_preview_section }}` token. `email.js` (`buildFamilyPreviewSection`) fills it
server-side with up to 3 nearby active family cards, querying `users` (by `location`
`$near`, falling back to `location.city`) joined with `nannyprofiles` for schedule /
has-nanny / children data. When no nearby families are found (e.g. a brand-new user
without a location yet), the token renders to an empty string and the rest of the email
is unaffected — no raw `{{ }}` placeholders ever reach a recipient.

**Campaign-app merge fields (email 16):** the re-engagement template keeps explicit
per-card placeholders (`{{ family_name_1 }}`, `{{ neighborhood_1 }}`, … suffix `_1/_2/_3`)
so the campaign app can map them to its own merge fields.

---

## Links → real site routes

Every button does what its label says, and every href resolves to a route that exists
in `frontend/src/App.jsx`.

| Button / link | URL | Route |
|---|---|---|
| Unsubscribe (footer, all emails) | `/unsubscribe?email=…&token=…` | `Unsubscribe` — **new** |
| Terms & Privacy (footer) | `/terms-and-conditions` | `TermsAndConditions` |
| Contact Us — **automated** emails | `mailto:system@famlink.care` | — |
| Contact Us — **founder** emails | `mailto:ari@famlink.care` | — |
| Contact Support (17, automated) | `mailto:system@famlink.care` | — |
| Share My Feedback (15) | `/feedback` | `FeedbackPage` — **new** |
| Create My New Account (07) | `/joinNow` | `JoinNow` |
| Complete My Profile (01, 02) | `/dashboard/complete-profile` | `OnboardingCompleteProfile` |
| Start Browsing / Browse Families (03, 13, 16) | `/find-nanny-share` | `NannyShareMatchForm` |
| Browse Oakland Families (09) | `/nanny-share/oakland` | `NannyShareCityPage` |
| Browse All Resources (12) | `/resources` | `ResourcesPage` |
| View Request (04) | `/dashboard/requests` | `MatchRequests` |
| Send a Message / Reply Now (05, 06) | `/dashboard/message` | `Message` |
| View My Profile (11) | `/dashboard/edit` | `EditProfile` |
| Reset My Password (10) | `/reset-password?token=…` | `ResetPassword` |
| See the New FamLink (08) | `/` | `NannyShare` |

`/unsubscribe`, `/feedback` and `/contact` are registered **outside** the logged-out
route block, so they resolve with or without a session — an unsubscribe or support link
has to work for anyone, including a user whose account was just deactivated.

### How unsubscribe works

`POST /unsubscribe { email, token }` — the token is an HMAC of the address
(`Services/utils/unsubscribeToken.js`), so the footer link is genuinely **one-click with
no login**, as CAN-SPAM requires. Confirming switches every `notifications.email.*` flag
off; the user can re-enable individual ones at `/dashboard/setting`.

Founder emails sent from the campaign app can't carry our HMAC, so their footer link is a
bare `/unsubscribe`. That page falls back to asking for the address and emailing back a
signed one-click link (`POST /unsubscribe/request`) — so nobody can unsubscribe an
address they don't control. If your campaign tool has its own unsubscribe merge tag,
prefer it: it can unsubscribe the exact recipient without the extra step.

⚠️ `/dashboard/*` links only render for a logged-in user; a logged-out click hits the
app's catch-all and lands on the home page.

---

## Global Variables (All Emails)

| Variable | Description |
|----------|-------------|
| `{{first_name}}` | Recipient's first name |
| `{{unsubscribe_url}}` | Backend-filled → `/dashboard/setting` (automated emails only) |

---

## Logo

Loaded from `https://www.famlink.care/logo3.png`.

---

## Design System

- **Font:** Livvic (Google Fonts) · **Navy:** `#001243` · **Blue (CTA):** `#AEC4FF`
- **Beige (bg):** `#F0EDE8` · **White (card):** `#FFFFFF`

See `_base_styles.css` for the full shared stylesheet (each email embeds it inline for
email-client compatibility).
