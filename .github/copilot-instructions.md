# Copilot instructions

Read `AGENTS.md` first. It has the stack, the rules and the one check command
(`scripts/verify.sh`).

## Story PRs follow the ship agent

Stories start in the repo's **Agents** tab: a new task with the `ship` agent,
where the prompt is the story. There are no issues in this repo.

A PR whose branch adds a spec under `docs/specs/` (not `_template.md`) is a
**story PR**. On a story PR, every session follows
`.github/agents/ship.agent.md`, even when this session wasn't started with the
`ship` agent selected:

1. Run `git fetch origin main` (the checkout may be shallow), then find the spec:
   `git diff --name-only --diff-filter=A origin/main...HEAD -- docs/specs/`.
2. Read its `## Progress` checklist and Review log.
3. Treat the message that started this session (a PR comment or a
   follow-up typed in the Agents tab chat, with or without `@copilot`) as a
   ship command: `answers: ...`, `approved` (optionally with answers or
   `but <tweak>`), `continue`, `sync`, `sync --light`, `rework`,
   `revise: ...`. Anything else is a request within the current phase.
4. Follow the matching section of `.github/agents/ship.agent.md`.

**Never write code on a story PR before the spec's Progress shows
`Approved`** (or the spec's Mode is `hands-off`).

## Every session

- Push progress after each step; a session can be stopped at any time.
- You can't create or edit PRs (no GitHub credentials); don't try `gh pr`.
  On a story branch, the `Story PR` workflow opens the PR and copies the
  spec's `## PR description` block into it on every push.
- Run `scripts/verify.sh` before you finish. "Done" means `--all` is green.
