# GitHub-native spec-to-PR agentic delivery

Deliver user stories end to end with GitHub Copilot custom agents: a written
spec, one explicit human approval, then an agent-coordinated delivery that lands
a pull request ready for a human to review and squash-merge. The only moving
parts are **agents**, **GitHub Actions** and a **PR** — no GitHub Issues and no
external orchestrator. Coordination is a convention applied by reading role
definitions and by humans launching sessions; nothing in-repo routes, hands off
or supervises agents.

Runtime behaviour (routing, handoff, isolation, model selection, budgets) is
**not yet validated** — treat it as intent, not a guarantee. Two rules never
bend: **a human approves the spec and a human squash-merges**, and **claims count
only as evidence a human can check**.

## Human runbook

1. **Start.** In the **Agents** tab, launch `discover` with the rough story as
   the prompt. Stories are not filed as issues.
2. **Interview.** `discover` asks a few pointed questions and proposes defaults;
   you accept a concrete scope deliberately (not a one-word "yes" that adopts
   hidden defaults).
3. **Challenge.** `architect` (design/feasibility) and `spec-reviewer` (testable
   criteria, honest non-goals, correct risk tier) run independent read-only
   reviews. They inform you; they approve nothing.
4. **Approve + start.** Read the spec's **Approved scope** section and approve
   it with a **PR comment** (`@copilot approved`) as a human with write access.
   Then, as a **separate explicit request**, start `deliver`. Approval alone
   never starts code.
5. **Tests then implementation.** `test-author` writes acceptance tests from the
   spec first. `implementer` is the single writer and adds unit and integration
   code serially, with **≤3 repair rounds per gate** inside a human-owned global
   budget; early repeated failures escalate to a human.
6. **Verify.** `scripts/verify.sh --all` is green and CI runs on the exact
   candidate commit.
7. **Review + QA.** A read-only `peer-reviewer` on a **distinct actual model**
   and a `qa` pass against the **running, integrated system** (functional + UX)
   each record the candidate SHA they ran against.
8. **Decide.** You `rework` within scope, `revise` (which voids approval and
   needs re-approval and a new start), defer out of scope, `stop`, or
   **squash-merge** yourself. Agents never merge.

## The roles

Eight definitions live under [`.github/agents/`](.github/agents/) — two
human-facing entry roles and six specialists. The links are **references to
where each definition is expected to live**, not proof a runtime registered or
invoked them; registration is unverified and not inspected here.

| Definition | Facing | Role (one line) |
|---|---|---|
| [`discover`](.github/agents/discover.agent.md) | human | interview a rough idea into an approval-ready spec |
| [`spec-reviewer`](.github/agents/spec-reviewer.agent.md) | specialist | independent read-only spec review before approval |
| [`architect`](.github/agents/architect.agent.md) | specialist | independent read-only design/feasibility review before approval |
| [`deliver`](.github/agents/deliver.agent.md) | human | preflight the approval + start, then coordinate delivery |
| [`test-author`](.github/agents/test-author.agent.md) | specialist | write acceptance tests from the spec, before implementation |
| [`implementer`](.github/agents/implementer.agent.md) | specialist | the single writer; implement the plan serially |
| [`peer-reviewer`](.github/agents/peer-reviewer.agent.md) | specialist | read-only code review at the exact candidate SHA |
| [`qa`](.github/agents/qa.agent.md) | specialist | exercise the running system from the spec at that SHA |

## Driving a story

Each command is a **request to a session a human starts**. There is no built-in
command parser and no native router: a `@copilot` mention does not dispatch an
agent, and `.github/copilot-instructions.md` points a session at `discover` or
`deliver` by **being read**, not by executing. The reliable path is a human
launching the named agent through the supported UI.

| Command | Where | What it asks for |
|---|---|---|
| `approved` | PR comment (`@copilot approved`) | approve the spec's current Approved scope; the comment is the approval record |
| `deliver` | Agents tab / PR | start delivery of the already-approved spec |
| `rework <candidate-sha> + <findings>` | PR comment | fix within the **same** approved scope; no new approval |
| `revise` | PR comment | change the scope → voids approval, needs a fresh `approved` comment **and** a new `deliver` |
| `continue` | Agents tab / PR | resume a stopped session; re-check approval first |
| `stop` | Agents tab | ask a session to wind down |

Prefix PR requests to Copilot with `@copilot`. Only an explicit `approved`
comment from a human approver counts as approval; other comments are discussion
or requests. `stop` is "please halt" — in-flight
cancellation is **not guaranteed**; confirm the session actually stopped.

## Approval

Approval is a **PR comment** (`@copilot approved`) on the story PR from a human
with write access. It covers the spec's **Approved scope** section as it stood
when the comment was posted; the spec's Approval record links to the comment.
A ticked `Approved` box, PR authorship or an agent's statement is never
approval. Any later change to the Approved scope voids the approval and needs a
new comment. The `## Progress` checklist and Review log are a **resume hint**,
not a control.

## Candidate SHA and evidence freshness

Any change to **code, the base branch, tests, or the approved scope**
invalidates prior results. Every peer-review and QA gate records the **candidate
SHA** it ran against, kept as externally linked PR artifacts — no self-referential
hash a gate computes about its own run. Even bookkeeping-only commits produce a
**new SHA**: either the external reports still point at the exact tree under
review, or the gate is **explicitly re-run**. Stale evidence is not carried
forward.

## Models and review independence

A high-capability, approved model does the primary design, implementation and
review work; this document hardcodes no version list and asserts no provider
superiority. Independence is an **evidence** requirement: the implementer and the
reviewer must be **demonstrably different actual models**. Model identity is
**optional, may be unknown, and is never inferred** from file names, prompts or
role labels, and no unsupported field is fabricated. If the reviewer's model is
unknown or the same as the implementer's, **pause for an explicit human exception
or a separate human review** rather than claiming diversity. Peer review is a
fresh, read-only pass by someone other than the implementer, working from the
**spec, the diff and objective evidence** — not the implementer's narrative.

## QA and UX evidence

`qa` works from the approved spec against the running, integrated app and designs
**independent** scenarios covering protected user journeys, error and negative
paths. The environment uses **seeded, synthetic data** — no production secrets,
no personal data — with **pinned fonts, browser, viewport and locale**. UX checks
cover **visual diff, keyboard focus, accessibility and responsive** behaviour
across a stated matrix; a material-design change is a **human gate**, and
screenshots/traces are **human-authorized baselines** (no silent "update to
green"). QA states its data **sanitization and retention** and flags limitations;
unverifiable evidence is **not a pass**, and automated accessibility checks are
**not** a full usability audit.

## Concurrency

The default is **serial**: one writer touches the tree at a time. Parallel work
is allowed only with isolated branches or workspaces, **agreed contracts**
between the parts, and a named **integrator** (the `deliver` role) running the
**integrated** checks. Absent all three, keep it serial; no two writers share a
tree.

## The Story PR workflow

The Copilot cloud agent can push commits but has no credentials to create or edit
a PR. [`.github/workflows/story-pr.yml`](.github/workflows/story-pr.yml) fills
only that gap.

- It runs on push to a **`copilot/**` branch** and expects **exactly one** spec
  added under `docs/specs/` versus `origin/main` (the template is excluded).
  More than one makes it **fail loudly**; none makes it **skip**.
- It sets the PR **title** from the spec's first `# ` heading and the
  **description** from the `<!-- pr-description:start/end -->` block, so **manual
  edits to the PR description are overwritten** on the next push — durable state
  lives in the spec.
- When the **exact first non-empty line** of that block is `✅ Ready for human
  review`, the draft is published; removing the marker returns it to draft.
- **Publication is cosmetic** — not an auth, approval or QA gate; the workflow
  never approves, reviews or merges.

Because this workflow uses the default `GITHUB_TOKEN`, a PR it creates **may not
trigger downstream CI** — token-event recursion is restricted, and you cannot
assume every `synchronize` runs a check. Whether CI ran on the exact candidate
must be **confirmed** via a supported trigger (a human push or approval); if none
ran, do not mark it verified, and do not claim a "re-run" button exists for a run
that never started. Required CI checks are **deterministic, independently
executed** gates and, with branch protection, can be hard — so **not every gate
is advisory**. This document does not claim any branch-protection rules or
approvers are actually configured.

## The stack and the one check command

- **UI** — [`ui/`](ui/): Vite + React + Redux Toolkit.
- **API** — [`api/`](api/): C# / .NET 10.
- **Infra** — Bicep / Azure Container Apps, Entra ID, Azure SQL DB.
- **Files** — blob access **only via short-lived, least-privilege SAS URIs**
  issued by the API with its managed identity; file bytes never transit the API.

Contracts and the per-area conventions are in
[`AGENTS.md`](AGENTS.md), [`REVIEW.md`](REVIEW.md) and
[`.github/instructions/`](.github/instructions/). There is **one check
command**: [`scripts/verify.sh`](scripts/verify.sh) — same checks as CI for what
changed versus `origin/main`, with **no args** (changed areas), **`--all`**,
**`--list`** and **`<path>...`** modes. It skips an area until it exists. **"Done"
means `scripts/verify.sh --all` is green.** Do not add a per-area checker.

## Costs and runners

Costs run on **separate meters** and exact rates are **not quoted here** — verify
current pricing yourself. **GitHub Actions usage** (CI, the `Story PR` workflow
and artifact storage) bills under the **Actions** meter with its own plan,
visibility and **OS/runner-class** pricing; **Copilot requests** draw on the
**Copilot** quota. **Self-hosted runners** consume no hosted-minute allowance but
are not free — compute, patching, security and storage under their own terms, and
possible other charges. A **direct laptop test is not an Actions job**, and a
self-hosted runner does **not** move where the Copilot cloud agent runs; untrusted
code should run on ephemeral, isolated runners.

## Before the first live story

Verify these with a human — none is demonstrated here, and local `verify.sh`
cannot prove hosted behaviour:

- Model **selection and identity** per role, and evidence of reviewer distinctness.
- Agent **registration**, **handoff** and **workspace/session isolation**.
- **Preview environment** for QA.
- **Approver permissions**, and trusted **workflow/source** rules.
- **Required checks** on the exact SHA and which events actually trigger CI.
- **Repair budgets**, artifact **retention**, and **runner** class/visibility.

## Pilot

Run a **measured, low-risk pilot**: track human time per story, escaped defects,
false "ready" signals, rework volume, Copilot/Actions usage, and how often gates
escalate to a human — read in context, with no universal thresholds and no
promise that the system is "fully ready". **High-risk changes**
(authentication/authorization, destructive migrations, production deployment) are
**outside the pilot**: each needs a separate human risk decision and stronger
controls before any delivery is authorized. Only a human merges, and there is no
rebase, amend or force-push — bring `main` in with a merge commit.
