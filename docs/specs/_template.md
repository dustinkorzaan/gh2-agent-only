# <Title>

- **Status:** discovery | approved | awaiting-start | delivering | blocked | ready | merged
- **Risk tier:** low | moderate | high  (high is excluded from the initial pilot)
- **Started:** <date>, from the Agents tab · **PR:** #<pr>

`merged` is only ever set by a human squash-merge; no agent sets it.

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

## Approved scope (stable; digest-covered)

Everything between the markers below is the approved contract. Edit it **only**
during discovery or an approved revision, and keep all mutable material (tick
lists, review logs, progress, timestamps) **outside** the markers so the digest
stays stable once approved.

The approval digest is the SHA-256 of the exact bytes **between** the markers,
as committed — UTF-8, LF line endings, no normalisation, marker lines excluded.
It is self-contained (it never covers the digest value itself), so the canonical
way to compute or re-check it needs no project script:

```
set -o pipefail
git show '<candidate-commit>:docs/specs/<this-file>.md' |
  awk '/^<!-- approved-scope:end -->$/{f=0} f; /^<!-- approved-scope:start -->$/{f=1}' |
  sha256sum
```

Replace the placeholders with the committed candidate and spec path; require
exactly one start marker followed by exactly one end marker before accepting
the result. Commit scope edits before computing it. At preflight, compare the
current committed scope digest with the approved one and reject uncommitted
scope changes; working-tree line-ending conversion must not change the key.

<!-- approved-scope:start -->

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

### Plan (draft)

Ordered tasks are part of the approved scope; their *completion* is tracked in
`## Plan status` below (outside the digest), not here.

- 1. ...

<!-- approved-scope:end -->

## Approval record

Approval is a **trusted human event**, not a ticked checkbox and not
`author_association`.

- **Approved digest:** <sha256 of the Approved scope block>
- **Approved by:** @<user> — verified **write/maintain/admin** on this repo
- **Event:** <link to the PR review or Agents-tab approval> · <timestamp>
- **Candidate commit at approval:** <sha> — external evidence only. The spec's
  own blob OID changes every time Progress is ticked, so it is **not** the
  approval key; the digest above is.

Delivery is authorised by a **separate, explicit** human event that references
the approved digest (approval alone never starts implementation):

- **Delivery started by:** @<user> · <link> · <timestamp> · references digest <sha256>

If the live Approved scope digest no longer equals the Approved digest, approval
is **void** — see the scope-change rule under `## Progress`.

## Story

<The story prompt, copied verbatim. It isn't stored anywhere else.>

## Affected areas

- [ ] ui (`/ui`)  - [ ] api (`/api`)  - [ ] infra  - [ ] workflows / docs

Contracts that apply (see `REVIEW.md`): <API contract ↔ RTK, SAS-only blobs, Entra ID auth, or "n/a">

## Plan status

Completion of the approved Plan tasks (mutable; **outside** the digest). Tick
each when pushed.

- [ ] 1. ...

### Acceptance test files

- <path>

## Revisions

Each row is an approved scope change: it supersedes the Approval record with a
new digest.

| Rev | Request (verbatim) | Starting sha | New approved digest | Approved (event, @user, timestamp) |
|---|---|---|---|---|

## Risk tier

- **low / moderate:** normal delivery.
- **high:** excluded from the initial pilot. Authentication/authorization
  changes, destructive migrations, and production deployment require a separate
  human risk decision and stronger controls before delivery is authorized.

<exclusions, or "n/a">

## Review log (advisory gates)

Each gate is an independent second opinion, **not** an approval or merge.
Record the **candidate SHA** it ran against — a verdict on a stale SHA does not
count. Peer-review independence, including any claim it ran on a different or
higher-capability model, is **unverified** unless a human confirms it.

| Round | Gate | Candidate sha | Findings | Resolution (commit / reason) |
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
