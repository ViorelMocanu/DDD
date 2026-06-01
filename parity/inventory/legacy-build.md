# Legacy Build Pipeline & Routing — Inventory

> Reference document for the Elder.js 1.7.5 + Svelte 3.57 + Rollup 2 legacy build.
> Authoritative for understanding what the Astro rebuild must replicate.
> Cross-reference: `CONTEXT.md`, `docs/adr/0002-routing-model.md`, `docs/adr/0003-content-pipeline.md`.

---

## 1. Package overview

| Field        | Value                                       |
| ------------ | ------------------------------------------- |
| Package name | `DeDeDe.ro` v0.8                            |
| Module type  | `commonjs`                                  |
| Entry point  | `./src/build.js`                            |
| Node engine  | `>= 12.0.0`                                 |
| Package mgr  | npm (legacy repo; Astro rebuild uses pnpm)  |

### Key runtime dependencies

| Package                         | Version   | Role                                                     |
| ------------------------------- | --------- | -------------------------------------------------------- |
| `@elderjs/elderjs`              | ^1.7.5    | SSG framework (build + dev server)                       |
| `@elderjs/plugin-markdown`      | ^1.3.4    | Converts `.md` files to routes/pages                     |
| `@elderjs/plugin-browser-reload`| ^1.3.10   | Dev-mode HMR via WebSocket on port 8080                  |
| `@elderjs/plugin-seo-check`     | 1.3.10    | Post-build SEO linting (title length, meta, etc.)        |
| `svelte`                        | ^3.57.0   | Template rendering engine                                |
| `svelte-preprocess`             | ^4.10.3   | Transforms SCSS/PostCSS inside `.svelte` files           |
| `rollup`                        | ^2.64.0   | Module bundler for client-side JS + Svelte SSR bundles   |
| `polka`                         | ^0.5.2    | Micro HTTP server (dev/serve mode only)                  |
| `sirv`                          | ^2.0.3    | Static asset serving in dev server                       |
| `dotenv`                        | ^16.3.1   | Loads `.env` at startup                                  |
| `body-parser`                   | ^1.20.1   | JSON + urlencoded parsing for the dev server             |
| `ncp`                           | 2.0.0     | Copies `assets/images` and `assets/resources` to `public/` after HTML build |
| `del`                           | ^6.1.1    | Cleans `public/` before each build                       |
| `glob`                          | ^10.3.4   | File-glob helper used in hooks                           |
| `intersection-observer`         | ^0.12.2   | Polyfill (bundled to client)                             |

### Key devDependencies

| Package             | Role                                              |
| ------------------- | ------------------------------------------------- |
| `autoprefixer`      | PostCSS vendor-prefix plugin                      |
| `postcss`           | CSS processing pipeline                           |
| `prettier-plugin-svelte` | Svelte file formatting                       |
| `babel` + presets   | Transpiles ES modules for Rollup output targeting |

---

## 2. npm scripts

```
build         → cleanPublic → build:rollup → build:html
build:rollup  → rollup -c
build:html    → node ./src/build.js  +  ncp assets/images public/images  +  ncp assets/resources public/resources
dev           → rollup -c -w --no-watch.clearScreen
serve         → cleanPublic + build:rollup + NODE_ENV=production node ./src/server.js
```

**Full production build sequence:**

1. `src/cleanPublic.js` — deletes `public/*` via `del.sync`.
2. `rollup -c` — produces SSR bundles and client-side JS under `public/_elderjs/`.
3. `node ./src/build.js` — calls `@elderjs/elderjs` `build()` which executes the full
   Elder.js lifecycle: bootstrap → allRequests → data → template rendering → writing HTML to `public/`.
4. `ncp assets/images public/images` — copies all image assets.
5. `ncp assets/resources public/resources` — copies font (`archivo-var.woff2`), `script.js`,
   `style.css`, `style.css.map`, `style.scss`.

---

## 3. Elder.js build lifecycle

Elder.js is a hook-based SSG. The framework defines a fixed sequence of named lifecycle hooks. User code
(in `src/hooks.js`) and plugins register handlers for any subset of these hooks.

### 3.1 Core lifecycle hooks (in execution order)

| Hook            | What it does                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------- |
| `bootstrap`     | Framework startup: loads config, plugins, shortcodes. User hooks run here.                    |
| `allRequests`   | Each route's `all()` function is called; produces the full list of request objects for the build. |
| `data`          | For each request, the route's `data()` function is called to populate the template data object. |
| `shortcodes`    | Shortcode patterns are resolved inside HTML content.                                           |
| `stacks`        | CSS/JS/head stacks are consolidated and injected into the HTML string.                         |
| `html`          | Final HTML string available for mutation (minification hook is present but commented out).    |
| `elderWriteHtmlFileToPublic` | Writes each rendered page to `public/<permalink>/index.html`. Can be disabled via `elder.config.js` hooks.disable. |

### 3.2 User hooks (`src/hooks.js`)

Only one active hook is registered:

| Hook        | Name                  | What it does                                                                                      |
| ----------- | --------------------- | ------------------------------------------------------------------------------------------------- |
| `bootstrap` | `copyAssetsToPublic`  | Globs `./assets/**/*` and copies every file with an extension to the matching path under `distDir` (`public/`). This is the mechanism that copies favicons, `browserconfig.xml`, `humans.txt`, `robots.txt`, `robots.txt`, etc. at build start. |

A commented-out HTML compression hook exists in the file (regex-based whitespace collapse) but is not
active and must NOT be enabled — it would corrupt inline scripts and SVGs.

A commented-out `data` hook example for adding global data to every page also exists but is not active.

### 3.3 Shortcodes (`src/shortcodes.js`)

Shortcode delimiters are configured in `elder.config.js` as `openPattern: '{{'` / `closePattern: '}}'`.

Two shortcodes are registered:

| Shortcode        | Usage                         | Output                                                                         |
| ---------------- | ----------------------------- | ------------------------------------------------------------------------------ |
| `box`            | `{{box class="yellow"}}...{{/box}}` | Wraps content in `<div class="box {class}">`, injects inline CSS + a `<script>` tag + a `<meta>` head tag. Unused in production content. |
| `numberOfPages`  | `{{numberOfPages /}}`         | Returns `allRequests.length` as HTML text. Also unused in production content.  |

**Conclusion:** no shortcodes are actively used in the production content. The shortcode system does not need to be replicated in Astro; both are dead code in the legacy build.

---

## 4. Rollup configuration (`rollup.config.js`)

```js
const { getRollupConfig } = require('@elderjs/elderjs');
const svelteConfig = require('./svelte.config');
module.exports = [...getRollupConfig({ svelteConfig })];
```

Entirely delegated to `@elderjs/elderjs`'s `getRollupConfig()`. The framework generates two Rollup
output targets internally:

- **SSR bundle** — Node.js CJS bundle used during `build()` to server-render each page.
- **Client bundle** — browser-targeted ES/IIFE bundle placed under `public/_elderjs/svelte/` for
  component hydration.

The Netlify `cache-control` header rule (`max-age=31536000, immutable`) applies to `/_elderjs/*`,
confirming these bundles are treated as immutable hashed assets.

### Svelte preprocessing (`svelte.config.js`)

```js
sveltePreprocess({ postcss: { plugins: [require('autoprefixer')] } })
```

`svelte-preprocess` is applied with one PostCSS plugin: `autoprefixer`. This means SCSS/CSS inside
`<style>` blocks in `.svelte` files gets vendor-prefixed automatically. No other PostCSS plugins
(e.g., `cssnano`) are active.

---

## 5. Routes

Elder.js discovers routes by scanning `src/routes/*/route.js`. Each route module exports: `all`, `permalink`, `data`, and optionally `template` and `dynamic`.

### 5.1 Route table

| Route dir              | `all()` slug(s)                          | `permalink`             | Data source                   | Template file                    | Notes                            |
| ---------------------- | ---------------------------------------- | ----------------------- | ----------------------------- | -------------------------------- | -------------------------------- |
| `home`                 | `[{ slug: '/' }]`                        | `'/'`                   | `hookInterface`, `hookEntityDefinitions` from `@elderjs/elderjs` | `Home.svelte` (auto-discovered) | Homepage; data is Elder.js introspection data, not page content |
| `contact`              | `[{ slug: 'contact' }]`                  | `'/:slug/'` → `/contact/` | `req` object + `hookInterface` | `Contact.svelte`                | `dynamic: true`; has a `middleware` stub that returns `req` untouched |
| `informatii-utile`     | `[{ slug: 'informatii-utile', template: 'BlogIndex' }]` | `'/:slug/'` → `/informatii-utile/` | Injected by markdown plugin; `data()` is a passthrough | `informatiiutile.svelte` (explicit `template` key) | Blog index; also spawns 3 child article routes (see §5.2) |
| `termeni-si-conditii`  | `[{ slug: 'termeni-si-conditii' }]`      | `'/termeni-si-conditii/'` | `hookInterface`, `hookEntityDefinitions` | `termeni-si-conditii.svelte` | Hard-coded permalink (no `:slug` param) |
| `confidentialitate`    | `[{ slug: 'confidentialitate' }]`        | `'/confidentialitate/'` | `hookInterface`, `hookEntityDefinitions` | `confidentialitate.svelte`    | Hard-coded permalink             |
| `cookies`              | `[{ slug: 'cookies' }]`                  | `'/cookies/'`           | `hookInterface`, `hookEntityDefinitions` | `cookies.svelte`              | Hard-coded permalink             |

**Important:** the `hookInterface` and `hookEntityDefinitions` values injected into `data` on home, contact, and the three legal pages are Elder.js framework internals. They are **not used** to render page content in any of the Svelte templates — the templates contain hardcoded Romanian content. These are boilerplate artefacts from the Elder.js project template and carry no content value.

### 5.2 Blog articles — markdown plugin route generation

The `@elderjs/plugin-markdown` plugin operates on the `informatii-utile` route. Its configuration in `elder.config.js`:

```js
'@elderjs/plugin-markdown': {
    routes: ['informatii-utile'],
    slugFormatter: function (relativeFilePath, frontmatter) {
        return false;  // <-- disables custom slug; uses filename stem as slug
    },
    useSyntaxHighlighting: false,
    useTableOfContents: true,
    createRoutes: true,   // <-- generates top-level routes for each .md file
}
```

Key behaviors:

- **`routes: ['informatii-utile']`** — tells the plugin to scan `src/routes/informatii-utile/` for `.md` files.
- **`slugFormatter` returns `false`** — the plugin falls back to using the markdown filename stem as the slug (e.g., `totul-despre-dezinsectie.md` → slug `totul-despre-dezinsectie`).
- **`createRoutes: true`** — the plugin creates **new top-level Elder.js routes** for each `.md` file, each with `permalink: '/:slug/'`. This produces root-level URLs (`/totul-despre-dezinsectie/`, etc.), NOT nested URLs under `/informatii-utile/`.
- **`useTableOfContents: true`** — generates a table of contents from `##` headings and injects it into the data object for the article template.
- Template for article pages: `BlogPost.svelte` (the plugin assigns this because the `informatii-utile/route.js` does not explicitly specify it for individual articles).

### 5.3 Markdown file inventory

All three `.md` files live in `src/routes/informatii-utile/`:

| File                                          | Slug (URL)                                    | Frontmatter `date`       |
| --------------------------------------------- | --------------------------------------------- | ------------------------ |
| `totul-despre-dezinsectie.md`                 | `/totul-despre-dezinsectie/`                  | 2021-09-14T11:40:00      |
| `cum-scapi-de-gandaci.md`                     | `/cum-scapi-de-gandaci/`                      | 2021-09-13T19:45:00      |
| `dezinfectie-dezinsectie-deratizare-diferente.md` | `/dezinfectie-dezinsectie-deratizare-diferente/` | 2021-09-12T19:45:00 |

**Frontmatter schema (common to all three):**

```yaml
title: string
description: string
excerpt: string
date: ISO 8601 datetime string
author: string
thumbnail:
  name: string   # filename stem, no extension — image at /images/{name}-desktop.webp etc.
  alt: string
ogimage:
  url: string    # absolute path e.g. /images/foo-og.jpg
  alt: string
```

---

## 6. Data sources

| Route                      | Where data comes from                                                       |
| -------------------------- | --------------------------------------------------------------------------- |
| `home`                     | All content is **hardcoded in `Home.svelte`**. The `data` function passes Elder.js framework introspection objects (`hookInterface`, `hookEntityDefinitions`) which the template does not use for rendering. |
| `contact`                  | All content is **hardcoded in `Contact.svelte`**. The `data` function passes the `req` object for potential SSR use; the template uses it only for form submission awareness. |
| `informatii-utile` (index) | Article list is **injected by the markdown plugin** into the `data` object. The `informatii-utile/route.js` `data()` is a passthrough (`return data`). |
| Blog articles              | **Markdown frontmatter + body** provided by the markdown plugin. Table of contents injected by plugin (`useTableOfContents: true`). |
| `termeni-si-conditii`      | All content is **hardcoded in `termeni-si-conditii.svelte`**.               |
| `confidentialitate`        | All content is **hardcoded in `confidentialitate.svelte`**.                 |
| `cookies`                  | All content is **hardcoded in `cookies.svelte`**.                           |

**Summary:** no external CMS, no API calls, no database. Content is either hardcoded in Svelte templates or lives in the three markdown files in `src/routes/informatii-utile/`. The authoritative content source for the Astro rebuild is the `/livesite` FTP snapshot, not these source files.

---

## 7. Build output shape (`public/`)

After a full build, `public/` contains:

```
public/
  index.html                             ← homepage
  contact/index.html
  informatii-utile/index.html
  totul-despre-dezinsectie/index.html
  cum-scapi-de-gandaci/index.html
  dezinfectie-dezinsectie-deratizare-diferente/index.html
  termeni-si-conditii/index.html
  confidentialitate/index.html
  cookies/index.html
  images/                                ← copied by ncp from assets/images/
  resources/                             ← copied by ncp from assets/resources/
    archivo-var.woff2
    script.js
    style.css
    style.css.map
    style.scss
  _elderjs/
    svelte/                              ← Rollup client bundles (hashed, immutable)
  android-chrome-192x192.png             ← copied by hooks.js bootstrap from assets/
  android-chrome-512x512.png
  apple-touch-icon.png
  browserconfig.xml
  favicon-16x16.png
  favicon-32x32.png
  favicon.ico
  favicon.svg
  google8bed9638f272a4f6.html
  humans.txt
  maskable_icon.png
  mstile-*.png
  robots.txt
  safari-pinned-tab.svg
  site.webmanifest
  ... (all other assets/ root-level files)
```

Every page is written as `<permalink>/index.html`, giving trailing-slash URLs. The `/_elderjs/` path
contains hashed client bundles and is served with `max-age=31536000, immutable` on Netlify.

---

## 8. Environment variables

The following env var names are referenced in source files. Values must never appear in this file or in
the repository.

| Variable       | File                | Purpose                                                    |
| -------------- | ------------------- | ---------------------------------------------------------- |
| `NODE_ENV`     | `src/server.js`, `elder.config.js` | Selects development vs production mode. `'production'` enables SEO-check error display and disables dev-server live-reload injection. |
| `SERVER_PORT`  | `src/server.js`     | HTTP port for the dev/serve Polka server. Defaults to `3000` if unset. |

`dotenv` is loaded in `elder.config.js`, `rollup.config.js`, and `src/server.js` via `require('dotenv').config()`, reading from a `.env` file at the repo root. No other env vars are referenced in the build pipeline source files inventoried here. (The PHP contact backend (`sideform.php`, `env.php`) uses additional env vars for SendGrid; those are outside this inventory's scope.)

---

## 9. Netlify deploy configuration (`netlify.toml`)

```toml
[build]
  command = "npm run build"
  publish = "public/"

[[headers]]
  for = "/_elderjs/*"
  [headers.values]
    cache-control = "public, max-age=31536000, immutable"
```

**Key points:**

- Build command is `npm run build` (the full pipeline: clean → rollup → html → copy assets).
- Publish directory is `public/`.
- The only custom HTTP header is a year-long immutable cache on `/_elderjs/*` (the Rollup client bundles).
- No Netlify Functions, no redirects config, no environment variable declarations in `netlify.toml`. The contact form posts to the existing PHP server (`sideform.php`), not to a Netlify Function.
- No `[context]` blocks — there is no staging/preview distinction configured in Netlify.

---

## 10. Dev server (`src/server.js`)

Used only in `npm run serve` (local production preview). Not used by Netlify. Stack:

- **Polka** as the HTTP server (lightweight Express alternative).
- **cors** — `cors()` middleware with default config (allow all origins).
- **compression** — gzip at level 6.
- **body-parser** — URL-encoded + JSON request bodies.
- **Elder.js `elder.server`** — SSR handler; serves pages with live data.
- **sirv** — serves static files from `distDir` (`public/`).

Dev mode browser reload is handled by `@elderjs/plugin-browser-reload` (WebSocket on port 8080), not by the Polka server.

---

## 11. SEO-check plugin (`@elderjs/plugin-seo-check`)

Configured in `elder.config.js`:

```js
'@elderjs/plugin-seo-check': {
    display: process.NODE_ENV === 'production' ? ['errors', 'warnings'] : [],
    preferences: [],
    rules: [],
    handleSiteResults: async ({ meta, ...results }) => {
        if (Object.keys(results).length > 0) { /* silent */ }
        else { console.log('No SEO issues detected.'); }
    },
}
```

**Note:** `process.NODE_ENV` is a bug — the correct form is `process.env.NODE_ENV`. As written, `process.NODE_ENV` is always `undefined`, so `display` is always `[]` (empty array — no output). The SEO-check plugin runs but produces no console output in any environment. This bug has no impact on the built HTML.

---

## 12. Astro mapping notes

| Legacy mechanism | Astro equivalent | Notes |
| --- | --- | --- |
| `elder.config.js` `distDir: 'public'`, `srcDir: 'src'` | `astro.config.mjs` `outDir: 'dist'` (Astro default) or keep `dist: 'dist'`; `srcDir: 'src'` | Astro uses `dist/` by default for output; static assets go in `public/` as passthrough. Rename not required — just configure `outDir`. |
| `npm run build` → Elder.js `build()` | `astro build` | Astro has a single build command. No separate Rollup step needed — Astro's Vite bundler handles JS. |
| `src/hooks.js` `copyAssetsToPublic` (bootstrap hook) | Assets in `public/` are automatically copied by Astro during build | No hook equivalent needed. Put favicons and root-level files directly in `public/`. |
| `src/cleanPublic.js` | `astro build` cleans `dist/` on each run by default | No equivalent script needed. |
| Rollup `getRollupConfig()` — SSR + client bundles | Astro/Vite handles all bundling internally | No `rollup.config.js` needed. Client interactivity via `<script>` or island directives. |
| `svelte-preprocess` + `autoprefixer` | Astro's built-in `sass-embedded` + `autoprefixer` via `vite.css.postcss` in `astro.config.mjs` | SCSS `<style lang="scss">` in `.astro` files works natively. Add `autoprefixer` to the PostCSS config if required. |
| `src/routes/*/route.js` `all()` + `permalink` | `src/pages/*.astro` file-based routing | Each route dir maps to one `src/pages/` file. Static `permalink` values map 1:1 to file names. `/:slug/` with `all()` maps to a `[slug].astro` dynamic route. |
| `src/routes/home/route.js` (`permalink: '/'`) | `src/pages/index.astro` | Direct mapping. |
| `src/routes/contact/route.js` (`dynamic: true`, `permalink: '/:slug/'`) | `src/pages/contact.astro` (static HTML) + `src/pages/api/contact.ts` (SSR endpoint) | `dynamic: true` in Elder.js means the route can serve SSR responses; in Astro this needs `output: 'hybrid'` or `'server'` for the API endpoint (ADR 0004). |
| `src/routes/informatii-utile/route.js` (blog index) | `src/pages/informatii-utile.astro` with `getCollection('blog')` | The index lists articles from the content collection. |
| `@elderjs/plugin-markdown` with `createRoutes: true` + `slugFormatter: () => false` | Astro content collection `src/content/blog/` + `src/pages/[slug].astro` with `getStaticPaths()` | The markdown plugin generated root-level routes by slug; Astro replicates this via a dynamic `[slug].astro` page that returns exactly the three article slugs from `getStaticPaths()`. This is the most parity-critical routing detail — see ADR 0002. |
| `useTableOfContents: true` | Manual: parse headings from `entry.body` at build time, or use `remark-toc` plugin | Astro's content pipeline does not generate TOC automatically; add a remark plugin or compute headings from rendered HTML. Verify if the legacy TOC is visible in the rendered output before implementing. |
| `src/routes/informatii-utile/*.md` frontmatter | `src/content/blog/*.md` with Zod schema in `src/content/config.ts` | Schema enforces `title`, `description`, `date`, `excerpt`, `author`, `thumbnail`, `ogimage`. See ADR 0003 for the recommended schema. |
| `data()` returning `hookInterface`/`hookEntityDefinitions` | Nothing — these are Elder.js internals, not used in template rendering | Drop entirely. Astro pages receive no equivalent; content is hardcoded in `.astro` files. |
| `src/shortcodes.js` (`box`, `numberOfPages`) | Not needed | Both shortcodes are unused in production content. No Astro equivalent required. |
| `src/server.js` (Polka + sirv dev server) | `astro dev` / `astro preview` | Astro's built-in dev server replaces Polka + sirv. No custom server file needed. |
| `@elderjs/plugin-seo-check` | Astro `astro check` + ESLint + manual meta parity tests | The legacy SEO check never ran due to the `process.NODE_ENV` bug. Use the parity baseline fixtures (`parity/baseline/meta/`) as the SEO oracle instead. |
| Netlify `[build] command = "npm run build"` | `[build] command = "pnpm build"` (or `astro build`) in `netlify.toml` | Update to pnpm. Publish dir stays `dist/` (or configure `outDir` to `public/`). |
| Netlify `/_elderjs/*` immutable cache header | Netlify `/_astro/*` immutable cache header | Astro places hashed client assets under `/_astro/`. Update the `for` pattern in `netlify.toml`. |
| `assets/` directory (root-level files + images) | `public/` (root-level files + `public/images/`) | The `copyAssetsToPublic` hook and `ncp` calls are replaced by Astro's automatic `public/` passthrough. Mirror the `assets/` structure under `public/`. |
| `assets/resources/script.js` | `public/resources/script.js` (passthrough) or inline `<script is:inline>` in layout | The legacy `script.js` contains vanilla JS for hamburger nav, dark mode, back-to-top, GTM, and Google Ads. Preserve as a passthrough file or inline per CONTEXT.md §4. |
| `assets/resources/style.css` (compiled from `style.scss`) | Compiled by Astro/Vite from `src/styles/style.scss` | Do not copy the pre-compiled CSS; let Astro compile from source SCSS. |
| `elder.config.js` `css: 'file'` | Astro default — CSS emitted as separate files | No action needed; Astro emits CSS as separate hashed files by default. |
| `elder.config.js` `lang: 'ro'` | `<html lang="ro">` in the Astro layout | Set directly in `src/layouts/BaseLayout.astro`. |
| `elder.config.js` `shortcodes: { openPattern: '{{', closePattern: '}}' }` | Not needed | No shortcodes are active in production content. |
