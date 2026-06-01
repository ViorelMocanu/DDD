# 02 — Layout, Head engine, Components, Styles, script.js

> **This group is owned inline by the spine, not by a standalone appendix.**
> See [`docs/IMPLEMENTATION-PLAN.md`](../IMPLEMENTATION-PLAN.md) **Group B (Tasks 14–21)** for the full,
> code-complete tasks:
>
> - Task 14 — copy legacy assets byte-for-byte into `public/`
> - Task 15 — `src/styles/tokens.scss` + `global.scss` (ported from legacy `style.scss`)
> - Task 16 — `src/utils/formatDate.ts`  ·  Task 17 — `src/utils/readingTime.ts` (bodies cross-linked from [`04-articles-collection.md`](04-articles-collection.md) Tasks 3–4)
> - Task 18 — `src/components/BaseHead.astro` — **the meta engine** (full code inline; WAIVER-SEO-01..04 baked in)
> - Task 19 — `DeHeader.astro` + `DeFooter.astro`
> - Task 20 — `src/layouts/BaseLayout.astro` (analytics gate + dark-mode no-flash inline script)
> - Task 21 — `public/resources/script.js` (7 behaviours; POST → `/api/contact`; UTM bug fix)
>
> The Phase-3 section-author for this file did not emit it; the synthesizer compensated by owning the
> group in the spine. The authoritative source for these tasks is the spine. The legacy sources to read
> during implementation: `parity/baseline/html/index.html`, `parity/baseline/meta/*.json`,
> `livesite/resources/script.js`, and the legacy `src/layouts/Layout.svelte` + `src/components/*.svelte`.
