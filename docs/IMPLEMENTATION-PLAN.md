# dedede.ro Astro Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL — use **superpowers:subagent-driven-development** (recommended; dispatch each task to a fresh subagent in this session) or **superpowers:executing-plans** (separate session with review checkpoints) to implement this plan task-by-task. Every step uses checkbox (`- [ ]`) syntax for tracking. Do NOT batch tasks; complete, verify, and commit one at a time. NEVER commit, push, scaffold, or `pnpm install` without an explicit human go-ahead at the named gate (SPEC §11).

**Goal:** Re-platform the live `dedede.ro` marketing site from Elder.js 1.7.5 + Svelte 3 + Rollup to Astro 6 (SSG-first) with strict visual, functional, and SEO parity across all 9 public routes, applying only the 7 approved deviations in `parity/WAIVERS.md`.

**Architecture:** All 9 routes are static (`output: 'static'`); the single on-demand surface is `src/pages/api/contact.ts` (`prerender = false`) running as one Cloudflare Worker via `@astrojs/cloudflare`. Six fixed `.astro` pages + one index + a single `[slug].astro` catch route whose `getStaticPaths()` allow-lists exactly the 3 root-level article slugs. Content comes from a typed `blog` content collection (3 markdown files) and from prose copied verbatim out of the committed baseline HTML fixtures; zero UI-framework islands (`@astrojs/svelte` NOT installed) — all interactivity is vanilla JS in `public/resources/script.js`.

**Tech Stack:** Astro `^6.4.2`, TypeScript `^6.0.3` (`astro/tsconfigs/strictest`), SCSS via `sass-embedded`, `@astrojs/cloudflare` `^13.6.0`, `@astrojs/sitemap` `^3.7.3`, `resend` `^6.12.4`, `sharp` `^0.34.5` (build-host OG image only), pnpm 10+. Tooling: ESLint 10 flat config, Prettier 3 (tabs, printWidth 3000), Vitest 4, Playwright 1.60 + `@axe-core/playwright`, `@lhci/cli`, husky + commitlint, knip. Deploy: Cloudflare Pages + 1 Worker. `trailingSlash: 'always'`, `build.format: 'directory'`.

---

## How this plan relates to the section appendices

This file is the **authoritative executable spine** with a single continuous task counter (Tasks 1–38). The detailed, code-complete section files are its **appendices** — link out to them for full code bodies rather than re-typing. Group ownership:

| Group | Tasks | Detail appendix |
|---|---|---|
| **A. Scaffold + config + install/audit** | 1–13 | [`docs/plan/01-scaffold-config.md`](plan/01-scaffold-config.md) |
| **B. Global styles + BaseLayout + BaseHead + DeHeader/DeFooter + TS helpers + script.js** | 14–21 | *Owned inline here* (no standalone `02-*` file exists) — TS helpers cross-link to [`04-articles-collection.md`](plan/04-articles-collection.md) Tasks 3–5 |
| **C. Content collection + schema** | 22–23 | [`docs/plan/04-articles-collection.md`](plan/04-articles-collection.md) Tasks 1–2 |
| **D. Static pages + articles + `[slug].astro`** | 24–29 | [`03-static-pages.md`](plan/03-static-pages.md) + [`04-articles-collection.md`](plan/04-articles-collection.md) Task 6 |
| **E. Contact form + endpoint** | 30–33 | [`docs/plan/05-contact-endpoint.md`](plan/05-contact-endpoint.md) |
| **F. Approved fixes** | 34–37 | [`docs/plan/06-approved-fixes.md`](plan/06-approved-fixes.md) |
| **G. Tests + parity verification + DoD gates** | 38 | *Owned inline here* (no standalone `07-*` file exists); parity harness = [`parity/tools/`](../parity/tools/) |

> **Two reconciliations the spine LOCKS (appendices defer to these):**
> 1. **Content config path/API.** Use Astro v6 **`src/content.config.ts`** with the **`glob()` loader** (`import { glob } from 'astro/loaders'`), per SPEC §6 and [`01-scaffold-config.md`](plan/01-scaffold-config.md) Task 6. The legacy `type: 'content'` + `src/content/config.ts` form shown in [`04-articles-collection.md`](plan/04-articles-collection.md) Task 1 is **superseded** — keep the identical Zod schema, but move the file to `src/content.config.ts` and swap to `glob()`. Markdown lives under `src/content/blog/`.
> 2. **Entry identifier.** With the `glob()` loader the URL key is **`entry.id`** (filename without extension), not `entry.slug`. Anywhere an appendix writes `entry.slug`, read it as `entry.id`. Articles render via `import { render } from 'astro:content'`.

---

## File structure (target tree)

```
dedede-ro/
	astro.config.mjs                 # output:static, cloudflare(), sitemap(serialize), passthroughImageService, trailingSlash, build.format
	tsconfig.json                    # astro/tsconfigs/strictest + path aliases
	eslint.config.js                 # flat: JS + TS + Astro + a11y + jsdoc
	.prettierrc                      # tabs, printWidth 3000, prettier-plugin-astro
	.editorconfig
	commitlint.config.cjs
	vitest.config.ts                 # node env, path aliases
	playwright.config.ts             # 3 viewports + webServer astro preview
	knip.config.ts
	lighthouserc.cjs                 # @lhci/cli — Lighthouse >= live gate (DoD §6)
	wrangler.jsonc                   # Cloudflare Pages + Worker (pages_build_output_dir, nodejs_compat)
	.env.example                     # RESEND_API_KEY / RESEND_FROM / CONTACT_TO shape
	.gitignore                       # + .astro/ dist/ .wrangler/ .env test output
	package.json                     # Astro deps, scripts -> scripts/run-verify.mjs
	pnpm-lock.yaml
	scripts/
		run-verify.mjs               # EXISTS (do not modify) — defensive gate orchestrator
		generate-og-image.mjs        # NEW — Sharp branded 1200x630 OG image (WAIVER-ASSET-01)
	.husky/
		pre-commit                   # format + lint
		commit-msg                   # commitlint
	src/
		content.config.ts            # blog collection (glob loader, Zod; date: z.string())
		content/
			blog/
				totul-despre-dezinsectie.md
				cum-scapi-de-gandaci.md
				dezinfectie-dezinsectie-deratizare-diferente.md
		layouts/
			BaseLayout.astro         # html shell, BaseHead, skip-nav, DeHeader/DeFooter, analytics gate, script.js, dark-mode no-flash inline script
		components/
			BaseHead.astro           # the meta engine (title/desc/canonical/og/article/twitter/theme/preload/mask-icon) + WAIVER-SEO-01..04
			DeHeader.astro           # nav, active-route class from Astro.url.pathname
			DeFooter.astro           # copyright 2021-${year}, dark-mode/back-to-top hooks
			Articol.astro            # article card; composes formatDate + readingTime
		pages/
			index.astro              # / (home) — analytics ON
			contact.astro            # /contact/ — analytics ON
			informatii-utile.astro   # /informatii-utile/ (blog index) — analytics ON
			termeni-si-conditii.astro# /termeni-si-conditii/ — analytics NONE
			confidentialitate.astro  # /confidentialitate/ — analytics NONE
			cookies.astro            # /cookies/ — analytics NONE (og:description name=)
			[slug].astro             # 3 root-level articles (allow-list) — analytics ON
			api/
				contact.ts           # POST handler, prerender=false (the only Worker route)
		styles/
			tokens.scss              # :root brand tokens (+ --color-highlight-hero, WAIVER-VISUAL-01)
			global.scss              # global styles ported from livesite style.scss (+ .Hero .Highlight override)
		utils/
			formatDate.ts            # RO date formatter (DataCitibila.svelte -> TS)
			readingTime.ts           # round(words/225) (TimpCitire.svelte -> TS)
		tests/
			content-collection.test.ts   # schema + getStaticPaths allow-list + helpers
			home-article-order.test.ts
			blog-index-sort.test.ts
			approved-fixes.test.ts
			unit/
				contact-endpoint.test.ts
			e2e/
				global-behaviours.spec.ts # nav hamburger, dark-mode, back-to-top
				contact.spec.ts           # form happy-path/validation/honeypot/dataLayer/axe
				approved-fixes.spec.ts    # axe contrast delta, rel=prev/next, body nav
				parity.spec.ts            # per-route meta + a11y assertions
	public/
		robots.txt                   # verbatim (SPEC §4)
		site.webmanifest             # + start_url (WAIVER-SEO-05)
		images/                      # legacy images copied byte-for-byte (+ regenerated og-image.jpg)
		resources/
			script.js                # 7 behaviours; POST target -> /api/contact; UTM bug fix
			archivo-var.woff2        # preloaded font
		favicon.ico, *.png, mask-icon.svg, ...   # favicons / PWA icons (verbatim)
```

> Note: `parity/` (harness + baseline fixtures), `livesite/` (gitignored FTP snapshot), and `tmp/` are **inputs**, never shipped. The harness keeps its own `package.json` and is excluded from tsconfig/eslint/knip.

---

# Task list (dependency-ordered, single counter)

## Group A — Scaffold, config, install & audit

> Full code bodies: [`docs/plan/01-scaffold-config.md`](plan/01-scaffold-config.md). Each task there has complete file contents; this spine restates the critical-path ones and the commit cadence. **Tasks 1–13 map 1:1 to that file's Tasks 1–13.**

### Task 1 — Replace `package.json` with Astro deps; install; audit
**Files:** Modify `package.json`; (generated) `pnpm-lock.yaml`
- [ ] Replace the Elder.js `package.json` with the Astro pnpm entry (deps/devDeps pinned to SPEC §8; scripts route `verify`/`verify:fix` to the existing `scripts/run-verify.mjs`). Full JSON: [`01-scaffold-config.md`](plan/01-scaffold-config.md) Task 1. NO `@astrojs/svelte`, NO `@astrojs/mdx`.
- [ ] `pnpm install` (only at the install gate, with human go-ahead).
- [ ] `pnpm audit --audit-level=high` → zero high/critical. **Record the result inline** in the appendix CVE-tracking block (SPEC §8). Do not lower the audit level.
- [ ] `node scripts/run-verify.mjs verify` → exits 0 (all gates SKIP vacuously at empty scaffold).
- [ ] **Commit:** `chore: replace Elder.js package.json with Astro 6 scaffold deps`

### Task 2 — `astro.config.mjs`
**Files:** Create `astro.config.mjs`
Inline the critical config (verified Astro v6 API — `passthroughImageService` from `'astro/config'`, `cloudflare()` default import, sitemap `serialize()` per-item):

```js
// astro.config.mjs
import { defineConfig, passthroughImageService } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";

const SITE = "https://dedede.ro";
const BUILD_DATE = new Date().toISOString();

// Per-URL priority + changefreq are byte-locked to the baseline sitemap (WAIVER-SEO-05 changes ONLY lastmod).
const PRIORITY = { "/": 1.0, "/contact/": 1.0, "/informatii-utile/": 0.8, "/totul-despre-dezinsectie/": 0.9, "/cum-scapi-de-gandaci/": 0.9, "/dezinfectie-dezinsectie-deratizare-diferente/": 0.9, "/termeni-si-conditii/": 0.5, "/confidentialitate/": 0.5, "/cookies/": 0.5 };
// changefreq is byte-locked to the baseline sitemap (WAIVER-SEO-05 changes ONLY lastmod): /contact/ = weekly, all others = monthly (incl. the 3 articles).
const CHANGEFREQ = { "/": "monthly", "/contact/": "weekly", "/informatii-utile/": "monthly", "/totul-despre-dezinsectie/": "monthly", "/cum-scapi-de-gandaci/": "monthly", "/dezinfectie-dezinsectie-deratizare-diferente/": "monthly", "/termeni-si-conditii/": "monthly", "/confidentialitate/": "monthly", "/cookies/": "monthly" };
// Article lastmod from frontmatter date (bare YYYY-MM-DD). Static pages -> build date.
const ARTICLE_LASTMOD = { "/totul-despre-dezinsectie/": "2021-09-14", "/cum-scapi-de-gandaci/": "2021-09-13", "/dezinfectie-dezinsectie-deratizare-diferente/": "2021-09-12" };

export default defineConfig({
	site: SITE,
	output: "static",                       // single SSR route opts out via prerender=false
	adapter: cloudflare(),
	image: { service: passthroughImageService() },  // no Sharp on the Worker; legacy images byte-for-byte
	trailingSlash: "always",
	build: { format: "directory" },         // dist/<route>/index.html
	integrations: [
		sitemap({
			filter: (page) => !page.includes("/api/"),
			serialize(item) {
				const path = new URL(item.url).pathname;
				if (PRIORITY[path] !== undefined) item.priority = PRIORITY[path];
				if (CHANGEFREQ[path] !== undefined) item.changefreq = CHANGEFREQ[path];
				item.lastmod = ARTICLE_LASTMOD[path] ?? BUILD_DATE;   // WAIVER-SEO-05 (i)
				return item;
			},
		}),
	],
	vite: { css: { preprocessorOptions: { scss: { api: "modern-compiler" } } } },
});
```
> The appendix's alternative (reading frontmatter via `fs` at config load) is also valid; the hard-coded `ARTICLE_LASTMOD` map above is simpler and the 3 dates are fixed. Either satisfies WAIVER-SEO-05 (i).
- [ ] `pnpm astro info` → adapter reports `@astrojs/cloudflare`.
- [ ] **Commit:** `feat: add astro.config.mjs with cloudflare adapter, sitemap, passthrough image service`

### Task 3 — `tsconfig.json` (strictest + aliases)
**Files:** Create `tsconfig.json`
- [ ] Extend `astro/tsconfigs/strictest`; declare the 7 path aliases (`@components @layouts @lib @utils @content @styles @img`); exclude `parity/tools parity/baseline livesite tmp public dist .wrangler`. Full file: [`01-scaffold-config.md`](plan/01-scaffold-config.md) Task 3.
- [ ] `pnpm typecheck` → `tsc --noEmit` exits 0.
- [ ] **Commit:** `chore: add tsconfig.json (astro/tsconfigs/strictest + path aliases)`

### Task 4 — `eslint.config.js` (flat: JS + TS + Astro + a11y + jsdoc)
**Files:** Create `eslint.config.js`
- [ ] Flat config with three blocks (JS, TS, `.astro` via `astro-eslint-parser`), `globalIgnores` for `parity/ livesite/ tmp/ public/ dist/ .astro/`. Full file: appendix Task 4.
- [ ] `pnpm lint` → 0 errors on empty src.
- [ ] **Commit:** `chore: add ESLint flat config (JS + TS + Astro + a11y + jsdoc)`

### Task 5 — `.prettierrc`, `.editorconfig`, `commitlint.config.cjs`
**Files:** Create all three
- [ ] Prettier: `useTabs:true`, `printWidth:3000`, `endOfLine:"lf"`, `plugins:["prettier-plugin-astro"]`, md override `useTabs:false`. EditorConfig: tabs, LF, UTF-8. Commitlint `.cjs`: `extends config-conventional` + `type-enum` (feat/fix/docs/chore/style/refactor/ci/test/revert/perf). Full bodies: appendix Task 5.
- [ ] `pnpm format` → config parses.
- [ ] **Commit:** `chore: add Prettier, EditorConfig, and commitlint configs`

### Task 6 — `src/content.config.ts` (LOCKED: glob loader, Astro v6 path)
**Files:** Create `src/content.config.ts`
```ts
// src/content.config.ts  — NOTE: NOT src/content/config.ts (Astro v6 moved it)
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
	loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/blog" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		excerpt: z.string(),
		// Bare YYYY-MM-DDTHH:MM:SS, NO timezone, NO coerce — passes verbatim to article:published_time (SPEC §6)
		date: z.string(),
		author: z.string(),
		thumbnail: z.object({ name: z.string(), alt: z.string() }),
		ogimage: z.object({ url: z.string(), alt: z.string() }),
		modifiedDate: z.string().optional(),
	}),
});

export const collections = { blog };
```
> `z.coerce.date()` is forbidden — it round-trips and reformats, breaking parity. This supersedes the `type:'content'` form in [`04-articles-collection.md`](plan/04-articles-collection.md) Task 1 (same schema, new loader + path).
- [ ] `pnpm typecheck` (after Task 22 populates the collection) → 0 errors. At scaffold time the empty collection still type-syncs.
- [ ] **Commit:** `feat: add Astro v6 blog content collection schema (glob loader, date as z.string)`

### Task 7 — `.env.example` + `wrangler.jsonc`
**Files:** Create both
- [ ] `.env.example` documents `RESEND_API_KEY`, `RESEND_FROM`, `CONTACT_TO` (placeholders only). `wrangler.jsonc`: `name`, `pages_build_output_dir:"dist"`, `compatibility_date`, `compatibility_flags:["nodejs_compat"]` (required by `resend`), `observability.enabled`. Full bodies: appendix Task 7.
- [ ] **Commit:** `chore: add .env.example (Resend shape) and wrangler.jsonc (Cloudflare Pages)`

### Task 8 — `vitest.config.ts`
**Files:** Create `vitest.config.ts`
- [ ] `environment:"node"`, include `src/**/*.test.ts` + `src/tests/**`, exclude `tests/e2e parity livesite tmp`, mirror tsconfig aliases in `resolve.alias`. Full body: appendix Task 8.
- [ ] `pnpm test` → "no test files" exit 0.
- [ ] **Commit:** `chore: add vitest.config.ts (node env, path aliases, unit test glob)`

### Task 9 — `playwright.config.ts`
**Files:** Create `playwright.config.ts`
- [ ] 3 viewport projects (mobile 375×812 / tablet 768×1024 / desktop 1440×900, all Chromium), `webServer: pnpm preview` on `http://localhost:4321`, `testDir: src/tests/e2e`. Full body: appendix Task 9.
- [ ] `pnpm exec playwright install --with-deps chromium`.
- [ ] `pnpm e2e` → parses, no test files yet.
- [ ] **Commit:** `chore: add playwright.config.ts (3 viewports, webServer astro preview)`

### Task 10 — `knip.config.ts`
**Files:** Create `knip.config.ts`
- [ ] Entry = pages/layouts/components/utils/tests/configs; ignore `parity livesite tmp dist .wrangler .astro`; `ignoreDependencies` for `sass-embedded sharp prettier-plugin-astro @commitlint/config-conventional wrangler @lhci/cli`. Full body: appendix Task 10.
- [ ] `pnpm knip` → parses (noise expected on empty project).
- [ ] **Commit:** `chore: add knip config (entry points, ignore parity/livesite/tmp)`

### Task 11 — Husky hooks
**Files:** Create `.husky/pre-commit`, `.husky/commit-msg`
- [ ] `pnpm prepare`; pre-commit = `pnpm format && pnpm lint`; commit-msg = `pnpm exec commitlint --edit "$1"`. Test a bad and a good message. Full bodies: appendix Task 11.
- [ ] **Commit:** `chore: add husky pre-commit (format+lint) and commit-msg (commitlint) hooks`

### Task 12 — `.gitignore` additions
**Files:** Modify `.gitignore`
- [ ] Append `.astro/ dist/ .wrangler/ .dev.vars .env .env.local playwright-report/ test-results/ coverage/`. Keep `.env.example` tracked. Full list: appendix Task 12.
- [ ] **Commit:** `chore: add Astro, wrangler, pnpm, and test output entries to .gitignore`

### Task 13 — Wire & run the full gate suite
**Files:** none (uses existing `scripts/run-verify.mjs`)
- [ ] `pnpm verify` → all gates PASS/SKIP (no FAIL). `pnpm audit --audit-level=high` → clean; record output.
- [ ] **Commit:** `chore: complete scaffold — all config files in place, verify gate green`

---

## Group B — Global styles, BaseLayout, BaseHead (meta engine), DeHeader/DeFooter, TS helpers, script.js

> **No standalone `02-*` appendix exists — this group is owned by the spine.** BaseHead / BaseLayout are referenced as prerequisites by sections 03/04/05/06; their contracts are derived from those callers and from the baseline meta JSON. Build this group BEFORE any page. Copy assets first so the visual harness has images to render against.

### Task 14 — Copy legacy assets byte-for-byte into `public/`
**Files:** Create `public/images/**`, `public/resources/archivo-var.woff2`, favicons, `public/robots.txt`, `public/site.webmanifest` (baseline form, no `start_url` yet — added in Task 36)
- [ ] Copy the 38 actively-loaded images + font + favicons from the livesite snapshot to `public/` **unchanged** (ADR 0003 two-track policy). Copy `robots.txt` verbatim from [`parity/baseline/seo/robots.txt`](../parity/baseline/seo/robots.txt) and `site.webmanifest` from [`parity/baseline/seo/site.webmanifest`](../parity/baseline/seo/site.webmanifest). Do NOT re-encode anything. The 0-byte `og-image.jpg` is left as-is here; Task 34 regenerates it.
- [ ] Verify byte-equality against [`parity/baseline/assets/`](../parity/baseline/assets/) for a sample (any non-identical legacy image is a regression).
- [ ] **Commit:** `chore(assets): copy legacy images, font, favicons, robots.txt, manifest byte-for-byte`

### Task 15 — `src/styles/tokens.scss` + `src/styles/global.scss`
**Files:** Create both
- [ ] Port `:root` brand tokens and global rules from `livesite/resources/style.scss` (theme-color `#fde24f`, dark `#00214d`, etc.) into `tokens.scss` (variables) + `global.scss` (element/utility/component rules). Keep class names verbatim. The `.Hero .Highlight` contrast override and the `--color-highlight-hero` token are added later in Task 35 (WAIVER-VISUAL-01) — leave a clearly-marked anchor comment.
- [ ] `global.scss` is imported once in `BaseLayout.astro` via `@use "@styles/global"`; per-component `<style lang="scss">` blocks `@use "@styles/tokens" as *` for variables only.
- [ ] **Commit:** `feat(styles): port tokens.scss and global.scss from legacy style.scss`

### Task 16 — `src/utils/formatDate.ts` (+ unit test seed)
**Files:** Create `src/utils/formatDate.ts`
- [ ] Deterministic RO formatter producing `14 Septembrie 2021 la ora 11:40` by string-splitting the bare ISO (NOT `new Date()`, to avoid TZ shift). Full body + JSDoc: [`04-articles-collection.md`](plan/04-articles-collection.md) Task 3.
- [ ] Hold commit — tested and committed with Task 23 (helpers + tests together).

### Task 17 — `src/utils/readingTime.ts`
**Files:** Create `src/utils/readingTime.ts`
- [ ] `readingTimeMinutes(text, wpm=225) = max(1, round(words/wpm))` + `wordCount(text)`. Full body: [`04-articles-collection.md`](plan/04-articles-collection.md) Task 4.
- [ ] Hold commit — committed with Task 23.

### Task 18 — `src/components/BaseHead.astro` (the meta engine)
**Files:** Create `src/components/BaseHead.astro`
This is the SEO/parity heart. It accepts typed props and emits the full `<head>` metadata diffed against `parity/baseline/meta/<route>.json`. **Bake in WAIVER-SEO-01..04 from the start** (so pages need no special-casing):

```astro
---
// src/components/BaseHead.astro
interface Props {
	title: string;
	description: string;
	canonical: string;          // absolute, trailing-slash
	ogImage: string;            // absolute OR root-relative (resolved below)
	ogImageAlt: string;
	ogType?: "website" | "article";   // default website; [slug].astro passes "article" (WAIVER-SEO-03)
	articlePublishedTime?: string;    // verbatim, mixed TZ preserved
	articleModifiedTime?: string;
}
const SITE = "https://dedede.ro";
const { title, description, canonical, ogImage, ogImageAlt, ogType = "website", articlePublishedTime, articleModifiedTime } = Astro.props;
// WAIVER-SEO-02: root-relative og:image -> absolute (articles); already-absolute unchanged.
const resolvedOgImage = ogImage.startsWith("/") ? `${SITE}${ogImage}` : ogImage;
---
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />
<link rel="preload" href="/resources/archivo-var.woff2" as="font" type="font/woff2" crossorigin />
<meta name="theme-color" content="#fde24f" />
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#00214d" />
<!-- ALL og:* and article:* emitted as name= (WAIVER-SEO-04 normalises /cookies/) -->
<meta name="og:type" content={ogType} />
<meta name="og:title" content={title} />
<meta name="og:description" content={description} />
<meta name="og:url" content={canonical} />
<meta name="og:image" content={resolvedOgImage} />
<meta name="og:image:alt" content={ogImageAlt} />
{articlePublishedTime && <meta name="article:published_time" content={articlePublishedTime} />}
{articleModifiedTime && <meta name="article:modified_time" content={articleModifiedTime} />}
<!-- WAIVER-SEO-01: twitter:site / twitter:creator (@TODO) intentionally OMITTED; keep card -->
<meta name="twitter:card" content="summary_large_image" />
<!-- favicons / manifest links: copy the exact set from baseline meta head; site.webmanifest, og:site_name, og:locale, fb:app_id etc. reproduced verbatim per route from parity/baseline/meta/<route>.json -->
```
> **Parity contract:** every additional baseline head tag (`og:site_name`, `og:locale`, `og:email`, `og:phone_number`, `fb:app_id`, `article:publisher`, `og:image:width/height`, favicon `<link>` set) MUST be reproduced verbatim — diff the rendered head against the baseline meta JSON for each route. Emoji in home/contact descriptions preserved exactly. `[slug].astro` does NOT pass any `rel=prev/next` for the head (WAIVER-SEO-05 (ii)).
- [ ] **Commit:** `feat(head): add BaseHead meta engine with WAIVER-SEO-01..04 baked in`

### Task 19 — `src/components/DeHeader.astro` + `src/components/DeFooter.astro`
**Files:** Create both
- [ ] **DeHeader:** convert `DeHeader.svelte` markup verbatim (logo, nav, hamburger button with its `id`s, skip-nav target). Active-route class derived from `Astro.url.pathname`. Hamburger toggle handler lives in `script.js` (not here). Preserve all `id`/`class`/`aria` and inline SVGs from baseline HTML.
- [ ] **DeFooter:** convert `DeFooter.svelte` verbatim; copyright renders `2021-${new Date().getFullYear()}` at build. Dark-mode toggle + back-to-top button markup preserved (behaviour wired in `script.js`). Drop the dead `onMount`/`add_resize_listener` stubs.
- [ ] Acceptance: these render inside BaseLayout; full visual check happens per page in Group D.
- [ ] **Commit:** `feat(components): add DeHeader and DeFooter (active-nav, copyright, dark-mode hooks)`

### Task 20 — `src/layouts/BaseLayout.astro`
**Files:** Create `src/layouts/BaseLayout.astro`
- [ ] HTML shell: `<html lang="ro">`, `<head>` renders `<BaseHead {...metaProps} />`, an **early `<script is:inline>`** that reads `localStorage` theme to set the dark-mode class BEFORE paint (prevents mode-flash, SPEC §5), skip-nav link, `<body class={bodyClass}>`, `<DeHeader />`, `<slot />`, `<DeFooter />`, deferred `<script src="/resources/script.js" defer>`.
- [ ] **Analytics gate:** accept `analytics: boolean` (alias `loadAnalytics`). When `true`, emit GTM-NGTSNLX + Ads AW-10780123066 (head script + `<noscript>` iframe) exactly as baseline; when `false`, emit NOTHING (legal pages). The GTM/Ads injection from `script.js` runs only on the 6 non-legal routes.
- [ ] Props interface (the contract all pages use): `title, description, canonical, ogImage, ogImageAlt, ogType?, articlePublishedTime?, articleModifiedTime?, analytics, bodyClass?`.
- [ ] **Commit:** `feat(layout): add BaseLayout with BaseHead, dark-mode no-flash script, analytics gate`

### Task 21 — `public/resources/script.js` (7 behaviours, no framework)
**Files:** Create/port `public/resources/script.js`
- [ ] Port the legacy `script.js` verbatim with exactly these changes (SPEC §5): (1) POST target `https://dedede.ro/sideform.php` → `/api/contact` (both occurrences); (2) **fix the UTM bug** — populate hidden fields from `new URLSearchParams(window.location.search)` (legacy `urlParams=[]` never read the URL); (3) keep `dataLayer` events (`formularInitializat`, `formularTrimis`, `conversieAcceptata`, `formularEroare`) and the `gtag('event','conversion',…)` call intact; (4) leave service-worker registration **commented out**. Exact diffs: [`05-contact-endpoint.md`](plan/05-contact-endpoint.md) Task 5.
- [ ] Behaviours covered: hamburger toggle, desktop-resize auto-close, dark-mode (localStorage), back-to-top (IntersectionObserver), contact AJAX submit, UTM population, GTM+Ads injection (6 non-legal routes).
- [ ] `node --check`-style parse confirmation; full behaviour proven by Group E E2E + Task 38 global E2E.
- [ ] **Commit:** `fix(script): port script.js — POST target /api/contact, UTM URLSearchParams fix`

---

## Group C — Content collection records

> Detail: [`docs/plan/04-articles-collection.md`](plan/04-articles-collection.md) Tasks 2 & 5. Schema already created in Task 6.

### Task 22 — Three article markdown files
**Files:** Create `src/content/blog/{totul-despre-dezinsectie,cum-scapi-de-gandaci,dezinfectie-dezinsectie-deratizare-diferente}.md`
- [ ] Copy each file (frontmatter + body) verbatim from the legacy `src/routes/informatii-utile/<slug>.md`. Frontmatter field names already match the SPEC §6 schema. **Preserve verbatim:** all diacritics; inline `<br />` in ART1's gel bullet; `<hr />` + `[DeDeDe.ro](/)` / `[serviciile DeDeDe](/#servicii)` links in ART3. Full frontmatter blocks: [`04-articles-collection.md`](plan/04-articles-collection.md) Task 2.
- [ ] **Commit:** `feat(content): add three blog article markdown files with correct schema frontmatter`

### Task 23 — Helper tests + schema/allow-list test (TDD; commits Tasks 16/17 helpers)
**Files:** Create `src/tests/content-collection.test.ts`; commit `src/utils/formatDate.ts`, `src/utils/readingTime.ts`
- [ ] Write the suite from [`04-articles-collection.md`](plan/04-articles-collection.md) Task 5: schema accepts valid frontmatter and **passes the bare date string through unchanged** (no coerce); `src/content/blog/` contains **exactly the 3 expected slugs** (the `getStaticPaths` allow-list pin, DoD §1); `formatDateRo` matches the 3 live display strings + Jan/Dec edges; `readingTimeMinutes` yields 6/5/4; `wordCount` edges.
- [ ] Run → FAIL (helpers missing) → confirm helpers present → run → PASS.
- [ ] **Commit:** `feat(utils): add formatDateRo and readingTimeMinutes helpers with Vitest tests`

---

## Group D — Static pages + articles + `[slug].astro`

> These six tasks are **parallelizable** once Groups B/C are green (each is an independent page that depends only on BaseLayout/BaseHead/Articol + the collection). When using subagent-driven development, dispatch them concurrently. Parity-conversion convention for every page: read `parity/baseline/html/<route>/index.html` (authoritative markup) + `parity/baseline/meta/<route>.json` (head); preserve verbatim every class/id/microdata/href/alt/SVG and all Romanian text/emoji; apply only the WAIVERS noted. Acceptance for each: build → `astro preview` → `parity/tools/capture-baseline.mjs --base http://localhost:4321` → `parity/tools/diff-screens.mjs` ≤ 0.001, plus a meta diff against the baseline JSON accounting for applicable waivers.

### Task 24 — `src/components/Articol.astro` (article card)
**Files:** Create `src/components/Articol.astro`
- [ ] Convert `Articol.svelte` to a card that takes `article: CollectionEntry<'blog'>` and renders the baseline `<li class="Article">` markup verbatim (thumbnail `<picture>` from `thumbnail.name`, title, excerpt, date via `formatDateRo`, read-time via `readingTimeMinutes`). Preserve all classes/attrs.
- [ ] **Commit:** `feat(components): add Articol card composing formatDate + readingTime helpers`

### Task 25 — Homepage `src/pages/index.astro`
**Files:** Create `src/pages/index.astro`; Test `src/tests/home-article-order.test.ts`
- [ ] Convert `Home.svelte`/baseline: Hero (`<h1>` with `.Highlight` spans), 3× `schema.org/Service` + nested `LocalBusiness` microdata (verbatim — see the critical microdata checklist in [`03-static-pages.md`](plan/03-static-pages.md) Task 1), testimonials, `<Articol>` list from `getCollection('blog')` sorted **descending** by `data.date`, contact CTA. `analytics={true}`, `bodyClass="home"`. WAIVER-VISUAL-01 contrast fix is applied via SCSS in Task 35 (token + `.Hero .Highlight` override), NOT inline here.
- [ ] Sort-order unit test (PASS); build; visual diff (index may exceed 0.1% ONLY in the `<h1>` `.Highlight` region per WAIVER-VISUAL-01 once Task 35 lands; otherwise ≤ 0.001); meta diff (twitter `@TODO` absent).
- [ ] **Commit:** `feat(pages): add homepage with microdata, article list, sorted blog cards`

### Task 26 — Blog index `src/pages/informatii-utile.astro`
**Files:** Create `src/pages/informatii-utile.astro`; Test `src/tests/blog-index-sort.test.ts`
- [ ] `getCollection('blog')` sorted descending → `<Articol>` cards; preserve `BlogIndex` hero markup. `analytics={true}`. `og:image=…/og-image-blogindex.jpg`. No visual waivers — any diff is a regression. Detail: [`03-static-pages.md`](plan/03-static-pages.md) Task 2.
- [ ] Sort test PASS; build; visual ≤ 0.001 all viewports; meta diff.
- [ ] **Commit:** `feat(pages): add blog index page with sorted article collection`

### Task 27 — `src/pages/termeni-si-conditii.astro`
**Files:** Create the page
- [ ] Copy prose verbatim from baseline **including the embedded `Politica de utilizare a cookie-urilor` H2 section** (it IS in the deployed HTML — do not remove). `analytics={false}` → assert `GTM-NGTSNLX`/`AW-10780123066` absent in `dist/`. `article:published_time=2021-09-27T19:35:55+03:00` verbatim. Detail: [`03-static-pages.md`](plan/03-static-pages.md) Task 3.
- [ ] Build; no-analytics check; visual ≤ 0.001.
- [ ] **Commit:** `feat(pages): add termeni-si-conditii page with embedded cookie section, no analytics`

### Task 28 — `src/pages/confidentialitate.astro` + `src/pages/cookies.astro`
**Files:** Create both
- [ ] **confidentialitate:** prose verbatim, `analytics={false}`. **cookies:** prose verbatim, `analytics={false}`; `og:description` is emitted as `name=` automatically by BaseHead (WAIVER-SEO-04) — assert `property="og:description"` is absent in `dist/cookies/index.html` and the content string is intact. Detail: [`03-static-pages.md`](plan/03-static-pages.md) Tasks 4 & 5.
- [ ] Build; no-analytics checks; visual ≤ 0.001 both.
- [ ] **Commit:** `feat(pages): add confidentialitate and cookies pages, no analytics (og:description name=)`

### Task 29 — `src/pages/[slug].astro` (3 root-level articles)
**Files:** Create `src/pages/[slug].astro`
- [ ] `getStaticPaths()` over `getCollection('blog')` sorted **ascending** by date → allow-lists exactly 3 ids; props carry `entry, prev, next` (chronological: ddd-diferente→cum-scapi→totul-despre). Render via `render(entry)` → `<Content />`. Preserve verbatim: `schema.org/Article` wrapper, `BreadcrumbList` (positions 1/2/3), hero `<picture>` (`thumbnail.name` → `-desktop.webp`/`-mobile.webp`/`-mobile.jpg`), `ArticlePreMeta`, `wordCount`, headline/author/intro, `ArticleBody` `itemprop`, and the **visible** prev/next `<aside>` nav. `bodyClass="informatii-utile"`, `analytics={true}`. **Apply:** `ogType="article"` (WAIVER-SEO-03), absolute `og:image` via BaseHead (WAIVER-SEO-02), NO `rel=prev/next` head links (WAIVER-SEO-05 (ii)). Full template + transformation rules + preserve-verbatim list: [`04-articles-collection.md`](plan/04-articles-collection.md) Task 6.
- [ ] **Heading-ID parity:** after build, verify rendered `<div class="ArticleBody">` heading `id`s match the baseline list ([`04-articles-collection.md`](plan/04-articles-collection.md) Task 2). If the remark slug algorithm diverges, add a rehype-slug option in `astro.config.mjs` (do NOT hand-write `{#id}` in the markdown).
- [ ] `astro check`; build (3 article `index.html` exist); visual ≤ 0.001 all 3 routes × 3 viewports; meta diff matches baseline except the 4 article waivers.
- [ ] **Commit:** `feat(pages): add [slug].astro article template with microdata, prev/next, hero, §9 fixes`

---

## Group E — Contact form + endpoint

> Detail: [`docs/plan/05-contact-endpoint.md`](plan/05-contact-endpoint.md). TDD order: tests first, then endpoint, then page, then script wiring (already done in Task 21), then E2E.

### Task 30 — Failing unit tests for `/api/contact` (TDD red)
**Files:** Create `src/tests/unit/contact-endpoint.test.ts`
- [ ] Tests: valid→200 + Resend called with correct to/from/subject/html; missing field→400; malformed email→400; bad `side_tip`→400; honeypot filled→200 **silent, no email**; GET→405. Resend mocked. Full body: [`05-contact-endpoint.md`](plan/05-contact-endpoint.md) Task 1. Run → FAIL (module missing).
- [ ] **Commit:** `test(contact): add failing vitest tests for /api/contact endpoint`

### Task 31 — Implement `src/pages/api/contact.ts` (TDD green)
**Files:** Create `src/pages/api/contact.ts`
- [ ] `export const prerender = false`. zod schema over all fields (`side_name/email/telephone/tip/mesaj`, `gdpr` literal "1", honeypot `hp_field`, UTM/`gclid`/`side_url`). Flow: parse JSON (bad→400) → zod (invalid→400) → honeypot filled→silent 200 (no send) → best-effort in-process rate-limit (5/IP/10min; 429) → env from `locals.runtime.env` w/ `process.env` fallback (missing→500) → `Resend.emails.send()` (error→502) → 200 `{success,message}`. Full code: [`05-contact-endpoint.md`](plan/05-contact-endpoint.md) Task 2.
- [ ] Run unit tests → all PASS.
- [ ] **Commit:** `feat(contact): add /api/contact SSR endpoint (zod, honeypot, rate-limit, Resend)`

### Task 32 — `src/pages/contact.astro` (static page + honeypot)
**Files:** Create `src/pages/contact.astro`
- [ ] Lift the form HTML verbatim from `parity/baseline/html/contact/index.html`: every field `id`/`name`/`type`/`maxlength`/`required`/`aria`/`tabindex`/`autocomplete`, the GDPR checkbox, all hidden UTM fields, `<output id="raspuns" for=…>`, the submit SVG, and the `<section class="Contact LimitWidth">` info block (copy from baseline — do not retype). **Change only** `action` → `/api/contact`. **Add** the CSS-hidden honeypot (`hp_field`, class `Honeypot` — `display:none`/off-screen, NOT `type=hidden`). `analytics={true}`, `bodyClass="contact"`. Head from `parity/baseline/meta/contact.json` (`og:type=website`). Full body + SCSS: [`05-contact-endpoint.md`](plan/05-contact-endpoint.md) Task 4.
- [ ] `astro check`; build (`dist/contact/index.html` has `id="sideform"`); visual ≤ 0.001 (honeypot adds zero pixels).
- [ ] **Commit:** `feat(contact): add static contact.astro with preserved form fields and honeypot`

### Task 33 — Contact E2E suite
**Files:** Create `src/tests/e2e/contact.spec.ts`
- [ ] Playwright (`page.route()` mocks `/api/contact`): title/h1, `action="/api/contact"`, all field ids present, hidden UTM fields present, **UTM populated from query params**, honeypot hidden, client validation blocks empty submit, happy-path success + `dataLayer` events (`formularInitializat`/`formularTrimis`/`conversieAcceptata`), server-error path → `formularEroare`, honeypot-filled silent success, axe no-serious; plus direct-fetch GET→405 and empty-POST→400. Full body: [`05-contact-endpoint.md`](plan/05-contact-endpoint.md) Task 6.
- [ ] Run vs `astro preview` → PASS.
- [ ] **Commit:** `test(contact): add Playwright E2E — happy path, validation, honeypot, dataLayer, axe`

---

## Group F — Approved fixes (the 7 waivers)

> Detail: [`docs/plan/06-approved-fixes.md`](plan/06-approved-fixes.md). WAIVER-SEO-01..04 are already baked into BaseHead (Task 18) and WAIVER-SEO-05 (i) lastmod into the sitemap (Task 2) — this group finishes the remaining fixes and writes the dedicated assertions.

### Task 34 — WAIVER-ASSET-01: branded OG image
**Files:** Create `scripts/generate-og-image.mjs`; Modify `public/images/og-image.jpg`; Modify `package.json` (`generate:og` script); add to `src/tests/approved-fixes.test.ts`
- [ ] Sharp script: 1200×630 `#fde24f` canvas + centred `dedede-logo-sqare-light.svg` + tagline "Spații fără dăunători" (`#00214d`) → `public/images/og-image.jpg` (mozjpeg q90). Run it; verify >10 KB and 1200×630. Sharp is build-host only (never the Worker). Full script: [`06-approved-fixes.md`](plan/06-approved-fixes.md) Task 1. Smoke test (size>10 000) in `approved-fixes.test.ts`.
- [ ] **Commit:** `feat(assets): generate real branded 1200x630 og-image.jpg [WAIVER-ASSET-01]`

### Task 35 — WAIVER-VISUAL-01: `.Highlight` contrast fix
**Files:** Modify `src/styles/tokens.scss`, `src/styles/global.scss`; add to `src/tests/e2e/approved-fixes.spec.ts`
- [ ] Add `--color-highlight-hero: #fde24f` token; add scoped `.Hero .Highlight { color: var(--color-highlight-hero); }` (do NOT touch global `.Highlight` — Services/Footer must stay unchanged). TDD: axe contrast test on `.Hero` FAIL → apply → PASS. Detail: [`06-approved-fixes.md`](plan/06-approved-fixes.md) Task 2.
- [ ] Full visual diff: bounded `<h1>` diff on `index` (all 3 viewports) is EXPECTED; any diff on the other 8 routes is a regression.
- [ ] **Commit:** `fix(a11y): fix .Highlight color-contrast in Hero h1 to WCAG AA [WAIVER-VISUAL-01]`

### Task 36 — WAIVER-SEO-05 (ii)+(iii): drop `rel=prev/next` head links; manifest `start_url`
**Files:** Modify `src/pages/[slug].astro` (confirm no head prev/next — already omitted in Task 29); Modify `public/site.webmanifest`; add to `approved-fixes.test.ts` + `approved-fixes.spec.ts`
- [ ] E2E: articles have **0** `head link[rel=prev]`/`[rel=next]`, AND the **visible** `<aside>` body nav is present (retained). Add `"start_url": "/"` to `site.webmanifest` (all other keys byte-identical); Vitest asserts `start_url` + unchanged keys. Detail: [`06-approved-fixes.md`](plan/06-approved-fixes.md) Tasks 5 & 6.
- [ ] **Commit:** `feat(seo,pwa): drop deprecated rel=prev/next head links; add manifest start_url [WAIVER-SEO-05]`

### Task 37 — SEO-waiver assertion suite (consolidate)
**Files:** Modify `src/tests/approved-fixes.test.ts`
- [ ] Unit assertions pinning the resolver logic for WAIVER-SEO-02 (root-relative→absolute, absolute unchanged, undefined→default), WAIVER-SEO-03 (`article` valid og:type), WAIVER-SEO-05 lastmod date extraction (`slice(0,10)` → 2021-09-14/13/12; build date `YYYY-MM-DD`). Bodies: [`06-approved-fixes.md`](plan/06-approved-fixes.md) Tasks 3 & 4. Run → PASS.
- [ ] **Commit:** `test(seo): pin WAIVER-SEO-02/03/05 resolver assertions`

---

## Group G — Tests, parity verification & DoD gates

> **No standalone `07-*` appendix — owned by the spine.** This is the Phase-5 verification spine: it adds the remaining cross-route E2E (global behaviours, per-route meta/a11y), wires the Lighthouse gate, then runs the full parity oracle and classifies every diff against `parity/WAIVERS.md`.

### Task 38 — Full verification & DoD oracle
**Files:** Create `src/tests/e2e/global-behaviours.spec.ts`, `src/tests/e2e/parity.spec.ts`, `lighthouserc.cjs`; Modify `package.json` (`lhci` script — the `@lhci/cli ^0.15.1` devDep is already in the Task 1 scaffold budget, so no install beyond the Task 1 gate); (run, no source changes) parity harness
- [ ] **Global-behaviours E2E** (`global-behaviours.spec.ts`): nav hamburger open/close + desktop-resize auto-close; dark-mode toggle persists via localStorage with no flash; back-to-top appears/scrolls. Run on all 9 routes where applicable.
- [ ] **Per-route meta + a11y E2E** (`parity.spec.ts`): for each of the 9 routes, assert the rendered head matches `parity/baseline/meta/<route>.json` (applying the WAIVERS), and `@axe-core/playwright` reports no NEW serious violations vs `parity/baseline/a11y/` (the only allowed delta is the *removal* of the homepage `.Highlight` contrast violation).
- [ ] **Lighthouse gate** (`lighthouserc.cjs` + `@lhci/cli`): run against `astro preview`; assert each route scores **≥** the live baseline in `parity/baseline/perf/`.
- [ ] **Parity oracle run:** `pnpm build && pnpm preview`, then `node parity/tools/capture-baseline.mjs --base http://localhost:4321` → `node parity/tools/diff-screens.mjs --threshold 0.001` across all 9 routes × 3 viewports (analytics/ads/consent hosts blocked during capture). Classify each diff via `parity/WAIVERS.md`: only `index` `<h1>` region may exceed 0.1% (WAIVER-VISUAL-01); everything else ≤ 0.1%. Sitemap/robots/manifest diffed against `parity/baseline/seo/` accounting for WAIVER-SEO-05.
- [ ] **Full gate:** `pnpm verify` (prettier → eslint → astro check/tsc → vitest → playwright) green; `pnpm audit --audit-level=high` clean; `pnpm knip` clean.
- [ ] Fix any regression (diff NOT matched by a waiver), re-verify.
- [ ] **Commit:** `test(parity): full DoD verification — visual, meta, a11y, lighthouse, gates green`

---

## Test & DoD gate (SPEC §10 → task map)

The Definition-of-Done oracle has 6 criteria. A route ships only when all hold; the Phase-5 verifier re-runs the harness against `astro preview` and classifies every diff via `parity/WAIVERS.md`.

| # | SPEC §10 criterion | Satisfied by task(s) |
|---|---|---|
| **1** | **Route-inventory match** — 9 trailing-slash URLs, articles at root, no 301s; Vitest pins `getStaticPaths()` to exactly 3 slugs | Routing config **Task 2** (`trailingSlash`/`build.format`); pages **Tasks 25–29**; allow-list pin **Task 23**; `robots.txt` **Task 14** |
| **2** | **Visual parity** — ≤ 0.1% pixel diff per view at 3 viewports, except WAIVER-VISUAL-01 (`index` `<h1>`) | Per-page diffs **Tasks 25–29, 32**; contrast waiver **Task 35**; full sweep **Task 38** |
| **3** | **Functional E2E parity** — nav hamburger (+resize), dark-mode (persist/no-flash), back-to-top, UTM population, contact submit (success/validation/honeypot/dataLayer) | `script.js` **Task 21**; contact E2E **Task 33**; global-behaviours E2E **Task 38** |
| **4** | **SEO/meta + sitemap + robots parity** — head/sitemap/robots/manifest diffed vs baseline, accounting for §9 (a)/(d) | BaseHead engine **Task 18**; sitemap lastmod **Task 2**; robots/manifest **Tasks 14, 36**; per-route meta E2E + sitemap diff **Task 38** |
| **5** | **Quality gates green (`pnpm verify`)** — astro check/tsc, ESLint, Prettier, Vitest, Playwright, axe, knip, `pnpm audit` | Scaffold/wiring **Tasks 1–13**; husky **Task 11**; final run **Task 38** |
| **6** | **Lighthouse ≥ live + axe no-new-serious** | Contrast improvement **Task 35**; Lighthouse + axe-delta gate **Task 38** |

---

## Execution notes for Phase 4

- **Gate discipline (overrides everything):** this is PR-only delivery. NEVER `pnpm install`, scaffold, commit, push, or deploy without explicit human go-ahead at the named gate (SPEC §11, CODING_PRINCIPLES §14). The `pnpm install` + `pnpm audit` in Task 1 is the first gated action.
- **Model tiering:** the mechanical bulk-conversion tasks (verbatim prose/markup copy from baseline into `.astro` — Tasks 22, 27, 28, and the verbatim portions of 25/26/29/32) may be delegated to a cheaper model, because the source is authoritative and the transformation is "copy + apply listed waivers." The judgment-heavy tasks (the meta engine Task 18, BaseLayout analytics gate Task 20, the endpoint Task 31, the OG-image script Task 34, and all verification in Task 38) should stay on the stronger model.
- **Commit cadence:** one conventional-commit per task as listed (type-enum: feat/fix/docs/chore/style/refactor/ci/test/perf). Frequent, small, green commits — never bundle multiple tasks into one commit.
- **Test suite cadence:** run the relevant per-task check inline (the TDD red/green step). Run the **full** suite (`pnpm verify` + parity oracle + Lighthouse) only at group boundaries and at Task 38 — not after every micro-edit; it is slow (Playwright spins browsers) and would stall the loop.
- **Parallelism:** Group D pages (Tasks 24–29) and Group F SEO assertions are independent once B/C are green — dispatch them concurrently under subagent-driven-development. Groups A→B→C are strictly sequential prerequisites.
- **Reconciliations to honor:** content config = `src/content.config.ts` + `glob()` loader (Task 6); use `entry.id` not `entry.slug`; `og:*`/`article:*` always `name=`; legacy images byte-for-byte (only `og-image.jpg` changes). When an appendix and this spine disagree, the spine wins.
- **Out-of-repo prerequisites before production deploy (not blocking the PR):** Resend sender-domain DNS verification; bind `RESEND_API_KEY`/`RESEND_FROM`/`CONTACT_TO` in Cloudflare (Preview + Production) — a missing binding is a runtime 500, not a build error.

---

*This plan is the GATE-2 executable spine. Detailed code bodies live in the linked `docs/plan/0X-*.md` appendices; the contract is `parity/SPEC.md`; intentional deviations are `parity/WAIVERS.md`; rationale is `docs/adr/0001-0006`.*
