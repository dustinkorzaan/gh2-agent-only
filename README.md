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
   type the story (template below) and start the task. Copilot pushes the
   spec, the `Story PR` workflow opens a draft `[Story] …` PR for it, and
   Copilot stops with questions or **Plan ready for approval** in the PR
   description.
2. **Approve:** read the spec in the PR's *Files changed*, then reply
   `approved`, either in the story's Agents chat or as a PR comment
   (`@copilot approved`). If it asked questions, each has a recommended
   answer: plain `approved` accepts them all, or reply
   `approved, 1) b 2) <text>` to answer and approve in one go. The whole
   loop runs.
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

Reply in **either** place: the story's chat in the **Agents** tab, or a
comment on its PR (there, start with `@copilot`). Both start the next
session the same way.

| When | What you type |
|---|---|
| **Start** (plan and interview) | New task in the **Agents** tab, agent **`ship`**, prompt = the story. Flags: `--quick`, `--hands-off` |
| **Approve** | `approved`: accepts the recommended answers to any questions and builds |
| **Approve with answers** | `approved, 1) b 2) <text>`: your answers, then builds |
| **Approve with a tweak** | `approved, but <tweak>` |
| **Answer only** (want to see the updated plan first) | `answers: 1) b 2) <text>` |
| **Continue** (session stopped, e.g. around an hour) | `continue` |
| **Sync** (after another PR merged into `main`) | `sync`, or `sync --light` to skip the overlap scan and re-review on a clean merge |
| **Rework** (fixes within the approved scope, or CI red) | Leave PR review comments, then `rework` |
| **Revise** (change what the story does, same PR) | `revise: <new or changed behaviour>`, then `approved` again |
| **Merge** | **Squash and merge** on the PR (only you; agents never merge) |

```
Agents tab → agent "ship" → story      start: plan / interview
approved                               accept recommendations, build
approved, 1) b 2) …                    answer + build in one go
approved, but …                        build with a tweak
answers: 1) b                          update the plan, ask again
continue                               resume after a pause
sync / sync --light                    bring in main after other merges
rework                                 fix your review comments / red CI
revise: …                              change the story; then approve again
Squash and merge                       you, after final review
```

On the PR, prefix each with `@copilot` (e.g. `@copilot approved`).

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
| `.github/workflows/story-pr.yml` | Opens the draft `[Story]` PR and keeps its title and description in sync with the spec (Copilot can't edit PRs itself) |
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
   *Allow GitHub Actions to create and approve pull requests* **ticked**.
   The `Story PR` workflow needs it to open and update story PRs; it never
   approves or merges.
4. Issues can stay **off**; nothing here uses them.
