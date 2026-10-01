# Move the health endpoint into a controller

- **Status:** in-progress
- **Started:** 2026-10-01, from the Agents tab · **PR:** #<pr>
- **Mode:** interactive

## Progress

The `ship` agent ticks each item only after it is finished and pushed. A new
session resumes from the first unticked item.

- [x] Spec and plan written
- [x] Approved (by @dustinkorzaan, 2026-10-01, tweaks: none; approved in Agents chat)
- [x] Acceptance tests written (existing `HealthEndpointTests.GetHealthReturnsOkStatus` covers AC1)
- [x] Implementation (all Plan tasks ticked)
- [x] Verify gate green
- [x] Peer review clean
- [ ] Final review: SHIP
- [ ] PR description updated, ready for human review

`@copilot revise: ...` unticks everything from Approved down; see
`## Revisions`.

## Story

Move the health endpoint into a controller, adjust the path if needed

## Problem

The health endpoint is currently mapped directly in `Program.cs`, while the API
is moving toward controller-based endpoints. Moving it into a controller should
keep the health check available to existing probes and callers.

## Goals

- Handle the health endpoint through an API controller rather than a minimal
  API route.
- Preserve the existing health response and route unless a controller
  requirement makes a path change necessary.

## Non-goals

- Add dependency or database health checks.
- Change the health response payload or configure infrastructure probes.

## Acceptance criteria

Each criterion is testable: given <state>, when <action>, then <observable result>.

1. **AC1 (proposed):** Given the API is running, when I call `GET /health`,
   then it returns HTTP 200 with JSON body `{"status":"ok"}`.

## Affected areas

- [ ] ui (`/ui`)  - [x] api (`/api`)  - [ ] infra  - [ ] workflows / docs

Contracts that apply (see `REVIEW.md`): n/a (no UI consumer, no auth, no
blob/SAS, no data access).

## Assumptions

- Keep the current `/health` path: the existing health endpoint and its test
  already establish it as the health-check URL, and controller routing can
  preserve it.
- Approved as-is by @dustinkorzaan on 2026-10-01 in the Agents chat; no answers
  or tweaks.

## Plan

- [x] 1. Add a health controller and register/map controller endpoints in
      `api/gh-api/Program.cs`, keeping `GET /health` and its current response.
- [x] 2. Reuse the existing assertion in
      `api/gh-api.tests/HealthEndpointTests.cs` that the health route returns
      HTTP 200 with `{"status":"ok"}`.
- [x] 3. Run `scripts/verify.sh` for the API changes, then
      `scripts/verify.sh --all`.

### Acceptance test files

- `api/gh-api.tests/HealthEndpointTests.cs`

## Revisions

| Rev | Request (verbatim) | Starting sha | Approved |
|---|---|---|---|

## Review log

| Round | Gate | Findings | Resolution (commit / reason) |
|---|---|---|---|
| 1 | Verify | `scripts/verify.sh` and `scripts/verify.sh --all` passed, including API, UI, E2E and shell checks. | n/a — green first round |
| 1 | Peer review | No findings; controller preserves the tested path and response, and scope/checklist are clean. | n/a — clean first round |

## Open issues

<Anything still failing or deferred after 3 rounds, with the next step. Empty when shipped.>

## PR description

The `Story PR` workflow copies the text between the markers into the PR
description on every push. Keep the markers; edit only between them.

<!-- pr-description:start -->
✅ Implementation and verification complete

- Health now serves through an MVC controller while preserving `GET /health` and `{"status":"ok"}`.
- AC1 is covered by `HealthEndpointTests.GetHealthReturnsOkStatus`.
- `scripts/verify.sh` and `scripts/verify.sh --all` passed.
- Peer review found no issues; final review is pending.
<!-- pr-description:end -->
