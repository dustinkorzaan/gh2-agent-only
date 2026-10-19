# Human playbook

> **Working document for PR #7.** This is what a person does, step by step, to
> take one story through the agents in `.github/agents/`. Background on why
> the process looks like this is in [`process.md`](process.md). It assumes
> nothing has been proven about agent-to-agent handoff, so **you** launch
> each role. Once handoff is shown to work, skip the launches it makes
> unnecessary.

You make four decisions per story. Everything else is checking evidence:

1. **Is the scope right?** You approve the spec with a PR comment.
2. **Go.** You start delivery.
3. **Is this candidate good enough?** You decide on rework, revise or merge.
4. **Merge.** You squash-merge.

---

## 0. One-time setup (repo admin)

- [ ] **Settings → Copilot → Cloud agent:** enabled. Leave *Require approval
      for workflow runs* **on** until the review's round-2 finding 1 is fixed:
      with it off, a Copilot push that edits a workflow runs that edit
      immediately, with write access to the PR.
- [ ] **Settings → Actions → General → Workflow permissions:** read-only, with
      *Allow GitHub Actions to create and approve pull requests* ticked
      (`story-pr.yml` needs it to open PRs; it never approves).
- [ ] **Settings → General → Pull Requests:** squash merging only.
- [ ] **Branch protection on `main`:** require a PR, require the CI checks
      that report on every PR (the `gh-build-and-test-success` jobs and CodeQL;
      **not** E2E, which is path-filtered and never reports on docs-only PRs),
      and require one human approving review. This is what turns "humans merge" from a convention into
      a hard control.
- [ ] Agree who may approve specs (people with write/maintain/admin) and write
      it down in the team channel.
- [ ] Decide the model policy for peer review (see step 6) **before** the
      first story, so nobody improvises it under pressure.
- [ ] In the **Agents** tab, confirm all eight agents appear in the agent
      picker. Note any that don't: an agent that isn't listed has to be run by
      pasting its definition into the prompt.

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

**Expect:** a branch `copilot/…` and a draft `[Story] …` PR opened by the
`Story PR` workflow. `discover` asks at most about four questions, each with a
recommended answer.

**You:** answer each question explicitly. Don't reply with a bare "yes": any
default you accept becomes part of the contract. If an answer changes the
scope, say so in plain words.

## 2. Challenge the spec (architect + spec-reviewer)

If `discover` reports that it launched both reviewers, go to step 3.
Otherwise launch each one yourself as a separate task on the same PR, so the
two reviews stay independent:

**Agents tab → agent `architect`** (on the story PR / branch):

```
Review the draft spec on this branch (docs/specs/<file>.md) as architect.
Read-only. Return verdict design-ok or revise, design risks + mitigations,
and the confirmed risk tier.
```

**Agents tab → agent `spec-reviewer`**:

```
Review the draft spec on this branch (docs/specs/<file>.md) as spec-reviewer.
Read-only. Return verdict spec-ok or revise, with BLOCKING/SHOULD/NIT findings
tied to specific lines.
```

**You:** if either reviewer says `revise`, paste its findings back to
`discover` (PR comment `@copilot` or the discover chat) and repeat. Don't
approve over a BLOCKING finding without writing down why.

## 3. Approve the scope (decision 1)

1. Read the spec's **Approved scope** section in *Files changed*. That
   section is what you approve. Check:
   - [ ] Every AC is a given/when/then you could test.
   - [ ] Negative cases exist (unauthenticated, empty, oversized, expired SAS…).
   - [ ] Non-goals are listed.
   - [ ] The risk tier matches the change. **`high`** (auth, destructive
         migration, production deploy) is **outside the pilot**: stop here
         and escalate.
2. Comment on the PR:

   ```
   @copilot approved
   ```

   That comment is the approval. The agent records its link in the spec's
   Approval record. If you edit the Approved scope afterwards, or ask for
   a change to it, approve again with a new comment.

## 4. Start delivery (decision 2)

This is a **separate** action from approval, on purpose.

**Agents tab → agent `deliver`** on the story PR (or comment
`@copilot deliver`):

```
deliver
Approval: <link to your approved comment>
Start: this message, by @<you>.
Record both in the spec's Approval record, check the Approved scope hasn't
changed since the approval comment, check the risk tier, then run the
delivery loop.
```

**Expect:** `deliver` fills in the Approval record and ticks Approved in
Progress. If it **stops and asks** because it can't find your approval
comment, reply with the comment link.

## 5. Tests, then implementation

If `deliver` runs these itself, just watch the PR. Otherwise launch them in
order, one at a time (never two writers at once):

**agent `test-author`**:

```
Write the acceptance tests for the approved spec docs/specs/<file>.md.
Test files only, failing first, one test per AC plus its negative cases.
Push and list criteria → test files.
```

**agent `implementer`** (after test-author has pushed):

```
Implement the approved plan in docs/specs/<file>.md, task by task. Keep
scripts/verify.sh green, ≤3 repairs per failing gate, escalate early on
repeated failures. Push, then report the candidate SHA.
```

**You:** watch CI on the PR. Write down the **candidate SHA**: the commit
where `scripts/verify.sh --all` and CI are both green.

## 6. Peer review and QA at the candidate SHA

Both of these are **read-only** and run against that exact SHA.

**agent `peer-reviewer`**. Pick a **different model** than the implementer
used, if the model picker lets you:

```
Review PR #<n> at candidate SHA <sha> against docs/specs/<file>.md and
REVIEW.md. Read-only. Return pass or rework with BLOCKING/SHOULD/NIT findings
(file:line), and the shared evidence record (model: actual or "unknown").
```

If you can't confirm a different model was used, apply your team's step-0
policy. Typically that means a human reviewer does a short independent pass
on top.

**agent `qa`**:

```
QA PR #<n> at candidate SHA <sha> from docs/specs/<file>.md: exercise every AC
and its negative cases against the running app (synthetic data only). Classify
each check pass / fail / unverified / n-a and link artifacts.
```

For the pilot, expect `qa` to cover the Playwright E2E flows against the local
dev servers and to mark preview-environment checks `unverified`.

**Then:** if either one says rework or fail, send the findings to
`implementer`. That produces a new SHA, and **both gates run again on it**.

## 7. Decide (decision 3)

When the PR description starts with **✅ Ready for human review**, the PR
leaves draft. Before you decide, check:

- [ ] The Review log has a peer-review and a QA row naming the **current head
      SHA**. A row for an older SHA is stale.
- [ ] Every AC maps to a test and to QA evidence. No QA check is `unverified`
      without a reason you accept.
- [ ] CI on the head commit is green and actually ran (open the Checks tab;
      don't assume).
- [ ] The diff stays inside the Approved scope. Run `REVIEW.md`'s *Scope* item.
- [ ] No test was deleted, skipped or loosened. Read
      `git diff origin/main...HEAD -- '*test*' '*e2e*'`.

Then choose:

| You want | Do this |
|---|---|
| Fixes within the approved scope | PR review comments, then `@copilot rework <sha>: <summary>` (or launch `implementer`). Gates re-run on the new SHA. |
| A change to what the story does | `@copilot revise: <change>`. This **voids approval**: back to step 3 for a new `approved` comment, and step 4 again. |
| To pause | Tell the session `stop`, then confirm in the Agents tab that it actually stopped. |
| To ship | Step 8. |

## 8. Merge (decision 4)

- [ ] Bring `main` in first if it moved (`@copilot` merge `origin/main` in with a
      merge commit, never rebase), then re-check CI on the new head.
- [ ] **Squash and merge.** Only a human does this.
- [ ] If other story PRs are open, merge them one at a time and bring the new
      `main` into the next one before reviewing it.

---

## When things go wrong

| Situation | What to do |
|---|---|
| Session stopped mid-way (timeout, ~1h) | Launch the same agent with `continue`. It resumes from the first unticked Progress item and must re-verify approval first. |
| `deliver` refuses to start | Read why. Usually the approval comment is missing, the Approved scope changed after it, or the tier is `high`. Fix the cause; don't talk it past the gate. |
| Approved scope edited after approval | Treat it as a revise: approve again with a new comment. |
| Same failure 2–3 times | Expected escalation. Decide whether the plan is wrong (revise) or a human should fix it. |
| CI didn't run on the latest push | PRs opened by `GITHUB_TOKEN` may not trigger CI. Push a commit yourself, or re-run from the Checks tab if a run exists. Don't treat a missing run as green. |
| Reviewer model unknown | Apply the step-0 policy (e.g. add a human review). Record it in the Review log. |
| Agent says it did something you can't see | It didn't count. Evidence is a link, a commit or a check run. |
| `Story PR` workflow failed with "more than one new spec" | A story branch must add exactly one spec. Remove the extra one. |

## Pilot log (one row per story)

Keep this in a team doc or spreadsheet, not in the repo.

| Story PR | Risk | Human minutes | Sessions launched | Repair rounds | Escalations | False "ready"? | Escaped defects (30 days) |
|---|---|---|---|---|---|---|---|
