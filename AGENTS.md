# Repository guidance for all agents

This file is the single source of truth for any AI agent working in this repo (Claude Code, Codex, Cursor, Gemini and others). Tool-specific files such as `CLAUDE.md` only add notes for that tool.

## Reading order (every session)

1. This file.
2. `docs/agent/session-resume.md`: what was in progress and the next step.
3. `CONTEXT.md`: domain words (Romanian), route map, what must not change.
4. The active change in `openspec/changes/`, if there is one.

## Precedence

1. What the owner says in the current conversation.
2. This file.
3. `openspec/` specs and the active change.
4. Config files (`eslint.config.js`, `.prettierrc`, `tsconfig.json`).
5. Tool-specific files.

When two sources disagree, follow the higher one and tell the owner about the conflict.

## Project identity

dedede.ro is a small Romanian brochure site for a pest-control company in Bucharest: nine pages, three articles, one contact form. It is built with Astro as static HTML and hosted on SiteGround shared hosting (Apache + PHP). The site earns its keep through Google Ads traffic landing on `/contact/`, so the contact page and its form matter most.

## Non-negotiables

1. **The owner owns git.** Never commit, push, stage, stash or rewrite history. Finish the work, summarise it, and suggest a commit message that passes `pnpm exec commitlint`. Remind the owner to run `/simplify` before committing.
2. **Never bypass hooks** (`--no-verify` and friends).
3. **Never read or print secret values.** `env.php`, `.env*` and anything under `_backup/` may hold credentials. Variable names are fine; values are not. Nothing from `_backup/` is ever copied into tracked files.
4. **Ask before deleting or moving files** that you did not create in the current task.
5. **Keep the dependency list small.** Adding a package needs a reason a few lines of code cannot meet. The site has one runtime dependency: `astro`.
6. **No untested behaviour.** Logic, the contact endpoint and browser behaviour are built test-first: write the failing test, make it pass, tidy up.
7. **Visible content, URLs and design do not change** unless the owner asks for that change. The markup in `src/pages/` and `src/components/` deliberately mirrors the original site.
8. **The contact endpoint never executes, concatenates into SQL, or prints unescaped anything that came from a request.**

## Workflow menu

Every code change goes through OpenSpec. Typo fixes, dependency bumps and formatting may skip it.

| Situation                          | Use                                                        |
| ---------------------------------- | ---------------------------------------------------------- |
| Unclear idea, want to think first  | `/opsx:explore`                                            |
| Start a change                     | `/opsx:new` (or `/opsx:ff` to draft all artifacts at once) |
| Implement                          | `/opsx:apply`                                              |
| Check the result against the specs | `/opsx:verify`                                             |
| Finish                             | `/opsx:archive`                                            |

Codex and other tools without slash commands use the matching skills in `.agents/skills/`.

## Quality gates

Before saying a task is done:

- `pnpm verify` passes with zero errors and zero warnings (ESLint, `astro check`, Prettier).
- `pnpm test` passes (build + unit tests; the endpoint tests need Docker running).
- `pnpm test:e2e` passes when pages, scripts or styles changed.
- You looked at neighbouring code for regressions and at `git status` for stray files.

If a check cannot run, say which one and why. Do not describe unverified work as done.

## Writing content

- Articles: add a Markdown file to `src/content/articole/`. The file name is the URL. The schema in `src/content.config.ts` lists the required front matter.
- Page text lives in the `.astro` files under `src/pages/`.
- Site-wide text (menu, footer, phone number) lives in `src/components/`.

## State and handoff

- `docs/agent/session-resume.md` is a living file. Update it after every completed step, so a session that is cut off can be resumed by a fresh agent.
- On a handoff, before a manual compaction, or after a major piece of work, also write a dated snapshot in `docs/state/` (see `docs/state/README.md`). Snapshots are never edited afterwards.
- `docs/agent/change-log.md` records milestones, retrospectives and every `/simplify` run with its base and end point.

## Conversation conventions

- Explain decisions and trade-offs, more for backend, hosting and tooling than for front-end work.
- Present two or more options as a comparison, recommended option first.
- No emojis in replies. Windows is the development machine: PowerShell is the primary shell, paths use `G:\_Projects\DDD`.
- Suggested commit messages follow Conventional Commits and contain no double quotes or backticks.

## Pointers

- Deploy and server setup: `DEPLOY.md`
- Domain glossary and routes: `CONTEXT.md`
- Specs: `openspec/specs/`
