# ADR 0006 — Contact Form Handler: Astro SSR Endpoint + Resend

- **Status:** Accepted
- **Date:** 2026-05-31
- **Deciders:** Human reviewer at GATE 1
- **Phase:** Phase 3 — Dynamic surface & form migration

## Context

The legacy site runs on a shared PHP host. The contact form POSTs to `sideform.php`, which uses the
SendGrid PHP SDK to dispatch outbound email. The entire PHP host is being retired as part of this
rebuild; there is no path to keep the PHP backend alive once the Cloudflare deploy goes live.

The rebuild targets Cloudflare **Workers** (Static Assets) via `@astrojs/cloudflare` v13 — see
[ADR 0005](0005-deploy-target.md). The default output is static, but the Worker lets individual pages
opt into server-side rendering with
`export const prerender = false`. The contact form is the only dynamic surface in scope; everything
else is fully pre-rendered.

Constraints:

- Form UI must be pixel-identical to the live site (GATE-1 approved waiver list does not include the
  contact form visually); the existing AJAX submission UX, UTM hidden fields, and GDPR checkbox must
  all be preserved.
- No visible CAPTCHA — the design must not change. Spam protection must be fully server-side.
- Sensitive credentials (API keys, sender address, recipient inbox) must never be committed to the
  repo; they live in a gitignored `.env` locally and in Cloudflare environment bindings in
  production.
- The legacy `sideform.php` + SendGrid PHP SDK are NOT ported; the decision simply retires them.

## Decision

Replace `sideform.php` with an Astro SSR POST endpoint at `src/pages/api/contact.ts`
(`export const prerender = false`). The endpoint validates the incoming form body with **zod**
(already a transitive dependency via `astro:content`), sends the outbound email via the **Resend**
Node.js SDK (`resend` package), and applies two spam-protection layers that require zero UI change:
a hidden honeypot field (bot-filled = silent discard) and server-side rate-limiting + input
validation.

Concrete mechanism:

- **POST target change:** `action="/sideform.php"` -> `action="/api/contact"` (form attribute only;
  AJAX `fetch` target updated in the existing JS to `/api/contact`).
- **Endpoint file:** `src/pages/api/contact.ts` with `export const prerender = false`.
- **Validation:** zod schema covering all expected fields; unexpected or malformed payloads return
  `400`.
- **Email dispatch:** `resend` SDK, `Resend.emails.send()`. Runtime reads three environment
  variables (names only — values are never committed):

  | Variable | Purpose |
  |---|---|
  | `RESEND_API_KEY` | Resend project API key |
  | `RESEND_FROM` | Verified sender address (e.g. `noreply@dedede.ro`) |
  | `CONTACT_TO` | Recipient inbox for incoming leads |

- **`.env.example`** committed at repo root documents all three names with placeholder values so
  local setup is self-documenting without exposing real credentials.
- **Spam protection:** honeypot field (hidden via CSS, not `type=hidden` to defeat smart bots) +
  server-side field-length/content validation. No Cloudflare Turnstile or reCAPTCHA widget in this
  phase (pixel-parity requirement).

## Consequences

**Positive**

- The PHP host dependency is fully eliminated; the contact form works entirely within the Cloudflare
  Worker runtime.
- `zod` is already present (via `astro:content`); no net new dependency for validation.
- Resend has generous free-tier limits and a reliable Node.js SDK; no SMTP credentials required.
- Honeypot + server validation adds meaningful spam friction with zero visual change to the form.
- GDPR checkbox, UTM hidden fields, and AJAX UX are untouched — no regression surface on the
  client.

**Negative / Risks**

- **Verified sender domain required:** Resend requires DNS verification of the sending domain
  (`dedede.ro`). This must be completed before the production deploy; DNS changes are outside the
  repo and must be coordinated with the domain owner.
- **Cloudflare environment bindings:** All three env variables must be added in the Cloudflare
  dashboard (Workers & Pages → project → Settings → Environment variables) for both Preview and
  Production environments. A missing binding causes a `500` at runtime, not at build time.
- **Rate-limiting is in-process:** The current design uses a simple in-memory counter inside the
  Worker. Cloudflare Workers are stateless and may run across many isolates, so this provides
  best-effort rather than strict global rate-limiting. Cloudflare Rate Limiting rules (dashboard) or
  a KV-backed counter can harden this in a future phase if spam volume warrants it.
- **No CAPTCHA:** A determined human or sophisticated bot can still submit the form. Accepted
  trade-off for parity. Turnstile (invisible widget) is listed as a future option below.

**Neutral**

- The `resend` package adds one runtime dependency to the bundle. It is small and has no known CVEs
  at the time of this decision (2026-05-31).
- The endpoint is only reachable via POST; GET requests return `405`. This is standard REST
  behaviour and requires no special routing config.
- `sideform.php` and the legacy SendGrid PHP SDK are removed from scope entirely; they are not
  migrated and are not referenced anywhere in the rebuild. This is documented as a deliberate
  retirement, not a gap.

## Alternatives considered

- **Keep PHP / sideform.php** — Not viable. The PHP shared host is retired with the migration.
  There is no runtime environment to host PHP on the Cloudflare Worker.

- **SendGrid Node.js SDK** — Functionally equivalent to Resend. Resend was preferred because it is
  already in use across the `viorelmocanu.ro` stack (consistency, shared sender-domain
  verification), has a simpler API surface for transactional email, and the team has operational
  familiarity with it. SendGrid remains a valid fallback if Resend sender verification is blocked.

- **Cloudflare Email Workers (send via MailChannels)** — Zero SDK dependency, but MailChannels
  deprecated its free Cloudflare integration in 2024. Would require a paid MailChannels account or
  a different relay. Not worth the operational complexity given Resend is already vetted.

- **Cloudflare Turnstile (invisible CAPTCHA)** — Would add meaningful bot protection without a
  visible widget. Deferred because it introduces a new JS dependency and a Turnstile site-key
  binding, both of which need testing before they can be certified as pixel-parity-safe. Documented
  here as the recommended next step if spam volume becomes a problem after launch.
