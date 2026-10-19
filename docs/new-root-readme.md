# GitHub-native spec-to-PR agentic delivery

> **Preview note.** This file is a staging copy that is meant to become the
> repository's root `README.md`. Its internal links are written **root-relative**
> (for example `AGENTS.md`, `scripts/verify.sh`, `.github/workflows/story-pr.yml`)
> so they resolve correctly **after** the file is copied to the repository root.
> While it lives under `docs/`, those links resolve against the wrong directory
> in a Markdown preview; that is expected and resolves on copy. The current root
> `README.md` is unchanged — this is an additional document, not a replacement in
> place.
> Remove this preview note when installing the file as the root README.

A master plan and operational manual for delivering user stories, end to end,
with GitHub Copilot custom agents: discovery and a written spec, one explicit
human approval, then an agent-coordinated delivery that lands a pull request
ready for a human to review and squash-merge.

This document is written as a **company proposal for a controlled pilot**. It
describes a design and an intended operating model. It deliberately separates
three things that are easy to blur:

1. **What the repository supports today** — the files, the one check command,
   and the one small workflow that are actually present and runnable here.
2. **Contracts and manual policies** — conventions this process asks people and
   agents to follow, which are honoured by discipline rather than enforced by a
   platform control.
3. **Future, pilot-stage capability** — runtime behaviour (routing, handoff,
   isolation, model selection, budgets) that is **not yet validated** and must
   not be presented as a guarantee.

Nothing in the pilot sections should be read as "done". Where a behaviour is
unproven, it is marked unverified.

---

## Table of contents

- [Scope and ground rules](#scope-and-ground-rules)
- [The roles](#the-roles)
- [The lifecycle](#the-lifecycle)
  - [Discovery](#discovery)
  - [Approval](#approval)
  - [Delivery start](#delivery-start)
  - [Test authoring](#test-authoring)
  - [Implementation](#implementation)
  - [Verify, peer review and QA](#verify-peer-review-and-qa)
- [Commands and how they are really dispatched](#commands-and-how-they-are-really-dispatched)
- [The Story PR workflow](#the-story-pr-workflow)
- [The approved-scope digest](#the-approved-scope-digest)
- [Candidate SHA and evidence freshness](#candidate-sha-and-evidence-freshness)
- [Models and review independence](#models-and-review-independence)
- [QA and UX evidence](#qa-and-ux-evidence)
- [State machine](#state-machine)
- [Trust, permissions and least privilege](#trust-permissions-and-least-privilege)
- [The stack and the one check command](#the-stack-and-the-one-check-command)
- [Capability matrix (what is still unknown)](#capability-matrix-what-is-still-unknown)
- [Costs and runners](#costs-and-runners)
- [Pilot metrics and rollout](#pilot-metrics-and-rollout)
- [Open questions](#open-questions)
- [Repository file map](#repository-file-map)

---

## Scope and ground rules

This is a **clean-sheet** design for this repository as it stands:

- **No issues.** The repo does not use GitHub Issues; a story starts from the
  **Agents** tab; subsequent interactions use the story's PR or Agents chat.
  Deferred work is written down as a spec,
  not filed as an issue.
- **No external orchestrator.** Coordination between roles is a convention applied
  by reading role definitions and by humans launching sessions. There is no
  native in-repo engine that routes, hands off or supervises agents.
- **No production deployment.** The pilot stops at a PR that is ready for human
  review. Shipping to production is out of scope, and so are the high-risk
  changes (see [State machine](#state-machine)) that would accompany it.

Two principles run through everything:

- **A human approves the spec, and a human squash-merges.** Agents never
  self-approve and never merge.
- **Claims are evidence, not assertions.** Approval, review independence, model
  identity and gate results only count when they are backed by something a human
  can check.

---

## The roles

The design declares **eight** role definition files under
[`.github/agents/`](.github/agents/) — **two entry (human-facing) roles and six
specialists**:

| Definition | Facing | Role |
|---|---|---|
| [`discover`](.github/agents/discover.agent.md) | human | interview from a rough idea, write an approval-ready spec |
| [`spec-reviewer`](.github/agents/spec-reviewer.agent.md) | specialist | independent read-only spec review before approval |
| [`architect`](.github/agents/architect.agent.md) | specialist | independent read-only design/feasibility review before approval |
| [`deliver`](.github/agents/deliver.agent.md) | human | preflight approval + explicit start, then coordinate delivery |
| [`test-author`](.github/agents/test-author.agent.md) | specialist | write acceptance tests from the approved spec, before implementation |
| [`implementer`](.github/agents/implementer.agent.md) | specialist | the single writer; implement the plan serially |
| [`peer-reviewer`](.github/agents/peer-reviewer.agent.md) | specialist | read-only code review at the exact candidate SHA |
| [`qa`](.github/agents/qa.agent.md) | specialist | exercise the running system from the spec at that SHA |

The links above are **references to where each definition is expected to live**,
not proof that a runtime registered, loaded or invoked them. The **target count
is exactly eight** (two entry + six specialists). This document makes **no claim
that it inspected a live agent registry** or confirmed that any of these
definitions are wired into a running system; that remains part of the pilot's
unverified capability surface.

---

## The lifecycle

### Discovery

`discover` turns a **rough idea** into a spec. It asks a **small number of
pointed questions** and proposes recommended answers, then records the result as
an interview: the **facts** it was told, the **assumptions** it made where it did
not ask, and an **explicit acceptance** of those assumptions by the requester.
Acceptance means a deliberate "yes, that is the scope" — **not** a one-word reply
that silently adopts hidden defaults. The output is a spec whose Acceptance
criteria, negative cases, non-goals and risk tier are concrete enough to test.

Before any human approval, two independent read-only reviews run:

- **`architect`** judges the design — is the shape of the change proportionate to
  the problem, and is it feasible against this stack and its contracts?
- **`spec-reviewer`** challenges the spec itself — are the criteria testable, the
  non-goals honest, the risk tier right, the assumptions acceptable?

These reviews inform the human; they do not approve anything.

### Approval

Approval binds a human decision to an **exact, bounded scope**. The approved
contract is the `Approved scope` block of the spec, and the approval is recorded
against the **SHA-256 digest** of that block (see
[The approved-scope digest](#the-approved-scope-digest)). An approval only counts
when it is:

- a **current, explicit event** from an **authenticated human** with
  **write, maintain or admin** permission on the repo, verified against repo
  permissions; and
- tied to the **digest of the current Approved scope**.

It does **not** count from `author_association`, from being the PR author, or
from a ticked `Approved` checkbox. The event, actor and timestamp are written
into the spec's Approval record.

### Delivery start

Approval does **not** start implementation. Delivery begins only on a
**separate, explicit** human event that **references the approved digest**. Until
that start event exists and is verified, no code is written — an approved spec
sitting idle is not a licence to implement.

### Test authoring

`test-author` works **before** implementation. It designs acceptance scenarios
**independently** from the approved spec, rather than transcribing whatever an
implementer might later build. Green acceptance tests are **evidence that stated
criteria are met** — they are not proof that the requirements themselves are
correct or complete; that judgement stays with the human who approved the spec.

### Implementation

`implementer` is the **single writer**. Work proceeds **serially**: no two
writers touch the same tree at once. The implementer runs a tight
**code → small test → repair** loop.

- Repairs are **soft-capped at three rounds per gate**, within a **global repair
  budget** across gates, overseen by a human. "Soft" means it is a convention the
  process tries to honour, **not** a hard kill switch — unless and until a hard
  cap is actually demonstrated to exist. Early, repeated failures are a signal to
  **stop and escalate to a human**, not to keep burning rounds.
- Concurrency is allowed **only** under strict conditions: isolated branches or
  worktrees, **agreed contracts** between the parts, and a named **integrator**
  (the `deliver` role) that runs the **integrated** checks. Absent that, keep it
  serial.

### Verify, peer review and QA

Each delivery gate is an **independent second opinion**. None of them approves or
merges. See [Models and review independence](#models-and-review-independence) and
[QA and UX evidence](#qa-and-ux-evidence) for how peer review and QA are kept
honest, and [Candidate SHA and evidence freshness](#candidate-sha-and-evidence-freshness)
for why every gate records the SHA it ran against.

---

## Commands and how they are really dispatched

You drive a story with a few plain-language commands typed in the **Agents** tab
or a **PR comment**. Be precise about what they are: each command is a **request
to a session a human starts**. There is **no built-in command parser** and **no
native router** that reads a `@copilot` mention and dispatches the right agent.
The `.github/copilot-instructions.md` convention points a session at `discover`
or `deliver` **by being read**, not by executing.

The reliable fallback is explicit: **a human launches the named agent on the
PR** through the supported UI. **Automatic model routing is unverified** —
nothing here promises which model handled a session.

| Command | Where | What it asks for |
|---|---|---|
| `approve-spec <digest>` | PR review or authenticated Agents approval | Approve the current Approved-scope **digest**; record a verifiable event before any separate delivery start |
| `deliver <digest>` | Agents tab / PR | Start delivery of the already-approved **digest** named in the Approval record |
| `rework <candidate-sha> + <specific findings>` | PR comment | Fix within the **same** approved scope at the current candidate SHA; no new approval |
| `revise` | PR comment | Change the scope itself — yields a **new digest**, voids the old approval, and needs a fresh `approve-spec` **and** a new `deliver` start |
| `continue` | Agents tab / PR | Resume a stopped session; **re-validate** approval and digest first |
| `stop` | Agents tab | Ask a running session to wind down |

For PR comments directed to Copilot, prefix the request with `@copilot`.
Comments can discuss approval, but a plain comment is not sufficient proof:
use a verifiable approval source supported by the specification template.
The command words are conventions, not guaranteed routing syntax.

Honesty notes:

- `stop` does **not dispatch** a forced termination. In-flight cancellation
  behaviour is **unknown**; treat `stop` as "please halt" and confirm the session
  actually stopped before assuming it did.
- `rework` stays inside the approved digest; `revise` leaves it. After `revise`,
  delivery may not resume until the new digest is re-approved and a new start
  event references it.

---

## The Story PR workflow

The Copilot cloud agent has no GitHub credentials in its session: it can push
commits but cannot create or edit a PR. [`.github/workflows/story-pr.yml`](.github/workflows/story-pr.yml)
fills that gap, and **only** that gap.

- It runs on push to a **`copilot/**` branch** and looks for **exactly one**
  spec added under `docs/specs/` versus `origin/main` (the template is
  **excluded**). **More than one** added spec makes it **fail loudly** rather than
  guess; **none** makes it **skip** (not a story branch).
- The default is a **single draft PR** per story branch. It sets the PR
  **title** from the spec's first `# ` heading and the **description** from the
  text between the `<!-- pr-description:start -->` / `<!-- pr-description:end -->`
  markers.
- Readiness is a precise signal: when the **exact first non-empty line** of that
  block is the Unicode marker **`✅ Ready for human review`**, the draft is
  published; if a revision **removes** the marker, a published PR is returned to
  draft.
- Because the description is mirrored from the spec, the workflow **overwrites
  manual edits** to the PR description on the next push. Durable state lives in
  the **spec and its recorded events**, not in hand-edited PR text.
- **Publication is cosmetic.** It is **not** an authorization or approval check:
  it never gates who may approve a spec or start delivery, and the workflow never
  approves, reviews or merges.

A larger pattern — a **spec-only PR linked to a separate delivery PR** — is a
**supported concept for the future**, not the current behaviour. Today there is
**no new-spec-only Action** beyond this one workflow.

**Actions caveat.** This workflow uses the default `GITHUB_TOKEN`. Do not assume
a push from one automated step automatically triggers downstream CI — token-based
event **recursion is restricted**, so whether CI ran must be **verified**, not
presumed.

---

## The approved-scope digest

The approval key is the **SHA-256 of the canonical, committed bytes** of the
`Approved scope` block: **UTF-8, LF line endings, no normalisation**, with
**exactly one** start marker and **one** end marker, and the marker lines
themselves **excluded**. All mutable material — approval record, Progress ticks,
review logs, timestamps — is kept **outside** the markers so the digest stays
stable once approved.

The canonical, script-free way to compute it is the anchored `awk` over
`git show` with `pipefail`, documented in
[`docs/specs/_template.md`](docs/specs/_template.md). **Reference** that command;
do not duplicate it here, where a stray edit could make it subtly wrong. Require
exactly one start/end pair before trusting the result, and compute it from a
**committed** candidate (working-tree line-ending conversion must not change the
key).

The scope digest is **distinct from the candidate SHA**: the spec file's own blob
OID changes every time Progress is ticked, so the blob OID is **not** the
approval key. A spec never approves itself; approval is the human event bound to
the digest.

---

## Candidate SHA and evidence freshness

Any change to **code, the base branch, tests, or the approved scope** invalidates
the relevant prior results. When that happens, review and QA run against a
**fresh candidate**.

- Every peer-review and QA gate records the **candidate SHA** it ran against, and
  that evidence is kept as **externally linked PR artifacts** — avoid a
  self-referential hash that a gate computes about its own run.
- Even **bookkeeping-only commits** (for example, ticking Progress) produce a
  **new SHA**. Acknowledge that: the tree may be identical, but the SHA differs,
  so **earlier evidence is not silently carried forward**. Either the external
  reports still point at the exact tree under review, or the gate is **explicitly
  re-run** to validate the latest tree.

Gate verdicts are **advisory**. Required CI checks, by contrast, are
**deterministic and independently executed**, and with branch protection they can
be made **hard** — so not every gate is merely advisory. An agent's report that a
gate "passed" is evidence that the gate **exists and ran**, not independent proof
that the result is **correct**.

---

## Models and review independence

Model selection is **per role**: a **high-capability, approved** model is
intended for design, implementation and review. This document **hardcodes no
version list and asserts no provider superiority** — naming a specific model or
vendor as "best" is out of scope.

Independence is an **evidence** requirement, not a slogan:

- The prerequisite is **evidence of distinct actual models** for the implementer
  and the reviewer. Using **different model families** is preferred **where
  permitted**, but the hard requirement is that the two actual models are
  demonstrably different.
- "Requested model" versus "reported model identity/version" may **both** be
  recorded; the reported identity is **optional and may be unknown** when the
  runtime does not expose it. Model identity is **never inferred** from file
  names, prompt text or role labels.
- If the reviewer's model is **unknown** or the **same** as the implementer's,
  **fail closed**: stop, or obtain an **explicit human exception** or a
  **separate human review**. Do **not** present an unverifiable claim as if it
  satisfied a mandatory diversity requirement.

A peer review is a **fresh, read-only** pass by someone other than the
implementer — not a restatement of the implementer's own narrative. It reads the
**diff and the surrounding tests**, checks **security-relevant** areas and
**lockfiles**, and runs **advisory dependency checks** against the GitHub
advisory database.

---

## QA and UX evidence

`qa` works **from the approved spec against the running, integrated app**. It
**designs independent scenarios** rather than blindly re-running the authored
tests, covering **functional, error, authentication and negative** paths.

- The environment uses **real but seeded, synthetic data** — **no production
  secrets, no personal data** — with **consistent fonts, browser, viewport and
  locale** so results are comparable.
- **UX checks** cover visual state, **keyboard focus**, **accessibility** and
  **responsive** behaviour. Screenshots and recordings are compared against a
  **stated baseline**; a human **authorizes baseline updates**. There is **no
  "update to green"** that silently moves the baseline to match a regression.
- **Automated accessibility checks are not a full audit.** Full usability and
  accessibility sign-off on a **material change** is a **human gate**.
- QA states the **data sanitization and retention** approach for its evidence —
  a deliberate selection, with **no indefinite storage** of captured artifacts.

---

## State machine

Durable state is **minimal** and lives in the **spec plus recorded events**. The
intended transitions:

| State | Enters when | Leaves to |
|---|---|---|
| `discovery` | Story opened; spec being written/revised or awaiting approval | `approved` after reviews and a verified human event bound to the digest |
| `approved` | Human approval bound to current digest | `awaiting-start` |
| `awaiting-start` | Approved, no delivery start yet | `delivering` (explicit start referencing digest) |
| `delivering` | Delivery started | `ready`, `blocked`, or back on scope change |
| `blocked` | Budget exhausted / human needed | `delivering` or `discovery` |
| `ready` | Required verification, review and QA evidence support the current candidate; readiness marker summarizes that evidence | `merged`, `delivering` for rework, or `discovery` for revised scope |
| `merged` | **Human** squash-merge only | — |

Rules:

- A **scope change** requires a **fresh approval event** against the new digest;
  it unticks Progress from Approved down and returns to `discovery`.
- **High-risk** changes — authentication/authorization, **destructive
  migrations**, and **production deployment** — are **excluded from the initial
  pilot**. They require a **separate human risk decision** and **stronger
  controls** before any delivery is authorized. High risk is **not** "pilot can
  do it if asked"; it is out until that separate decision exists.

---

## Trust, permissions and least privilege

The requirements for authority form a **trust chain** that must be checked, not
assumed:

- **Check repo permissions** of the acting human (write/maintain/admin),
  confirm the event is from an **authenticated** actor, and confirm it **links to
  the current digest**. If any proof is **unavailable or unverifiable**, **stop**
  and ask.
- Treat **PR content as untrusted**. Run with **least privilege**: **no `eval`**
  of PR-supplied content, and **no privileged checkout** of untrusted code into a
  trusted context.
- **Branch protection, required checks and human-only merge are repo settings.**
  They are configured **out of band** and must not be **claimed as configured**
  when they have not been validated here.
- Do **not** disable the Actions workflow-approval control as a **blanket**
  convenience; it is an independent execution gate with its own trade-offs.

---

## The stack and the one check command

The stack this pilot targets:

- **UI** — `/ui`: Vite + React + Redux Toolkit.
- **API** — `/api`: C# / .NET 10.
- **Infra** — Bicep / Azure Container Apps, Entra ID, Azure SQL DB.
- **Files** — blob access **only via short-lived, least-privilege SAS URIs**
  issued by the API with its **managed identity**; **file bytes never transit the
  API**, and no endpoint proxies uploads or downloads.

There is **one check command**: [`scripts/verify.sh`](scripts/verify.sh). It runs
the same checks as CI for what changed versus `origin/main`, installs missing
dependencies, and supports **no args** (changed areas), **`--all`**, **`--list`**
and **`<path>...`** modes. **"Done" means `scripts/verify.sh --all` is green.**
Use it instead of per-area commands; **do not add a new per-area checker** — the
single command is the contract. It **skips** an area until that area exists.

---

## Capability matrix (what is still unknown)

Every runtime behaviour below is **unverified pending human validation**. **Local
verification cannot prove hosted behaviour** — a green `verify.sh` says nothing
about how a hosted agent session is routed or isolated.

| Capability | Status |
|---|---|
| Agent **registration** (definitions loaded by a runtime) | unknown |
| Agent **invocation** / selection | unknown — manual fallback |
| **Handoff** between agents | unknown — launch the next agent yourself |
| **Model selection** per role | unknown |
| **Observability** of sessions | unknown |
| **Tool scopes** per agent | unknown |
| **Workspace / session isolation** | unknown |
| Session **identity** | unknown |
| **Actions-event** triggering of sessions | unknown — verify, don't assume |
| `stop` termination | best-effort, not guaranteed |
| Repair/**budget** enforcement | soft convention, not enforced |
| **Preview environment** for QA | unknown |
| **Approval** enforcement | manual policy, verified by humans |
| **External-trust** rule / repo settings | not validated here |

---

## Costs and runners

Costs run on **separate meters**, and exact rates are **not researched here**:

- **GitHub Actions usage** (CI and the `Story PR` workflow) is billed under the
  **Actions** meter, with its own plan, visibility and **OS/runner class**
  pricing.
- **Copilot requests** draw on the **Copilot** quota and billing.
  These are **different** meters under their **current terms**; this document
  quotes **no rates**.
- **Self-hosted runners** do **not** consume the hosted-minute allowance, but
  they are **not blanket free**: they add **infrastructure maintenance, storage
  and security** costs and carry their own **platform terms**.
- A **direct local test is not an Actions job**, and adding a **self-hosted
  runner does not automatically move where the Copilot cloud agent runs**. CI
  should run on an **ephemeral, isolated runner** for untrusted code — **not** a
  developer laptop or an internal network.

---

## Pilot metrics and rollout

Measure what the pilot is for, without inventing universal thresholds:

- **Human time** spent per story, **escaped bugs**, **false "ready"** signals,
  **rework** volume, **stage-detection** accuracy, **cost/overhead**, and
  **confidence**. There are **no universal thresholds** — each is read in context.

Rollout, staged, and **not already solved**:

1. Validate declared **capabilities** against **isolated, seeded defect
   fixtures** — **not** against main-line work.
2. Start **serial, low-risk** stories; then add **UX and cross-model** review;
   then, only if contracts hold, a **parallel** phase.
3. Deliverable order: **capabilities → contracts → agent policy → a native thin
   Action → a live pilot**. **Retire** obsolete pieces **only after human
   verification**. Files that were **moved out externally** must **not be
   resurrected** by a later ship step.

**Future scope is distinct from what is already verified**; this plan does not
mark pilot stages complete.

---

## Open questions

Resolve these with named owners before or during the pilot:

- Who are the authorized **approvers**, and how is their permission checked?
- Which **model providers/models** are approved per role, and how is distinctness
  evidenced?
- What is the concrete **repair budget**, beyond "soft cap of three"?
- What **runner** class and **visibility** does CI use?
- **Browser-data retention** for QA artifacts — what, where, how long?
- The precise **definitions of done** per gate.

When a gate budget is exhausted, **hand the remainder to a human**: record it,
**defer** it to a **separate backlog spec** (not an issue) with evidence. Never
**silently weaken tests** to pass. **Only a human merges**, and there is **no
rebase, amend or force-push** — bring `main` in with a **merge commit**.

---

## Repository file map

Only files known to exist in this repository are listed; no executable router or
Action is invented here.

| Path | Purpose |
|---|---|
| [`.github/agents/*.agent.md`](.github/agents/) | The eight role definitions (declared; links are references, not registration proof) |
| [`.github/copilot-instructions.md`](.github/copilot-instructions.md) | Convention pointing a story-PR session at `discover` or `deliver` (applied by reading, not a native router) |
| [`.github/workflows/story-pr.yml`](.github/workflows/story-pr.yml) | Opens/updates the draft `[Story]` PR and mirrors the spec's description block |
| [`.github/workflows/ci-ui.yml`](.github/workflows/ci-ui.yml), [`ci-api.yml`](.github/workflows/ci-api.yml), [`e2e-playwright.yml`](.github/workflows/e2e-playwright.yml), [`codeql.yml`](.github/workflows/codeql.yml) | CI checks |
| [`.github/workflows/copilot-setup-steps.yml`](.github/workflows/copilot-setup-steps.yml) | Installs Node, .NET and dependencies for the agent |
| [`.github/instructions/*.instructions.md`](.github/instructions/) | UI and API conventions |
| [`AGENTS.md`](AGENTS.md) | Stack, git/PR policy, rules |
| [`REVIEW.md`](REVIEW.md) | The review checklist for every change |
| [`docs/specs/`](docs/specs/) | One spec per story (`YYYY-MM-DD-<slug>.md`); [`_template.md`](docs/specs/_template.md) holds the canonical digest command |
| [`scripts/verify.sh`](scripts/verify.sh) | The one check command; same checks as CI |
| [`ui/`](ui/) | Vite + React + RTK app |
| [`api/`](api/) | .NET 10 API and tests |

---

*This document describes an intended pilot. Treat routing, handoff, isolation,
model selection and budgets as unverified until a human confirms them out of
band; treat approval, review independence and merge as human responsibilities
that no agent discharges on its own.*
