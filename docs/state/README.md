# State snapshots

Dated, self-contained notes that let a fresh agent or the owner pick up work without the original conversation.

## When to write one

- Before a manual context compaction, and in the first turn after an automatic one that no snapshot covers.
- On a handoff to another agent or session.
- After a major piece of work, before handing back to the owner.

Day-to-day progress goes in `docs/agent/session-resume.md` instead, which is overwritten as work moves on.

## Rules

- File name: `YYYY-MM-DD-HHMM-<task-slug>.md`.
- Never edit or delete an old snapshot. Write a new one that says which it supersedes.
- No secrets, no personal data.

## Template

```markdown
# <task> (<date and time>)

Trigger: handoff | compaction | milestone Branch and HEAD: <branch> at <short sha>, working tree clean | dirty Supersedes: <file name or none>

## 1. Resume here

The single next action.

## 2. What is done

## 3. What is in progress

## 4. Decisions and why

## 5. Open questions for the owner

## 6. How to verify
```
