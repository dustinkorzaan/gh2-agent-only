# gh

User stories are delivered by GitHub Copilot custom agents defined in
`.github/agents/`: two human-facing agents, **`discover`** and **`deliver`**,
and six specialists they coordinate. `discover` interviews you and writes a
spec; you approve it; `deliver` drives tests, implementation, verification,
review and QA until the PR is ready for your review. You squash-merge.

No PAT, issues or extra secrets are needed: every session starts from
something you do in the **Agents** tab or a PR comment.

## Start a story

1. **Discover:** open the repo's **Agents** tab
   (`https://github.com/<owner>/<repo>/agents`), pick the **`discover`**
   agent, type the story (template below) and start the task. It asks a few
   questions with recommended answers, gets design and spec reviews from
   `architect` and `spec-reviewer`, and pushes the spec; the `Story PR`
   workflow opens a draft `[Story] …` PR for it.
2. **Approve:** read the spec in the PR's *Files changed* and approve the exact
   spec revision named in its Approved-spec reference block (a PR review or
   your own comment). An agent-ticked checkbox is not an approval.
3. **Start delivery:** as a separate step, start the **`deliver`** agent on the
   PR. Approval alone never starts implementation.
4. **Done:** when the PR description says **✅ Ready for human review**,
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
```

## Agents

Two human-facing agents and six specialists:

| Definition | Facing | Role |
|---|---|---|
| [`discover`](.github/agents/discover.agent.md) | human | interview, write an approval-ready spec (criteria, negative cases, non-goals, risk) |
| [`spec-reviewer`](.github/agents/spec-reviewer.agent.md) | specialist | independent read-only spec review before approval |
| [`architect`](.github/agents/architect.agent.md) | specialist | independent read-only design/feasibility review before approval |
| [`deliver`](.github/agents/deliver.agent.md) | human | preflight approval + explicit start, then drive delivery to green `verify.sh --all` |
| [`test-author`](.github/agents/test-author.agent.md) | specialist | write acceptance tests from the approved spec, early |
| [`implementer`](.github/agents/implementer.agent.md) | specialist | the single writer; implement the plan serially |
| [`peer-reviewer`](.github/agents/peer-reviewer.agent.md) | specialist | read-only code review at the exact candidate SHA |
| [`qa`](.github/agents/qa.agent.md) | specialist | exercise the running system from the spec at that SHA |

Humans always approve the spec and always merge; agents never self-approve or
merge. If automatic handoff to a specialist isn't available, the human-facing
agent asks you to launch that specialist yourself. Many runtime behaviours
(agent selection, handoff, session/workspace isolation, tool scopes, Actions
events, budgets) are **unknown until demonstrated** and are flagged as such in
each definition.

With several story PRs open, merge them one at a time and bring `main` into
the next one (a merge commit) after each merge.

## How it fits together

| File | Purpose |
|---|---|
| `.github/agents/*.agent.md` | The agents: mandate, method, hard rules for each role |
| `.github/copilot-instructions.md` | Routes every `@copilot` session on a story PR to `discover` or `deliver` |
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
