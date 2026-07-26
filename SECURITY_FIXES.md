# FamLink — Security Remediation Report

**Date:** 26 July 2026
**Scope:** Backend API and real-time (socket) layer
**Status:** Complete, verified, ready to deploy

> **Confidential.** This document describes weaknesses that existed in the live
> system. Please treat it as internal until the changes are deployed.

---

## 1. Summary

A review of the FamLink API found that responses sent to the browser contained
substantially more personal data than the app displays, and that a number of
endpoints could be called with no login at all.

The most significant finding: **the exact GPS coordinates of members' homes, plus
their email addresses, phone numbers and dates of birth, were being sent to the
browser on ordinary pages** — the browse list, profile pages, favourites, job
posts, bookings and chat. None of it appeared on screen, but anything the server
sends is readable by anyone using their browser's developer tools. On a platform
connecting families, young children and caregivers, home coordinates are the most
sensitive data we hold.

Separately, **six endpoints required no authentication**, including one that
deleted any user account and returned that account's stored password hash, and
three that exposed or altered private conversations.

All findings below have been fixed and verified. **No visible change to the
product**, with one deliberate exception (§5).

---

## 2. Why this happened

The cause was a single consistent pattern rather than isolated mistakes.

Throughout the codebase, endpoints described what to **hide** rather than what to
**show** — for example, "send everything about this user except their password."
That approach is safe only on the day it is written. Every field added to the
user record afterwards is included automatically, because nobody remembers to go
back and add it to the exclusion list.

Over time the user record grew to include location coordinates, phone numbers,
dates of birth, Stripe customer identifiers, referral data and password-reset
tokens. All of it began flowing to the browser silently. The code still *looked*
correct — the exclusion lists were right there in every file.

The fix inverts this: the API now declares what it is **allowed** to send. A field
added to the user record next month is private by default and stays private until
somebody deliberately decides otherwise.

---

## 3. What was fixed

### 3.1 Personal data exposed to logged-in members — **Critical**

Affected: member browse and search, profile pages, favourites, nanny-share
listings, job posts, bookings, match requests, chat and community comments.

Members received the following about *other* members, none of it displayed:

| Data exposed | Risk |
|---|---|
| **Exact home coordinates** (latitude/longitude) | Physical safety — pinpoints a home to the doorstep |
| **Full street address** | Physical safety |
| Email address | Off-platform contact, spam, phishing, scraping |
| Phone number | Off-platform contact, harassment |
| Date of birth | Identity theft; combined with name and address, materially so |
| Stripe customer & subscription IDs | Billing-system reconnaissance |
| Password-reset tokens | **Account takeover** |
| Referral codes, notification settings, favourites, account status | Privacy |

**Fixed.** A single approved-fields list now governs every response. Members see
the marketplace profile — name, photo, about, availability, rates, reviews,
verification badges — and nothing else.

Location is now returned as an **area, never a point**. `5432 Broadway Terrace,
Oakland, CA 94618` becomes `Oakland, CA 94618`. Coordinates are no longer
retrieved from the database at all for these responses.

### 3.2 Endpoints requiring no login — **Critical**

| Endpoint | What anyone could do |
|---|---|
| `DELETE /userData/users/:id` | **Delete any account**, and receive that account's full record including its password hash |
| `GET /userData/getById/:id` | Retrieve any member's complete profile, including home coordinates, email, phone and date of birth |
| `GET /chats/:id/:userId` | **Read any private conversation** |
| `PUT /chats/:id` | Add themselves to any conversation and read it from then on |
| `DELETE /chats/:id` | Delete any conversation |
| All of `/message` | Read, edit or delete any individual message |
| `GET /nannyShare/:id` | Retrieve any share post with the poster's email and exact address |

**Fixed.** All now require a valid login, and — critically — verify that the
caller is actually entitled to the specific record. Being logged in is not
sufficient; you must be a participant in that conversation, or the owner of that
account. Account deletion is restricted to the account owner or an administrator,
and no longer echoes the deleted record back.

### 3.3 Real-time (chat socket) exposure — **High**

Every chat message broadcast carried the **sender's entire user record** to
everyone in the conversation — email, phone, date of birth, billing identifiers.
Booking status updates did the same for the other party.

**Fixed.** Real-time messages now carry a name, photo and online status.

### 3.4 Credentials could reach the browser — **High**

One sign-in path (Google sign-in) returned the account's stored password hash to
the browser. Password-reset tokens were included in several responses, including
those used by the admin console — meaning a compromised admin session could have
been used to take over any user account.

**Fixed** at two independent levels:

1. Every response now excludes these fields explicitly.
2. The user record itself now **refuses to serialise** passwords, one-time codes
   and reset tokens under any circumstances. Even a future endpoint written
   without care cannot put them on the wire.

### 3.5 Personal data on public marketing pages — **Medium**

The logged-out homepage and public job pages showed caregivers' and families'
**full legal names** alongside their neighbourhood, hourly rate and availability
— enough to identify a specific person or household without an account. Full
street addresses were also present in the underlying data.

**Fixed.** Public pages now show `Maria G.` instead of a full name, and an area
instead of an address. Full names remain visible to signed-in members.

### 3.6 Internal error details leaked — **Low**

Some failures returned internal stack traces and raw error objects to the
browser, revealing file paths and internal structure — standard reconnaissance
material for an attacker.

**Fixed.** Errors are logged server-side; the browser receives a plain message.

### 3.7 Unprotected Google Maps proxy — **Medium (financial)**

An endpoint proxied address lookups to Google Maps using FamLink's paid API key,
with no login, no rate limit and no restriction on use. Anyone who found the URL
could have run up an uncapped bill or used FamLink as a free anonymous geocoding
service. It also returned Google's complete raw response, which is what made it
worth abusing.

This endpoint cannot require a login — it is used during sign-up, before an
account exists. It is now protected by:

- **A rate limit** of 15 lookups per minute per visitor (and 120/min on the public
  coverage map, which queries the database on each call).
- **Input validation**, bounding what can be sent upstream.
- **A trimmed response** — only the two fields the sign-up form actually uses.
- **Error suppression**, so Google's error responses (which can echo the request
  URL, and the URL contains the API key) never reach the browser.

---

## 4. How this was verified

Three automated test suites were written and run against the changes:

1. **Data-protection suite (55 checks)** — confirms credentials are stripped,
   private fields withheld, locations reduced to an area, and that malformed or
   missing data cannot crash the protection layer.
2. **Database query suite** — confirms the database is never *asked* for home
   coordinates on member-facing requests, while the internal features that
   legitimately need them (distance matching, the coverage map, location-based
   emails) still receive them.
3. **Access-control and rate-limit suite** — drives the hardened endpoints over
   real HTTP and confirms rejection of unauthorised and malformed requests, that
   the rate limit engages at the correct threshold, and that the API key never
   appears in any response.

All suites pass. Every modified file was additionally confirmed to load cleanly,
and a final sweep confirmed no remaining endpoint sends contact details except
those correctly restricted to the account owner or an administrator.

This verification caught one error in the remediation itself: an initial attempt
to protect coordinates at the database level did not work in all cases, because
of a subtlety in how the database handles nested fields. The test suite detected
it and the approach was corrected. **Without that suite, the fix would have
appeared complete while still leaking coordinates on several endpoints.**

---

## 5. Impact on the product

**No change to how the application looks or behaves**, with one deliberate
exception.

The one intentional change: **public, logged-out pages now show a first name and
last initial** rather than a full name. This matches standard practice for
childcare marketplaces. It is a product decision as much as a security one — if
full names on public pages are intended, it can be reverted in a single place
(`maskedName` in `backend/Routes/userData.js`).

Location labels are unchanged. Every screen already derived "Oakland, CA" from the
stored address; it now derives the identical text from an address with the street
removed. No frontend changes were required.

---

## 6. Recommended next steps

These were outside the scope of this work and remain open:

1. **Rotate the Google Maps API key.** The proxy was open for an unknown period.
   Rotating is inexpensive and removes any doubt.
2. **Restrict the Google Maps key** by API and referrer in Google Cloud Console,
   so a leaked key has limited value.
3. **Review database logs** for unusual access volume against the affected
   endpoints, to assess whether the exposure was actually exploited.
4. **Consider whether disclosure is required.** Home coordinates and contact
   details were retrievable. Depending on where members are located, privacy
   regulations (including CCPA in California) may impose notification duties.
   This is a question for legal counsel — we raise it so it is not overlooked.
5. **Extend rate limiting** to sign-in and password-reset, which are currently
   unlimited and therefore open to password-guessing at scale.
6. **Commission an independent penetration test.** This review targeted data
   exposure in the API. It was not a full security audit and did not cover
   infrastructure, dependencies, payment flows or the admin console in depth.

---

## 7. Files changed

Two new shared components, 19 files modified, ~523 lines added.

| Component | Purpose |
|---|---|
| `backend/Services/utils/userPrivacy.js` | **New.** The single approved-fields policy — what may be sent, and to whom |
| `backend/Services/utils/rateLimit.js` | **New.** Shared rate limiting for public endpoints |
| `backend/Schema/user.js` | Credentials can no longer be serialised; coordinates are opt-in |
| `backend/Routes/userData.js` | Browse, profile and account-deletion endpoints |
| `backend/Routes/chat.js`, `message.js`, `Socket/chat.js` | Conversation access control and payloads |
| `backend/Routes/bookHire.js`, `Socket/socket.js` | Booking responses |
| `backend/Routes/postJob.js`, `nannyShare.js`, `favourite.js`, `community.js`, `edit.js` | Listing and profile responses |
| `backend/Controllers/share.controller.js`, `match.controller.js` | Nanny-share browse and match requests |
| `backend/Routes/location.js` | Maps proxy hardening |
| `backend/Services/cron/*`, `Controllers/mapPins.controller.js` | Updated for the new coordinate opt-in |

The privacy policy lives in **one file**. Changing what members can see about one
another is now a single, reviewable decision rather than an edit across twenty
files.
