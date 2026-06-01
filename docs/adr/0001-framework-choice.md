# ADR 0001 — Framework choice: Astro 6.x

- **Status:** Accepted
- **Date:** 2026-05-30
- **Deciders:** Mission brief (framework is fixed); human reviewer ratifies at GATE 1
- **Phase:** Phase 0 (decision recorded), Phase 4 (scaffold)

## Context

The legacy `dedede.ro` is built on **Elder.js 1.7.5 + Svelte 3.57 + Rollup 2** — an SSG framework whose
upstream is effectively unmaintained, on a Svelte major two versions behind, with a build toolchain
(Rollup 2) that predates modern Vite-based DX. The site is a small (9-route) marketing site that is
**>95% static**: per the component inventory in `CONTEXT.md`, zero of the six display components need
client hydration, and only the contact form requires server-side handling.

We need a framework that is: SSG-first; able to reproduce the legacy URLs exactly (including root-level
blog slugs); able to emit one SSR/endpoint for the contact form without making the whole site dynamic;
TypeScript-strict; SCSS-native; and actively maintained with a healthy security posture. The mission
fixes the target as **Astro**, so this ADR records the rationale rather than opening the choice.

## Decision

Adopt **Astro `6.3.1`** (latest stable; requires Node `^22.12.0 || ^24.0.0`) as the framework. Astro is
SSG-first by default, supports hybrid `output: 'static'` with per-route `export const prerender = false`
for the single contact endpoint, has first-party `@astrojs/sitemap`, native `sass-embedded` support via
Vite, and a `passthroughImageService()` that preserves the legacy optimized image bytes (protecting the
pixel-diff baselines). It maps cleanly onto the static-vs-island split already established in `CONTEXT.md`.

## Consequences

- **Easier:** build-time HTML output ideal for parity diffing; `.astro` components are near-1:1 with the
  static Svelte components; minimal shipped JS (good for Lighthouse parity); one mental model for SSG + the
  lone SSR endpoint.
- **Harder / to watch:** Astro's ecosystem moves fast, so third-party integration APIs must be verified
  against current docs before first use (per `AGENTS.md`). Node version floor (`^22.12.0 || ^24.0.0`) must
  be met by CI and the deploy target.
- **Security pins to honor (from research brief):** prefer `tsc --noEmit` over `@astrojs/check` (the latter
  pulls a `yaml` transitive vulnerable to CVE-2026-33532); pin `@astrojs/node@9.5.3+` for the contact
  endpoint (patches CVE-2026-25545 SSRF); pin `@astrojs/cloudflare@13.1.10+` only if that adapter is chosen
  (CVE-2026-41321). Run `pnpm audit --audit-level=high` as a build-blocking gate.

## Alternatives considered

- **Stay on Elder.js + Svelte 3** — rejected. Unmaintained, stale Svelte/Rollup, the migration mandate exists precisely to leave it.
- **Next.js / Nuxt** — rejected. Heavier React/Vue runtime for a near-static brochure site; worse default JS budget; SSG is a secondary mode rather than the default.
- **Eleventy (11ty)** — viable for pure static, but no first-class component islands or typed content collections, and the contact-form SSR story is less integrated than Astro's hybrid output.
- **SvelteKit** — keeps Svelte familiarity but is SSR-leaning, and the project's components are already proven not to need Svelte's reactivity.

_No open question for GATE 1 — the framework is fixed by the mission. GATE-1 decisions that depend on Astro
(routing model, rendering split, deploy target) are recorded in ADRs 0002, 0004, and 0005._
