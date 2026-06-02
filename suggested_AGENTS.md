# AGENTS.md — Universal Agent Contract

> Read this first, every session. This file is the cross-tool contract for any AI agent working in this repository (Claude, Cursor, GitHub Copilot, Codex, Gemini, future tools). Tool-specific adapters (`CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `.github/copilot-instructions.md`) delegate to this file rather than restate it.

## How to use this file

1. **First**: Read this file end-to-end on session start.
2. **Second**: Read [`CODING_PRINCIPLES.md`](CODING_PRINCIPLES.md) for the full coding standards (this contract cherry-picks essentials but does not replace it).
3. **Third (when resuming)**: Read [`docs/agent/session-resume.md`](docs/agent/session-resume.md) for handoff state from the previous session.
4. **Then**: proceed to the user's task. If the task is non-trivial, follow the OpenSpec workflow below before writing code.

If a tool-specific behavior matters (Windows command resolution for Claude, Cursor MDC scopes, Copilot prompt prefacing), check the corresponding adapter for tool-only glue. Project-wide rules live here.

---

## Precedence

When instructions conflict, follow this order (highest first):

1. **The user's explicit instruction** in the current conversation
2. **An active OpenSpec change's artifacts** under `openspec/changes/<name>/` (proposal, design, specs, tasks)
3. **`openspec/config.yaml`** — project-tailored OpenSpec workflow rules
4. **This `AGENTS.md`** — the cross-tool contract
5. **`CODING_PRINCIPLES.md`** — the deep standards
6. **Tool-specific adapters** (`CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `.github/copilot-instructions.md`) — only the tool-specific bits they own
7. **Tool defaults**

Lower-precedence rules never override higher-precedence ones. When in doubt, ask the user.

---

## Project Identity

**`viorelmocanu.ro`** is the personal site of Viorel Mocanu — a bilingual Romanian / English (RO / EN) Astro site replacing the original WordPress site at `https://www.viorelmocanu.ro`. It is content-heavy with a long content roadmap: blog, articles, services, case studies, tools, guides, webinars, newsletters, advertisers, courses, tags, categories.

- **Tech stack**: Astro 6.x, TypeScript (strict), SCSS, MDX, Vitest, Playwright. Cloudflare Workers via `@astrojs/cloudflare`. Pagefind, PostHog, Resend, Turnstile, RSS, sitemap, image processing, content collection schemas.
- **Architecture**: SSG-first. Server islands and SSR are allowed only when no elegant static solution exists (e.g., contact form via server actions).
- **Deploy target**: Cloudflare Workers (production). Local dev via `pnpm dev` (Astro), `pnpm preview` (Astro preview), or `pnpm wrangler:dev` for Worker-realistic preview.
- **Solo developer**: Viorel Mocanu. No multi-developer coordination overhead is needed; ergonomic and low-maintenance choices win against ceremonial ones.

---

## Non-Negotiables

These are absolute. Violating them is never acceptable without explicit user override.

1. **Never `git commit` or `git push` without explicit user request.** The user owns all commits and pushes. After completing work, summarize what changed and propose a commit message; do not execute.
2. **Never bypass hooks** (`--no-verify`, `--no-gpg-sign`, etc.) unless the user explicitly asks. If a hook fails, fix the underlying cause.
3. **Never commit secrets, credentials, tokens, or unredacted personal data** to the repository. If you spot one in a diff, flag it immediately.
4. **`pnpm` is the package manager.** Never use `npm` or `yarn`. Prefer `pnpm` over `npx` for invoking dependencies (`pnpm exec ...` or direct `pnpm <script>`).
5. **Run verification before declaring work done.** At minimum `pnpm verify:fix` (lint + typecheck + format + Astro check). For non-trivial changes, also `pnpm test` (Vitest + Playwright) and `pnpm run preview` for a smoke check.
6. **Preserve user changes.** Before destructive operations on the working tree (delete, force-overwrite, reset --hard), ask. If unfamiliar files, branches, or configs appear, investigate before deleting.
7. **No `@ts-ignore`, no `any` casts, no `(x as any)`, no `var`, no `console.*` in production code.** Use `unknown` + narrowing, explicit return types, `const`/`let`, proper logger / `safePostHogCapture*`.
8. **Verify third-party API signatures against current docs before first use.** Especially for Astro ecosystem integrations (`astro-pagefind`, `@astrojs/sitemap`, `@astrojs/rss`, `@astrojs/cloudflare`, Resend, PostHog, Cloudflare Workers APIs). Use the **`perplexity-search`** skill or context7 MCP to confirm options exist; do not guess.
9. **Never use `return new Response(...)` inside non-page Astro components.** Causes `ResponseSentError` during SSG prerendering. Use `throw new Error(...)` instead and let the error boundary handle it. `return new Response(...)` is only valid in page-level routes (`src/pages/**`) or API routes.
10. **Mark task completion immediately when verified, not retroactively.** Avoid the "I'll mark them all done at the end" anti-pattern; it loses information about what was actually checked.

### Windows-first development

This project is developed on **Windows 11** unless the user explicitly states otherwise. Agents must default to Windows-friendly commands at all times:

- **Use `pnpm` (not `npm` or `npx`) for all package operations.** It works identically on Windows.
- **For shell commands, prefer Bash syntax via Git Bash** (the default for the Bash tool in Claude Code on Windows) — Unix-style paths (`/c/...` or forward slashes) are usually accepted by the underlying tools.
- **PowerShell is available** when Bash chokes on a Windows-specific operation (file moves on locked files, `taskkill` for process management, registry, services). Use the dedicated PowerShell tool in agents that have it.
- **Avoid Bash idioms that don't translate**: do not assume `rm -rf` cleans `node_modules` (PowerShell `Remove-Item -Recurse -Force` is more reliable for locked files); use `taskkill //F //PID <id>` (Bash) or `Stop-Process -Force` (PowerShell) over `kill -9`; use `cmd /c npx ...` if `npx` resolution fails for `.cmd` shims.
- **Path separators**: use forward slashes in Bash and source code; backslashes when invoking Windows tools directly.
- **Long-running file operations** (renames, deletes inside `.git`-tracked dirs) sometimes fail with "Permission denied" on Windows due to file locking. Retry with PowerShell `Move-Item -Force`.

---

## OpenSpec Workflow

This repository uses [OpenSpec](https://github.com/fission-ai/openspec) for spec-driven development. **All non-trivial code changes must go through the OpenSpec artifact workflow.**

### When to use OpenSpec

- **Use OpenSpec for any non-trivial change**: new features, refactors, cross-cutting infrastructure, anything touching multiple files or capabilities.
- **Skip OpenSpec for trivial changes**: typo fixes, single-line bug fixes, dependency-version bumps, formatting-only edits.
- If unsure, default to OpenSpec — the workflow itself is fast for simple changes via `/opsx-propose` (one-shot generation).

### Slash command vocabulary

The canonical form everywhere in documentation, prose, and skill descriptions is the **dash form** `/opsx-action`. It works in every supported tool (Claude Code, Cursor, GitHub Copilot, Gemini CLI, Codex). Claude Code additionally accepts the colon shortcut `/opsx:action` as a tool-specific alias — that form is not the canonical reference and should not appear in universal documentation.

The legacy `/openspec-action` form (e.g., `/openspec-explore`) remains a recognized alias indefinitely; skill descriptions list it for backward muscle-memory matching.

### Standard cycle

| Command                 | Purpose                                                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `/opsx-explore <topic>` | Think through a problem before committing to a change. No code, no artifacts; thinking partner mode. Ends with an offer to start a change.     |
| `/opsx-grillme <topic>` | Stress-test a plan or design by interview. Resolve every branch of the decision tree before writing artifacts. Use when option space is broad. |
| `/opsx-propose <name>`  | One-shot: scaffold a change AND generate proposal + design + specs + tasks in a single pass. Best when the design is already settled.          |
| `/opsx-new <name>`      | Step-through alternative: scaffold a change with checkpoint between each artifact (proposal → specs → design → tasks).                         |
| `/opsx-ff <name>`       | Middle ground: fast-forward through artifacts with light narration.                                                                            |
| `/opsx-continue <name>` | Resume after a pause; create the next ready artifact.                                                                                          |
| `/opsx-apply <name>`    | Implement the tasks from the change. Walks through `tasks.md` checkboxes.                                                                      |
| `/opsx-verify <name>`   | Validate that implementation matches the change's specs before archiving.                                                                      |
| `/opsx-sync <name>`     | Sync delta specs from a change into main `openspec/specs/` without archiving.                                                                  |
| `/opsx-archive <name>`  | Move a completed change to `openspec/changes/archive/<YYYY-MM-DD>-<phase>-<name>/`. The dated prefix is added automatically at archive time.   |
| `/opsx-bulk-archive`    | Archive multiple completed changes at once with conflict resolution.                                                                           |
| `/opsx-onboard`         | Guided tutorial through a complete OpenSpec workflow cycle.                                                                                    |

### In-progress vs archived change naming

- **In-progress**: `openspec/changes/phase-<N>-<slug>/` (e.g., `openspec/changes/phase-11-improve-agentic-harness/`). The OpenSpec CLI rejects names starting with a digit, so the date prefix is omitted while in-progress.
- **Archived**: `openspec/changes/archive/<YYYY-MM-DD>-phase-<N>-<slug>/`. The full dated convention matches existing archives like `2026-03-06-phase-10-code-quality`. The date prefix is added automatically by `/opsx-archive`.

### Spec writing rules (excerpt from `openspec/config.yaml`)

- Write requirements as outcome-based statements (`GIVEN/WHEN/THEN`), **not** mechanism-based. Describe _what_ should happen, not _how_ to implement it.
- Use `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`, `## RENAMED Requirements` headers for delta operations.
- Each requirement: `### Requirement: <name>` followed by SHALL/MUST normative language.
- Each scenario: `#### Scenario: <name>` (exactly 4 hashtags) with WHEN/THEN bullets.
- Spec folders use `domain--name` semantic taxonomy with double-dash separators (e.g., `agentic-harness--sync`, `seo--semantic-sitemaps`, `analytics--setup`).
- Suggested mechanisms in design.md should be labeled "Suggested approach (verify API)" — not hard requirements.

For the full schema, read [`openspec/config.yaml`](openspec/config.yaml).

---

## i18n Invariants

The `viorelmocanu.ro` site is bilingual RO / EN. The i18n architecture is **routes-first**, and these invariants are load-bearing — break them and the site breaks.

1. **`src/i18n/ui.ts` is the single source of truth for URLs and UI text.** Never hardcode `/en/...` paths or RO strings outside this dictionary.
2. **Use `translateUrl(lang)(keyOrRoSlug)`** to produce locale-aware URLs. Never construct `/en/<x>` by string concatenation.
3. **Use `useTranslations(lang)(key)`** for labels, titles, meta. Never inline raw strings in components.
4. **Default locale is RO** (`"ro"`). Source files (`.mdx` content) use Romanian slugs. English variants live under `/en/...` with translated slugs (e.g., `/blog/ai/` ↔ `/en/blog/artificial-intelligence/`).
5. **Trailing slashes are mandatory** and enforced by `translateUrl`.
6. **Composite keys** for menu submenu items: `nav.{key}.template`.
7. **Globally unique semantic slugs**: English slugs are individually translated, never `ro-slug-en` magic-suffixed. The build-time `slug-guard` (`src/utils/slug-guard.js`) explicitly fails the build on duplicate identical slugs across locales.
8. **`buildMenu`** in `src/i18n/utils.ts` produces locale-aware navigation — use it for nav rendering, do not duplicate the logic.
9. **Always check `src/i18n/ui.ts` before creating a new page.** If a route maps to `privacy`, the file is `privacy.astro`, not `privacy-policy.astro`. New pages require a corresponding entry in `ui.ts`.

For the deeper guide, read [`docs/guides/bilingual-i18n-navigation.md`](docs/guides/bilingual-i18n-navigation.md).

---

## Astro Invariants

Astro 6.x + Cloudflare Workers + TypeScript strict has specific gotchas. These come up regularly:

1. **SSG by default.** Pages, components, and utilities should assume static generation. Server islands and SSR routes are explicit opt-ins documented in design artifacts.
2. **`return new Response(...)` rule** — see Non-Negotiable #9 above. **API routes** (`src/pages/**/*.ts`) and **server actions** (`src/actions/**`) MAY use `return new Response(...)` — they are server-side by definition.
3. **Verify third-party APIs against current docs before first use** — Astro ecosystem packages evolve quickly. Use `perplexity-search` skill or context7 MCP. Do not assume an option exists based on naming convention.
4. **Image optimization**: use `ResponsiveImage.astro` (or its underlying `<picture>` pattern) for content images. Cloudflare Images is the production transform via `@astrojs/cloudflare`.
5. **Pagefind**: built-in static search. To test search functionality use `pnpm build:search` (which copies the Pagefind index to `public/`), not `pnpm build`.
6. **Build budgets**: `scripts/check-budgets.js` runs after `pnpm build` and **fails the build** if HTML > 40 KB / CSS > 80 KB / JS > 30 KB. Respect them.
7. **`scripts/astro-with-retry.mjs`** wraps `astro check` and `astro sync` to handle Windows-flaky lockfile re-optimization. Use it (it's already wired into `pnpm verify`).
8. **Worker-side env**: secrets via Wrangler (`.dev.vars` locally, dashboard in production). Never inline secrets.

---

## Quality Gates

The project has a layered verification model. Run the right gate for the work you just did.

| Command                | What it covers                                                                      | When to run                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `pnpm verify:fix`      | Slug guard, format, lint fix, typecheck, Astro check (with auto-fix where possible) | After any code edit; fast loop. Pre-commit hook also runs this automatically. |
| `pnpm verify`          | Same as above but read-only (no auto-fix); fails on any issue                       | In CI; before declaring work done if you want a clean read                    |
| `pnpm build`           | Astro build + slug guard + `scripts/check-budgets.js`                               | After non-trivial code changes; verifies budgets and SSG output               |
| `pnpm build:search`    | `pnpm build` + Pagefind index copy to `public/`                                     | When you need to test search functionality locally                            |
| `pnpm build:timing`    | Build with timing instrumentation                                                   | Performance investigation                                                     |
| `pnpm test:unit`       | Vitest only                                                                         | Unit-level changes, fast iteration                                            |
| `pnpm test:e2e`        | Playwright only                                                                     | E2E behavior changes                                                          |
| `pnpm test`            | `pnpm verify && pnpm build && vitest run && playwright test` (full local gate)      | Pre-push hook runs this. Before a major commit.                               |
| `pnpm preview`         | Astro preview server                                                                | Smoke-test built site                                                         |
| `pnpm wrangler:dev`    | Cloudflare Worker local dev                                                         | Test Worker-specific behavior (server actions, headers, env)                  |
| `pnpm check:doc-links` | Validate relative links and machine-specific paths in markdown _(after Phase 11.7)_ | After editing docs/planning files; auto-runs in `verify`                      |
| `pnpm harness:check`   | Validate `.agents/` ↔ consumer-surface sync                                         | Auto-runs in `verify`                                                         |
| `pnpm harness:sync`    | Regenerate consumer surfaces from `.agents/`                                        | After editing `.agents/skills/`, `.agents/workflows/`, or `.agents/rules/`    |
| `pnpm harness:autofix` | Re-sync only drifted consumer-surface files                                         | Auto-runs in `verify:fix`; pre-commit transitively re-syncs                   |
| `pnpm harness:diff`    | Preview drift without writing                                                       | Sanity-check before sync                                                      |

**Hook chain (already configured):**

- **pre-commit**: runs `pnpm verify:fix` (auto-fixes lint/format and harness drift)
- **pre-push**: runs `pnpm test` (full gate including E2E)
- **CI** (`.github/workflows/`): runs `pnpm verify` (drift becomes a PR-blocking failure)

---

## Harness Map

The project's agentic harness — skills, workflows, slash commands, MCP servers, settings — is organized as follows:

```
                .agents/             .claude/             .cursor/             .github/
                (canonical)          (generated)          (generated)          (generated)
                ────────────         ────────────         ────────────         ────────────
skills/         hand-edited          fan-out target       fan-out target       fan-out target
workflows/      hand-edited          fan-out target       fan-out target       fan-out target
                                     (commands/opsx-*.md  (commands/opsx-*.md  (prompts/opsx-*.prompt.md)
                                      AND
                                      commands/opsx/*.md)
rules/          hand-edited          —                    rules/perplexity-    —
                                                          search.mdc generated
sync config:    .agents/sync-harness.config.json  *(authored in Phase 11.4)*
sync script:    scripts/sync-harness.mjs           *(authored in Phase 11.4)*
```

**Edit sources, not generated targets.** Edits to `.claude/skills/*`, `.cursor/skills/*`, `.github/skills/*`, `.claude/commands/*`, `.cursor/commands/*`, `.github/prompts/*`, or `.cursor/rules/perplexity-search.mdc` are overwritten by the next sync run. Make changes in `.agents/`, then `pnpm harness:sync` (or let pre-commit auto-sync via `pnpm verify:fix`).

**Adapter files** (this file's tool-specific cousins):

- [`CLAUDE.md`](CLAUDE.md) — Claude Code first-look adapter
- [`GEMINI.md`](GEMINI.md) — Gemini CLI first-look adapter
- [`.cursorrules`](.cursorrules) — Cursor first-look adapter
- [`.github/copilot-instructions.md`](.github/copilot-instructions.md) — GitHub Copilot first-look adapter
- **Codex** reads this file (`AGENTS.md`) natively per the `agents.md` convention; no separate adapter

**Other harness files**:

- [`CONTEXT.md`](CONTEXT.md) — The `/grill-with-docs` skill artefact, used to clarify glossary terms and concepts throughout all interactions and taxonomies
- [`.mcp.json`](.mcp.json) — Claude Code project MCP servers (`astro-docs`, `context7`, `playwright`)
- [`.claude/settings.json`](.claude/settings.json) — tracked shared Claude Code allowlist for safe pnpm/git commands
- [`docs/agent/session-resume.md`](docs/agent/session-resume.md) — handoff state from previous session
- [`docs/agent/mcp.md`](docs/agent/mcp.md) — which MCP file each tool reads

---

## Key Skills Callout

Among the many skills in `.agents/skills/`, three are load-bearing for everyday work and worth knowing by name:

### The OpenSpec cycle skills

The `openspec-*` family wraps the slash-command workflow. The most-used ones are `openspec-explore`, `openspec-new`, `openspec-propose`, `openspec-continue`, `openspec-apply`, `openspec-verify`, `openspec-archive`. These auto-invoke when you type the corresponding `/opsx-action` slash command, but they also fire on natural-language phrasings ("let's explore X", "start a change for Y", etc.).

### `openspec-grillme` (custom)

Your interview-the-user-into-clarity skill. Fires on `/opsx-grillme`, "grill me", "stress-test this plan", or when an option tree looks too broad. Walks down the decision tree one branch at a time, asking one question per turn with a recommended answer. Use this before committing to a non-trivial design.

### `grill-with-docs`

Matt Pocock's evolved grilling skill that also produces and updates `CONTEXT.md`, that documents glossary, taxonomies and concepts.

### `perplexity-search`

Live web search via Perplexity Pro MCP. Auto-applies to fast-moving ecosystems where training data is reliably stale within months: AI/LLM SDKs (LangChain, OpenAI SDK, Anthropic SDK, Vercel AI SDK, MCP SDK), cloud infra (AWS CDK, Terraform, Cloudflare Workers / Wrangler, Kubernetes operators), frontend frameworks (shadcn/ui, Tailwind CSS v4+, Astro 5+, Next.js App Router, React 19+), or any version-pinned recent release. Use `perplexity_verify_api`, `perplexity_changelog_lookup`, `perplexity_security_check`, `perplexity_debug_error`, etc., before generating integration code.

For the full skill catalog, browse `.agents/skills/`.

---

## Pointers to Deeper Documentation

When this contract is too thin for the task, follow these links rather than guessing:

| Need                                                                                           | Read                                                                                   |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Full coding standards (TypeScript, CSS/SCSS, accessibility, security, error handling patterns) | [`CODING_PRINCIPLES.md`](CODING_PRINCIPLES.md)                                         |
| Project roadmap, phase history, what's planned                                                 | [`docs/planning/IMPLEMENTATION_PLAN.md`](docs/planning/IMPLEMENTATION_PLAN.md)         |
| Completed phase history (frozen)                                                               | [`docs/planning/ARCHIVE.md`](docs/planning/ARCHIVE.md)                                 |
| Inline TODO tracking                                                                           | [`docs/planning/TODO_TRACKER.md`](docs/planning/TODO_TRACKER.md)                       |
| OpenSpec config rules (proposal/design/specs/tasks contracts)                                  | [`openspec/config.yaml`](openspec/config.yaml)                                         |
| Active OpenSpec changes                                                                        | `openspec/changes/phase-*-*/`                                                          |
| Domain-prefixed completed specs                                                                | `openspec/specs/<domain>--<name>/spec.md`                                              |
| Bilingual i18n architecture deep-dive                                                          | [`docs/guides/bilingual-i18n-navigation.md`](docs/guides/bilingual-i18n-navigation.md) |
| Performance metrics over time                                                                  | [`docs/planning/performance_log.md`](docs/planning/performance_log.md)                 |
| Security policy                                                                                | [`SECURITY.md`](SECURITY.md)                                                           |
| Contributor guide                                                                              | [`CONTRIBUTING.md`](CONTRIBUTING.md)                                                   |
| Tool-vs-MCP-file mapping                                                                       | [`docs/agent/mcp.md`](docs/agent/mcp.md)                                               |
| Last-session handoff                                                                           | [`docs/agent/session-resume.md`](docs/agent/session-resume.md)                         |
| Glossary of terms                                                                              | [`CONTEXT.md`](CONTEXT.md)                                                             |

---

## A note on this contract's lifecycle

This file is **hand-edited canonical**. It is not generated by any sync process and never will be. When project-wide rules change (a new non-negotiable, a precedence shift, an OpenSpec workflow update), edit this file once — the tool-specific adapters point here rather than duplicate.

If you find yourself wanting to add ~10+ lines of detail to this file, ask first whether the detail belongs in `CODING_PRINCIPLES.md` (deep standards), in `openspec/config.yaml` (workflow rules), in a tool-specific adapter (tool-only behavior), or in a deeper doc under `docs/`. This contract aims to stay readable in one sitting; targeted ~600-1000 lines, hard cap ~1500.
