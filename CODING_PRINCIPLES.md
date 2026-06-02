# Coding Principles — dedede.ro Astro Rebuild

This document defines the coding standards that **MUST** be followed when generating or modifying code for the dedede.ro rebuild. Consult and apply these before any code-generation task.

> **Context.** dedede.ro is a Romanian pest-control (DDD: Dezinsecție / Dezinfecție / Deratizare) marketing site, currently on Elder.js + Svelte 3, being rebuilt in **Astro 6** with strict **visual + functional + SEO parity** to the live site. Delivery is **PR-only**: a human reviews and deploys. Nothing here authorises a commit, push, scaffold, or dependency install on its own — those happen at named gates (see §11).

## Table of Contents

1. [Parity-First Mindset](#1-parity-first-mindset)
2. [Code Validity](#2-code-validity)
3. [Component Design — `.astro` First, Islands Only for Real Interactivity](#3-component-design--astro-first-islands-only-for-real-interactivity)
4. [File / Folder Conventions, Naming & Path Aliases](#4-file--folder-conventions-naming--path-aliases)
5. [Semantic HTML & Accessibility (First-Class)](#5-semantic-html--accessibility-first-class)
6. [SCSS Architecture & Tokens](#6-scss-architecture--tokens)
7. [SEO, Meta & Head Conventions](#7-seo-meta--head-conventions)
8. [Performance Budgets](#8-performance-budgets)
9. [Security & Privacy](#9-security--privacy)
10. [Testing Philosophy — Unit vs E2E vs Visual](#10-testing-philosophy--unit-vs-e2e-vs-visual)
11. [Error Handling](#11-error-handling)
12. [Coding Standards, Linting & Style](#12-coding-standards-linting--style)
13. [Documentation & Comments](#13-documentation--comments)
14. [Branching, Commits & Gate Discipline](#14-branching-commits--gate-discipline)
15. [Validation & Definition of Done](#15-validation--definition-of-done)

---

## 1. Parity-First Mindset

**Principle:** This is a rebuild, not a redesign. The live site is the specification. When in doubt, the live deployment wins over taste, over the legacy Svelte source, and over "best practice" improvements.

- **Source of truth = `/livesite`** (gitignored FTP snapshot of the live deployment). It is authoritative for content, markup, meta, and assets. The legacy `src/` (Svelte) is a **secondary** reference for component structure only.
- **Identical public URLs.** The nine live routes (`/`, `/contact/`, `/informatii-utile/`, `/termeni-si-conditii/`, `/confidentialitate/`, `/cookies/`, and the three root-level articles `/totul-despre-dezinsectie/`, `/cum-scapi-de-gandaci/`, `/dezinfectie-dezinsectie-deratizare-diferente/`) must resolve byte-for-byte at the same paths, with the same trailing-slash behaviour. Any unavoidable URL change requires a **301 redirect** and explicit human sign-off.
- **Do not rename CSS classes.** Preserve exact class names from the livesite HTML. Renaming alters selector specificity and breaks the visual diff baseline.
- **Do not "improve" content, copy, or markup** during the rebuild unless the task explicitly asks. Parity is measured; gratuitous edits show up as diffs and waste the oracle's signal.
- **Two-track asset policy.** Existing images are already optimised — pass them through unchanged (see §8) so byte output matches the screenshot baselines. Only *new* assets added after parity is certified may go through Astro's image pipeline.
- **The parity oracle is the Definition of Done** (see §15). Improvements are welcome — but surfaced as *suggestions*, never silently applied. Capture them; let the human decide post-parity.

---

## 2. Code Validity

**Principle:** Always generate valid HTML, CSS/SCSS, JS, TS, and Astro.

- **Validate against official sources**, not memory:
    - HTML/CSS — [MDN](https://developer.mozilla.org/)
    - Astro — [Astro docs](https://docs.astro.build/) (use the `astro-docs` / Context7 MCP; this stack pins Astro 6, whose APIs differ from older majors)
    - TypeScript — language spec + project `tsconfig` (`strictest`)
- **Verify third-party API signatures before first use.** Astro ecosystem packages (`@astrojs/sitemap`, the chosen adapter, `resend`/SendGrid SDK) move fast — confirm options exist; do not guess from naming.
- **Pin dependency versions exactly** (no `^`/`~` drift). Security-vet every new dependency: `pnpm audit --audit-level=high` must be clean, and unmaintained packages are rejected. Treat high/critical advisories as build-blocking.

---

## 3. Component Design — `.astro` First, Islands Only for Real Interactivity

**Principle:** Default to zero-JS `.astro` components. A client island is a deliberate, justified exception — not a habit.

The domain inventory found that **0 of 6** legacy components need hydration. Encode that bias:

- **Static rendering is the default.** Header, footer, layout, article cards, date formatting, and read-time are all pure build-time computation or DOM-only behaviour → plain `.astro` components.
- **Prefer no framework over `@astrojs/svelte`/React.** Do **not** add a UI-framework integration unless genuine, stateful client interactivity demands it. The contact form is the *only* identified candidate.
- **Vanilla JS for progressive-enhancement behaviours**, delivered via `<script>` in the owning `.astro` file:
    - **Hamburger nav toggle**, **back-to-top** (IntersectionObserver), and similar DOM toggles → ordinary module `<script>` (Astro bundles + scopes it). No island.
    - **Dark-mode toggle** (reads/writes `localStorage`) → an **`<script is:inline>` placed early in `<head>`** to set the body class before paint and avoid a flash-of-wrong-theme. The toggle button handler can live in a normal `<script>`.
    - **GTM / Google Ads / Cookiebot** → `<script is:inline>` in the layout `<head>`, plus the `<noscript>` GTM iframe. Keep firing gated behind Cookiebot consent. Never wrap analytics in a framework island.
- **When an island is truly required** (the contact form): build a single focused component and hydrate with the **narrowest directive** that works. Prefer `client:visible` or `client:idle` over `client:load` unless the interaction must be ready immediately. Keep its `<style>` in the `.astro` wrapper, not inside the island, to avoid FOUC.
- **Islands are leaves, not branches.** An island wraps the minimum interactive surface; the surrounding page stays static. Never hydrate a layout or a whole page to get one button working.
- **Decision rule:** if the behaviour can be expressed as build-time HTML, a CSS state, or a small vanilla `<script>`, it is **not** an island. Only real client-side *state that drives re-render* justifies hydration.

---

## 4. File / Folder Conventions, Naming & Path Aliases

**Principle:** Predictable structure that an auditor can map 1:1 to the live routes.

### Folder layout (target)

```
src/
    pages/                  # file-based routes (1 file ≈ 1 URL)
        index.astro                         → /
        contact.astro                       → /contact/
        informatii-utile.astro              → /informatii-utile/
        termeni-si-conditii.astro           → /termeni-si-conditii/
        confidentialitate.astro             → /confidentialitate/
        cookies.astro                       → /cookies/
        [slug].astro                        → the 3 root-level articles
        api/
            contact.ts                      → POST handler (only non-static route)
    layouts/                # page shells (BaseLayout.astro, ArticleLayout.astro)
    components/             # reusable .astro components (DeHeader, DeFooter, Articol, …)
    content/
        blog/               # 3 article entries + Zod schema (content collection)
    styles/                # tokens.scss, global.scss, partials
    lib/                   # pure TS helpers (read-time, date format, slug logic)
public/
    images/                # pass-through, byte-identical to livesite
    resources/             # fonts (archivo-var.woff2) and other static files
    robots.txt             # copied verbatim from livesite
parity/                    # parity evidence: screenshots/, head-diffs/, reports
```

- **Static pages = dedicated `.astro` files** in `src/pages/`. No collection overhead, maximum auditability for SEO parity.
- **The three blog articles are a content collection** (`src/content/blog/`) with a Zod schema (`title`, `description`, `canonical`, `ogImage`, `datePublished`, …). `[slug].astro` calls `getStaticPaths()` → `getCollection('blog')` and returns **exactly** those three slugs. Astro's route-priority rules guarantee the static page files win over `[slug].astro`, so the dynamic route fires only for the articles. **This root-level slug behaviour is parity-critical** — articles are NOT nested under `informatii-utile/`.
    - **Extension point:** a future multi-segment slug requires `[...slug].astro` (rest param). Note this if it ever arises; do not pre-build it.

### Naming

- **Components & layouts:** `PascalCase.astro` (`DeHeader.astro`, `BaseLayout.astro`).
- **Pages:** lowercase, hyphenated, matching the live URL slug exactly (`termeni-si-conditii.astro`). The on-disk slug is canonical — never invent or guess a slug.
- **TS helpers / modules:** `kebab-case.ts` (`read-time.ts`), exporting `camelCase` functions and `PascalCase` types.
- **CSS classes:** preserve the live names verbatim (see §1). For genuinely *new* markup only, follow the live site's existing casing convention rather than introducing a competing one.
- **Constants:** `UPPER_SNAKE_CASE`. Variables/functions: `camelCase`. Types/interfaces: `PascalCase`.

### Path aliases

- Define TS path aliases in `tsconfig.json` (e.g. `@components/*`, `@layouts/*`, `@lib/*`, `@styles/*`, `@content/*`) and import via them — **never** deep relative chains (`../../../`).
- Aliases must resolve identically for `tsc`, Astro, Vitest, and Playwright. Keep them in one place; do not duplicate the mapping across configs by hand if a shared resolver can be referenced.

---

## 5. Semantic HTML & Accessibility (First-Class)

**Principle:** Accessibility is a non-negotiable acceptance criterion, not a polish pass. Target **WCAG 2.1 AA across every route, AAA wherever the live design already affords it** — and never regress below the live site's accessibility.

### Semantic HTML

- Use the correct HTML5 landmarks: `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`. One `<main>` per page; one `<h1>` per page.
- Choose elements by meaning, not appearance. Maintain a correct, gap-free heading outline (`h1`→`h6`).
- Forms use real `<label for>`/`<input id>` pairs, `<fieldset>`/`<legend>` where grouping applies, and native input `type`s.

### WCAG checklist (apply to every route)

- **Perceivable:** every non-text element has a text alternative; decorative images use `alt=""`; contrast meets **AA (4.5:1 text, 3:1 large/UI)** and AAA (7:1) where the live palette allows. Never use colour as the sole information channel.
- **Operable:** full keyboard reachability and operability; visible, non-suppressed focus styles; logical tab order; no keyboard traps; skip-link to `<main>`; the hamburger nav and contact form must be fully keyboard-driveable.
- **Understandable:** `<html lang="ro">` (single-language site); predictable navigation; form fields have programmatic labels, helpful inline error text, and `aria-describedby` linking errors to inputs; invalid fields get `aria-invalid`.
- **Robust:** prefer native semantics; reach for ARIA only when HTML can't express the role/state, and keep ARIA correct (no redundant or conflicting roles). Live regions (`aria-live="polite"`) announce async contact-form success/failure.

### Motion & preferences

- Respect `prefers-reduced-motion`: gate the back-to-top scroll and any micro-animation behind it.
- Dark-mode toggle must not strand a user mid-state; persist and restore via `localStorage` without a flash (see §3).

### Tooling

- `@axe-core/playwright` runs on **every** route in the E2E suite; zero serious/critical violations is a gate. Manual keyboard + screen-reader spot-checks on the contact form before that route is "done".

---

## 6. SCSS Architecture & Tokens

**Principle:** SCSS via `sass-embedded`, organised around tokens, with the DOM kept free of utility-class noise. Visual output must match the live CSS exactly.

- **Processor:** `sass-embedded` (native Dart Sass), supported by Astro 6 / Vite with no extra plugin. Author component styles in `<style lang="scss">`.
- **Modern module system only:** use `@use` / `@forward`. **Never `@import`** (deprecated in Dart Sass).
- **Tokens:** `src/styles/tokens.scss` holds design tokens as **CSS custom properties** (so dark-mode can swap them at runtime) with SCSS variable aliases where compile-time math is needed. Import per-component with `@use '@styles/tokens' as *;`. Mirror the live theme values exactly — notably the brand color `#fde24f` and the dark/light mode variables.
- **Global base/reset:** `src/styles/global.scss`, imported **once** in `BaseLayout.astro`. Per-component styles stay scoped in their `.astro` file.
- **No FOUC concern for static pages:** Astro hoists component `<style>` into the page `<head>` at build time — there is no runtime injection. Keep any island's styles in its `.astro` wrapper, not in the island module.
- **Specificity discipline:** match the live cascade. Do not deepen selectors or add `!important` to "win" — that is a parity regression in disguise. Reproduce the legacy specificity, don't out-specify it.
- **Style formatting:** single-line rules except at-rule queries (`@media`, `@keyframes`, `@supports`, `@container`), which place their nested rules inside the element they address for portability. Short hex (`#fff`). Tabs for indentation.

---

## 7. SEO, Meta & Head Conventions

**Principle:** SEO parity is measured per-route. Title, description, canonical, Open Graph, Twitter card, JSON-LD, sitemap, robots, and favicons must match the live site head — equivalently or better, never worse.

- **A single `BaseHead.astro`** owns the `<head>` and accepts typed props: `title`, `description`, `canonical` (absolute, built from `Astro.site + Astro.url.pathname`), `ogImage`, `ogType`, `twitterCard`, and optional `jsonLd`. Inline JSON-LD as `<script type="application/ld+json" set:html={JSON.stringify(jsonLd)}>`.
- **Per-route meta** (titles, descriptions, OG images such as `og-image.jpg`, `og-image-contact.jpg`, per-article OG) is copied from the livesite snapshot. Preserve the `fb:app_id` and any existing meta verbatim unless told otherwise.
- **Canonical & trailing slashes:** every page emits a self-referential canonical with the **same trailing-slash form** as live. Configure Astro's `trailingSlash` to match.
- **Sitemap:** `@astrojs/sitemap` auto-discovers prerendered routes; verify the output enumerates all nine URLs with priorities matching the live `sitemap.xml`. `robots.txt` is copied **verbatim** from livesite (allow all, disallow `/login`, reference the sitemap).
- **i18n / hreflang:** the site is Romanian-only → `<html lang="ro">` and **no hreflang**. If i18n is ever added, hreflang must be retro-fitted across `BaseHead` — flag this as a known extension point, do not build it now.
- **Head-diff automation is part of the oracle:** a Playwright helper fetches live vs local for each route, parses `<head>`, and asserts equivalence of title, description, canonical, `og:*`, `twitter:*`, and JSON-LD. A meaningful head diff fails the route.
- **Favicons / manifest / PWA artifacts** (`favicon.*`, `site.webmanifest`, `browserconfig.xml`, `humans.txt`) are reproduced from livesite. Update only stale tech credits in `humans.txt` (Astro, not Svelte/Webpack). The legacy service worker is **inactive on live** — do not enable it unless explicitly asked.

---

## 8. Performance Budgets

**Principle:** Match or beat the live site's Lighthouse scores; never ship a slower page than what's live.

- **Lighthouse gate:** run `@lhci/cli` against `astro preview`. **Performance, Accessibility, Best Practices, and SEO must each be ≥ the live site's score** for the corresponding route. Below-live is a build-blocking regression.
- **Ship near-zero JS.** Every island is a budget line item; justify each one (§3). Static pages should ship **no** page JS beyond the small inline theme/analytics scripts.
- **Images pass through unchanged.** Configure `passthroughImageService()` so existing optimised assets emit byte-identical output (re-encoding would break visual baselines). Still use `<Image>`/explicit `width`+`height`+`alt` to lock dimensions and prevent CLS. New post-parity images may use Sharp.
- **Fonts:** preload the single variable font (`/resources/archivo-var.woff2`) via `<link rel="preload" as="font" type="font/woff2" crossorigin>` exactly as live; `font-display` behaviour must match. Don't add new font requests.
- **Critical path:** CSS is hoisted to `<head>` by Astro; keep it lean. No render-blocking third-party scripts before consent. Analytics load deferred/`is:inline` and consent-gated.
- **Track CI cost:** record build, unit, E2E, and Lighthouse durations; optimise the slow ones. Never exceed any hosting / third-party free-tier budget.

---

## 9. Security & Privacy

**Principle:** Build secure-by-default and never leak secrets or personal data into the repo.

- **Secrets never enter the repo or output.** `/livesite` contains secrets (`env.php`, `php_errorlog`) — **never read their values into output, never copy them into the repo, never print them.** If a secret appears in a diff or log, stop and flag it.
- **The contact endpoint handles untrusted input.** Validate and sanitise every field server-side (`side_name`, `side_email`, `side_telephone`, `side_tip`, `side_mesaj`, the UTM/`gclid` fields). Validate email/phone shape; cap lengths; reject unexpected `side_tip` values; strip control characters. Client-side validation is UX, not a security boundary.
- **Output encoding:** escape any user-derived content rendered back; Astro auto-escapes expressions — reserve `set:html` for trusted, build-time content (e.g. JSON-LD) only.
- **Email delivery secrets** (SendGrid / Resend API key, etc.) come from environment/Wrangler secrets — never inlined, never committed. Decide SendGrid-vs-Resend and the deploy adapter at **Gate-1** before scaffolding the endpoint.
- **Transport & headers:** HTTPS only; honour CSP/HSTS/`X-Frame-Options` parity (and tighten if the live config is weak — flag, don't silently weaken). `target="_blank"` always pairs with `rel="noopener"`.
- **Dependencies:** pinned, audited, maintained (see §2). Follow OWASP Top 10 for the form path.
- **GDPR / consent:** Cookiebot gates analytics (GTM `GTM-NGTSNLX`, Google Ads `AW-10780123066`, DoubleClick). No tracking fires before consent. Cookiebot presence on live must be confirmed during Phase 4 before assuming its config.

---

## 10. Testing Philosophy — Unit vs E2E vs Visual

**Principle:** Test at the cheapest layer that gives confidence. Pure logic → unit; behaviour & accessibility → E2E; pixels → visual. The whole suite is also the parity oracle.

### Unit (Vitest)

- **What:** pure functions and data transforms — read-time (`words / 225`), date formatting, slug logic, content-collection Zod schema validation, any contact-form field validators.
- **Rules:** no DOM, no network, deterministic. Fast feedback loop. Test edge cases (empty input, boundary read-times, malformed frontmatter). Aim for high coverage on `src/lib/**`.

### E2E / functional (Playwright)

- **What:** real browser behaviour — nav hamburger toggle and resize-collapse, dark-mode persistence across reload, back-to-top visibility, **contact-form submission** (valid path, validation errors, the `dataLayer` events `formularInitializat` / `formularTrimis` / `formularEroare` / `conversieAcceptata`), and the head/SEO diff (§7).
- **Accessibility:** `@axe-core/playwright` on every route; zero serious/critical violations.
- **Form network:** assert the POST shape/endpoint without sending real leads (intercept/mock the endpoint in test).

### Visual regression (Playwright `toHaveScreenshot`)

- **What:** pixel parity vs the livesite snapshot at three explicit viewports — mobile `375×812`, tablet `768×1024`, desktop `1440×900` — for all nine routes.
- **Threshold:** `maxDiffPixelRatio: 0.001` (**≤ 0.1%**). Baselines live in `parity/screenshots/` and are generated against the **live snapshot**, not against our own build, before any page counts as done.
- **Discipline:** never update a baseline to silence a diff without confirming the diff is intended and human-approved. A surprising visual diff is a finding, not noise.

### What NOT to over-test

- Don't unit-test Astro rendering output that the visual/head diff already covers. Don't E2E-test pure functions a unit test pins faster. One behaviour, one owning layer.

---

## 11. Error Handling

**Principle:** Fail loud at build time, fail gracefully and accessibly at runtime, and never swallow errors.

- **No silent catches.** Catch only to add context or recover; rethrow or surface otherwise. An empty `catch {}` is an anti-pattern.
- **No `console.*` in shipped code.** Use a proper logger / error-reporting utility. (`console` is permitted only in tests and throwaway scripts.)
- **Build-time (SSG):** invalid content-collection frontmatter or a missing required asset must **fail the build** via the Zod schema or an explicit `throw`. Better a red build than a broken live page. Do not paper over missing data with defaults that diverge from live.
- **Astro response rule:** `return new Response(...)` is valid **only** in page routes (`src/pages/**`) and the API route (`src/pages/api/contact.ts`). In a non-page `.astro` component it triggers `ResponseSentError` during prerender — `throw new Error(...)` there and let the boundary handle it.
- **Contact endpoint:** validate → on failure return a typed JSON error with an appropriate status (4xx for bad input, 5xx for delivery failure) **without leaking** internal/SendGrid details. The client surfaces a friendly, accessible message (`aria-live`), preserves user input, and pushes `formularEroare` to `dataLayer`. Network/transport failures degrade gracefully (retry affordance, no data loss).
- **Error responses must not echo secrets or stack traces** to the client.

```typescript
// Good: add context, surface a typed result, no secret leakage
try {
	const result = await sendContactEmail(payload);
	return Response.json({ ok: true, message: "Mesaj trimis." });
} catch (error) {
	logger.error("Contact email delivery failed", { error });
	return Response.json({ ok: false, message: "Trimiterea a eșuat. Reîncearcă." }, { status: 502 });
}

// Bad: swallow + lose the cause
try {
	return await sendContactEmail(payload);
} catch {
	return Response.json({ ok: false });
}
```

---

## 12. Coding Standards, Linting & Style

**Principle:** One consistent style, enforced by tooling, matching the reference-repo conventions.

### TypeScript

- **`strictest` config.** **No `any`** — use `unknown` + narrowing. No `@ts-ignore` / `@ts-expect-error` to hide real type errors. Explicit return types on exported functions. Prefer `const`; never `var`.
- Use `Number.isNaN` / `Number.isFinite` (not the globals), `Array.isArray`, object spread over `Object.assign`, and a radix with `parseInt`. Prevent import cycles. No hardcoded secrets/keys/tokens.

### Formatting (Prettier + `prettier-plugin-astro`)

- **Tabs** for indentation (`useTabs: true`, width 4). **LF** line endings. **Semicolons always.** Double quotes. Trailing commas `all`. Bracket spacing on; arrow parens always. `printWidth: 3000` (no auto-wrap — wrap by hand for readability). UTF-8, final newline, no trailing whitespace.
- **Markdown override:** 4-space indentation (no hard tabs), prose-wrap never.
- Astro indentation is owned by ESLint where it conflicts with Prettier (same convention as the reference repo); run the project's `verify:fix` so the final pass matches the lint rules.

### Linting (ESLint flat config)

- Honour the project's flat config: sorted imports, no duplicate imports/args, no `console`, Astro plugin rules, and `jsx-a11y`-equivalent accessibility rules for Astro templates. Warnings are signal — drive them to zero before "done".

### Style consistency

- **Mimic existing patterns** in the repo before introducing a new one. If existing code violates a principle here (a11y, security, validity), **flag it to the user** — do not silently "fix" unrelated code, and do not copy the violation forward.
- `pnpm` only — never `npm`/`yarn`. Prefer `pnpm <script>` / `pnpm exec` over `npx`.
- **Windows-first:** developed on Windows 11 / PowerShell. Committed scripts must be cross-platform (no bashisms baked into `package.json` scripts); use Node-based scripts where shell portability is at risk.

---

## 13. Documentation & Comments

**Principle:** Document the *why*; let types and names carry the *what*.

- **JSDoc** every exported function/type: a description, `@param` (typed), `@returns` (typed). Keep it accurate as code changes.
- Comment non-obvious decisions, parity constraints ("class name preserved from live — do not rename"), and any deliberate deviation from a principle here (with rationale).
- Keep `CONTEXT.md` (domain glossary/taxonomy) and any ADRs current as decisions crystallise — especially Gate-1 (deploy target / email provider) and the root-level-slug routing decision.
- Record parity evidence under `parity/` (screenshots, head diffs, Lighthouse reports) as the audit trail.

```typescript
/**
 * Estimate reading time in minutes from article body text.
 *
 * @param {string} text - Plain-text article body.
 * @param {number} [wpm=225] - Words-per-minute reading speed (legacy parity value).
 * @returns {number} Whole-minute reading-time estimate, matching the live site.
 */
export function readingTimeMinutes(text: string, wpm = 225): number {
	const words = text.trim().split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / wpm));
}
```

---

## 14. Branching, Commits & Gate Discipline

**Principle:** PR-only delivery with explicit human go-aheads. The agent never self-authorises a destructive or publishing action.

- **New branch + PR only.** **Never** `git commit`, `git push`, or merge without an explicit user request at the relevant gate. After finishing work, summarise changes and *propose* a Conventional Commits message — do not execute it.
- **Never bypass hooks** (`--no-verify`, `--no-gpg-sign`) and never skip signing unless the user explicitly asks.
- **Gate-1 (pre-scaffold):** deploy target + email provider (Netlify+Resend / Cloudflare+Resend / Node sidecar+SendGrid) is a **human decision** — it determines the adapter and whether the hybrid `output: 'static'` + one SSR endpoint is viable. Do not scaffold the Astro project, create `package.json`, install dependencies, or write framework config until this gate is passed.
- **Commits:** Conventional Commits `<type>(<scope>): <subject>`, subject < 72 chars, atomic and focused. Co-author trailer as configured.
- **Destructive ops** (delete/move files, `reset --hard`, force-overwrite): **ask first.** Never touch `/livesite`.
- **Remind to run `/simplify`** before any commit/push.

---

## 15. Validation & Definition of Done

**Principle:** A route is done only when the parity oracle is green and the quality gates pass. Evidence lives in `parity/`.

### The verify gate

`pnpm verify` chains the static gates **in order, fail-fast** (run `verify:fix` for the auto-fixing loop); this is exactly the sequence `scripts/run-verify.mjs` runs:

```bash
# typecheck gate uses `astro check` when Astro is installed, else falls back to `tsc --noEmit`
prettier --check . && eslint . && tsc --noEmit && vitest run && playwright test
```

Lighthouse (`lhci autorun`) and `pnpm audit --audit-level=high` run as separate steps outside the orchestrator (Lighthouse is part of the parity oracle; audit is the security gate).

> **Note:** prefer `tsc --noEmit` over `@astrojs/check` while the latter's transitive `yaml` advisory is unpatched. Re-evaluate at dependency-vetting time.

### Definition of Done (per route, then whole-site)

A route is **done** only when **all** of the following hold:

- [ ] **Route inventory match** — URL resolves at the identical path + trailing-slash form as live.
- [ ] **Visual parity** — ≤ 0.1% pixel diff vs the live snapshot at mobile / tablet / desktop.
- [ ] **Functional parity** — E2E behaviours (nav, dark mode, back-to-top, contact form, dataLayer events) match live.
- [ ] **SEO/meta parity** — head diff equivalent (title, description, canonical, OG, Twitter, JSON-LD); sitemap + robots correct.
- [ ] **Accessibility** — zero serious/critical axe violations; keyboard + focus verified; not below live.
- [ ] **Performance** — Lighthouse ≥ live scores for the route.
- [ ] **Quality gates green** — `pnpm verify` passes; `pnpm audit --audit-level=high` clean.
- [ ] **Evidence committed** under `parity/` (screenshots, head diff, Lighthouse report).
- [ ] **No secrets** introduced; `/livesite` untouched.

Only when every route — and the whole-site inventory — satisfies this list is the rebuild ready for human review.

---

## Quick Reference

### Technologies (this stack)

- **Astro 6.x** — SSG-first; one SSR endpoint (contact) via the Gate-1 adapter.
- **TypeScript** `strictest` — no `any`, explicit return types.
- **SCSS** via **`sass-embedded`** — `@use`/`@forward`, token-driven, DOM kept utility-class-free.
- **Vanilla JS** client behaviours; **client islands only for real interactivity** (contact form).
- **Vitest** (unit) + **Playwright** (E2E, a11y, visual) + **`@lhci/cli`** (Lighthouse).
- **ESLint** (flat config) + **Prettier** (`prettier-plugin-astro`, tabs, LF) + **pnpm**.

### Folder anchors

- `src/pages/` — one file per URL; `[slug].astro` for the 3 root-level articles.
- `src/content/blog/` — article collection + Zod schema.
- `src/styles/` — `tokens.scss`, `global.scss`.
- `public/images/` + `public/resources/` — pass-through assets, byte-identical to live.
- `parity/` — the audit trail (screenshots, head diffs, Lighthouse).

### Key resources

- [MDN](https://developer.mozilla.org/) · [Astro docs](https://docs.astro.build/) · [WCAG 2.1 quickref](https://www.w3.org/WAI/WCAG21/quickref/) · [OWASP Top 10](https://owasp.org/www-project-top-ten/) · [Conventional Commits](https://www.conventionalcommits.org/) · [Playwright snapshots](https://playwright.dev/docs/test-snapshots)

---

_These principles are mandatory for every code-generation task in the dedede.ro rebuild. When a principle and the live site conflict on a parity question, the live site wins — and the conflict gets flagged to the human._
