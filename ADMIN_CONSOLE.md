# Admin Console

Everything an admin can do, where it lives, and the handful of decisions that
are non-obvious enough to be worth writing down.

**Two repos.** The API lives in `Famylink/backend` (`/admin/*` routes). The UI
lives in the separate **`Famylink-admin`** app (Next.js 15 + TypeScript,
shadcn/ui) — *not* in `Famylink/frontend`, which is the public marketing site
and is deliberately untouched by any of this.

---

## Getting started

1. **An admin account is a user with `type: "Admin"`.** There is no separate
   admin table. Promote an existing account in Mongo:
   ```js
   db.users.updateOne({ email: "you@famlink.care" }, { $set: { type: "Admin" } })
   ```
2. **Backfill the waitlist.** Admin → Waitlist → *Backfill*. The capture hooks
   only fire for people who onboard from now on, so without this the screen
   starts empty despite the data already existing. Idempotent — safe to re-run.
3. **Publish the Terms.** Admin → Terms & policies. Until something is
   published, the site falls back to the copy compiled into the frontend.

Nothing else needs setting up. Analytics and the email log start recording on
deploy; neither backfills, because neither can.

---

## What each screen does

| Screen | Admin app route | Backend |
|---|---|---|
| Dashboard | `/` | `Routes/admin/analytics.js` |
| Users | `/Users` | `Routes/admin/users.js` |
| Activity | `/Activity` | `Routes/admin/activity.js` |
| Share links | `/ShareLinks` | `Routes/admin/shareLinks.js` |
| Waitlist | `/Waitlist` | `Routes/admin/waitlist.js` |
| Reports | `/Reports` | `Routes/admin/reports.js` |
| Messages | `/Messages` | `Routes/admin/messages.js` |
| Audit log | `/AuditLog` | `Routes/admin/auditLog.js` |
| Matches | `/Matches` | `Routes/admin/matches.js` |
| Traffic | `/Traffic` | `Routes/admin/traffic.js` |
| Profile health | `/ProfileHealth` | `Routes/admin/analytics.js` |
| Subscriptions | `/Subscriptions` | `Routes/admin/subscriptions.js` |
| Email log | `/EmailLog` | `Routes/admin/emailLog.js` |
| Support | `/Support` | `Routes/admin/support.js` |
| Terms & policies | `/Terms` | `Routes/admin/terms.js` |

Public endpoints the console depends on: `/legal/*` (terms), `/analytics/*`
(the traffic beacon), `/reports` (member reporting).

---

## Decisions worth knowing about

These are the places where the obvious implementation is the wrong one.

### Deleting an account is a soft delete

`status` becomes `"Deleted"`, personal data is cleared, the email address is
released so they can sign up again, and the row stays.

A hard delete would leave every message, match request and review pointing at a
missing id — and **those records belong to the other party as much as to this
one**. A family who spent three weeks arranging a share should not lose their
half of the conversation because the caregiver closed their account.

Deleting a *profile* and deleting an *account* are separate buttons for the same
reason: "take my listing down" and "erase me" are different requests, and
conflating them turns a support ticket into a data-loss incident.

### Share links revoke by a flag, never by deleting the token

Turning a link off sets `shareEnabled: false` and leaves `shareToken` intact, so
switching it back on revives **the same URL**. Revoking by deleting the token
would mint a new one on re-enable and silently break every link already pasted
into a Facebook group.

### Terms propagate because there is only one place to read them

Every surface — the terms page, the signup checkbox, the checkout consent, the
questionnaire footers — reads `GET /legal/terms`. Propagation isn't a mechanism
that runs; it's the only thing that *can* happen.

Publishing **appends** a new version and demotes the old one. `User.termsAcceptedVersion`
points at the text someone agreed to, and an UPDATE would destroy the only
record of what that text said. Restoring an old version publishes it as a new
version for the same reason.

**A screen that hardcodes the terms copy is outside this guarantee.** That is
the bug the endpoint exists to remove — if you add a surface, read from
`/legal/terms`.

### Reading a private conversation is an audited act

The conversation list carries **no message content** — only participants and
counts, so finding the right thread never exposes any others. Opening one
requires a stated reason and writes an audit row *before* returning anything.

There is deliberately **no full-text search across all messages**. Searching
every private conversation for a keyword is a different power from investigating
a specific complaint, and nothing in the brief asked for it.

### Moderation reasons never reach the member

`moderationReason` is in an admin-only field tier (`INTERNAL_USER_FIELDS` in
`Services/utils/userPrivacy.js`) — the account owner cannot see it either. The
deactivation email sends generic copy on purpose: in a small local marketplace,
"reported twice for pressuring caregivers about rates" identifies the reporter.

### Subscriptions: the console changes access, not billing

Granting or removing FamLink Plus flips the `premium` entitlement and **never
touches Stripe**. Writing to Stripe from here would turn "comp this founding
member" into a real charge, or a real cancellation, on someone's card.

The *Entitlement mismatches* figure is normal in small numbers (comped
accounts). A sudden jump usually means Stripe webhooks have stopped arriving.

### Analytics can't answer some questions, and says so

* **Unique visitors are per-day.** The visitor hash is salted with a
  daily-rotating value so stored rows can't be linked to a person across days.
  That's a deliberate privacy property; its cost is that a monthly unique count
  isn't computable. The multi-day figure is an upper bound and the UI labels it.
* **Duration and bounce cover measured sessions only.** A view whose closing
  beacon never arrived has `durationSec: null` and is excluded rather than
  counted as zero — treating those as instant departures is what makes a bounce
  rate read 90% on a site that doesn't have one.
* **No IPs, no query strings.** Marketing links carry email addresses; the
  query string is stripped at ingest before anything is written.
* Do Not Track is honoured. Bots are dropped — Facebook fetches every share link
  before attaching it to a post, and counting those would make a link nobody
  clicked look popular.

### The suspicious-accounts scan is circumstantial

It returns **reasons, not verdicts**, and the `score` is a sort key that is
never rendered as a percentage — presenting a heuristic as a confidence level is
how a circumstantial signal turns into an account ban.

### Suspensions expire on their own

`accountGate` in `Routes/Auth.js` lifts an expired suspension at the next
sign-in attempt. No cron: the only moment the answer matters is when someone
tries to log in. The same gate runs on token refresh, so blocking someone who is
already signed in takes effect within the access-token lifetime rather than
whenever they next choose to log in.

### The launch email is deliberately hard to fire

`POST /admin/waitlist/notify` defaults to a dry run. Sending needs
`dryRun: false` **and** `confirm: true` — two independent flags, so one mistyped
field can't mail several hundred strangers. Recipients are always and only
people who consented, haven't unsubscribed, and haven't already been told, so
re-running is safe by construction rather than by anyone remembering.

Onboarding leads appear on the waitlist but are **not** opted in — they were
never shown a consent checkbox, and inferring consent that was never given is
the one shortcut not worth taking.

---

## Data model additions

New collections: `emaillogs`, `reports`, `terms`, `adminactions`, `pageviews`,
`trafficdailies`, `waitlistentries`.

Extended: `users` (suspension, terms acceptance, activity counters, soft-delete
stamps), `nannyprofiles` (share toggle + view counts), `matchrequests`
(`respondedAt`), `feedbacks` (status, assignee, internal notes).

All additions are optional with defaults — nothing existing breaks, and no
migration is required.

### Retention

Raw `pageviews` are deleted after 180 days by a TTL index. Anything older
survives **only** in `trafficdailies`, written by the nightly rollup
(`Services/cron/trafficRollup.js`, 02:15 UTC). If that job stops, history
disappears six months later and can't be reconstructed — which is why its
failure path logs loudly.

---

## Security posture

* Every `/admin/*` sub-router mounts its own `adminOnly` guard rather than
  relying on one gate in `Routes/admin/index.js`. Deliberate duplication: a
  router mounted elsewhere by mistake carries its protection with it.
* The frontend gate in `AdminLayout` is **not** a security boundary — it can be
  bypassed from devtools. It exists so a non-admin gets an honest page instead
  of a shell full of 403s.
* Destructive actions require a reason of 10+ characters and are written to the
  audit log. The audit log is read-only from the API and always will be — a
  trail an admin can edit answers no question that matters.
* Terms HTML is sanitised on **write**, once, because there is one writer and
  many readers (`Services/utils/sanitizeHtml.js`). It's an allow-list; if the
  editor needs new tags, add them there rather than loosening the filter.
* CSV export neutralises leading `=`, `+`, `-` and `@` — those fields come from
  a public form, and Excel would otherwise execute them as formulas.

---

## Known gaps

Stated plainly so nobody rediscovers them as bugs.

* **Email delivery is not tracked, only acceptance.** The log records whether
  the mail server took the message. Knowing it reached an inbox needs delivery
  webhooks from the email provider, which aren't consumed yet.
* **Average time to match starts empty.** `respondedAt` was added with this
  console, so the figure only reflects requests answered since deploy.
* **Some filters are page-local.** Profile completeness and "mutual" matches are
  computed after fetching, so they narrow the visible rows without changing the
  total. The UI says so rather than showing a count that doesn't match its rows.
* **Bulk scans are bounded.** The suspicious-accounts and profile-completeness
  reports cover the most recent 1,000–2,000 accounts, and say so in the
  response.
* **The launch-radius zip list is duplicated** in `frontend/src/Config/serviceArea.js`
  and `backend/Services/utils/serviceArea.js`. When a city opens, edit both.

---

## Outstanding: traffic tracking needs a beacon on the public site

The Traffic screen and its API are complete, but nothing is sending it data yet.
Page views are collected by a small client-side beacon that has to run on the
**public famlink.care site** — that is where the visitors are; the admin app's
own navigation is not website traffic and would skew every figure.

Until that snippet is added to `Famylink/frontend`, the Traffic screen shows an
explicit "no data yet" state rather than zeros. The endpoints waiting for it:

* `POST /analytics/view`  — `{ sessionId, path, title, referrer, query, isEntry }`,
  returns `{ viewId }`
* `POST /analytics/close` — `{ viewId, durationSec, clicks, maxScrollPct }`,
  sent via `navigator.sendBeacon` on `pagehide`

Both are public, rate-limited, drop bot traffic, honour Do Not Track, and strip
query strings before storage. Nothing else on this list depends on it.
