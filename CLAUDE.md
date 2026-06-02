# CLAUDE.md

**This repo's working contract lives in [`AGENTS.md`](AGENTS.md) — read it first, end to end.** This file is only the Claude Code adapter; it does not restate the contract. Your global `~/.claude/CLAUDE.md` (personal preferences) still applies on top of it.

## Quick start (the must-knows)

- **Mission**: rebuild `dedede.ro` (a Romanian pest-control marketing site) from Elder.js + Svelte into **Astro 6.x**, with strict **visual + functional + SEO parity** to the live site. Delivery is **PR-only**; a human reviews and deploys.
- **Branch**: work on `feat/astro-rebuild` (off `main`). **Never commit, push, or merge without an explicit human go-ahead at each gate.** Summarize changes and propose a commit message instead.
- **Package manager**: **`pnpm`** only — never `npm`/`yarn`, prefer it over `npx`. Pin every dependency to an exact version and security-vet it before adding.
- **Source of truth**: **`/livesite`** (gitignored FTP snapshot of production) is authoritative for content, markup, meta, and assets. It contains **secrets** (`env.php`, `php_errorlog`) — read content, **never read or print secret values**, never copy them into the repo, never modify `/livesite`.
- **Before declaring anything done**: run `pnpm verify` _(Phase-4-pending — the full gate becomes runnable only after the Astro scaffold exists; until then the verify orchestrator scaffold under `scripts/` is the only runnable piece)_. The full Definition of Done is the parity oracle in `AGENTS.md`.
- **Phase 0 (now)**: produce harness docs + the verify orchestrator only. Do NOT create `package.json`, install deps, scaffold Astro, add config files, or run git. The Astro scaffold lands in **Phase 4, after Gate 1**.
- **Windows-first / PowerShell**: no bashisms in committed scripts; `$null` not `/dev/null`, `$env:VAR` not `$VAR`. Use absolute paths in tool calls.

## Where to look next

- `AGENTS.md` — the full contract (precedence, non-negotiables, gates, parity oracle, skill index).
- `CODING_PRINCIPLES.md` / `CONTEXT.md` / `docs/adr/` — Phase-0 drafts that exist now (ADRs: 0001 Accepted, 0002–0005 Proposed pending GATE 1); they deepen in later phases. `parity/` is created in Phase 4 — do not assume it exists yet.
- Skills available: `grill-with-docs`, `tdd`, `diagnose`, `handoff`, `improve-codebase-architecture` (see the skill index in `AGENTS.md`). This repo does **not** use OpenSpec or a Perplexity skill — do not invoke them.
