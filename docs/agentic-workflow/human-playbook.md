# Human playbook

What a person does, step by step, to take one story through the agents in
`.github/agents/`. Why the process looks like this is in [`process.md`](process.md);
the operator overview is the root [`README.md`](../../README.md). This guide
repeats none of the authority rules — it points at them.

You make four decisions per story; everything else is checking evidence:

1. **Is the scope right?** You approve the spec with a PR comment.
2. **Go.** You start delivery — a separate action.
3. **Is this candidate good enough?** Rework, revise, or merge.
4. **Merge.** You squash-merge.

A human does **not** normally launch eight sessions. Where handoff isn't
available, `deliver` runs tests-then-code itself; you launch the separate
**peer review** (and, preferably, **QA**).

---

## 0. One-time setup (repo admin)

- [ ] **Settings → Copilot → Cloud agent:** enabled. Keep *Require approval for
      workflow runs* **on** — otherwise a Copilot push that edits a workflow runs
      that edit immediately with write access to the PR. This is a **policy**
      control, not a hard gate.
- [ ] **Settings → Actions → General → Workflow permissions:** read-only, with
      *Allow GitHub Actions to create and approve pull requests* ticked
      (`story-pr.yml` needs it to open PRs; it never approves).
- [ ] **Settings → General → Pull Requests:** squash merging only.
- [ ] **Branch protection on `main`:** require a PR and **one human approving
      review** (this, backed by permissions, is what makes "humans merge" a real
      control — branch rules require *a reviewer*, not literally "only humans",
      unless permissions enforce it). Require the status checks that report on
      **every** PR:
      - Both `CI - API` and `CI - UI` expose a job named
        **`gh-build-and-test-success`** — the **same check name from two different
        workflows**. Add **both** to the required list (disambiguated by workflow);
        a single `gh-build-and-test-success` entry does **not** prove both ran.
      - **CodeQL** reports per language (`Analyze (javascript-typescript)`,
        `Analyze (csharp)`). Inspect `codeql.yml`'s triggers before requiring it,
        so you require only checks that actually run on PRs.
      - **Do not** require **E2E - Playwright**: it is **path-filtered** and does
        not report on docs-only PRs, so a blanket requirement would wedge them.
- [ ] Agree who may approve specs (write/maintain/admin) and write it in the team
      channel; approval is checked by **permission**, not `author_association`.
- [ ] Decide the peer-review model policy (step 6) **before** the first story.
- [ ] In the **Agents** tab, confirm the agents appear in the picker. Any that
      don't must be run by pasting the definition into the prompt.

## 1. Start the story (discover)

**Agents tab → New task → agent `discover`**. Paste:

```
Story: <what you want, for whom, and why>

Acceptance criteria (optional — discover proposes them):
- Given <state>, when <action>, then <observable result>

Areas: ui / api / infra
Out of scope: <…>
Constraints: <auth scopes, schema, blob/SAS, …>
```

**Expect:** a `copilot/…` branch and a draft `[Story] …` PR from the `Story PR`
workflow. `discover` asks at most a few questions, each with a recommended answer.

**You:** answer each explicitly. Don't reply "yes" — any default you accept becomes
part of the contract.

## 2. Challenge the spec (architect + spec-reviewer)

If `discover` reports it launched both reviewers, go to step 3. Otherwise launch
each as a separate read-only task on the same PR so the two reviews stay
independent:

```
Review the draft spec on this branch (docs/specs/<file>.md) as <architect|spec-reviewer>.
Read-only. Return your verdict and findings tied to specific lines.
```

**You:** if either says `revise`, paste the findings back to `discover` and repeat.
Don't approve over a BLOCKING finding without writing down why.

## 3. Approve the scope (decision 1)

1. Read the spec's **Approved scope** in *Files changed* — that is what you approve.
   Check each AC is testable, negative cases exist, non-goals are listed, and the
   **risk tier** matches. **`high`** (auth, destructive migration, production
   deploy) is **outside the pilot** — stop and escalate.
2. Comment on the PR, using the **full head SHA the agent supplies** (read the
   latest head in the PR; you don't compute anything):

   ```
   @copilot approved <full-head-sha>
   ```

   That comment is the approval; the agent records its link and the SHA in the
   Approval record. Edit the Approved scope afterwards and you must approve again
   with a new comment naming the new SHA.

## 4. Start delivery (decision 2)

A **separate** action from approval, on purpose.

```
@copilot deliver
Approval: <link to your approved comment> (@you, <full-head-sha>)
Record approval + this start in the Approval record, confirm the Approved scope
hasn't changed since that SHA and the risk tier, then run the delivery loop.
```

**Expect:** `deliver` fills in the Approval record and ticks Approved in Progress.
If it **stops and asks** (missing approval, scope changed, or `high` tier), fix the
cause — don't talk it past the gate.

## 5. Tests, then implementation

If `deliver` runs these itself, watch the PR. Otherwise launch, in order, one at a
time (never two writers):

```
agent test-author: Write acceptance tests for docs/specs/<file>.md. Test files
only, failing first, one per AC plus negative cases. Push and map criteria → files.
```

```
agent implementer: Implement the approved plan in docs/specs/<file>.md task by
task. Keep scripts/verify.sh green, ≤3 repairs per failing gate, escalate early.
Push, then report the candidate SHA.
```

**You:** write down the **candidate SHA** — the commit where `scripts/verify.sh
--all` and required CI are both green on the head.

## 6. Peer review and QA at the candidate SHA

Both are **read-only** against that exact SHA.

```
agent peer-reviewer: Review PR #<n> at candidate SHA <sha> against docs/specs/<file>.md
and REVIEW.md. Read-only. Return pass or rework with findings (file:line) and the
model record (actual or "unknown").
```

Pick a **different model** than the implementer used if the picker lets you. If you
can't confirm a different model, apply your step-0 policy (typically a short human
independent pass) and record it — don't claim diversity.

```
agent qa: QA PR #<n> at candidate SHA <sha> from docs/specs/<file>.md: exercise
every AC and its negative cases against the running app (synthetic data only).
Classify each check pass / fail / unverified / n-a and link artifacts.
```

For the pilot, `qa` drives the real Playwright setup (it starts API + UI together);
mark preview-only or extra-matrix checks `unverified` rather than blocking all.

**Then:** if either says rework/fail, send findings to `implementer`. That makes a
new SHA, and **both gates run again on it** before Ready.

## 7. Decide (decision 3)

When the PR description's first line is **✅ Ready for human review**, it leaves
draft. Before deciding, check: the Review log has a peer-review **and** a QA row
naming the **current head SHA**, or the tested candidate with a verified
bookkeeping-only `candidate → HEAD` mapping (Approved scope unchanged and no
other tracked-file changes); every AC maps to a test and QA evidence; CI on the
head actually ran (open Checks); the diff stays in Approved scope; no test was
deleted, skipped or loosened (`git diff origin/main...HEAD -- '*test*' '*e2e*'`).

| You want | Do this |
|---|---|
| Fixes within scope | `@copilot rework <sha>: <summary>`. Gates re-run on the new SHA. |
| Change what the story does | `@copilot revise: <change>` — **voids approval**: back to step 3 (new `approved <sha>`) and step 4. |
| Pause | Tell the session `stop`, then confirm it stopped. |
| Ship | Step 8. |

## 8. Merge (decision 4)

- [ ] If `main` moved, `@copilot sync` brings it in with a **merge commit** (never
      rebase); re-check CI on the new head.
- [ ] **Squash and merge.** Only a human does this.
- [ ] Merge open story PRs one at a time, bringing new `main` into the next first.

---

## When things go wrong

| Situation | What to do |
|---|---|
| Session stopped mid-way (timeout) | Launch the same agent with `continue`; it re-verifies approval before any code. |
| `deliver` refuses to start | Usually the approval comment is missing, the scope changed, or the tier is `high`. Fix the cause. |
| Approved scope edited after approval | Treat as revise: approve again with a new `approved <sha>` comment. |
| Same failure 2–3 times | Expected escalation: decide revise or a human fix. |
| CI didn't run on the latest push | PRs opened by `GITHUB_TOKEN` may not trigger CI. Push a commit yourself; don't treat a missing run as green. |
| Reviewer model unknown | Apply the step-0 policy (add a human review); record it. |
| Agent says it did something you can't see | It didn't count. Evidence is a link, a commit or a check run. |
| `Story PR` failed with "more than one new spec" | A story branch adds exactly one spec; remove the extra. |

## Pilot log (one row per story)

Keep this in a team doc, not the repo.

| Story PR | Risk | Human minutes | Sessions launched | Repair rounds | Escalations | False "ready"? | Escaped defects (30 days) |
|---|---|---|---|---|---|---|---|
