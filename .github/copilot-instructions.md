# Copilot instructions

Read `AGENTS.md` first. It has the stack, the rules and the one check command
(`scripts/verify.sh`).

## Pick the role you were started as

If this session was started with a **specific agent selected** (a specialist
such as `architect`, `peer-reviewer`, `qa`, …), follow that role. The routing
convention below **never overrides an explicitly chosen agent** — in
particular, a read-only reviewer stays read-only.

For **general maintenance** — a direct task from a human that is not a story (docs,
tooling, a one-off fix) — just do the task. There is no phase gate to clear.

## Story PRs follow the story agents

Stories start in the repo's **Agents** tab: a new task with the `discover`
agent, where the prompt is the story. There are no issues in this repo.

A PR whose branch adds a spec under `docs/specs/` (not `_template.md`) is a
**story PR**. On a story PR, a session that was started generically follows the
matching definition in `.github/agents/` by **reading it** — routing is a
convention you apply, not a native parser, router or model selector:

1. Run `git fetch origin main` (the checkout may be shallow), then find the spec:
   `git diff --name-only --diff-filter=A origin/main...HEAD -- docs/specs/`.
2. Read its `## Progress` checklist and Review log as a **resume hint** only —
   they tell you which phase to pick up, not whether the spec was approved.
3. Route by phase: before approval, follow `discover`; after a verified approval
   **and** a separate explicit delivery start, follow `deliver`. Do not infer
   approval from a ticked `Approved` checkbox, `author_association`, or a mention.
   Approval is a PR comment `@copilot approved <full-head-sha>` from an
   authenticated human with current write/maintain/admin permission (confirm the
   permission; bots never approve), posted after the last change to the spec's
   **Approved scope**. If the approval comment, the permission evidence, or the
   separate start is missing, or the Approved scope changed after it, stay in
   discovery and **ask** — never start implementation.
4. Check the recorded Risk tier before delivery. `high` (auth/authorization,
   destructive migration, production deploy) is excluded from the pilot: stop and
   request a separate human risk decision; approval and a start alone never
   authorize it.

A coordinator may **transcribe** a verified approval/start event into the spec's
Approval record (recording metadata is not granting approval), but production or
test edits stay prohibited until both are verified. Any claim that a specific
(e.g. higher-capability) model handled a session is **unverified** unless a human
confirms it out of band.

**Never write code on a story PR before you have verified that an authenticated
human with write access approved the current Approved scope** and explicitly
started delivery.

## Single-session delivery fallback

Where agent-to-agent handoff isn't available, the `deliver` coordinator carries
the `test-author` and `implementer` responsibilities **sequentially in its own
session** (acceptance tests first, then code), by following those definitions.
Label this accurately as a convention — **not** independent sessions or models.
Keep **peer review** a separate session; keep **QA** separate where possible and
disclose it if QA shares the delivery session.

## Lifecycle commands (requests, not a parser)

Each command is a human request a session acts on by reading these instructions;
there is no command parser or external orchestrator.

- **`approved <full-head-sha>`** — a PR comment that approves the current Approved
  scope at that commit. Record the linked human event in the Approval record; do
  not fabricate one.
- **`deliver`** — the separate, explicit start of delivery for an already-approved
  spec.
- **`rework <candidate-sha>: <findings>`** — fix **within the same** Approved scope.
  Scope is preserved, but the fix invalidates prior checks; re-run the affected
  gates on the new candidate.
- **`revise: <change>`** — change the scope. This returns to discovery and **voids
  approval**: it needs a fresh `approved` comment **and** a new start.
- **`continue`** — resume a stopped session. Re-verify approval and the start
  **before** writing any code.
- **`sync`** — bring `origin/main` in with a **merge commit** (never rebase, amend
  or force-push), then re-run checks and reviews; no `--light` or bypass.
- **`stop`** — wind down. In-flight cancellation is **not guaranteed**; confirm the
  session actually stopped.

## Every session

- Push progress after each step; a session can be stopped at any time.
- You can't create or edit PRs (no GitHub credentials); don't try `gh pr`.
  On a story branch, the `Story PR` workflow opens the PR and copies the
  spec's `## PR description` block into it on every push.
- Run `scripts/verify.sh` before you finish. "Done" means `--all` is green.
