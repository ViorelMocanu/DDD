# 07 — Test plan, parity-harness wiring, DoD gates

> **This group is owned inline by the spine, not by a standalone appendix.**
> See [`docs/IMPLEMENTATION-PLAN.md`](../IMPLEMENTATION-PLAN.md) **Group G (Task 38)** plus the test tasks
> distributed through the plan:
>
> - Unit (Vitest): schema + `getStaticPaths` allow-list + helpers — **Task 23**; contact endpoint — **Tasks 30–31**; approved-fixes assertions — **Tasks 34–37**.
> - E2E (Playwright): contact — **Task 33**; global behaviours (nav/dark-mode/back-to-top) + per-route meta/a11y + approved-fixes — **Task 38**.
> - Visual parity: the `parity/tools/` harness (`capture-baseline.mjs` → `diff-screens.mjs`, threshold `0.001`) run against `astro preview` — **Task 38**.
> - a11y: `@axe-core/playwright` no-new-serious (only the homepage `.Highlight` contrast violation may disappear) — **Task 38**.
> - Lighthouse ≥ live: `@lhci/cli` + `lighthouserc.cjs` — **Task 38**.
> - SEO/meta + sitemap + robots + manifest diff vs `parity/baseline/` accounting for the WAIVERS — **Task 38**.
> - Gate orchestration: `scripts/run-verify.mjs` (already exists) chains prettier → eslint → typecheck → vitest → playwright; `pnpm audit` + `lhci` run alongside.
>
> The Phase-3 section-author for this file did not emit it; the synthesizer compensated by owning the
> group in the spine. The DoD→task map is in the spine's "Test & DoD gate" table. Authoritative spec for
> the oracle: [`parity/SPEC.md`](../../parity/SPEC.md) §10; deviation classification: [`parity/WAIVERS.md`](../../parity/WAIVERS.md).
