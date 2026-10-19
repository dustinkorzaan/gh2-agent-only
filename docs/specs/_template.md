# <Title>

- **Status:** discovery | approved | awaiting-start | delivering | blocked | ready
- **Started:** <date>, from the Agents tab · **PR:** #<pr>

The **PR merge itself is authoritative** for "merged" — a squash-merge does not
edit this file, so no session needs to set a `merged` status. A delivery session
leaves Status at `ready`; a human may optionally note the merge here or in an
external record after the fact. The **Risk tier** is declared inside the
`Approved scope` section, not here, so lowering it after approval counts as a
scope change.

## Progress

A **resume hint**, not proof of approval: it tells a new session which phase to
pick up from (the first unticked item), nothing more. The authority for "is this
approved?" is the `## Approval record` below. A resuming session must re-verify
approval before writing any code.

- [ ] Spec and plan written
- [ ] Approved (see `## Approval record`)
- [ ] Acceptance tests written
- [ ] Implementation (all Plan tasks ticked)
- [ ] Verify gate green
- [ ] Peer review clean
- [ ] QA clean
- [ ] PR description updated, ready for human review

A scope change voids approval: untick everything from Approved down, return
Status to `discovery`, and record it under `## Revisions` before re-approval.

## Approved scope

This section is the approved contract. Edit it **only** during discovery or an
approved revision. Keep mutable material (tick lists, review logs, progress,
timestamps) in the sections after it. Any edit to this section after approval
is a scope change and needs a new approval comment.

### Risk tier

<low | moderate | high — part of the approved scope, so lowering it after
approval needs a new approval. high is excluded from the initial pilot and needs a
separate human risk decision; see `## Risk tier` for the detail.>

### Problem

<What is wrong or missing, for whom, and why now. 2-5 sentences.>

### Goals

- <outcome>

### Non-goals

- <explicitly out of scope>

### Acceptance criteria

Each criterion is testable: given <state>, when <action>, then <observable result>.

1. **AC1:** ...
2. **AC2:** ...

### Constraints

- <auth scopes, schema, blob/SAS, performance, compatibility, …>

### Assumptions

<Decisions made without asking. Each one says what was assumed and why.>

### Design

<Shape of the change: components touched, contracts, data flow. Enough for an
independent reviewer to judge feasibility.>

### Verification

<How each AC will be proven: which tests/checks, what evidence counts.>

### Acceptance test files

Planned acceptance-test paths are part of the approved contract (edited only
during discovery / an approved revision).

- <path>

### Plan (draft)

Ordered tasks are part of the approved scope; their *completion* is tracked in
`## Plan status` below, not here.

- 1. ...


## Approval record

Approval is a **PR comment** on this story PR of the form
`@copilot approved <full-head-sha>`, posted by a **human with write/maintain/admin
permission** (verified by permission, not `author_association`); bots never
approve. The `<full-head-sha>` is the current full PR head SHA the agent supplied —
no human computes a hash. A ticked checkbox or an agent's own statement is not
approval. A coordinator may transcribe this verified event here (recording is not
granting).

- **Approved by:** @<user> · <link to the approval comment> · <timestamp>
- **Approved at commit:** <full head sha named in the comment>

Delivery is started by a **separate, explicit** human request (approval alone
never starts implementation):

- **Delivery started by:** @<user> · <link> · <timestamp>

If the `Approved scope` section changes after the approval comment, approval is
**void**. See the scope-change rule under `## Progress`.

## Story

<The story prompt, copied verbatim. It isn't stored anywhere else.>

## Affected areas

- [ ] ui (`/ui`)  - [ ] api (`/api`)  - [ ] infra  - [ ] workflows / docs

Contracts that apply (see `REVIEW.md`): <API contract ↔ RTK, SAS-only blobs, Entra ID auth, or "n/a">

## Plan status

Completion of the approved Plan tasks (mutable; **outside** the approved scope). Tick
each when pushed.

- [ ] 1. ...

## Revisions

Each row is an approved scope change: its approval comment supersedes the
Approval record.

| Rev | Request (verbatim) | Starting sha | Approved (comment link, @user, timestamp) |
|---|---|---|---|

## Risk tier

The tier is declared inside the `Approved scope` section above, so approval
covers it and lowering it needs a new approval.

- **low / moderate:** normal delivery.
- **high:** excluded from the initial pilot. Authentication/authorization
  changes, destructive migrations, and production deployment require a separate
  human risk decision and stronger controls before delivery is authorized.

<exclusions, or "n/a">

## Review log (advisory gates)

Each gate is an independent second opinion, **not** an approval or merge.
Record the **candidate SHA** it ran against — a verdict on a stale SHA does not
count. When a later HEAD only adds a **bookkeeping-only** change to this spec
outside `Approved scope`, note the simple `candidate → HEAD` mapping (optional
free-text; no schema) rather than re-running; any other tracked-file change
re-runs the affected gate. Peer-review independence, including any claim it ran
on a different or higher-capability model, is **unverified** unless a human
confirms it.

| Round | Gate | Candidate sha (→ HEAD if bookkeeping-only) | Findings | Resolution (commit / reason) |
|---|---|---|---|---|

Repairs are **soft-capped** at 3 rounds per gate plus a global budget across
gates. "Soft" means it is a convention this process tries to honour, not a hard
kill switch; on reaching the cap, stop and hand the remaining issues to a human
under `## Open issues`.

## QA / UX matrix

Synthetic data only — no production or personal data. Link every artifact
(screenshot, recording, log); never invent a status.

| Case | Data (synthetic) | Baseline | Result | Artifact |
|---|---|---|---|---|

## Open issues

<Anything still failing or deferred after 3 rounds, with the next step. Empty when shipped.>

## PR description

The `Story PR` workflow copies the text between the markers into the PR
description on every push. Keep the markers; edit only between them.

<!-- pr-description:start -->
Spec and plan in progress.
<!-- pr-description:end -->
