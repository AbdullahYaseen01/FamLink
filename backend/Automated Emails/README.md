# Automated Emails

HTML email templates for FamLink's automated/transactional emails, matching the
approved collage design: a white logo bar, a **photo hero with a dark overlay**
and white title text, a primary CTA, a heart sign-off, and footer links.

Each file is a complete, email-client-safe HTML document (table layout + inline
styles). Drop the markup into your mailer (e.g. `sendAutoEmail` in
`Services/email/email.js`) and replace the `{{placeholders}}` before sending.

## Templates

| File | Email | When it's sent | Hero badge |
| --- | --- | --- | --- |
| `01-welcome-after-signup.html` | Welcome to FamLink! | Right after a user signs up | — |
| `02-subscription-confirmed.html` | Welcome to FamLink Plus! | After upgrading to FamLink Plus | `PLUS` pill |
| `03-new-match-request.html` | Someone wants to connect! | A new match request is received | people |
| `04-match-request-accepted.html` | It's a match! | A sent match request is accepted | heart |
| `05-new-message-received.html` | You've got a new message! | A new chat message arrives | message |
| `06-complete-your-profile.html` | You're almost there! | Profile-completion reminder | — |

## Hero photos

Each template references its hero photo from the `images/` folder via a relative
path (e.g. `images/01-welcome.jpg`) — see `images/README.md` for the filename map.
Drop the six photos in that folder to preview locally; swap `images/` for your
hosted base URL before sending in production.

## Placeholders

Replace these tokens (string find/replace or your templating engine) before sending:

- `{{first_name}}` — recipient's first name (all templates)
- `{{match_name}}` — name of the person who accepted (template 04)
- `{{sender_name}}` — name of the message sender (template 05)
- `{{cta_url}}` — destination for the main button
- `{{unsubscribe_url}}`, `{{privacy_url}}`, `{{contact_url}}` — footer links

## Hero image + dark overlay

The header is a background image with a dark gradient overlay so the white title
text stays readable:

- A `linear-gradient(rgba(...))` over the photo handles legibility in
  image-capable clients (Apple Mail, iOS Mail, Outlook mobile, most webmail).
- A fallback dark `background-color:#33384a` guarantees the white title is
  readable even if the image fails to load or is blocked.
- A VML `<v:image>` + 40% black `<v:rect>` block renders the image with a dark
  tint in **Outlook desktop (Windows)**.

Recommended hero image: ~960×520 px (2× of the ~480×260 display size), JPG,
center-weighted subject.

## Notes

- **Photos 02–05 have their badge baked into the image** (FAMILY+, POTENTIAL
  MATCH, heart, message), so those templates do not add a CSS badge.
- **Image files are not bundled** in this folder — save the six provided photos in
  `images/` using the filenames in `images/README.md`. The FamLink logo is a text
  mark ("FamLink" + blue tile); swap in a hosted logo `<img>` if
  preferred.
- Accent/brand blue used for buttons, links, badges and the heart is `#2f80ed`
  (matching the collage). Adjust if your brand blue differs.
- Content width is capped at 480px; layout is mobile-first.
- The footer shows the three required links only. For CAN-SPAM/GDPR you may also
  want to add a physical mailing address.
