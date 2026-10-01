# gh

User stories are delivered by one GitHub Copilot cloud agent, **`ship`**
(`.github/agents/ship.agent.md`). Within one session it plans, waits for your
approval, then writes acceptance tests, implements, verifies, peer-reviews and
final-reviews (up to 3 rounds each) until the PR is ready for your review. You
squash-merge.

No PAT, issues or extra secrets are needed: every session starts from
something you do in the **Agents** tab or a PR comment.

## Start a story: next, next, done

1. **Start:** open the repo's **Agents** tab
   (`https://github.com/<owner>/<repo>/agents`), pick the **`ship`** agent,
   type the story (template below) and start the task. Copilot opens a draft
   `[Story] …` PR with the spec, then stops with questions or
   **Plan ready for approval**.
2. **Approve:** read the spec in the PR's *Files changed*, then comment
   `@copilot approved` on the PR (or `@copilot answers: 1) … 2) …` if it
   asked something). The whole loop runs.
3. **Done:** when the PR description says **✅ Ready for human review**,
   review it and **Squash and merge**.

### Story prompt

Paste this into the Agents tab and fill it in. Only the first line is
required; the agent proposes acceptance criteria if you leave them out.

```
Story: <what you want, for whom, and why>

Acceptance criteria:
- <given … when … then …>

Areas: ui / api / infra
Out of scope: <…>
Constraints: <auth scopes, schema, blob/SAS, …>
Flags: --quick (small single-area change) | --hands-off (no questions, no approval wait)
```

## Commands

| When | Where | What you do |
|---|---|---|
| **Start** (plan and interview) | **Agents** tab, agent **`ship`** | Type the story. Flags in the prompt: `--quick`, `--hands-off` |
| **Answer** (only if it asked) | PR comment | `@copilot answers: 1) … 2) …` |
| **Approve** | PR comment | `@copilot approved` or `@copilot approved, but <tweak>`. The rest of the loop runs in this session |
| **Continue** (session stopped, e.g. around an hour) | PR comment | `@copilot continue` |
| **Sync** (after another PR merged into `main`) | PR comment | `@copilot sync`, or `@copilot sync --light` to skip the overlap scan and re-review on a clean merge |
| **Rework** (fixes within the approved scope, or CI red) | Review comments, then a PR comment | `@copilot rework` |
| **Revise** (change what the story does, same PR) | PR comment | `@copilot revise: <new or changed behaviour>`. Updates the spec's acceptance criteria, waits for `@copilot approved`, then reruns the loop for the changes |
| **Merge** | PR | **Squash and merge** (only you; agents never merge) |

```
Agents tab → agent "ship" → story       start: plan / interview
@copilot answers: …                    answer interview questions
@copilot approved                      go: runs the full loop
@copilot continue                      resume after a pause
@copilot sync                          bring in main after other merges
@copilot sync --light                  same, skips overlap scan/re-review
@copilot rework                        fix your review comments / red CI
@copilot revise: …                     change the story; then approve again
Squash and merge                       you, after final review
```

All `@copilot` commands go on the **PR**, not anywhere else.

When the agent hands over, the PR description starts with
**✅ Ready for human review**, or **⚠️ Needs triage** if a gate hit its
3-round cap (details under *Open issues* in the spec).

With several story PRs open, merge them one at a time and `@copilot sync` the
next one after each merge.

## How it fits together

| File | Purpose |
|---|---|
| `.github/agents/ship.agent.md` | The agent: phases, commands, hard rules |
| `docs/agents/*.md` | Checklists for each phase: planner, test-author, implementer, peer-reviewer, final-reviewer, sync |
| `.github/copilot-instructions.md` | Makes every `@copilot` session on a story PR follow `ship` |
| `AGENTS.md` | Stack, git policy, rules |
| `.github/instructions/*.instructions.md` | UI and API conventions |
| `REVIEW.md` | Review checklist |
| `docs/specs/` | One spec per story (`YYYY-MM-DD-<slug>.md`) with your story prompt copied in; its **Progress** checklist is how sessions resume |
| `scripts/verify.sh` | The one check command; same checks as CI |
| `.github/workflows/copilot-setup-steps.yml` | Installs Node, .NET and dependencies for the agent |
| `.github/workflows/ci-*.yml`, `e2e-playwright.yml`, `codeql.yml` | CI |

## One-time repo settings

1. **Settings → Copilot → Cloud agent:** enabled for this repo, and
   **Require approval for workflow runs** off (otherwise CI waits for an
   "Approve and run" click every push).
2. **Settings → General → Pull Requests:** squash merging only, and
   optionally *Automatically delete head branches*.
3. **Settings → Actions → General → Workflow permissions:** read-only, and
   *Allow GitHub Actions to create and approve pull requests* unticked.
4. Issues can stay **off**; nothing here uses them.
