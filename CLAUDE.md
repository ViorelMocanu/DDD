# Claude Code notes

Read `AGENTS.md` first. It is the contract for every agent in this repo; this file only adds what is specific to Claude Code.

@AGENTS.md

## Session start

1. Read `docs/agent/session-resume.md` and continue from its "Next step" unless the owner asks for something else.
2. Check `git status` so you know what is already in the working tree.

## Claude-specific notes

- OpenSpec commands are available as `/opsx:*`. The matching skills live in `.claude/skills/`.
- `.claude/settings.json` denies reading and editing `.env*` and `env.php`. Do not work around it.
- `/simplify` covers everything changed since the last run recorded in `docs/agent/change-log.md`, committed or not. Record the new base and end point there after each run.
- The endpoint tests start PHP in Docker. If Docker is not running they are skipped: say so in your report.

## After a context compaction

Tell the owner it happened, re-read `docs/agent/session-resume.md`, and if it does not cover the lost work, write a snapshot in `docs/state/` saying what is uncertain.
