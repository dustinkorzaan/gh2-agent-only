# Copilot instructions

Read `AGENTS.md` first. It has the stack, the rules and the one check command
(`scripts/verify.sh`).

## Story PRs follow the story agents

Stories start in the repo's **Agents** tab: a new task with the `discover`
agent, where the prompt is the story. There are no issues in this repo.

A PR whose branch adds a spec under `docs/specs/` (not `_template.md`) is a
**story PR**. On a story PR, every session follows the matching definition in
`.github/agents/`, even when this session wasn't started with that agent
selected:

1. Run `git fetch origin main` (the checkout may be shallow), then find the spec:
   `git diff --name-only --diff-filter=A origin/main...HEAD -- docs/specs/`.
2. Read its `## Progress` checklist and Review log.
3. Before the spec's Progress shows `Approved`, follow
   `.github/agents/discover.agent.md`. After it, follow
   `.github/agents/deliver.agent.md`, whose preflight needs a verified human
   approval and a separate, explicit start; if either is missing, stop and ask.

**Never write code on a story PR before an authenticated human has approved
the spec** and explicitly started delivery.

## Every session

- Push progress after each step; a session can be stopped at any time.
- You can't create or edit PRs (no GitHub credentials); don't try `gh pr`.
  On a story branch, the `Story PR` workflow opens the PR and copies the
  spec's `## PR description` block into it on every push.
- Run `scripts/verify.sh` before you finish. "Done" means `--all` is green.
