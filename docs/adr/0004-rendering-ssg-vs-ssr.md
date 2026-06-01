# ADR 0004 — Rendering: static-first with one SSR endpoint for the contact form

- **Status:** Accepted (2026-05-31)
- **Date:** 2026-05-30
- **Deciders:** human reviewer at GATE 1 (coupled with ADR 0005)
- **Phase:** Phase 4 (rendering config)

## Context

Per the interactivity inventory in `CONTEXT.md`, the site is almost entirely static: nav toggle, dark mode,
and back-to-top are DOM-only vanilla JS needing no server; the six display components need no hydration.
The **only** dynamic need is the **contact form** on `/contact/`, which currently POSTs JSON to
`sideform.php` (SendGrid PHP SDK) and pushes dataLayer events on success.

We want to keep the whole site as pure SSG for performance, security, and parity simplicity, while
providing exactly one mechanism to handle the contact submission. The legacy form posts to a PHP endpoint
on the same origin; how that submission is handled in the rebuild depends on the deploy target (ADR 0005),
so the two decisions are coupled.

## Decision

Set **`output: 'static'`** for the whole site and make the contact form the only non-static surface.
Three handling options exist, ranked; the final pick is bound to the GATE-1 deploy-target choice (ADR 0005):

1. **Keep posting to the existing `sideform.php`** (no SSR endpoint at all). The Astro site stays 100%
   static; the `<ContactForm client:load />` island POSTs cross-origin/same-origin to the existing PHP,
   exactly as today. **Lowest risk, highest parity, no adapter required.** Recommended if the PHP host
   stays in place.
2. **Astro SSR endpoint** `src/pages/api/contact.ts` with `export const prerender = false`, served by an
   adapter (`@astrojs/node@9.5.3+`, or the Netlify/Cloudflare adapter per ADR 0005), forwarding to
   SendGrid or Resend. Keeps everything in one codebase; needs an adapter and a secret store.
3. **External serverless function** (Netlify/Cloudflare function) decoupled from Astro — useful if the host
   provides functions natively and we prefer not to introduce an Astro adapter.

```ts
// src/pages/api/contact.ts  — only if Option 2 is chosen (Suggested approach — verify adapter API)
export const prerender = false; // the ONE dynamic route; everything else stays SSG

export async function POST({ request }: { request: Request }): Promise<Response> {
	const data = await request.json();
	// validate side_name / side_email / side_telephone / side_tip / side_mesaj + UTM/gclid,
	// then forward via SendGrid or Resend. Never inline secrets — read from env/secret store.
	return new Response(JSON.stringify({ message: "ok" }), { status: 200 });
}
```

## Consequences

- **Easier:** the rest of the site keeps SSG's caching, security, and CDN simplicity; only one route carries server risk and must be CVE-tracked and rate-limited; static Lighthouse scores stay high for parity.
- **Harder / to watch:** Options 2/3 require a secret store for the email API key and server-side input validation/anti-spam (the legacy PHP did this). Option 1 keeps a PHP dependency alive and a cross-origin POST (CORS + the form's success dataLayer events must still fire). Whichever path, the `<ContactForm>` island and its `dataLayer` events (`formularInitializat/Trimis/Eroare`, `conversieAcceptata`) must match legacy behavior exactly.
- **Security pin:** if Option 2 uses `@astrojs/node`, pin `>= 9.5.3` (CVE-2026-25545 SSRF). Never use `return new Response(...)` in non-page components (Astro SSG `ResponseSentError`); it is valid only in this `api/contact.ts` route.

## Alternatives considered

- **Full SSR (`output: 'server'`)** — rejected. Makes all 9 routes dynamic for the sake of one form; worse performance, larger attack surface, harder pixel-diff stability. Hybrid static + one endpoint is strictly better here.
- **Astro Server Actions** instead of an API route — viable and ergonomic, but adds a newer abstraction; a plain `POST` endpoint mirrors the legacy `sideform.php` contract more transparently. Revisit if Server Actions simplify validation on the chosen adapter.

## GATE 1 Resolution (2026-05-31)

**Option 2 (Astro SSR endpoint) was chosen.** Rendering split confirmed: `output: 'static'` for all pages;
`src/pages/api/contact.ts` is the sole on-demand route (`export const prerender = false`). Adapter:
`@astrojs/cloudflare` (per ADR 0005). Email provider: Resend SDK (not SendGrid). Spam protection: hidden
honeypot field + server-side validation (zod) + rate-limiting — no visible CAPTCHA. Legacy `sideform.php`
and SendGrid PHP SDK are NOT ported. The form POST target changes from `/sideform.php` to `/api/contact`;
all other form UX (AJAX flow, UTM hidden fields, GDPR checkbox, dataLayer events) is preserved verbatim.
