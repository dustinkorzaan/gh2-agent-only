# GitHub-native spec-to-PR agentic delivery

Deliver user stories end to end with GitHub Copilot agents: a written spec, one
explicit human approval, a **separate** explicit start, then an agent-coordinated
delivery that lands a pull request ready for a human to review and squash-merge.
The only moving parts are **agents**, **GitHub Actions** and a **PR** — no GitHub
Issues and no external orchestrator.

Coordination is a **convention** applied by reading role definitions and by humans
starting sessions. Nothing in-repo natively routes, hands off, supervises or
selects a model for an agent; a `@copilot` mention is a **request** to a session a
human (or the cloud agent, where enabled) starts, not a command a parser or router
executes. Runtime behaviour (routing, handoff, isolation, model identity, budgets)
is **not validated here** — treat it as intent. Two rules never bend: **a human
approves the spec and a human squash-merges**, and **claims count only as evidence
a human can check**.

## Three human gates

Everything else is agents doing work and humans checking evidence.

1. **Discovery.** In the **Agents** tab, start `discover` with the rough story as
   the prompt (stories are not filed as issues). It interviews you and writes the
   spec; `architect` and `spec-reviewer` challenge it read-only. They inform you;
   they approve nothing.
2. **Approve, then separately start.** Approve the spec's **Approved scope** with a
   PR comment, then — as a **distinct** request — start delivery. These are two
   separate events on purpose; approval alone never starts code. Delivery then runs
   tests-first, a single writer, and review + QA against one candidate commit.
3. **Final review + merge.** You `rework` within scope, `revise` (which voids
   approval and needs a fresh approval **and** a new start), defer, `stop`, or
   **squash-merge** yourself. Agents never merge.

The step-by-step human guide is the [human playbook](docs/agentic-workflow/human-playbook.md).
How and why the process is shaped this way — the roles, model independence, QA/UX,
concurrency, costs and controls — is in the [process overview](docs/agentic-workflow/process.md).

## The roles

Eight definitions live under [`.github/agents/`](.github/agents/): two human-facing
entry roles (`discover`, `deliver`) and six specialists (`architect`,
`spec-reviewer`, `test-author`, `implementer`, `peer-reviewer`, `qa`). The canonical
one-line-each table — who launches whom, what each reads and writes — is in the
[process overview](docs/agentic-workflow/process.md#who-does-what); it is not
repeated here or in the playbook.

A human does not normally launch eight sessions. Where agent-to-agent handoff isn't
available, the `deliver` **coordinator** carries the `test-author` and `implementer`
responsibilities **sequentially within its own session** by following their
definitions (tests first, then code). That is a documented operating **convention**,
not independent sessions or models, and it is labelled as such — it does not change
the separate role definitions. **Peer review stays a separate session**, and QA is
**preferably separate**; if QA shares the delivery session it must say so. A session
started with a specific specialist selected keeps that role — the routing convention
below never overrides an explicitly chosen agent.

## Approval

Approval is a **PR comment** of the form `@copilot approved <full-head-sha>`, where
`<full-head-sha>` is the current full PR head SHA the agent supplies (no human runs
a shell or computes a hash). It counts only when posted by an **authenticated human
with current write/maintain/admin permission**, confirmed via a permissions check or
a named authorized maintainer — **not** `author_association`, PR authorship, a ticked
checkbox, or the mere act of mentioning `@copilot`. **Bots never approve.** The spec's
Approval record links the original trusted comment (actor, the full commit approved)
and, separately, the explicit delivery start.

Approval covers the **Approved scope** section exactly as it stood at the approved
commit. Before any production or test edit, confirm permission evidence exists, that
the committed Approved scope matches the current one, and that the working tree is
clean of scope changes; if a reference or permission evidence is missing, **ask** —
never fabricate one. Later edits to spec **metadata** (progress, logs, PR block) are
not scope changes; any edit to **Approved scope** voids approval and needs a new
`@copilot approved <new-full-head-sha>` comment and a new, separate start. A
coordinator may **transcribe** a verified approval event into the Approval record
(metadata only — recording is not granting), but production/test edits stay prohibited
until both approval and start are verified. PR/workflow publication supplies **no**
auth gate: keep least-privilege workflow permissions and workflow-run approval on;
don't disable them.

## Candidate SHA and evidence

Every peer-review and QA gate records the **candidate SHA** it ran against, kept as
externally linked PR artifacts. Any change to **code, tests, the base branch, or any
other tracked file** invalidates prior results and re-runs the affected gates against
the latest candidate. A later HEAD may reuse earlier evidence **only** when the diff
from the candidate is a **bookkeeping-only change to the story spec outside Approved
scope** and nothing else; verify that diff is metadata-only and record an explicit
`candidate → HEAD` mapping with the scope confirmed unchanged — never exempt the whole
spec blindly. Do not claim checks ran on HEAD if they ran on an older candidate, and
still require any configured required CI to run on the current head when settings
demand it, even for bookkeeping. When the PR description block's **exact first
non-empty line** is `✅ Ready for human review`, the draft publishes; the marker is
cosmetic and authorizes nothing.

## The stack and the one check command

- **UI** — [`ui/`](ui/): Vite + React + Redux Toolkit.
- **API** — [`api/`](api/): C# / .NET 10.
- **Infra** — Bicep / Azure Container Apps, Entra ID, Azure SQL DB.
- **Files** — blob access **only via short-lived, least-privilege SAS URIs** issued
  by the API with its managed identity; file bytes never transit the API.

Contracts and per-area conventions are in [`AGENTS.md`](AGENTS.md),
[`REVIEW.md`](REVIEW.md) and [`.github/instructions/`](.github/instructions/). There
is **one check command**: [`scripts/verify.sh`](scripts/verify.sh) — same checks as CI
for what changed versus `origin/main`, with **no args** (changed areas), **`--all`**,
**`--list`** and **`<path>...`** modes. It skips an area until it exists. **"Done"
means `scripts/verify.sh --all` is green**, and required automated checks are never
waived for scope or risk. **Low-risk pilot only:** authentication/authorization,
destructive migrations and production deployment are **out of the pilot** and need a
separate human risk decision. Costs, runners and pilot metrics are covered in the
[process overview](docs/agentic-workflow/process.md#costs-and-runners).
