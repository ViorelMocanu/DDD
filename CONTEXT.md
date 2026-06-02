# CONTEXT.md — dedede.ro Astro Rebuild

> Domain glossary, route map, and component inventory for the dedede.ro parity rebuild.
> Read this first, every session. It is the shared vocabulary and current-state record for the
> migration from the legacy Elder.js + Svelte 3 site to Astro 6.x. Decisions that shape the build
> live in [`docs/adr/`](docs/adr/); this file records the _domain_ and the _state_.

---

## 1. What this project is

**`dedede.ro`** is the marketing website of a Romanian pest-control business serving **București + Ilfov**
(Bucharest and Ilfov county). The brand name **DeDeDe** is a play on the shared `de-` prefix of the three
core services it sells; the business tagline is **"Spații fără dăunători"** (pest-free spaces).

**Mission of this repo:** rebuild the live site with **strict visual, functional, and SEO parity** from the
legacy stack (**Elder.js 1.7.5 + Svelte 3.57 + Rollup 2**) into **Astro 6.x** (SSG-first, TypeScript strictest,
SCSS via `sass-embedded`, pnpm). Delivery is **PR-only**; a human reviews and deploys at each gate.

**Content source of truth:** the gitignored `/livesite` folder is an FTP snapshot of the LIVE deployment.
It is authoritative for content, markup, meta, and assets. The legacy `src/` (Svelte) is a SECONDARY
reference, used only to understand component structure. `/livesite` contains secrets (`env.php`,
`php_errorlog`) — never read their values into output, never copy them into the repo.

---

## 2. Domain glossary (RO ↔ EN)

The site is **Romanian-only** (`<html lang="ro">`). These terms recur in content, slugs, meta, and form fields.

| Term (RO)                  | EN gloss                          | Context / notes                                                                                   |
| -------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------- |
| DDD                        | Pest-control triple-service abbr. | Stands for the three services combined (Dezinsecție + Dezinfecție + Deratizare)                   |
| Dezinsecție                | Insect control / extermination    | Cockroaches, bedbugs, wasps, mosquitoes, flies, bats, moths, ticks, ants                          |
| Dezinfecție                | Disinfection / surface sanitation | Killing viruses, bacteria, pathogens on surfaces                                                  |
| Deratizare                 | Rodent control / rat-proofing     | Eliminating mice and rats                                                                         |
| Dăunători                  | Pests / vermin                    | Collective term for insects + rodents + pathogens                                                 |
| Gândaci                    | Cockroaches                       | Primary pest keyword; "gândaci de bucătărie" = kitchen cockroaches                                |
| Ploșnițe                   | Bedbugs                           | High search-intent pest term                                                                      |
| Șobolani / șoareci         | Rats / mice                       | Rodent terms                                                                                      |
| Informații utile           | Useful info / blog index          | Section name for the editorial articles                                                           |
| Confidențialitate          | Privacy / GDPR policy             | Legal page                                                                                        |
| Termeni și condiții        | Terms and conditions              | Legal page                                                                                        |
| Cookies                    | Cookie policy                     | GDPR compliance page (confirmed absent Cookiebot — see §6 resolved items)                         |
| Prima pagină               | Homepage                          | Navigation label                                                                                  |
| Spații fără dăunători      | Pest-free spaces                  | Site tagline                                                                                      |
| DeDeDe / dedede.ro         | Brand name                        | Play on the `de-` prefix shared by all three services; domain = dedede.ro                         |
| Sideform / `sideform.php`  | Legacy PHP contact-form backend   | Accepted POST from contact page, sent via SendGrid — NOT ported; replaced by Resend SSR endpoint  |
| Cloudflare Workers (Static Assets) | Edge runtime + static hosting | Deploy target via `@astrojs/cloudflare` v13 + `wrangler deploy` (NOT Pages). One Worker serves both the pre-rendered static pages (Static Assets / `ASSETS` binding, adapter-managed) and the one SSR route (`/api/contact`). `wrangler.jsonc` stays minimal; no `pages_build_output_dir` |
| Resend                     | Transactional email service       | Replaces SendGrid; API key stored as `RESEND_API_KEY` env binding; official SDK `resend`          |
| Content collection         | Astro typed content layer         | `src/content/blog/*.md` — the 3 articles; schema enforced by Zod at build time                    |
| Parity waiver              | Approved intentional deviation    | A deliberate, documented delta from byte/pixel parity; each waiver gets an entry in `WAIVERS.md`  |
| Honeypot field             | Invisible spam-protection input   | Hidden `<input>` in the contact form; bots fill it, humans don't; rejected server-side            |
| București + Ilfov          | Bucharest + Ilfov county          | Service area                                                                                      |

---

## 3. Route map (9 routes)

| URL                                              | Purpose                                          | Source type                       | Notable interactivity                                              | Legacy Svelte file                                          |
| ------------------------------------------------ | ------------------------------------------------ | --------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| `/`                                              | Homepage: hero, services, testimonials, contact  | Static page                       | Hero CTA, nav hamburger, dark-mode toggle, back-to-top            | `src/routes/home/Home.svelte`                              |
| `/contact/`                                      | Lead-capture form                                | Static page + SSR endpoint        | Full contact form (AJAX), validation, UTM hidden fields, GDPR box | `src/routes/contact/Contact.svelte`                        |
| `/informatii-utile/`                             | Blog index listing the 3 articles                | Static page (data from MD)        | Article card links                                                | `InformatiiUtile.svelte` + `BlogIndex.svelte`              |
| `/totul-despre-dezinsectie/`                     | Article: full guide to insect control            | Markdown article, **root-level**  | Prev/next nav, read-time display                                  | `BlogPost.svelte`                                          |
| `/cum-scapi-de-gandaci/`                         | Article: how to get rid of cockroaches           | Markdown article, **root-level**  | Prev/next nav, read-time display                                  | `BlogPost.svelte`                                          |
| `/dezinfectie-dezinsectie-deratizare-diferente/` | Article: differences between the three services  | Markdown article, **root-level**  | Prev/next nav, read-time display                                  | `BlogPost.svelte`                                          |
| `/termeni-si-conditii/`                          | Terms of use (legal)                             | Static page (pure prose)          | None                                                              | `termeni-si-conditii.svelte`                               |
| `/confidentialitate/`                            | GDPR privacy policy                              | Static page (pure prose)          | None                                                              | `confidentialitate.svelte`                                 |
| `/cookies/`                                      | Cookie policy (Cookiebot / GDPR)                 | Static page (pure prose)          | None                                                              | `cookies.svelte`                                           |

**Parity-critical routing note:** the three blog articles resolve at **root level**
(`/totul-despre-dezinsectie/`, NOT `/informatii-utile/totul-despre-dezinsectie/`). Elder.js achieves
this because the markdown plugin's `slugFormatter` returns `false` and `createRoutes: true` generates
top-level slugs. Astro must replicate exactly these URLs — see [`docs/adr/0002-routing-model.md`](docs/adr/0002-routing-model.md).

---

## 4. Component & interactivity inventory (static vs island)

**Headline finding: zero of the six legacy display components require a client island.** All behavior is
either pure build-time data transformation (dates, read-time) or DOM-only vanilla JS (nav toggle, dark
mode, back-to-top) handled by the legacy `script.js`. The **only** thing needing real hydration is the
contact form, which becomes a single dedicated Astro island.

### Components → Astro mapping

| Component      | Legacy file                         | Judgment                  | Evidence                                                                                              |
| -------------- | ----------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `DeHeader`     | `src/components/DeHeader.svelte`     | **STATIC** → `.astro`     | No reactive state/stores. Active nav `class` resolves at SSR from the route. Hamburger is DOM-only JS. |
| `DeFooter`     | `src/components/DeFooter.svelte`     | **STATIC** → `.astro`     | Only `new Date()` for copyright year (build-time). Dark-mode + back-to-top wired in `script.js`.       |
| `Layout`       | `src/layouts/Layout.svelte`          | **STATIC** → `.astro`     | Renders header/footer, `<head>` meta, slot. `onMount` calls a no-op. GTM `<noscript>` is declarative.  |
| `Articol`      | `src/components/Articol.svelte`      | **STATIC** → `.astro`     | Pure card: thumbnail, title, excerpt, date, read-time. Composes `DataCitibila` + `TimpCitire`.         |
| `DataCitibila` | `src/components/DataCitibila.svelte` | **STATIC** → `.astro`/TS  | Pure date-formatting from build-time frontmatter. No reactivity.                                       |
| `TimpCitire`   | `src/components/TimpCitire.svelte`   | **STATIC** → `.astro`/TS  | Read-time = word-count ÷ 225. Pure computation. No reactivity.                                         |

### Interactivity → hydration strategy

| Behavior              | Source in live site                                       | Needs client island?                                                                 |
| --------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Hamburger nav toggle  | `#menuToggle` → `script.js`; toggles `.Active` on `#header` | **No.** Vanilla JS in a `<script>` tag (or `<script is:inline>`) in the layout.       |
| Dark-mode toggle      | `#darkMode` → `script.js`; reads/writes `localStorage`     | **No.** Vanilla JS. Needs `<script is:inline>` early in `<head>` to avoid mode flash. |
| Back-to-top           | `#backTop` + IntersectionObserver on hero                 | **No.** Vanilla JS.                                                                   |
| **Contact form**      | `#sideform` on `/contact/`; AJAX POST -> `/api/contact`     | **No framework island (GATE-1).** Vanilla JS AJAX in `script.js` -> SSR `api/contact.ts`. |
| GTM / Google Ads      | Injected in `script.js`; container `GTM-NGTSNLX`           | **No.** `<script is:inline>` in layout; fires on 6 non-legal routes only.             |
| Cookiebot             | Referenced in brief; confirmed ABSENT on live site        | **No.** Not present (no Cookiebot script found). GDPR gap noted — out of scope.        |
| Scroll/animation, search | Not present beyond back-to-top observer                | N/A                                                                                  |

---

## 5. Third-party, assets & SEO surface (preserve for parity)

- **Fonts:** `Archivo` variable font at `/resources/archivo-var.woff2`, preloaded in every `<head>`.
- **Logos / images:** responsive `<picture>` for logo (desktop SVG, mobile SVG + PNG fallback, 850px breakpoint),
  hero SVG, services SVG, per-article thumbnails in `webp` + `jpg`. All served from `/images/`; mirror under `public/images/`.
- **Favicons / PWA:** full favicon set, `site.webmanifest` (theme `#fde24f`), `browserconfig.xml`, `humans.txt`
  (update Svelte→Astro), `robots.txt` (allow all, disallow `/login`, sitemap at `https://dedede.ro/sitemap.xml`),
  `sitemap.xml` (9 URLs). An inactive Workbox `service-worker.js` exists but registration is commented out — do not enable unless asked.
- **Analytics / tags:** GTM `GTM-NGTSNLX` (+ `<noscript>` iframe), Google Ads / DoubleClick conversion `AW-10780123066`,
  GA presumed via GTM, `fb:app_id` meta `811489239521802`. dataLayer events: `formularInitializat`, `formularTrimis`,
  `formularEroare`, `conversieAcceptata`. GTM + Ads load on the 6 non-legal routes only; legal pages load
  NO analytics. NO Cookiebot/consent UI (confirmed absent on live — GDPR gap is a future recommendation,
  NOT in scope; analytics fire unconditionally on the 6 non-legal routes, matching live).
- **Contact endpoint:** replaced (GATE-1 decision, 2026-05-31). Legacy `sideform.php` (SendGrid PHP) is NOT
  ported. New endpoint: `src/pages/api/contact.ts` (Astro SSR, `prerender=false`), validates with Zod, sends
  via **Resend** SDK. Env vars: `RESEND_API_KEY`, `RESEND_FROM`, `CONTACT_TO` (values in gitignored `.env` /
  Cloudflare bindings; `.env.example` committed). Form POST target changes from `/sideform.php` to
  `/api/contact`; AJAX UX, UTM hidden fields, and GDPR checkbox are preserved unchanged.

---

## 6. Current project status

| Item                  | State                                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Phase                 | **Phase 2 / GATE 1 complete** — spec locked (2026-05-31); awaiting approval to scaffold (Phase 4).                                 |
| Branch                | `feat/astro-rebuild` (off `main`). PR-only delivery; no commit/push/merge without explicit human go-ahead per gate.                |
| Astro scaffold        | **Not yet created.** No `package.json`, no dependencies, no Astro/Vitest/Playwright config. Happens in **Phase 4**.                |
| ADRs                  | `0001`–`0006` **Accepted** (GATE 1 resolved 2026-05-31). `0002`–`0006` reflect approved decisions (0006 = Resend contact handler). |
| Spec                  | **Locked.** All GATE-1 decisions encoded. Phase 4 scaffold unblocked pending human go-ahead.                                       |
| Approved waivers      | 4 parity waivers approved (SEO meta cleanups, OG image fix, homepage h1 contrast, sitemap/PWA niceties) — see `WAIVERS.md`.        |

### Definition of Done (parity oracle, encode in Phase 4+)

Evidence is committed under `parity/`. A page/route is "done" only when all hold:

1. **Route-inventory match** — every legacy public URL resolves identically (9 routes, all trailing-slash, articles at root level). Redirects = NONE (any future URL change needs its own ADR + 301).
2. **Visual parity** — `≤ 0.1%` pixel diff (`maxDiffPixelRatio: 0.001`) at mobile (375×812), tablet (768×1024), desktop (1440×900).
3. **Functional E2E parity** — Playwright covers nav, dark mode, back-to-top, contact form submit.
4. **SEO/meta parity** — title, description, canonical, OG, Twitter, inline microdata (NO JSON-LD added), `sitemap.xml`, `robots.txt`, `site.webmanifest` diffed against live, accounting for the approved §9 meta/sitemap/manifest waivers.
5. **Quality gates green** — `astro check`/`tsc --noEmit`, ESLint, Prettier, Vitest, Playwright, `@axe-core`, `pnpm audit --audit-level=high`.
6. **Lighthouse ≥ live scores** — `@lhci/cli` against `astro preview`.

### Open items to confirm before / at GATE 1

- **Cookiebot presence:** referenced in the brief but absent from the FTP snapshot. Inspect live `https://dedede.ro`
  before Phase 4 to confirm whether it is injected via GTM or a standalone `<script>`. Do NOT assume absent.
- **Deploy target + contact backend:** the open GATE-1 decision (ADR `0005`). Determines which adapter is installed
  and whether hybrid `output: 'static'` with one SSR endpoint is needed.

### Known extension points (flagged for the future, out of scope now)

- **Multi-segment blog slugs:** if a future article slug contains `/`, the `[slug].astro` route must become `[...slug].astro` (rest param).
- **i18n / hreflang:** site is RO-only today. If a second locale is ever added, `hreflang` must be retro-fitted across the `BaseHead` component.
- **New images post-parity:** once parity is certified, new images may use `astro:assets` + Sharp; legacy images stay passthrough to protect pixel baselines (see [`docs/adr/0003-content-pipeline.md`](docs/adr/0003-content-pipeline.md)).
