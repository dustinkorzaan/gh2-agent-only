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
   **Approved scope** digest named in the spec's Approval record (a PR review or
   your own comment that quotes the SHA-256 of the Approved scope block). An
   agent-ticked checkbox is not an approval, and neither is being the PR author.
3. **Start delivery:** as a separate step, start the **`deliver`** agent on the
   PR. Approval alone never starts implementation.
4. **Done:** when the PR description says **✅ Ready for human review**,
   review it and **Squash and merge**. Agents never merge.

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

## Commands

You drive a story with a few plain-language commands in the Agents tab or a PR
comment. Each one is a **request to a session you start**, not a native button:
there is no built-in router that dispatches these, so if an automatic handoff
isn't offered, launch the named agent yourself on the PR.

| Command | Where | What it asks for | Targets |
|---|---|---|---|
| `approve-spec` | PR review/comment | Approve the current **Approved scope** digest so delivery may start | A specific spec digest (quote the SHA-256) |
| `deliver` | Agents tab / PR | Start delivery of an already-approved spec | The approved digest named in the Approval record |
| `rework` | PR comment | After a review/QA finding, fix within the **same** approved scope | The current candidate SHA; no new approval |
| `revise` | PR comment | Change the scope itself (new goals/AC/constraints) | Produces a new digest that voids the old approval and needs re-`approve-spec` |
| `continue` | Agents tab / PR | Resume a stopped session from the first unticked Progress item | The same approved digest; re-verifies approval first |
| `stop` | Agents tab | Ask the running session to halt | Best-effort only (see below) |

Notes that keep these honest:

- **Authorization is a checked permission, not a claim.** `approve-spec` and
  `deliver` only count from a human with **write, maintain or admin** on the
  repo, verified against repo permissions — not from `author_association`, not
  from being the PR author, and not from a ticked checkbox. Record the approving
  event, actor and timestamp in the spec's Approval record.
- **`revise` vs `rework`.** `rework` stays inside the approved scope (same
  digest). `revise` changes the scope: it yields a new Approved scope digest,
  voids the previous approval, unticks Progress from Approved down, and must be
  re-approved before delivery continues.
- **`stop` is not a guaranteed kill.** It is a request the session may not honour
  immediately, and it does not forcibly terminate compute. Treat it as "please
  wind down", and confirm the session actually stopped before assuming it did.
- **Review comments are on request.** Peer review and QA run when you ask for
  them (or when `deliver` reaches those phases); they are not posted
  automatically on every push.
- **One spec, one PR.** The `Story PR` workflow only opens/updates a PR for a
  branch that adds **exactly one** new spec under `docs/specs/`. More than one
  added spec makes it fail loudly rather than guess; running several stories at
  once means several branches/PRs, merged one at a time.

## What is and isn't guaranteed

Most of the "autonomy" here is **convention**, not an enforced control. Be
explicit about that when you rely on it:

- **Routing / model.** Nothing natively routes a session to `discover` vs
  `deliver`, or guarantees which model handled it. Treat any "a higher-capability
  model reviewed this" statement as **unverified** unless you confirmed it out of
  band. When a reviewer's model identity can't be verified, **fail closed**: get
  an independent high-capability review (ideally a human, or an explicitly
  different model you chose) before trusting a "clean" verdict, and prefer the
  approved model for that review.
- **Gates are advisory.** Verify, peer review and QA are second opinions that
  inform you; they never approve or merge. A human approves the spec and
  squash-merges.
- **QA / UX evidence.** QA uses **synthetic data only** (no production or
  personal data), compares against a stated baseline, and keeps screenshots and
  recordings as linked artifacts. Retain that evidence with the PR; don't accept
  an invented status.
- **Costs.** Hosted **GitHub Actions minutes** (CI, the `Story PR` workflow)
  are billed separately from your **Copilot** allowance — they are different
  meters. Self-hosted runners remove hosted-minute charges but add your own
  compute and storage costs (and their terms), and they do **not** move where
  the Copilot cloud agent itself runs.
- **Capability matrix is a pilot.** Every runtime behaviour in the table below
  is **unverified pending human validation**. Nothing here is a tested guarantee
  — especially not routing, handoff or model selection.

  | Capability | Status |
  |---|---|
  | Agent selection / routing | unverified — manual fallback |
  | Automatic handoff between agents | unverified — launch the next agent yourself |
  | Session / workspace isolation | unverified |
  | Tool scopes per agent | unverified |
  | Actions-event triggering of sessions | unverified |
  | Repair/budget enforcement | soft convention, not enforced |
  | `stop` termination | best-effort, not guaranteed |

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
| `.github/copilot-instructions.md` | Convention that points every `@copilot` session on a story PR at `discover` or `deliver` (applied by reading it, not a native router) |
| `.github/workflows/story-pr.yml` | Opens the draft `[Story]` PR and keeps its title and description in sync with the spec (Copilot can't edit PRs itself) |
| `AGENTS.md` | Stack, git policy, rules |
| `.github/instructions/*.instructions.md` | UI and API conventions |
| `REVIEW.md` | Review checklist |
| `docs/specs/` | One spec per story (`YYYY-MM-DD-<slug>.md`) with your story prompt copied in; its **Progress** checklist is a resume hint, and its **Approved scope** digest plus Approval record are the authority |
| `scripts/verify.sh` | The one check command; same checks as CI |
| `.github/workflows/copilot-setup-steps.yml` | Installs Node, .NET and dependencies for the agent |
| `.github/workflows/ci-*.yml`, `e2e-playwright.yml`, `codeql.yml` | CI |

## One-time repo settings

1. **Settings → Copilot → Cloud agent:** enabled for this repo. Separately,
   **Settings → Actions → General → "Require approval for all outside
   collaborators" / workflow-run approval** is its own control, independent of
   spec approval: leaving it **on** means a human clicks "Approve and run" before
   CI runs each push (an execution gate, but slower feedback); turning it **off**
   speeds CI at the cost of that gate. Choose per your risk tolerance — this repo
   does not require it off.
2. **Settings → General → Pull Requests:** squash merging only, and
   optionally *Automatically delete head branches*.
3. **Settings → Actions → General → Workflow permissions:** read-only, and
   *Allow GitHub Actions to create and approve pull requests* **ticked**.
   The `Story PR` workflow needs it to open and update story PRs; it never
   approves or merges.
4. Issues can stay **off**; nothing here uses them.
