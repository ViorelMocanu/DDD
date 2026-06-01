# ADR 0005 — Deploy target & contact-form backend

- **Status:** Accepted (2026-05-31)
- **Date:** 2026-05-30
- **Updated:** 2026-05-31 — ratified at GATE 1
- **Deciders:** Viorel Mocanu (GATE 1 approval)
- **Phase:** unblocks Phase 4 scaffold

## Context

The legacy contact form POSTs to `sideform.php` + SendGrid PHP SDK on nginx + mod_php. The rebuild needs a
deploy target, and that target determines (a) which Astro adapter — if any — is installed, (b) whether the
hybrid `output: 'static'` + one SSR endpoint from ADR 0004 is viable, and (c) how the contact submission is
handled and which email provider is used. **This is the decision that unblocks the Phase 4 scaffold**, so it
is deliberately deferred to the human at GATE 1 rather than pre-decided here.

Coupled inputs: ADR 0004 (rendering split + contact-handling options) and the SEO/parity requirement that
public URLs stay identical (any host migration must preserve URLs or add 301s, and must not regress
Lighthouse vs the live site).

## Decision

Two orthogonal sub-decisions, both ratified at GATE 1 (2026-05-31):

### A. Deploy target — ACCEPTED: Cloudflare **Workers** (Static Assets) — NOT Pages

The whole site deploys to a single **Cloudflare Worker** via `@astrojs/cloudflare` **v13** (a *Workers*
adapter, not a Pages adapter) and **`wrangler deploy`**. The pre-rendered static pages are served by the
Worker's **Static Assets** (the adapter's reserved `ASSETS` binding); the single dynamic surface
(`src/pages/api/contact.ts`, `prerender = false`) runs on-demand in that same Worker.

> **Correction (post-build verification):** an earlier draft of this ADR said "Cloudflare Pages." That is
> incompatible with `@astrojs/cloudflare` v13: Pages mode requires `pages_build_output_dir` in
> `wrangler.jsonc`, which **rejects the adapter's reserved `ASSETS` binding** (and the adapter also
> validates `main` before the build emits it). The shipped, verified target is **Workers + Static
> Assets**. Deploy with `wrangler deploy` (never `wrangler pages deploy`).

Astro config:

- `output: 'static'` (default) — all pages pre-rendered except the contact endpoint
- `@astrojs/cloudflare` adapter installed; `passthroughImageService()` required (no native Sharp on Workers)
- `trailingSlash: 'always'`; `build.format: 'directory'`
- `wrangler.jsonc` is **minimal** (`name` / `compatibility_date` / `compatibility_flags` /
  `observability`); the adapter manages `main` + `assets` (`ASSETS`). Do NOT set `main`, `assets`, or
  `pages_build_output_dir` by hand.
- Local dev/deploy tooling: **wrangler** (replaces any Netlify CLI dependency)

Rejected alternatives:

- **Netlify** — was the Phase 3 recommendation; rejected in favour of Cloudflare's global edge performance
  and alignment with the client's existing viorelmocanu.ro stack.
- **nginx + Node sidecar** — rejected; client does not wish to manage VPS infra.

### B. Contact-form backend — ACCEPTED: Astro SSR endpoint + Resend

- **Endpoint:** `src/pages/api/contact.ts` (POST, `prerender = false`). Input validation via **zod**
  (bundled with `astro:content`, no extra dependency). Anti-spam: hidden honeypot field + server-side
  rate-limiting. No visible CAPTCHA — form UI stays pixel-identical to live.
- **Email provider:** **Resend** (`resend` SDK). Matches the viorelmocanu.ro stack; free tier covers
  ~3,000 transactional emails/month. Legacy PHP + SendGrid (`sideform.php`) is retired and NOT ported.
- **Env shape** (names only; values in gitignored `.env` / Cloudflare secret bindings; a committed
  `.env.example` documents the shape):
  - `RESEND_API_KEY` — Resend API key
  - `RESEND_FROM` — verified sender address
  - `CONTACT_TO` — recipient inbox
- **POST target change:** form `action` updated from `/sideform.php` to `/api/contact`; existing AJAX UX,
  UTM hidden fields, and GDPR checkbox are preserved verbatim.

Rejected alternatives:

- **Keep PHP + SendGrid** — retired with the legacy host; not ported.
- **Serverless + SendGrid** — no existing validated SendGrid sender domain on this project.

## Consequences

- **Easier:** deploy target is committed; adapter pin (`@astrojs/cloudflare`) and email SDK (`resend`) are
  concrete; `astro.config` rendering mode is finalized; Phase 4 scaffold is unblocked.
- **Harder / to watch:** `@astrojs/cloudflare` has an advisory history — pin carefully and run
  `pnpm audit` in Phase 4 (see ADR 0001/0004). The contact endpoint needs a secret store (Cloudflare
  secret bindings) + server-side validation + honeypot anti-spam that the PHP previously provided; these
  must be implemented before going live. Lighthouse must stay ≥ live on the Cloudflare Worker deploy.
- **Legacy retired:** `sideform.php` and the SendGrid PHP SDK are NOT ported. The Netlify adapter (if any
  was prototyped) is removed. The legacy PHP host can be decommissioned once the Cloudflare deploy is live.

## Alternatives considered

- **Vercel** — possible, similar DX to Netlify; not chosen, Cloudflare already used for viorelmocanu.ro.
- **Netlify** — was Phase 3 recommendation; superseded by GATE 1 decision.
- **nginx + Node sidecar** — rejected; client does not wish to manage VPS infra.
- **Static-host + 3rd-party form service (e.g. Formspree)** — adds a vendor without benefit given the
  Cloudflare Workers capability already available.
- **Self-hosted SMTP** — rejected: deliverability and maintenance burden far exceed a managed provider for
  a lead-gen marketing site.
- **Serverless + SendGrid** — no existing validated sender domain; Resend is simpler to onboard.
