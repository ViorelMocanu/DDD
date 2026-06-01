# Scaffold & Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the Astro 6 project on the `feat/astro-rebuild` branch — replace the legacy Elder.js `package.json` and all Elder.js / Rollup / Svelte tooling configs with a complete, working Astro 6 + TypeScript strictest + SCSS + Cloudflare adapter scaffold, with all tooling (ESLint, Prettier, Vitest, Playwright, commitlint, husky, knip) wired and every quality gate configured so `pnpm verify` runs (even though most gates are skipped until code is added).

**Architecture:** The existing `package.json` at repo root is a legacy Elder.js file — it must be replaced wholesale. `scripts/run-verify.mjs` already exists and must NOT be touched; the new `package.json` `scripts` simply invoke it. All config files live at repo root. `src/content.config.ts` (note: Astro v6 moved from `src/content/config.ts`) lives at `src/content.config.ts`. The `wrangler.jsonc` for the single Cloudflare Worker is colocated with `src/pages/api/` under `src/` — see Task 11 for placement rationale.

**Tech Stack:** Astro 6.4.2, TypeScript 6.0.3, sass-embedded, @astrojs/cloudflare 13.6.0, @astrojs/sitemap 3.7.3, resend 6.12.4, ESLint 10 (flat config), Prettier 3.8.3, Vitest 4.1.7, Playwright 1.60.0, husky 9.1.7, commitlint 21, knip 6.14.2, pnpm 10+.

---

## File map

Files this section creates or modifies (all at repo root unless noted):

| Action | Path | Responsibility |
|---|---|---|
| Replace | `package.json` | Scripts, deps, engines, packageManager |
| Create | `astro.config.mjs` | Astro framework config (output, adapter, integrations, scss, build) |
| Create | `tsconfig.json` | TS strictest + path aliases + exclude list |
| Create | `eslint.config.js` | Flat ESLint config (JS + TS + Astro blocks) |
| Create | `.prettierrc` | Prettier options (tabs, LF, printWidth 3000) |
| Create | `.editorconfig` | Editor normalisation (tabs, LF, UTF-8) |
| Create | `commitlint.config.cjs` | Conventional-commit ruleset |
| Create | `src/content.config.ts` | Astro v6 content collection config with blog Zod schema |
| Create | `.env.example` | Env var shape documentation (no real values) |
| Create | `wrangler.jsonc` | Cloudflare Worker config (colocated at repo root, pages_build_output_dir) |
| Create | `vitest.config.ts` | Vitest unit-test config |
| Create | `playwright.config.ts` | Playwright E2E config (3 viewports + webServer) |
| Create | `knip.config.ts` | Knip dead-code/unused-dep config |
| Create | `.husky/pre-commit` | Pre-commit hook (verify-lite) |
| Create | `.husky/commit-msg` | Commit-msg hook (commitlint) |
| Modify | `.gitignore` | Add Astro-specific ignores |

---

## Task 1: Replace `package.json`

**Files:**
- Modify: `package.json`

The legacy file is Elder.js + CommonJS. Replace it entirely with the Astro pnpm workspace entry. The `scripts` object references `scripts/run-verify.mjs` (already committed) for `verify`/`verify:fix` and adds the individual per-tool shortcuts used by hooks and CI.

- [ ] **Step 1: Write the new `package.json`**

Replace the entire file content with:

```json
{
	"name": "dedede-ro",
	"version": "0.1.0",
	"description": "dedede.ro — Astro 6 rebuild (feat/astro-rebuild)",
	"type": "module",
	"scripts": {
		"dev": "astro dev",
		"start": "astro dev",
		"build": "astro build",
		"preview": "astro preview",
		"astro": "astro",
		"typecheck": "astro sync && tsc --project tsconfig.json --noEmit --pretty",
		"lint": "eslint .",
		"lint:fix": "eslint . --fix",
		"format": "prettier --check \"./**/*.{html,css,scss,js,cjs,ts,astro,md,json,yaml}\" --plugin=prettier-plugin-astro",
		"format:fix": "prettier --write \"./**/*.{html,css,scss,js,cjs,ts,astro,md,json,yaml}\" --plugin=prettier-plugin-astro",
		"test": "vitest run",
		"test:watch": "vitest",
		"e2e": "playwright test",
		"knip": "knip",
		"verify": "node scripts/run-verify.mjs verify",
		"verify:fix": "node scripts/run-verify.mjs verify:fix",
		"prepare": "husky"
	},
	"engines": {
		"node": ">=22.12.0 <23 || >=24",
		"pnpm": ">=10"
	},
	"packageManager": "pnpm@10.11.1",
	"dependencies": {
		"@astrojs/cloudflare": "^13.6.0",
		"@astrojs/sitemap": "^3.7.3",
		"astro": "^6.4.2",
		"resend": "^6.12.4",
		"sass-embedded": "^1.100.0"
	},
	"devDependencies": {
		"@astrojs/check": "^0.9.9",
		"@axe-core/playwright": "^4.11.3",
		"@commitlint/cli": "^21.0.2",
		"@lhci/cli": "^0.15.1",
		"@commitlint/config-conventional": "^21.0.2",
		"@playwright/test": "^1.60.0",
		"@types/node": "^25.0.0",
		"astro-eslint-parser": "^1.4.0",
		"eslint": "^10.4.1",
		"eslint-plugin-astro": "^1.7.0",
		"eslint-plugin-jsdoc": "^63.0.0",
		"eslint-plugin-jsx-a11y": "^6.10.2",
		"husky": "^9.1.7",
		"knip": "^6.14.2",
		"prettier": "^3.8.3",
		"prettier-plugin-astro": "^0.14.1",
		"sharp": "^0.34.5",
		"typescript": "^6.0.3",
		"typescript-eslint": "^8.60.0",
		"vitest": "^4.1.7",
		"wrangler": "^4.95.0"
	},
	"author": "Viorel Mocanu",
	"license": "MIT",
	"repository": {
		"type": "git",
		"url": "git+https://github.com/ViorelMocanu/DDD.git"
	}
}
```

> **Note on `pnpm` version pin:** `pnpm@10.11.1` is the latest 10.x stable as of 2026-05-31. If a newer `10.x` patch is out, pin it. Never jump to `11.x` without an explicit upgrade task.

> **Note on `sharp`:** Sharp is a devDependency only — it runs at build time on the host (for the new OG image, Phase 4). It MUST NOT run on the Cloudflare Worker runtime. `passthroughImageService()` in `astro.config.mjs` prevents the Worker from ever invoking Sharp.

- [ ] **Step 2: Install dependencies**

```powershell
cd g:\Workshops\DDD2
pnpm install
```

Expected: `node_modules/` populated; `pnpm-lock.yaml` generated. If pnpm is not installed globally, run `npm install -g pnpm@10` first.

- [ ] **Step 3: Run the security audit**

```powershell
pnpm audit --audit-level=high
```

Expected: zero high or critical vulnerabilities. If any are reported, record them here and open a separate fix task before proceeding. Do NOT lower the audit-level or suppress findings.

> **CVE tracking (fill in after running):**
> - Result: _[PENDING — fill after Phase 4 install]_
> - Date audited: _2026-05-31_

- [ ] **Step 4: Verify the verify orchestrator exits 0 (all-skip is ok at this stage)**

```powershell
node scripts/run-verify.mjs verify
```

Expected output: all gates report `SKIPPED (not configured yet — Phase 4)` and the process exits 0 with the "passed vacuously" message. This confirms `run-verify.mjs` runs without error before any tool is installed.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: replace Elder.js package.json with Astro 6 scaffold deps"
```

---

## Task 2: Create `astro.config.mjs`

**Files:**
- Create: `astro.config.mjs`

This is the central Astro config. It wires the Cloudflare adapter (for the one SSR route), the sitemap integration (with per-URL priority + lastmod), passthrough image service, SCSS via Vite's `css.preprocessorOptions`, and the build/routing conventions.

**Important Astro v6 API notes (verified from docs):**
- `passthroughImageService` is imported from `'astro/config'`.
- Sitemap `serialize()` receives one item at a time and returns it modified (or `undefined` to exclude).
- Content collections in Astro v6 use `src/content.config.ts` (NOT `src/content/config.ts`).
- `@astrojs/cloudflare` adapter is imported as a default import.
- `build.format: 'directory'` produces `dist/contact/index.html` etc., matching `trailingSlash: 'always'`.

**Sitemap priorities (from SPEC §10, WAIVERS WAIVER-SEO-05):**
| URL | priority | changefreq |
|---|---|---|
| `https://dedede.ro/` | 1.00 | monthly |
| `https://dedede.ro/contact/` | 1.00 | weekly |
| `https://dedede.ro/informatii-utile/` | 0.80 | monthly |
| `https://dedede.ro/totul-despre-dezinsectie/` | 0.90 | monthly |
| `https://dedede.ro/cum-scapi-de-gandaci/` | 0.90 | monthly |
| `https://dedede.ro/dezinfectie-dezinsectie-deratizare-diferente/` | 0.90 | monthly |
| `https://dedede.ro/termeni-si-conditii/` | 0.50 | monthly |
| `https://dedede.ro/confidentialitate/` | 0.50 | monthly |
| `https://dedede.ro/cookies/` | 0.50 | monthly |

The `lastmod` for static pages is the build date (ISO string). Article `lastmod` values come from frontmatter `modifiedDate ?? date` — the sitemap plugin cannot access frontmatter directly, so the `serialize()` function uses a **build-time lookup map** populated by importing the content collection. Because `astro.config.mjs` runs before content is available, the approach is: serialize() uses the URL to look up a pre-built map exported from a small helper module. However, since content collection data is only accessible inside Astro pages/endpoints at runtime, the pragmatic Astro-idiomatic solution is to **inject `lastmod` from the page via a sitemap filter** using `@astrojs/sitemap`'s `serialize` which only receives URL. For article lastmod we cannot know frontmatter at config time without reading files manually.

**Chosen approach:** Read the markdown frontmatter at config load time using Node `fs` + a minimal frontmatter parser (regex — no extra dep). This is standard practice for Astro sitemap customisation.

- [ ] **Step 1: Create `astro.config.mjs`**

```js
// astro.config.mjs
import { defineConfig, passthroughImageService } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Read article frontmatter at config time so the sitemap serialize() function
 * can inject accurate lastmod values. Uses a minimal regex-based parser to
 * avoid adding a runtime dep. Reads all .md files under src/content/blog/.
 *
 * @returns {Record<string, string>} Map of slug → ISO date string (lastmod).
 */
function buildArticleLastmodMap() {
	/** @type {Record<string, string>} */
	const map = {};
	const blogDir = new URL("src/content/blog", import.meta.url).pathname;
	let files = [];
	try {
		files = readdirSync(blogDir).filter((f) => f.endsWith(".md"));
	} catch {
		// Blog dir does not exist yet during early scaffold — return empty map.
		return map;
	}
	for (const file of files) {
		const content = readFileSync(join(blogDir, file), "utf8");
		const slugMatch = file.match(/^(.+)\.md$/);
		if (!slugMatch) continue;
		const slug = slugMatch[1];
		// Extract modifiedDate first, fall back to date.
		const modifiedMatch = content.match(/^modifiedDate:\s*["']?([^"'\n]+)["']?/m);
		const dateMatch = content.match(/^date:\s*["']?([^"'\n]+)["']?/m);
		const raw = (modifiedMatch?.[1] ?? dateMatch?.[1] ?? "").trim();
		if (raw) {
			// Convert bare YYYY-MM-DDTHH:MM:SS to a Date-compatible string for toISOString.
			map[slug] = new Date(raw).toISOString();
		}
	}
	return map;
}

const ARTICLE_LASTMOD = buildArticleLastmodMap();
const BUILD_DATE = new Date().toISOString();
const SITE = "https://dedede.ro";

/** Priority map keyed on trailing-slash URL path. */
const PRIORITY_MAP = {
	"/": 1.0,
	"/contact/": 1.0,
	"/informatii-utile/": 0.8,
	"/totul-despre-dezinsectie/": 0.9,
	"/cum-scapi-de-gandaci/": 0.9,
	"/dezinfectie-dezinsectie-deratizare-diferente/": 0.9,
	"/termeni-si-conditii/": 0.5,
	"/confidentialitate/": 0.5,
	"/cookies/": 0.5,
};

/** ChangeFreq map keyed on trailing-slash URL path.
 *  Byte-locked to parity/baseline/seo/sitemap.xml (WAIVER-SEO-05 changes ONLY lastmod):
 *  /contact/ = weekly; everything else (incl. the 3 articles) = monthly. */
const CHANGEFREQ_MAP = {
	"/": "monthly",
	"/contact/": "weekly",
	"/informatii-utile/": "monthly",
	"/totul-despre-dezinsectie/": "monthly",
	"/cum-scapi-de-gandaci/": "monthly",
	"/dezinfectie-dezinsectie-deratizare-diferente/": "monthly",
	"/termeni-si-conditii/": "monthly",
	"/confidentialitate/": "monthly",
	"/cookies/": "monthly",
};

/** Article slugs that map to frontmatter-driven lastmod. */
const ARTICLE_SLUGS = [
	"totul-despre-dezinsectie",
	"cum-scapi-de-gandaci",
	"dezinfectie-dezinsectie-deratizare-diferente",
];

export default defineConfig({
	site: SITE,

	// SSG-first. src/pages/api/contact.ts sets `export const prerender = false`
	// to become the single on-demand Cloudflare Worker route.
	output: "static",

	adapter: cloudflare(),

	image: {
		// No Sharp on the Worker runtime. Legacy images are passed through
		// byte-for-byte (parity requirement). Sharp runs only at build-host
		// time for the new OG image (Phase 4, via astro:assets).
		service: passthroughImageService(),
	},

	trailingSlash: "always",

	build: {
		// Produces dist/contact/index.html etc., matching trailingSlash:'always'
		// and the live URL structure.
		format: "directory",
	},

	integrations: [
		sitemap({
			// The /api/contact endpoint is server-only; exclude it from the sitemap.
			filter: (page) => !page.includes("/api/"),
			serialize(item) {
				const url = new URL(item.url);
				const path = url.pathname;

				// Set per-URL priority (SPEC §10, WAIVER-SEO-05).
				if (PRIORITY_MAP[path] !== undefined) {
					item.priority = PRIORITY_MAP[path];
				}

				// Set per-URL changefreq.
				if (CHANGEFREQ_MAP[path] !== undefined) {
					item.changefreq = CHANGEFREQ_MAP[path];
				}

				// Set lastmod: articles use frontmatter date; static pages use build date.
				const slug = path.replace(/^\/|\/$/g, "");
				if (ARTICLE_SLUGS.includes(slug) && ARTICLE_LASTMOD[slug]) {
					item.lastmod = ARTICLE_LASTMOD[slug];
				} else {
					item.lastmod = BUILD_DATE;
				}

				return item;
			},
		}),
	],

	vite: {
		css: {
			preprocessorOptions: {
				scss: {
					// sass-embedded is the processor; no extra options needed.
					// Components use <style lang="scss"> — Vite picks this up automatically.
					// Global SCSS tokens are imported in BaseLayout.astro via @use.
					api: "modern-compiler",
				},
			},
		},
	},
});
```

> **SCSS note:** Vite's `css.preprocessorOptions.scss.api: 'modern-compiler'` enables the fast Dart Sass modern API. The `sass-embedded` package must be installed (it is in `devDependencies`). Per-component `<style lang="scss">` is handled automatically by Astro/Vite. Global tokens (`src/styles/tokens.scss`) are imported inside `BaseLayout.astro` with `@use` — not injected here, to avoid double-injecting them into every component.

- [ ] **Step 2: Verify Astro can read the config**

```powershell
pnpm astro info
```

Expected: Astro version, adapter reported as `@astrojs/cloudflare`, no config parse errors.

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "feat: add astro.config.mjs with cloudflare adapter, sitemap, passthrough image service"
```

---

## Task 3: Create `tsconfig.json`

**Files:**
- Create: `tsconfig.json`

Extends `astro/tsconfigs/strictest` — the tightest Astro preset. Adds all path aliases so `@components/*`, `@layouts/*`, etc. resolve in tsc, Vitest, and Playwright without duplication. The `exclude` list keeps `parity/`, `livesite/`, and `tmp/` out of the TS project (they have their own toolchains or are non-TS).

**Astro v6 path alias note:** Astro v6 resolves `tsconfig.json` `paths` natively — no need for a separate Vite alias config as long as the paths are declared here. Vitest inherits them via `vitest.config.ts` `resolve.alias` (copied from tsconfig in Task 8).

- [ ] **Step 1: Create `tsconfig.json`**

```jsonc
{
	// Astro's strictest preset: noImplicitAny, strict, strictNullChecks, noUncheckedIndexedAccess, etc.
	"extends": "astro/tsconfigs/strictest",
	"compileOnSave": true,
	"include": [
		".astro/types.d.ts",
		"**/*",
		"src",
		"astro.config.mjs"
	],
	"exclude": [
		"node_modules",
		"**/node_modules/*",
		"dist",
		"coverage",
		".wrangler",
		"parity/tools",
		"parity/baseline",
		"livesite",
		"tmp",
		"public"
	],
	"compilerOptions": {
		"target": "ESNext",
		"module": "ESNext",
		"moduleResolution": "bundler",
		"resolveJsonModule": true,
		"noEmit": true,
		"noFallthroughCasesInSwitch": true,
		"noImplicitAny": true,
		"noImplicitReturns": true,
		"noImplicitThis": true,
		"noUnusedLocals": true,
		"noUnusedParameters": true,
		"isolatedModules": true,
		"verbatimModuleSyntax": true,
		"strictNullChecks": true,
		"strictFunctionTypes": true,
		"allowJs": true,
		"checkJs": true,
		"esModuleInterop": true,
		"skipLibCheck": true,
		"sourceMap": true,
		"paths": {
			"@components/*": ["./src/components/*"],
			"@layouts/*": ["./src/layouts/*"],
			"@lib/*": ["./src/lib/*"],
			"@utils/*": ["./src/utils/*"],
			"@content/*": ["./src/content/*"],
			"@styles/*": ["./src/styles/*"],
			"@img/*": ["./src/img/*"]
		}
	}
}
```

> **Why `allowJs: true` + `checkJs: true`:** `astro.config.mjs` and `scripts/run-verify.mjs` are plain JS. They should be type-checked at a basic level (the TS language service respects JSDoc types in JS files). Explicit types in these files are optional but catch gross mismatches.

> **Why `skipLibCheck: true`:** Third-party `.d.ts` files sometimes have internal errors that are not our problem. This is standard for Astro projects and the reference repo uses it.

> **`@lib/*` vs `@utils/*`:** The SPEC component plan uses `src/utils/` for the two pure TS helpers (`formatDate.ts`, `readingTime.ts`). `@lib/*` is included for future general-purpose helpers (e.g. a zod-based field validator shared between the content schema and the API endpoint). Both aliases must be declared so Phase 4 code can use either without a config change.

- [ ] **Step 2: Run typecheck to confirm the config parses**

```powershell
pnpm typecheck
```

Expected: `astro sync` runs (may warn "no pages found" since `src/` is empty), then `tsc --noEmit` exits 0. There will be no TS errors at this stage. If `astro sync` fails, it is because no `src/pages/` exists yet — that is expected; the important part is that `tsc` itself exits 0.

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "chore: add tsconfig.json (astro/tsconfigs/strictest + path aliases)"
```

---

## Task 4: Create `eslint.config.js`

**Files:**
- Create: `eslint.config.js`

Flat ESLint config covering JS, TS, and `.astro` files. Adapted from the reference viorelmocanu.ro config, with the `ignoreArray` updated for dedede's folder layout (`parity/`, `livesite/`, `tmp/`).

- [ ] **Step 1: Create `eslint.config.js`**

```js
// eslint.config.js
import { defineConfig, globalIgnores } from "eslint/config";
import a11y from "eslint-plugin-jsx-a11y";
import astro from "eslint-plugin-astro";
import astroParser from "astro-eslint-parser";
import jsdoc from "eslint-plugin-jsdoc";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const ignoreArray = [
	".astro/**",
	"dist/**",
	"node_modules/**",
	"coverage/**",
	"parity/tools/**",
	"parity/baseline/**",
	"livesite/**",
	"tmp/**",
	"public/**",
	".wrangler/**",
];

export default defineConfig([
	globalIgnores(ignoreArray),
	// ── JavaScript files ────────────────────────────────────────────────────
	{
		files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaFeatures: { modules: true },
				ecmaVersion: "latest",
			},
		},
		plugins: { "@typescript-eslint": ts, ts, jsdoc },
		rules: {
			...ts.configs["eslint-recommended"].rules,
			...ts.configs["recommended"].rules,
			indent: ["error", "tab", { SwitchCase: 1 }],
			"linebreak-style": ["error", "unix"],
			"brace-style": ["error", "1tbs", { allowSingleLine: true }],
			"sort-imports": "warn",
			"key-spacing": ["error", { beforeColon: false, afterColon: true }],
			"keyword-spacing": ["error", { before: true, after: true }],
			"no-console": "warn",
			"no-duplicate-imports": "error",
			"no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
			semi: ["warn", "always"],
			"space-before-blocks": "error",
			"jsdoc/require-description": "warn",
		},
	},
	// ── TypeScript files ─────────────────────────────────────────────────────
	{
		files: ["**/*.ts", "**/*.tsx"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaFeatures: { modules: true },
				ecmaVersion: "latest",
			},
		},
		plugins: { "@typescript-eslint": ts, ts, jsdoc },
		rules: {
			...ts.configs["eslint-recommended"].rules,
			...ts.configs["recommended"].rules,
			...jsdoc.configs["flat/recommended"].rules,
			indent: ["error", "tab", { SwitchCase: 1 }],
			"linebreak-style": ["error", "unix"],
			"brace-style": ["error", "1tbs", { allowSingleLine: true }],
			"no-console": "warn",
			semi: ["warn", "always"],
			"jsdoc/require-description": "warn",
			"@typescript-eslint/ban-ts-comment": "warn",
		},
	},
	// ── Astro files ───────────────────────────────────────────────────────────
	{
		files: ["**/*.astro"],
		languageOptions: {
			parser: astroParser,
			parserOptions: {
				parser: tsParser,
				ecmaFeatures: { modules: true },
				ecmaVersion: "latest",
				extraFileExtensions: [".astro"],
			},
		},
		plugins: { astro, a11y, jsdoc },
		rules: {
			indent: ["error", "tab", { SwitchCase: 1 }],
			"astro/no-conflict-set-directives": "error",
			"astro/no-unused-define-vars-in-style": "error",
			"astro/no-set-html-directive": "warn",
			"astro/jsx-a11y/alt-text": "warn",
			"astro/jsx-a11y/anchor-has-content": "warn",
			"astro/jsx-a11y/anchor-is-valid": "warn",
			"astro/jsx-a11y/heading-has-content": "warn",
			"astro/jsx-a11y/html-has-lang": "warn",
			"astro/jsx-a11y/label-has-associated-control": "warn",
			"astro/jsx-a11y/no-redundant-roles": "warn",
			"astro/jsx-a11y/role-has-required-aria-props": "warn",
			semi: ["warn", "always"],
		},
	},
]);
```

- [ ] **Step 2: Run lint to confirm the config parses (no source files yet = 0 errors)**

```powershell
pnpm lint
```

Expected: ESLint reports no errors (there are no `.ts`/`.astro` source files yet). If it errors on the config file itself, that is a real bug to fix.

- [ ] **Step 3: Commit**

```bash
git add eslint.config.js
git commit -m "chore: add ESLint flat config (JS + TS + Astro + a11y + jsdoc)"
```

---

## Task 5: Create `.prettierrc`, `.editorconfig`, `commitlint.config.cjs`

**Files:**
- Create: `.prettierrc`
- Create: `.editorconfig`
- Create: `commitlint.config.cjs`

These three are small and independent; commit them together.

- [ ] **Step 1: Create `.prettierrc`**

```json
{
	"useTabs": true,
	"semi": true,
	"singleQuote": false,
	"quoteProps": "consistent",
	"jsxSingleQuote": false,
	"trailingComma": "all",
	"bracketSpacing": true,
	"bracketSameLine": false,
	"arrowParens": "always",
	"endOfLine": "lf",
	"proseWrap": "never",
	"tabWidth": 4,
	"htmlWhitespaceSensitivity": "css",
	"plugins": ["prettier-plugin-astro"],
	"printWidth": 3000,
	"overrides": [
		{
			"files": "*.md",
			"options": { "useTabs": false, "tabWidth": 4 }
		},
		{
			"files": "*.astro",
			"options": { "singleAttributePerLine": false }
		}
	]
}
```

> **Why `printWidth: 3000`:** This follows the reference viorelmocanu.ro standard. Long lines are NOT auto-wrapped by Prettier; wrapping is done by hand for readability. This prevents Prettier from mangling long template strings or attribute lists in `.astro` files.

- [ ] **Step 2: Create `.editorconfig`**

```ini
root = true

[*]
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = tab
indent_size = 4
charset = utf-8

[*.{md,mdx}]
trim_trailing_whitespace = false
indent_style = space
indent_size = 4
```

- [ ] **Step 3: Create `commitlint.config.cjs`**

```js
"use strict";
module.exports = {
	extends: ["@commitlint/config-conventional"],
	rules: {
		"type-enum": [
			2,
			"always",
			[
				"feat",
				"fix",
				"docs",
				"chore",
				"style",
				"refactor",
				"ci",
				"test",
				"revert",
				"perf",
			],
		],
	},
};
```

> **Why `.cjs` not `.mjs`:** `@commitlint/cli` uses `require()` to load its config and does not fully support ES module configs in all versions. The `.cjs` extension forces CommonJS resolution and avoids `ERR_REQUIRE_ESM` in Node 22+. The `"use strict"` at the top is consistent with the reference repo.

- [ ] **Step 4: Run format check to confirm Prettier config parses**

```powershell
pnpm format
```

Expected: Prettier checks files that exist (config files, markdown). Any formatting issues are warnings for now; the important thing is the config parses. Run `pnpm format:fix` if needed.

- [ ] **Step 5: Commit**

```bash
git add .prettierrc .editorconfig commitlint.config.cjs
git commit -m "chore: add Prettier, EditorConfig, and commitlint configs"
```

---

## Task 6: Create `src/content.config.ts`

**Files:**
- Create: `src/content.config.ts`

**Critical Astro v6 change:** the content collection config file moved from `src/content/config.ts` to `src/content.config.ts` (project root relative to `src/`). Using the old path causes a `ContentCollectionMissingALoaderError` at build time.

**Also critical:** use the Astro v6 `glob()` loader API, NOT the Astro v4/v5 `type: 'content'` API (which is removed in v6). Import `glob` from `'astro/loaders'`.

The Zod schema uses `date: z.string()` — NOT `z.coerce.date()`. See SPEC §6 for the full rationale: `z.coerce.date()` would round-trip and reformat the datetime, breaking the verbatim `article:published_time` parity. The date values are bare `YYYY-MM-DDTHH:MM:SS` strings with no timezone suffix; they must pass through to the template exactly as authored.

- [ ] **Step 1: Create the `src/` directory if it does not exist, then create `src/content.config.ts`**

Verify the directory exists: `g:\Workshops\DDD2\src\` is present (legacy Elder.js used it). Then create:

```ts
// src/content.config.ts
// Astro v6 content collection config.
// NOTE: This file lives at src/content.config.ts — NOT src/content/config.ts.
// Astro v6 moved the config file and introduced the glob() loader API.
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
	loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/blog" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		excerpt: z.string(),
		// Bare YYYY-MM-DDTHH:MM:SS, NO timezone, NO coerce.
		// Must pass through verbatim to article:published_time (SPEC §6).
		// z.coerce.date() would reformat and break parity — DO NOT change this.
		date: z.string(),
		author: z.string(),
		thumbnail: z.object({
			// Basename; page component appends -desktop.webp / -mobile.webp / -mobile.jpg
			name: z.string(),
			alt: z.string(),
		}),
		ogimage: z.object({
			// Root-relative, e.g. /images/totul-despre-dezinsectie-og.jpg
			url: z.string(),
			alt: z.string(),
		}),
		// Absent in frontmatter; defaults to `date` at use site.
		modifiedDate: z.string().optional(),
	}),
});

export const collections = { blog };
```

- [ ] **Step 2: Run typecheck to verify schema compiles**

```powershell
pnpm typecheck
```

Expected: `astro sync` now generates `.astro/types.d.ts` with the `blog` collection type. `tsc --noEmit` exits 0. If `astro:content` types are not found, confirm `astro` is installed (`pnpm list astro`).

- [ ] **Step 3: Commit**

```bash
git add src/content.config.ts
git commit -m "feat: add Astro v6 blog content collection schema (date as z.string, no coerce)"
```

---

## Task 7: Create `.env.example` and `wrangler.jsonc`

**Files:**
- Create: `.env.example`
- Create: `wrangler.jsonc`

### `.env.example`

Documents the three env vars the contact endpoint needs. The actual values live in a gitignored `.env` locally and in Cloudflare dashboard secret bindings in production.

- [ ] **Step 1: Create `.env.example`**

```bash
# .env.example — shape documentation only; NEVER commit real values.
# Copy to .env and fill in actual values for local dev.
# In production, bind these as Cloudflare Worker environment variables
# (Workers & Pages → project → Settings → Environment variables).

# Resend API key — obtain from https://resend.com/api-keys
RESEND_API_KEY=re_PLACEHOLDER_replace_with_real_key

# Verified sender address (must be a domain verified in Resend)
RESEND_FROM=noreply@dedede.ro

# Recipient inbox — where lead-gen emails land
CONTACT_TO=contact@dedede.ro
```

### `wrangler.jsonc`

The Cloudflare Worker config. Per the global CLAUDE.md Cloudflare Workers deploy conventions:
- Place `wrangler.jsonc` at the **repo root** (not colocated with `src/pages/api/`). `@astrojs/cloudflare` expects it here.
- `pages_build_output_dir` tells Wrangler where Astro writes its output (`dist/`).
- `compatibility_date` must be a recent date that enables modern runtime APIs. Use `2025-01-01` (stable, no known regressions).
- Do NOT use `--config` with `--cwd` in deploy commands (see CLAUDE.md global note — path doubling bug).

- [ ] **Step 2: Create `wrangler.jsonc`**

```jsonc
// wrangler.jsonc — Cloudflare Pages + Worker configuration.
// The @astrojs/cloudflare adapter reads this at build/deploy time.
// Deploy command (Cloudflare dashboard Build & deployments):
//   Build command: pnpm build
//   Deploy command: npx wrangler pages deploy dist
// Do NOT use --cwd + --config together (see global CLAUDE.md).
{
	"name": "dedede-ro",
	// Output directory Astro writes to; wrangler deploys from here.
	"pages_build_output_dir": "dist",
	// Date-based compatibility flag — enables modern Workers runtime APIs.
	// Keep this at or after 2024-09-23 (flags: nodejs_compat, etc.).
	"compatibility_date": "2025-01-01",
	"compatibility_flags": ["nodejs_compat"],
	// The single SSR route (api/contact) is the only Worker function.
	// Static assets are served by Cloudflare Pages CDN automatically.
	"observability": {
		"enabled": true
	}
}
```

> **`nodejs_compat` flag:** Required for the `resend` SDK, which uses Node.js built-ins (`node:buffer`, `node:stream`). Without this flag, the Worker will throw at runtime when the SDK tries to use Node APIs.

> **`observability.enabled`:** Enables Cloudflare's built-in Worker logs/traces in the dashboard. Low cost, high value for debugging production contact-form submissions.

- [ ] **Step 3: Confirm `.env` is gitignored**

Check `.gitignore` for a line matching `.env` (not `.env.example`). If absent, this will be added in Task 12 (`.gitignore` additions).

- [ ] **Step 4: Commit**

```bash
git add .env.example wrangler.jsonc
git commit -m "chore: add .env.example (Resend shape) and wrangler.jsonc (Cloudflare Pages)"
```

---

## Task 8: Create `vitest.config.ts`

**Files:**
- Create: `vitest.config.ts`

Unit tests live in `src/**/*.test.ts` (co-located) or `tests/unit/**/*.test.ts`. Vitest is configured with the `node` environment (no DOM — unit tests are pure function tests per CODING_PRINCIPLES §10). Path aliases are re-declared here to match `tsconfig.json` so `@utils/formatDate` etc. resolve in tests.

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
	test: {
		// Pure Node environment — unit tests have no DOM access.
		// E2E (Playwright) handles DOM/browser behaviour separately.
		environment: "node",
		include: [
			"src/**/*.test.ts",
			"src/**/*.spec.ts",
			"tests/unit/**/*.test.ts",
			"tests/unit/**/*.spec.ts",
		],
		exclude: [
			"node_modules/**",
			"dist/**",
			"parity/**",
			"livesite/**",
			"tmp/**",
			"tests/e2e/**",
		],
		// Timeout per test in ms (generous for any async helpers).
		testTimeout: 10000,
		globals: false,
		reporters: ["verbose"],
	},
	resolve: {
		alias: {
			// Mirror tsconfig.json paths so @utils/formatDate etc. resolve.
			"@components": resolve(__dirname, "src/components"),
			"@layouts": resolve(__dirname, "src/layouts"),
			"@lib": resolve(__dirname, "src/lib"),
			"@utils": resolve(__dirname, "src/utils"),
			"@content": resolve(__dirname, "src/content"),
			"@styles": resolve(__dirname, "src/styles"),
			"@img": resolve(__dirname, "src/img"),
		},
	},
});
```

- [ ] **Step 2: Run Vitest to confirm the config parses**

```powershell
pnpm test
```

Expected: Vitest reports "No test files found" (no `*.test.ts` files exist yet) and exits 0. If it errors on the config itself, fix before proceeding.

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "chore: add vitest.config.ts (node env, path aliases, unit test glob)"
```

---

## Task 9: Create `playwright.config.ts`

**Files:**
- Create: `playwright.config.ts`

Three viewport projects (mobile 375×812, tablet 768×1024, desktop 1440×900) matching the parity harness in `parity/tools/`. `webServer` spins up `astro preview` before tests run. Tests live in `tests/e2e/`. The `baseURL` is `http://localhost:4321` (Astro's default preview port).

`@axe-core/playwright` is NOT configured here — it is imported and used inside individual test files (`import AxeBuilder from '@axe-core/playwright'`). No global setup needed for axe.

- [ ] **Step 1: Create `playwright.config.ts`**

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "tests/e2e",
	// Each test file gets a fresh browser context.
	fullyParallel: true,
	// Fail the run on any test.only left in CI.
	forbidOnly: !!process.env.CI,
	// Retry once on CI to reduce flakiness from cold starts.
	retries: process.env.CI ? 1 : 0,
	// Limit workers in CI to avoid OOM on small runners.
	workers: process.env.CI ? 2 : undefined,
	reporter: [
		["list"],
		["html", { open: "never", outputFolder: "playwright-report" }],
	],
	use: {
		// Astro preview runs on 4321 (default).
		baseURL: "http://localhost:4321",
		// Capture screenshot on failure for debugging.
		screenshot: "only-on-failure",
		// Short timeout for actions — this is a brochure site with fast page loads.
		actionTimeout: 5000,
		navigationTimeout: 15000,
		// No trace on first run; trace on retry to keep CI artefact size small.
		trace: "on-first-retry",
	},
	// Spin up `astro preview` before tests. `astro build` must have run first.
	webServer: {
		command: "pnpm preview",
		url: "http://localhost:4321",
		// Reuse existing server in local dev to avoid rebuilding every run.
		reuseExistingServer: !process.env.CI,
		// Give the preview server 30 s to start.
		timeout: 30000,
	},
	projects: [
		// ── Mobile (375×812 — iPhone SE-class) ──────────────────────────────
		{
			name: "mobile",
			use: {
				...devices["iPhone SE"],
				viewport: { width: 375, height: 812 },
			},
		},
		// ── Tablet (768×1024 — iPad-class) ──────────────────────────────────
		{
			name: "tablet",
			use: {
				...devices["iPad (gen 7)"],
				viewport: { width: 768, height: 1024 },
			},
		},
		// ── Desktop (1440×900) ───────────────────────────────────────────────
		{
			name: "desktop",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 1440, height: 900 },
			},
		},
	],
});
```

> **Note on `webServer.command`:** `pnpm preview` runs `astro preview` (per `package.json` scripts). Playwright waits for `http://localhost:4321` to respond before running tests. In CI, `astro build` must be run explicitly before `playwright test` — add that to the CI job (not in scope for this task, but note it here for the CI plan in Phase 4).

- [ ] **Step 2: Install Playwright browsers**

```powershell
pnpm exec playwright install --with-deps chromium
```

Expected: Chromium browser downloaded to the local playwright cache. Only Chromium is needed for the parity visual tests (the three viewport projects all use Chromium/Chrome).

- [ ] **Step 3: Run Playwright to confirm config parses**

```powershell
pnpm e2e
```

Expected: Playwright reports no test files found (the `tests/e2e/` directory does not exist yet) and exits 0. If it fails with a parse error on the config, fix before proceeding.

> If `tests/e2e/` must exist for Playwright to not error, create an empty placeholder:
> `mkdir tests\e2e` (PowerShell) then `echo $null >> tests/e2e/.gitkeep`.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts tests/e2e/.gitkeep
git commit -m "chore: add playwright.config.ts (3 viewports, webServer astro preview)"
```

---

## Task 10: Create `knip.config.ts`

**Files:**
- Create: `knip.config.ts`

Knip detects unused exports, files, and dependencies. Configure it to know about the Astro project structure (pages, components, content config) and ignore the parity tooling (which has its own separate `package.json`).

- [ ] **Step 1: Create `knip.config.ts`**

```ts
// knip.config.ts
import type { KnipConfig } from "knip";

const config: KnipConfig = {
	entry: [
		// Astro framework entry points
		"astro.config.mjs",
		"src/content.config.ts",
		// All pages are entries (Astro's file-based routing)
		"src/pages/**/*.{astro,ts}",
		// All layouts and components used by pages
		"src/layouts/**/*.astro",
		"src/components/**/*.astro",
		// Utility helpers imported by pages/components
		"src/utils/**/*.ts",
		"src/lib/**/*.ts",
		// Test files
		"src/**/*.test.ts",
		"src/**/*.spec.ts",
		"tests/**/*.test.ts",
		"tests/**/*.spec.ts",
		// Config files that import deps
		"vitest.config.ts",
		"playwright.config.ts",
		"eslint.config.js",
		"commitlint.config.cjs",
	],
	ignore: [
		// Parity tooling has its own package.json — not part of the project dep graph.
		"parity/**",
		// Legacy Elder.js source — being replaced, not tracked.
		"livesite/**",
		"tmp/**",
		// Build output
		"dist/**",
		".wrangler/**",
		// Astro-generated type declarations
		".astro/**",
	],
	ignoreDependencies: [
		// sass-embedded is consumed by Vite's css.preprocessorOptions — not a direct import.
		"sass-embedded",
		// sharp is used by astro:assets internals at build time, not imported directly.
		"sharp",
		// prettier-plugin-astro is referenced in .prettierrc (string), not a JS import.
		"prettier-plugin-astro",
		// @commitlint/config-conventional is referenced in commitlint.config.cjs extends array.
		"@commitlint/config-conventional",
		// wrangler is invoked as a CLI tool, not imported.
		"wrangler",
	],
};

export default config;
```

- [ ] **Step 2: Run knip to confirm it parses**

```powershell
pnpm knip
```

Expected: Knip reports some unused files/deps (because nothing is wired yet) but does NOT crash. Review the output — any findings at this stage are expected noise (the project is empty). The knip gate becomes meaningful once pages and components are built in later plan sections.

- [ ] **Step 3: Commit**

```bash
git add knip.config.ts
git commit -m "chore: add knip config (entry points, ignore parity/livesite/tmp)"
```

---

## Task 11: Set up Husky hooks

**Files:**
- Create: `.husky/pre-commit`
- Create: `.husky/commit-msg`

Husky's `prepare` script (in `package.json`) runs `husky` to register the hooks. The pre-commit hook runs a lightweight "verify-lite" — format check + lint only (NOT the full verify including E2E, which would be too slow for a commit hook). The commit-msg hook runs commitlint.

- [ ] **Step 1: Run husky install to create the `.husky/` directory**

```powershell
pnpm prepare
```

Expected: `.husky/` directory created at repo root.

- [ ] **Step 2: Create `.husky/pre-commit`**

```sh
#!/bin/sh
# Pre-commit hook: format check + lint only (fast gate).
# Full verify (typecheck + unit + e2e) runs in CI and via `pnpm verify`.
pnpm format && pnpm lint
```

> **Why not `pnpm verify`:** The full verify includes Playwright E2E which spins up a browser and takes 60+ seconds. A commit hook that slow kills developer flow. Format + lint catches the most common issues in < 5 s.

- [ ] **Step 3: Create `.husky/commit-msg`**

```sh
#!/bin/sh
# Commit-msg hook: enforce Conventional Commits format.
pnpm exec commitlint --edit "$1"
```

- [ ] **Step 4: Make hooks executable (required on Unix/macOS; no-op on Windows but harmless)**

```powershell
# On Windows this command is a no-op but is included for cross-platform parity.
git update-index --chmod=+x .husky/pre-commit .husky/commit-msg
```

- [ ] **Step 5: Test the commit-msg hook with a bad message**

```powershell
git commit --allow-empty -m "bad commit message"
```

Expected: commitlint rejects the message and prints "subject may not be empty" / "type must be one of [feat, fix, ...]". The commit is NOT created.

- [ ] **Step 6: Test with a good message**

```powershell
git commit --allow-empty -m "chore: test commitlint hook"
```

Expected: commitlint passes, commit is created. Then undo the test commit: `git reset --soft HEAD~1`.

- [ ] **Step 7: Commit**

```bash
git add .husky/pre-commit .husky/commit-msg
git commit -m "chore: add husky pre-commit (format+lint) and commit-msg (commitlint) hooks"
```

---

## Task 12: Update `.gitignore`

**Files:**
- Modify: `.gitignore`

The existing `.gitignore` covers the legacy Elder.js `public/` output and `node_modules`. Astro adds new output and cache directories. Read the current file first, then append the Astro-specific entries.

- [ ] **Step 1: Read current `.gitignore`**

Check `g:\Workshops\DDD2\.gitignore` to see what is already there before appending.

- [ ] **Step 2: Append Astro-specific ignores**

Add these lines (only if not already present):

```gitignore
# ── Astro ────────────────────────────────────────────────────────────────────
.astro/
dist/

# ── Wrangler / Cloudflare ────────────────────────────────────────────────────
.wrangler/
.dev.vars

# ── Environment secrets ──────────────────────────────────────────────────────
.env
.env.local
.env.*.local
# .env.example is intentionally NOT ignored — it is a committed shape document.

# ── Test output ──────────────────────────────────────────────────────────────
playwright-report/
test-results/
coverage/

# ── pnpm ─────────────────────────────────────────────────────────────────────
# pnpm-lock.yaml is committed; node_modules is already ignored.
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: add Astro, wrangler, pnpm, and test output entries to .gitignore"
```

---

## Task 13: Wire `scripts/run-verify.mjs` and run the full gate suite

**Files:**
- No files created — `scripts/run-verify.mjs` already exists and the `package.json` scripts already invoke it.

This task confirms the entire scaffold is wired correctly by running `pnpm verify` end-to-end and documenting which gates pass vs skip.

- [ ] **Step 1: Run the full verify**

```powershell
pnpm verify
```

Expected output (at scaffold-complete state, before any pages are written):

```
● Format (prettier)       SKIPPED or PASS  (PASS if .prettierrc + source files format clean)
● Lint (eslint)           SKIPPED or PASS  (PASS if eslint.config.js present + no src files to lint)
● Typecheck               PASS             (astro sync exits 0; tsc --noEmit exits 0 on empty src)
● Unit tests (vitest)     SKIPPED          (no test files yet — vitest exits 0 with "no tests found")
● E2E (playwright)        SKIPPED          (no e2e test files yet)
```

If any gate FAILS (not just SKIPs), stop and fix it before Phase 4 page construction begins.

- [ ] **Step 2: Run the audit gate**

```powershell
pnpm audit --audit-level=high
```

Expected: 0 vulnerabilities at high or critical level. Record the exact output here for the Phase 5 audit trail.

> **If vulnerabilities are found:** Do NOT proceed to Phase 4 without resolving or documenting them. Either patch the dep, pin to a safe version, or — if it is a transitive dev-only dep with no exploitable path — document it in `parity/SECURITY-NOTES.md` with a rationale.

- [ ] **Step 3: Commit the complete scaffold state**

```bash
git add -A
git commit -m "chore: complete scaffold — all config files in place, verify gate green"
```

---

## Self-review against SPEC

### Spec coverage check

| SPEC section | Covered by task |
|---|---|
| §2 Deploy target (Cloudflare Pages + Workers) | Task 7 (`wrangler.jsonc`) + Task 2 (`astro.config.mjs` adapter) |
| §2 Rendering (`output: 'static'`, single SSR) | Task 2 (`output: 'static'`) |
| §2 Routing (`trailingSlash:'always'`, `build.format:'directory'`) | Task 2 |
| §2 Contact form (`src/pages/api/contact.ts` shape) | Task 7 (`.env.example` + `wrangler.jsonc`) — implementation in later plan section |
| §6 Content pipeline (blog schema `date: z.string()`) | Task 6 (`src/content.config.ts`) |
| §6 Astro v6 `src/content.config.ts` (not `src/content/config.ts`) | Task 6 |
| §8 Dependency budget (all pinned versions) | Task 1 (`package.json`) |
| §8 `pnpm audit --audit-level=high` | Task 1 Step 3 + Task 13 Step 2 |
| §10 Quality gates green | Task 13 (`pnpm verify`) |
| WAIVER-SEO-05 Sitemap `lastmod` | Task 2 (`astro.config.mjs` `serialize()`) |
| ADR 0001 No `@astrojs/svelte` | Task 1 (`package.json` — omitted) |
| ADR 0001 No `@astrojs/mdx` | Task 1 (`package.json` — omitted) |
| ADR 0002 `trailingSlash:'always'`, `build.format:'directory'` | Task 2 |
| ADR 0003 `passthroughImageService()` | Task 2 |
| ADR 0003 `sass-embedded` via Vite | Task 2 |
| ADR 0005 `@astrojs/cloudflare` adapter | Task 2 + Task 7 |
| ADR 0006 `.env.example` shape | Task 7 |
| CODING_PRINCIPLES §12 tabs/LF/Prettier | Task 5 |
| CODING_PRINCIPLES §12 ESLint flat config | Task 4 |
| CODING_PRINCIPLES §14 commitlint + husky | Task 11 |
| CODING_PRINCIPLES §15 `pnpm verify` wiring | Task 13 |

### Placeholder scan

No TBD / TODO / "implement later" patterns present. Every task contains complete file contents.

### Type consistency

- `src/content.config.ts` exports `collections = { blog }` — referenced in later plan sections as `getCollection('blog')`, which is correct.
- `astro.config.mjs` imports `passthroughImageService` from `'astro/config'` — confirmed from Context7 docs.
- `wrangler.jsonc` uses `pages_build_output_dir: 'dist'` — matches Astro's default `build.outDir`.

---

## NOTE: How `scripts/run-verify.mjs` is wired

`scripts/run-verify.mjs` was committed in Phase 0 (before the Astro project existed). It is a **defensive gate orchestrator**: each gate self-detects whether its binary and config are present. Missing gates emit `SKIPPED (not configured yet — Phase 4)` and exit 0. It is NOT modified in this plan section.

Wiring is entirely through `package.json` scripts (Task 1):
- `"verify": "node scripts/run-verify.mjs verify"` → check-only (CI + pre-PR gate)
- `"verify:fix": "node scripts/run-verify.mjs verify:fix"` → auto-fix then check

The `run-verify.mjs` gates, in order:
1. **format** — detected by `.prettierrc` presence + `prettier` binary in `node_modules/.bin/`
2. **lint** — detected by `eslint.config.js` presence + `eslint` binary
3. **typecheck** — detected by `tsconfig.json` presence; prefers `astro check` if Astro is installed, falls back to `tsc --noEmit`
4. **unit** — detected by `vitest.config.ts` presence + `vitest` binary
5. **e2e** — detected by `playwright.config.ts` presence + `@playwright/test` package

After this section's Tasks 1–12, all five gates are configured (their config files exist and binaries are installed). Gates 4 and 5 will still "pass" at 0 test count until Phase 4 adds actual test files.

`@lhci/cli` (Lighthouse) and `pnpm audit` are deliberately outside `run-verify.mjs` — they run as separate steps in the Phase 5 verification and in the Cloudflare Pages build pipeline.
