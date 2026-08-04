# FamLink Email Templates

All transactional and marketing email templates for FamLink.
Built on a single shared design system — consistent branding, no hero image required.

These `.html` files are the **single source of truth** for email markup.

- **Automated emails** are rendered and sent from `backend/Services/email/email.js`
  (one exported function per template). Tokens like `{{first_name}}` are substituted
  server-side; whitespace inside the braces is tolerated (`{{ first_name }}` works too).
- **Every template here is sent by the backend.** Nothing depends on the email campaign
  app any more and nothing needs pasting into an external tool.
- **Founder-voice emails (14 waitlist, 15 feedback request, 16 re-engagement,
  20 onboarding nudge, 21 feedback received)** are rendered and sent from `email.js`
  too, but from the founder mailbox (`EMAIL_FROM_FOUNDER` / `EMAIL_REPLY_FOUNDER`) so
  the replies they invite reach Ari. That mailbox is monitored.

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
| `07_platform_launch_new_account.html` | Platform Launch – New Account | Founder | Admin console → Waitlist → **Notify** (recipient has no account) | ✅ auto |
| `08_platform_launch_update.html` | Platform Launch – Update | Founder | Admin console → Waitlist → **Notify** (recipient is a member) | ✅ auto |
| `09_oakland_awareness.html` | Oakland Awareness | Automated | Admin console → Waitlist → by city → **Awareness** | ✅ auto |
| `10_password_reset.html` | Password Reset | Automated | User requests password reset | ✅ auto |
| `11_profile_updated.html` | Profile Updated | Automated | User saves profile changes | ✅ auto |
| `12_weekly_resources.html` | Weekly Resources | Automated | Weekly cron — Tue 09:00 | ✅ auto |
| `13_new_users_in_area.html` | New Users in Area | Automated | Weekly cron — Wed 09:00 | ✅ auto |
| `14_waitlist_confirmation.html` | Waitlist Confirmation | Founder | User joins waitlist | ✅ auto |
| `15_feedback.html` | Feedback Request | Founder | 30 days on the platform, if active — daily cron | ✅ auto |
| `16_reengagement.html` | Re-engagement | Founder-voice | 30 days inactive (complete profile) — daily cron | ✅ auto |
| `17_account_deactivated.html` | Account Deactivated | Automated | Account suspended / blocked | ✅ auto |
| `18_resource_download.html` | Resource Center Download | Automated | Visitor requests a free guide/template | ✅ auto |
| `19_referral_reward.html` | Referral Reward | Automated | A friend signs up with the user's referral code | ✅ auto |
| `20_onboarding_incomplete.html` | Onboarding Incomplete | Founder-voice | Intake questions answered, no account — hourly cron | ✅ auto |
| `21_feedback_received.html` | Feedback Received | Founder | Feedback **or** Contact form submitted — sent immediately | ✅ auto |

**Legend:** ✅ auto = sent by the backend, at an in-app trigger, on a cron, or from a
button in the admin console. All twenty-one are ✅.

**Why 07, 08 and 09 are admin-triggered rather than cron'd.** They are campaigns: which
city to open or push, and when, is a decision someone makes, not a condition that becomes
true on its own. A cron firing them would mean the campaign schedules itself. They are
still sent by the server — the button only chooses the moment, and the send is logged,
consent-checked and de-duplicated exactly like a cron'd one. Both use a two-step dry run:
the first click reports who would receive it and sends nothing.

---

## Sender Configuration

- **Automated emails (backend):** envelope `from` is `EMAIL_FROM_AUTOMATED` (falls back
  to `EMAIL_FROM`), Reply-To `EMAIL_REPLY_SUPPORT` (default `support@famlink.care`).
  Set `EMAIL_FROM_AUTOMATED` once `hello@famlink.care` is verified with your provider.
- **Founder emails (backend):** envelope `from` is `EMAIL_FROM_FOUNDER`, Reply-To
  `EMAIL_REPLY_FOUNDER` (`ari@famlink.care`). Set both in the backend environment. Do
  NOT let these fall back to a no-reply or team@ address — they're meant to feel
  personal, and several of them invite a reply that has to reach a real, monitored
  mailbox.

---

## Family Preview Cards

**Backend-rendered (emails 01, 02, 13):** these templates contain a single
`{{ family_preview_section }}` token. `email.js` (`buildFamilyPreviewSection`) fills it
server-side with up to 3 nearby active family cards, querying `users` by `location`
`$near` (25mi radius) and falling back to `location.city`. When no nearby families are
found, the token renders to an empty string and the rest of the email is unaffected —
no raw `{{ }}` placeholders ever reach a recipient.

⚠️ **A family's share details live in one of two collections, and both are in use.**
`loadFamilyProfiles()` reads both and normalises across them; reading only one silently
drops most families:

| | `nannyprofiles` | `nannyshares` |
|---|---|---|
| Foreign key | `userId` | **`user`** |
| `hasNanny` | Boolean | **String** — `"yes – we already have a nanny"` |
| `childrenAges` | `[{ label, value, unit }]` | **`["2 yrs"]`** |
| `nannyShareType` | `"full-time"` | `"Full-time care"` |

`nannyprofiles` wins if a user somehow has both. Other normalisation the cards depend on:

- **`value` is stored in YEARS in both**, even when `unit` is `"months"` (a 13-month-old
  is `value: 1.083`). Rendering it raw produced `1.0833333333333333mo`. Ages are always
  re-derived from the number — stored labels are also unreliable (`"1 yrs"`, `"0.75 yrs"`).
- **Unknown `hasNanny` renders no status pill at all.** Only ~38 of 140 "completed"
  families have any profile row, and telling a family that already has a nanny that
  they're "Looking for nanny" is worse than showing nothing.
- **Locality comes from `location.format_location`** (present on 136/140 families) —
  `location.city` is set on only 8. It's parsed down to a neighbourhood or city
  ("Downtown San Jose", "Hayward"); the raw string starts with a street address and is
  **never** shown, since these cards show strangers to each other.
- Surnames are stored uncapitalised (`"Gabriele muratori"`), so the family label is
  title-cased → "The Muratori Family".
- Candidates are pooled 12-deep and families **with** share details are shown first, so
  cards aren't empty shells.

**Email 16 (re-engagement)** uses the same backend-rendered `{{ family_preview_section }}`
token as 01/02/13 — its cards are filled by `buildFamilyPreviewSection` from the
recipient's own location, not campaign-app merge fields.

**Email 20 (onboarding incomplete)** uses it too, and is the one recipient who is
**not a user**. It goes to an `onboardingLeads` row, which stores the location the
visitor typed into the intake form in the same shape `users` does. That is why
`getNearbyFamilies()` gates on `recipient.location` rather than `recipient._id` — the
query needs a place, not an account. The "complete your profile" note under the cards
is overridable (`noteText`) so 20 can say *finish creating your account* instead, which
is what is actually true for someone who doesn't have one.

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
| Finish Setting Up My Account (20) | `/find-nanny-share/family/:id` | `FamilyOnboarding` |
| See the New FamLink (08) | `/` | `NannyShare` |

`/unsubscribe`, `/feedback` and `/contact` are registered **outside** the logged-out
route block, so they resolve with or without a session — an unsubscribe or support link
has to work for anyone, including a user whose account was just deactivated.

### How unsubscribe works

`POST /unsubscribe { email, token }` — the token is an HMAC of the address
(`Services/utils/unsubscribeToken.js`), so the footer link is genuinely **one-click with
no login**, as CAN-SPAM requires. Confirming switches every `notifications.email.*` flag
off; the user can re-enable individual ones at `/dashboard/setting`.

Every template now carries `{{unsubscribe_url}}`, so the footer link is genuinely
one-click for all of them. Templates 07, 08 and 15 kept a bare `/unsubscribe` from their
campaign-app days and were switched over when they moved onto the backend; that page
still exists as a fallback, asking for the address and emailing back a signed link
(`POST /unsubscribe/request`), so nobody can unsubscribe an address they don't control.

The one template with no unsubscribe link at all is **17 (account deactivated)** — a
mandatory account notice rather than commercial mail, where there is nothing left to
unsubscribe from.

⚠️ `/dashboard/*` links only render for a logged-in user; a logged-out click hits the
app's catch-all and lands on the home page.

---

## Scheduled jobs & batching

Started from `index.js` on boot:

| Job | Schedule (env-overridable) | Emails |
|---|---|---|
| `completeProfileReminder.js` | hourly, 24h after signup | 02 |
| `weeklyResources.js` | `WEEKLY_RESOURCES_CRON` — Tue 09:00 | 12 |
| `newUsersInArea.js` | `NEW_USERS_AREA_CRON` — Wed 09:00 | 13 |
| `reengagementReminder.js` | `REENGAGEMENT_CRON` — daily 10:00 | 16 |
| `onboardingNudge.js` | `ONBOARDING_NUDGE_CRON` — hourly, 3h after drop-off | 20 |
| `feedbackRequest.js` | `FEEDBACK_REQUEST_CRON` — daily 11:00 | 15 |

- **12** pulls the 3 most recently published blogs (`isDraft: false`, newest first) from
  the `blogs` collection. If fewer than 3 exist it renders 2 or 1 — the cards are
  generated into `{{ resource_cards }}`, so the count is dynamic. Skips the run entirely
  when nothing is published. Cards link to `/resources/<blogId>`, which `ArticlePage`
  now resolves against the blogs API (static `articlesData` first, then the DB).
- **13** batches new local signups into one weekly digest and only emails a user when
  **1+ new family joined their city that week** — never one email per new user.
- **06** is batched over a **15-minute window** (`messageDigest.js`): a burst of messages
  produces one email, not one per message. If the recipient comes online during the
  window, the email is dropped entirely.
- **16** targets users whose `lastLogin` is 30–37 days old with a complete profile, and
  sends **at most once per inactivity streak** (`reengagementSentAt` guards re-sends; a
  user is eligible again only after they log in). `lastLogin` is set on login and token
  refresh, so active users who never log out are never nudged.
- **20** targets `onboardingLeads` rows — people who answered the intake questions and
  never created an account. Sent **once per address, ever** (`nudgeSentAt`), and only
  while no user exists for that address. Registering calls `retireOnboardingLead()`,
  which stamps `nudgeSentAt` so a converted lead is dropped before the cron looks at it;
  the run also re-checks the `users` collection as a backstop. `ONBOARDING_NUDGE_DELAY_HOURS`
  (default 3) is the "a few hours later" — most people who finish the questions go
  straight on to the account step, so an immediate send would nag people who were about
  to convert anyway.

### Which intake forms feed email 20

`POST /onboarding-leads/capture` is called the moment an intake form is submitted, from
`frontend/src/Config/onboardingLead.js`.

| Form | Route | Asks for email? | Feeds 20? |
|---|---|---|---|
| Family match (`NannyShareMatchForm`) | `/find-nanny-share` | ✅ name + email | ✅ wired |
| Caregiver intake (`ChooseNannyShare`) | `/caregiver/nannyshare` | ❌ name only | ⚠️ can't — no address |

⚠️ The caregiver funnel asks for a name and a path, and only collects an email on the
final account-creation screen — so a caregiver who abandons leaves us nothing to write
to. The backend handles them already (`source: "caregiver-job"` / `"caregiver-share"`
build the right resume link); it needs an email field added to that form's intake step
before anything can be sent.

### Notification toggles honoured

The footer Unsubscribe switches every `notifications.email.*` flag off, and these sends
now actually respect them:

| Email | Flag (Settings label) |
|---|---|
| 06 New message | `newMessage` — "New Messages" |
| 12 Weekly resources | `tipsAndTricks` — "Tips and Tricks" |
| 13 New users in area | `newSubInArea` — "New Subscriber in area" |
| 16 Re-engagement | `tipsAndTricks` — "Tips and Tricks" |

Transactional emails (welcome, password reset, profile updated, subscription, match
request/accepted, deactivation) are intentionally **not** gated — a user can't opt out of
being told their password was reset.

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
