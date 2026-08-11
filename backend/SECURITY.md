# Backend security notes

## Day 1–2 hardening (implemented)

- Required secrets fail fast at boot (`Services/utils/loadEnv.js`)
- Helmet + restricted CORS / Socket.IO origins
- Auth endpoint rate limits
- PhantomBuster webhook shared-secret gate
- Multer: MIME allow-list, size caps, memory-only (Cloudinary), no `originalname` storage
- Static `/assets/uploads` hardened (no index, nosniff, sandbox CSP)
- HTML allow-list sanitiser on blog/legal/waitlist writes
- Plain-text scrub on community posts/comments and profile `aboutMe`
- Legacy `adminUser` / blogs / verification / community admin routes use shared `adminOnly`

## Residual risk — tokens in localStorage

The SPA stores JWT access + refresh tokens in `localStorage` (redux-persist).
An XSS bug on `famlink.care` can exfiltrate them.

**Recommended follow-up (separate sprint):** httpOnly `Secure` `SameSite` refresh cookie + short-lived access token in memory.

Do **not** change this in place without a staged rollout: frontend is
`famlink.care`, API is cross-origin (`api.famylink.us`), so cookies need
`SameSite=None; Secure`, axios `withCredentials`, and logout cookie clearing.
