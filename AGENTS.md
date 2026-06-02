# AGENTS.md — Universal Agent Contract

> Read this first, every session. This file is the cross-tool contract for any AI agent or human working in this repository (Claude Code, Cursor, Copilot, Codex, Gemini, future tools, and people). Tool-specific adapters (`CLAUDE.md`, etc.) delegate here rather than restate.

## How to use this file

1. **First**: read this file end-to-end on session start.
2. **Second**: read `CODING_PRINCIPLES.md` for the full coding standards _(Phase-0 draft; deepens in Phase 4 as the scaffold lands)_.
3. **Third**: read `CONTEXT.md` for the domain glossary and taxonomy _(Phase-0 draft; refined via `/grill-with-docs` as decisions crystallize)_.
4. **Then**: proceed to the task. For anything non-trivial, confirm the phase gate (below) before touching code.

When a tool-specific behavior matters (Windows command resolution, MCP wiring), check the relevant adapter. Project-wide rules live here.

---

## Precedence

When instructions conflict, follow this order (highest first):

1. The user's explicit instruction in the current conversation
2. The active phase gate and its acceptance criteria (see "Phased delivery")
3. This `AGENTS.md` — the cross-tool contract
4. `CODING_PRINCIPLES.md` — the deep standards _(Phase-0 draft; deepens in Phase 4)_
5. `CONTEXT.md` — domain glossary / taxonomy _(Phase-0 draft)_
6. Tool-specific adapters (`CLAUDE.md`) — only the tool-only glue they own
7. Tool defaults

Lower-precedence rules never override higher-precedence ones. When in doubt, ask the user.

---

## Project Identity & Mission

**`dedede.ro`** is a Romanian pest-control marketing site for a Bucharest + Ilfov (București + Ilfov) business. **DDD** = **D**ezinsecție (insect control) / **D**ezinfecție (disinfection) / **D**eratizare (rodent control). Tagline: _spații fără dăunători_ ("pest-free spaces").

**Mission**: rebuild the site from its legacy stack into **Astro**, with **strict visual + functional + SEO parity** to the live production site. Delivery is **PR-only**; a human reviews and deploys. We are not redesigning — we are re-platforming with pixel-and-meta fidelity.

### Legacy → Astro context

| | Legacy (current production) | Target (this rebuild) |
| --- | --- | --- |
| Framework | Elder.js 1.7.5 | **Astro 6.x** |
| UI layer | Svelte 3.57 | `.astro` components (SSG) + one client island |
| Bundler | Rollup 2 | Vite (bundled with Astro) |
| Styling | compiled CSS | **SCSS** via `sass-embedded` |
| Contact backend | `sideform.php` + SendGrid PHP SDK | **unchanged** — Astro form POSTs to the same PHP endpoint (parity requirement) |

The legacy `src/` (Svelte) is a **secondary** reference — useful for component structure only. See "Source of truth" below for what is authoritative.

### Routes (9 total)

Six standard pages plus **three blog articles that resolve at ROOT level** (this is parity-critical for the routing model):

```
/                                              homepage
/contact/                                      lead-capture form
/informatii-utile/                             blog index
/termeni-si-conditii/                          terms (legal)
/confidentialitate/                            GDPR privacy
/cookies/                                      cookie policy
/totul-despre-dezinsectie/                     ARTICLE (root-level, NOT nested)
/cum-scapi-de-gandaci/                         ARTICLE (root-level, NOT nested)
/dezinfectie-dezinsectie-deratizare-diferente/ ARTICLE (root-level, NOT nested)
```

**Root-level blog slugs are non-negotiable.** The articles must NOT live under `/informatii-utile/<slug>/`. The planned Astro shape: dedicated `.astro` files in `src/pages/` for the six standard pages, plus a single `src/pages/[slug].astro` dynamic route whose `getStaticPaths()` returns exactly the three article slugs from a `blog` content collection. Astro's priority rules guarantee the static files win, so `[slug].astro` only fires for the three articles. _(All of this is Phase-4 scaffold work — do not create it before Gate 1.)_

### Third-party to preserve (parity)

Cookiebot (cookie consent), Google Tag Manager (`GTM-NGTSNLX`), Google Analytics (via GTM), Google Ads / DoubleClick conversion (`AW-10780123066`). Keep these as deferred inline scripts gated by Cookiebot — not islands. Confirm Cookiebot's exact injection against live `https://dedede.ro` during Phase 4; it was not captured in the FTP snapshot.

---

## Source of Truth

- **`/livesite`** (gitignored) is an FTP snapshot of the LIVE deployment. It is **authoritative** for content, markup, meta tags, assets, and structure. When the legacy Svelte `src/` and `/livesite` disagree, **`/livesite` wins**.
- **`/livesite` contains SECRETS** (`env.php`, `php_errorlog`). **Never read their values into any output, never echo them, never copy them into the tracked repo.** If a secret value risks landing in a file, commit, or message, stop and flag it.
- The legacy Svelte `src/` is a **secondary** reference for component structure only.

---

## Non-Negotiables

Absolute. Violating them is never acceptable without explicit user override.

1. **PR-only delivery. Never `git commit`, `git push`, or `git merge` without an explicit human go-ahead at each gate.** Work happens on a feature branch (current: `feat/astro-rebuild`, off `main`). The human reviews the PR and deploys. The user owns all commits/pushes — summarize changes and propose a commit message; do not execute.
2. **Never bypass hooks** (`--no-verify`, `--no-gpg-sign`) unless the user explicitly asks. If a hook fails, fix the root cause.
3. **Never commit secrets, credentials, tokens, or unredacted personal data.** Treat `/livesite/env.php` and `/livesite/php_errorlog` as radioactive. Flag any secret you spot in a diff.
4. **`pnpm` is the package manager.** Never `npm` or `yarn`. Prefer `pnpm exec` / `pnpm <script>` over `npx`.
5. **Pin every dependency to an exact version and security-vet it before adding it** (see "Dependency vetting").
6. **Preserve public URLs and SEO exactly.** Identical URLs (301 redirect for any unavoidable change); title / meta description / canonical / OG / Twitter / JSON-LD parity; `sitemap.xml`; `robots.txt`; analytics + GDPR + cookie tags. The site is Romanian-only (`<html lang="ro">`) — no hreflang today, but note in `CONTEXT.md` that hreflang must be retro-fitted if i18n is ever added.
7. **Run verification before declaring work done** (see "Quality gates"). _(Gates become fully runnable only after the Phase-4 Astro scaffold exists.)_
8. **Preserve user changes and `/livesite`.** Before any destructive operation (delete, force-overwrite, `reset --hard`), ask. Never modify `/livesite`.
9. **No `@ts-ignore`, no `any` casts, no `var`, no `console.*` in production code.** Use `unknown` + narrowing, explicit return types, `const`/`let`, a proper logger.
10. **Verify third-party API signatures against current docs before first use.** Astro ecosystem packages move fast. Use the `astro-docs` / `context7` MCP servers (when configured) or official docs — do not guess that an option exists from its name.

### Phase-0 constraints (current phase)

In Phase 0 you MUST NOT: create `package.json`, install dependencies, scaffold the Astro project, create Astro / Vitest / Playwright config files, run git, modify `/livesite`, or print secret values. Phase 0 produces only harness docs and the verify-orchestrator scaffold. The real Astro scaffold lands in **Phase 4, after Gate 1**.

---

## Phased Delivery & Gates

PR-only means every phase boundary is a **human gate**. Do not roll past a gate without explicit go-ahead.

- **Gate 1 (deploy-target decision)** — before any Astro scaffold. The legacy contact form POSTs to `sideform.php` + SendGrid. The rebuild keeps POSTing to that same PHP endpoint by default (parity), so a serverless email replacement is NOT required for parity. If the human instead chooses a serverless backend (Netlify + Resend, Cloudflare + Resend, or a Node sidecar), that decision picks the adapter and whether a hybrid `output: 'static'` + one prerendered endpoint is needed. **Do not scaffold until the deploy target is confirmed.**
- **Phase 4 (scaffold)** — create `package.json`, pinned deps, `astro.config.ts`, configs, the route files, the `<ContactForm>` island, styles. This is where the "Phase-4-pending" items below come alive.
- **Definition of Done** — the parity oracle (next section). No phase that triggers a push/deploy completes until its gates are green.

---

## Definition of Done — the Parity Oracle

A page/route is "done" only when ALL of the following hold, with evidence committed under **`parity/`** _(directory created in Phase 4)_:

1. **Route inventory match** — the rebuilt route set equals the live route set exactly (the 9 routes above), including the three root-level article slugs and trailing-slash behavior.
2. **Visual parity** — Playwright `toHaveScreenshot()` with `maxDiffPixelRatio: 0.001` (≤ 0.1% pixel diff) at three viewports: mobile `375×812`, tablet `768×1024`, desktop `1440×900`. Baselines captured from the `/livesite` snapshot live in `parity/screenshots/`.
3. **Functional parity** — E2E coverage of every interactive behavior: hamburger nav, dark-mode toggle (with no flash-of-wrong-mode), back-to-top, and the contact form (validation, AJAX POST, `dataLayer` events `formularInitializat` / `formularTrimis` / `formularEroare` / `conversieAcceptata`).
4. **SEO / meta parity** — a head-diff helper asserts title, description, canonical, `og:*`, `twitter:*`, and JSON-LD equivalence between live and local for each route pair. `robots.txt` and `sitemap.xml` match.
5. **Quality gates green** — `pnpm verify` passes (see below).
6. **Lighthouse ≥ live** — Lighthouse scores meet or beat the live site's scores per category.
7. **Accessibility** — `@axe-core/playwright` passes on every route (target WCAG AA minimum; AAA where feasible per coding principles).

Evidence (screenshots, head diffs, Lighthouse reports, route inventory) is committed under `parity/` so a human reviewer can audit the oracle without re-running everything.

---

## Dependency Vetting

Every dependency is a liability. Before adding one:

1. **Pin an exact version** in `package.json` (no `^`, no `~`). Reproducible builds beat convenience.
2. **Security-vet it**: run `pnpm audit --audit-level=high` and treat high/critical as **build-blocking**. Check the advisory database / changelog for the specific version.
3. **Reject unmaintained packages** (no commits/releases in a long time, unanswered security issues, single-maintainer abandonware) unless there is no viable alternative and the human approves.
4. **Prefer the minimal set.** The research brief defines a tight pinned budget (Astro core, `sass-embedded`, `@astrojs/sitemap`, an SSR adapter only if a serverless contact backend is chosen, Vitest, Playwright, `@axe-core/playwright`, `@lhci/cli`, ESLint, Prettier + `prettier-plugin-astro`, TypeScript, husky, commitlint, knip). Do not add beyond it without justification.

**Known security flags to honor at scaffold time** (verify current state when you reach Phase 4 — advisories evolve):

- Prefer `tsc --noEmit` over `@astrojs/check` if the latter still pulls a vulnerable transitive `yaml`.
- If a Node SSR adapter is chosen, pin `@astrojs/node` at a version that patches the known SSRF advisory (≥ 9.5.3 per the brief).
- If the Cloudflare adapter is chosen, pin past its known SSRF advisory.
- `passthroughImageService()` is the intended image strategy (see below) — it avoids re-encoding the already-optimized `/livesite` images, which would break pixel-diff baselines.

---

## Quality Gates

> **Phase-4-pending**: The `pnpm verify` / `pnpm verify:fix` package scripts do not exist yet — they are wired when `package.json` is created in Phase 4. Until then, the runnable artifact is the **verify orchestrator** (`scripts/run-verify.mjs`, the Phase-0 deliverable), invoked directly as `node scripts/run-verify.mjs verify`; it wires the gate chain but no-ops (SKIPs) on tools that aren't installed yet. Do not invent intermediate commands.

The intended single gate is **`pnpm verify`** (read-only, CI + pre-PR) and **`pnpm verify:fix`** (auto-fix, fast local loop). The orchestrator runs five gates **in order, fail-fast**:

```
prettier --check . && eslint . && [astro check OR tsc --noEmit] && vitest run && playwright test
```

Two further checks run **outside** the orchestrator as separate steps: `lhci autorun` (Lighthouse ≥ live, part of the parity oracle) and `pnpm audit --audit-level=high` (security gate, CI-blocking on high/critical). All must pass green before a PR is considered review-ready. The five-gate chain is the machine-checkable half of the Definition of Done; the parity oracle (visual + SEO + functional + Lighthouse evidence under `parity/`) is the other half.

Planned per-tool scripts (Phase 4): `pnpm lint` / `lint:fix`, `pnpm typecheck`, `pnpm format` / `format:fix`, `pnpm test:unit` (Vitest), `pnpm test:e2e` (Playwright), `pnpm test:visual` (screenshots), `pnpm lighthouse`, `pnpm build`, `pnpm preview`, `pnpm dev`. Git hooks (husky): **pre-commit** runs `verify:fix`; **pre-push** runs the full `verify`.

---

## Astro Invariants (target architecture)

These are the load-bearing decisions for the rebuild. They become enforceable in Phase 4 but bind every design decision now.

1. **SSG by default.** The whole site is `output: 'static'`. The only candidate for a prerendered/SSR endpoint is a contact handler — and only if Gate 1 chooses a serverless backend. If the contact form keeps POSTing to the existing `sideform.php`, no adapter and no SSR is needed at all.
2. **Root-level article routing** via `src/pages/[slug].astro` + a `blog` content collection (Zod-validated frontmatter). If a future slug ever contains `/`, it must become `[...slug].astro` (rest param) — flag this in `CONTEXT.md` as a known extension point.
3. **Preserve exact CSS class names** from the `/livesite` HTML. Do not rename classes during migration — it shifts selector specificity and breaks visual parity.
4. **Images live in `public/images/`** referenced as `/images/...`, with `passthroughImageService()` configured so Astro does not re-encode them. Two-track policy: parity images pass through untouched; genuinely new images added after parity is certified may use `astro:assets` + Sharp. Document this in `CONTEXT.md`.
5. **One client island only.** The contact form is the sole component needing real hydration (`<ContactForm client:load />`). Everything else — header, footer, article cards, date/read-time helpers — is static `.astro`. Nav toggle, dark mode, and back-to-top are vanilla `<script>` (dark mode needs an early `is:inline` script to avoid flash-of-wrong-mode).
6. **Fonts**: the `Archivo` variable font (`/resources/archivo-var.woff2`) is preloaded in every page `<head>` — preserve the preload.
7. **Never `return new Response(...)` in a non-page component** — only in `src/pages/**` routes or API endpoints. Elsewhere it breaks SSG prerendering; `throw` instead.

---

## Code Style (target)

Adapted from the reference repo `viorelmocanu.ro`. Full detail lands in `CODING_PRINCIPLES.md` (Phase-4-pending). Essentials:

- **Astro 6 + TypeScript `strictest`** + **SCSS** (`sass-embedded`, `@use` not `@import`).
- **Indentation = TABS, width 4.** Line endings = **LF**. UTF-8, final newline. _(Markdown is the exception: 4-space indent.)_
- **Prettier** with `useTabs: true`, double quotes, trailing commas `all`, `prettier-plugin-astro`, large `printWidth` (no auto-wrap).
- **ESLint flat config** (ESLint 9); ESLint is the source of truth for `.astro` indentation.
- **Conventional Commits**, commitlint-enforced, subject < 72 chars, atomic commits, larger work on branches.
- Semantic HTML5, WCAG AA minimum (AAA where feasible), performance-first.

---

## Windows-first / pnpm notes

This repo is developed on **Windows 11** with **PowerShell** as the primary shell (Bash is available via the Bash tool).

- **No bashisms in committed scripts.** The Phase-0 verify orchestrator and any future scripts must run on Windows. Prefer cross-platform Node scripts (`.mjs`) invoked via pnpm over shell-specific `.sh`.
- **PowerShell syntax** when you do use the shell: `$null` not `/dev/null`, `$env:VAR` not `$VAR`, backtick for line continuation, `Remove-Item -Recurse -Force` not `rm -rf`.
- **`pnpm` everywhere** — it behaves identically on Windows. Prefer it over `npx`; if a `.cmd` shim won't resolve, fall back to `pnpm exec`.
- **Path separators**: forward slashes in source and Bash; backslashes only when invoking Windows tools directly. Use absolute paths in agent tool calls (cwd resets between Bash calls).
- **File locking**: renames/deletes inside tracked dirs can fail with "Permission denied" on Windows; retry via PowerShell `Move-Item -Force` / `Remove-Item -Force`.

---

## Skill Index

The repo ships five skills, mirrored under `.claude/skills/` (Claude Code) and `.agents/skills/` (canonical / cross-tool). When the matching trigger appears, prefer the skill over ad-hoc work.

| Skill | Use it when | What it does |
| --- | --- | --- |
| **`grill-with-docs`** | Stress-testing a plan against the project's domain language before building; whenever a decision sharpens terminology. | Interviews you relentlessly, branch by branch, and updates `CONTEXT.md` + ADRs (`docs/adr/`) inline as decisions crystallize. The way `CONTEXT.md` and `docs/adr/` get authored. |
| **`tdd`** | Building a feature or fixing a bug test-first; red-green-refactor; integration tests. | Drives the red-green-refactor loop. Use for the contact-form validation/submit logic, slug/read-time helpers, and schema validation. |
| **`diagnose`** | A hard bug, a parity mismatch you can't explain, or a performance regression ("debug this", "it's failing/broken"). | Disciplined reproduce → minimise → hypothesise → instrument → fix → regression-test loop. The right tool when a pixel diff or head diff won't reconcile. |
| **`handoff`** | Wrapping a session with work unfinished, or when context is getting compressed. | Compacts the conversation into a handoff doc (written to the OS temp dir, not the workspace) so a fresh agent can continue. |
| **`improve-codebase-architecture`** | Finding refactoring/deepening opportunities; consolidating coupled modules; improving testability and AI-navigability. | Surfaces architectural friction informed by `CONTEXT.md` and `docs/adr/`. Use after the scaffold exists, not during parity lockdown. |

> This repo does **not** use OpenSpec or a Perplexity MCP skill — do not invoke or reference them here. For doc lookups, use the `astro-docs` / `context7` MCP servers if configured, or official docs.

---

## Pointers to Deeper Documentation

When this contract is too thin, follow these rather than guess. Items marked _(Phase-4-pending)_ do not exist yet.

| Need | Read |
| --- | --- |
| Full coding standards (TS, SCSS, a11y, security, error handling) | `CODING_PRINCIPLES.md` _(Phase-0 draft)_ |
| Domain glossary & taxonomy (DDD terms, route purposes, extension points) | `CONTEXT.md` _(Phase-0 draft; refined via `grill-with-docs`)_ |
| Architecture Decision Records (deploy target, routing model, image policy) | `docs/adr/` _(Phase-0 drafts: 0001 Accepted, 0002–0005 Proposed pending GATE 1)_ |
| Parity evidence (screenshots, head diffs, Lighthouse, route inventory) | `parity/` _(created in Phase 4)_ |
| Tool-specific Claude Code glue | `CLAUDE.md` |
| Reference conventions adapted into this contract | `suggested_AGENTS.md`, `suggested_CODING_PRINCIPLES.md` (from `viorelmocanu.ro`; adapt, never blindly copy) |
| Authoritative content / markup / meta / assets | `/livesite` (gitignored, secrets inside — read content, never secret values) |
| Legacy component structure (secondary reference) | `src/` (Elder.js + Svelte) |

---

## Lifecycle of this contract

This file is **hand-edited canonical** — not generated by any sync process. When a project-wide rule changes (a new non-negotiable, a gate moving, a phase completing), edit this file once; adapters point here rather than duplicate. Keep it readable in one sitting (target 200–350 lines). If you want to add ~10+ lines of detail, ask first whether it belongs in `CODING_PRINCIPLES.md`, `CONTEXT.md`, a `docs/adr/` entry, or a tool adapter instead.

_Last updated: 2026-05-30 (Phase 0 — harness docs)._
