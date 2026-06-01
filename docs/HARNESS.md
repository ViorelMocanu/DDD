# Harness Guide — dedede.ro Astro Rebuild

This document is the map of the project's **engineering harness**: the quality gates, the
parity oracle, the phase workflow, the directory conventions, and the skills that support each
phase. Read it before touching code. It is written for the next agent or human picking up the
rebuild cold.

## Mission (one paragraph)

Rebuild the live marketing site **dedede.ro** (a Romanian DDD pest-control business —
_Dezinsecție / Dezinfecție / Deratizare_) from its legacy stack (Elder.js 1.7.5 + Svelte 3 +
Rollup 2) into **Astro 6 (SSG)**, with strict **visual + functional + SEO parity** against the
live site. Delivery is **PR-only**: a human reviews and deploys. Nothing ships automatically.

The authoritative content source is the gitignored `/livesite` folder (an FTP snapshot of the
live deployment). The legacy `src/` Svelte tree is a **secondary** reference for component
structure only. `/livesite` also contains secrets (`env.php`, `php_errorlog`) — never read their
values into output and never copy them into the repo.

---

## 1. The Two Pillars

The harness has two independent pillars. Both must be green before a phase that triggers a PR is
considered done.

### Pillar A — Quality Gates (`pnpm verify`)

Mechanical correctness of the code itself. Implemented by `scripts/run-verify.mjs` and surfaced
as `pnpm verify` / `pnpm verify:fix` (wired in Phase 4). Gates run **in order, fail-fast**:

| # | Gate | Tool | What it proves |
|---|------|------|----------------|
| 1 | format | `prettier --check` | Code matches the repo's formatting (tabs, LF, printWidth). |
| 2 | lint | `eslint .` | No lint violations (flat config, Astro + TS rules). |
| 3 | typecheck | `astro check` (else `tsc --noEmit`) | Types are sound under TS `strictest`. |
| 4 | unit | `vitest run` | Pure-logic units pass (slug, read-time, date, schema). |
| 5 | e2e | `playwright test` | E2E + visual regression + a11y pass. |

`verify:fix` runs `prettier --write` then `eslint --fix` first, then the full check sequence.

**The orchestrator is defensive.** It was committed in Phase 0, before the Astro project exists.
Each gate detects whether its binary is installed (under `node_modules/.bin`) **and** whether a
relevant config file is present. If either is missing the gate prints
`SKIPPED (not configured yet — Phase 4)` and execution continues. The process exits non-zero
**only when a configured gate actually fails**. A Phase-0 run where every gate skips exits `0`.
This is by design: it lets the gate runner live in the repo from day one without ever giving a
false failure.

As gates come online in Phase 4 they activate automatically — no edit to the orchestrator is
needed when you add `prettier`, then `eslint`, then `tsconfig.json`, and so on. Add the tool +
its config, and the matching gate flips from SKIP to PASS/FAIL on the next run.

Run it directly during development:

```sh
node scripts/run-verify.mjs verify       # check-only
node scripts/run-verify.mjs verify:fix   # auto-fix, then check
```

Also run `pnpm audit --audit-level=high` as a security gate (CI-blocking on high/critical). See
the research brief for pinned versions and the CVE list (e.g. `@astrojs/node@9.5.3+` for
CVE-2026-25545; avoid `@astrojs/check` until its `yaml` transitive is patched).

### Pillar B — The Parity Oracle (Definition of Done)

Quality gates prove the code is _clean_. The parity oracle proves the rebuild is
_indistinguishable from the live site_. It is the real Definition of Done. All evidence lands
under `parity/`. The oracle has five checks:

1. **Route-inventory match** — exactly the 9 public routes resolve, with identical URLs. The
   three blog articles MUST resolve at **root level**
   (`/totul-despre-dezinsectie/`, `/cum-scapi-de-gandaci/`,
   `/dezinfectie-dezinsectie-deratizare-diferente/`) — NOT nested under `/informatii-utile/`.
   Any URL change requires a 301 redirect and an ADR.
2. **Visual diff** — `≤ 0.1%` pixel difference (`maxDiffPixelRatio: 0.001`) at three viewports:
   mobile `375×812`, tablet `768×1024`, desktop `1440×900`. Baselines captured from the
   `/livesite` snapshot live in `parity/screenshots/`.
3. **Functional E2E parity** — every interactive behaviour works identically: hamburger nav,
   dark-mode toggle (+ no flash on load), back-to-top, and especially the contact form
   (validation, POST to `sideform.php`, `dataLayer` events, GDPR checkbox, UTM/gclid hidden
   fields).
4. **SEO / meta diff** — `title`, `description`, `canonical`, `og:*`, `twitter:*`, JSON-LD,
   `lang="ro"`, `sitemap.xml`, `robots.txt` match the live `<head>` per route. Automate with a
   Playwright head-diff helper that compares live vs local build.
5. **Quality gates green + Lighthouse ≥ live** — `pnpm verify` passes and Lighthouse scores meet
   or beat the live site's, recorded as evidence.

Only when **both pillars** are green is a route — and ultimately the rebuild — done.

---

## 2. Phase Workflow & Gates

Each phase ends at a **human gate**. The agent never crosses a gate (branch, scaffold, commit,
push, merge, deploy) without an explicit human go-ahead. Work happens on `feat/astro-rebuild`
(off `main`); delivery is PR-only.

| Phase | Goal | Exit gate |
|-------|------|-----------|
| **0 — Harness** | Produce harness docs + the `run-verify.mjs` orchestrator. No package.json, no deps, no scaffold, no Astro/test config. | Harness docs + orchestrator committed; human reviews approach. |
| **1 — Inventory & briefs** | Lock the route map, component inventory, interactivity inventory, asset/third-party inventory, domain glossary. Capture in `CONTEXT.md`. | Inventory agreed; ambiguities resolved. |
| **2 — Parity baselines** | Capture authoritative baselines from `/livesite`: per-route screenshots (3 viewports), `<head>` snapshots, route inventory, Lighthouse-on-live. Store under `parity/`. | Baselines reviewed and frozen. |
| **3 — Decisions (ADRs)** | Record load-bearing decisions in `docs/adr/`. **Gate-1 deploy-target decision** (Netlify vs Cloudflare vs Node sidecar) lives here — it determines the adapter and whether hybrid `output: 'static'` + one SSR endpoint is viable. Pin dependency versions; security-vet every dep. | Deploy target confirmed; ADRs approved. **Blocks Phase 4.** |
| **4 — Scaffold & build** | Create `package.json`, install pinned deps, scaffold Astro + tsconfig + eslint/prettier/vitest/playwright configs. Build the 9 routes + the contact-form island. Gates activate automatically in `run-verify.mjs` as tools land. | `pnpm verify` green; each route built. |
| **5 — Parity certification** | Run the full parity oracle against the build. Iterate until visual ≤ 0.1%, SEO diff clean, E2E parity, Lighthouse ≥ live. Commit evidence under `parity/`. | All five oracle checks pass; evidence committed. |
| **6 — PR & handoff** | Open the PR with parity evidence linked. Human reviews and deploys. | Human merges + deploys. |

**Phase-0 hard "do nots"** (this phase only): no `package.json`, no dependency install, no Astro
scaffold, no Astro/Vitest/Playwright config files, no `git` commands, no modifying `/livesite`,
no printing secret values. Phase 0 produces **only** the harness docs and the verify orchestrator.

---

## 3. Directory Conventions

```
scripts/            Tooling. run-verify.mjs (gate orchestrator) lives here. Node ESM,
                    cross-platform, Windows-safe (no bashisms).
docs/               Project documentation.
  HARNESS.md        This file.
  adr/              Architecture Decision Records — one numbered file per decision
                    (0001-framework-choice.md … 0005-deploy-target.md). The source
                    of truth for "why".
                    Skills read these so they don't re-litigate settled calls.
parity/             Parity oracle evidence (the Definition-of-Done artifacts).
  screenshots/      Per-route, per-viewport baselines + diffs.
  head/             Per-route <head> / SEO snapshots and diffs.
  routes/           Route-inventory match output.
  lighthouse/       Lighthouse-on-live and Lighthouse-on-build reports.
CONTEXT.md          Domain glossary + inventories (created in Phase 1). The shared
                    vocabulary; skills key off it for naming.
livesite/           GITIGNORED FTP snapshot — authoritative content. Read-only.
                    Contains secrets; never copy in, never print values.
src/                Legacy Svelte/Elder source — secondary reference only (Phase 0–3).
                    Replaced by the Astro tree in Phase 4.
```

Conventions inherited from the reference repo (viorelmocanu.ro): **tabs** for indentation
(width 4), **LF** line endings, UTF-8, final newline — all enforced by `.editorconfig` and
Prettier (`useTabs: true`, `printWidth: 3000`, `prettier-plugin-astro`). TypeScript runs on the
`strictest` preset. Package manager is **pnpm**. Commits follow **conventional commits**
(commitlint + husky). Adapt these standards from `suggested_AGENTS.md` and
`suggested_CODING_PRINCIPLES.md` at the repo root — adapt, do not blindly copy.

---

## 4. How the Skills Fit In

The repo ships a small skill set under `.claude/skills/` (mirrored in `.agents/skills/`). Map of
when each one earns its keep across the phases:

- **grill-with-docs** — _Phases 1 & 3._ Stress-test a plan against the project's own language and
  documented decisions. Sharpens terminology and updates `CONTEXT.md` / ADRs inline as decisions
  crystallise. Use it to pin the inventory and the Gate-1 deploy-target decision.
- **improve-codebase-architecture** — _Phase 4._ Find deepening opportunities (shallow → deep
  modules) once the Astro tree exists. Informed by `CONTEXT.md` vocabulary and `docs/adr/`
  decisions; it won't re-suggest things an ADR already settled.
- **tdd** — _Phases 4 & 5._ Red-green-refactor for the pure logic units (slug resolution,
  read-time calc, date formatting, Zod schema) and the contact-form behaviour, before the E2E
  parity pass.
- **diagnose** — _Phases 4–5._ Disciplined reproduce → minimise → hypothesise → instrument → fix
  loop for stubborn parity failures (e.g. a persistent visual diff or a flaky E2E).
- **handoff** — _Phase 6, or any context boundary._ Compact the conversation into a handoff doc
  (written to the OS temp dir, not the repo) so a fresh agent can continue. Redacts secrets.

When a phase calls for one, invoke the skill rather than improvising the same workflow by hand.

---

## 5. Quick Reference

```sh
# Quality gates (Pillar A)
pnpm verify          # → node scripts/run-verify.mjs verify     (check only)
pnpm verify:fix      # → node scripts/run-verify.mjs verify:fix  (autofix, then check)
node scripts/run-verify.mjs verify        # run directly without pnpm wiring
pnpm audit --audit-level=high             # security gate (CI-blocking)

# Definition of Done = Pillar A green AND all 5 parity-oracle checks green,
# with evidence committed under parity/.
```

**Golden rules:** PR-only; never cross a gate without an explicit human go-ahead; pin and
security-vet every dependency; preserve identical public URLs (301 + ADR for any change); keep
the three blog slugs at root level; never read or print `/livesite` secrets.
