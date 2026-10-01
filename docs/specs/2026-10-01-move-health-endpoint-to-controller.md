# Move the health endpoint into a controller

- **Status:** draft
- **Started:** 2026-10-01, from the Agents tab · **PR:** #<pr>
- **Mode:** interactive

## Progress

The `ship` agent ticks each item only after it is finished and pushed. A new
session resumes from the first unticked item.

- [x] Spec and plan written
- [ ] Approved (by @<user>, <date>, tweaks: <none>)
- [ ] Acceptance tests written
- [ ] Implementation (all Plan tasks ticked)
- [ ] Verify gate green
- [ ] Peer review clean
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
- No question round needed; the route and response are already established, so
  this plan is ready for approval.

## Plan

- [ ] 1. Add a health controller and register/map controller endpoints in
      `api/gh-api/Program.cs`, keeping `GET /health` and its current response.
- [ ] 2. Update `api/gh-api.tests/HealthEndpointTests.cs` to assert the existing
      health route still returns HTTP 200 with `{"status":"ok"}` through the
      controller.
- [ ] 3. Run `scripts/verify.sh` for the API changes, then
      `scripts/verify.sh --all`.

### Acceptance test files

- `api/gh-api.tests/HealthEndpointTests.cs`

## Revisions

| Rev | Request (verbatim) | Starting sha | Approved |
|---|---|---|---|

## Review log

| Round | Gate | Findings | Resolution (commit / reason) |
|---|---|---|---|

## Open issues

<Anything still failing or deferred after 3 rounds, with the next step. Empty when shipped.>

## PR description

The `Story PR` workflow copies the text between the markers into the PR
description on every push. Keep the markers; edit only between them.

<!-- pr-description:start -->
## Plan ready for approval

- Move the health endpoint from `Program.cs` into a controller.
- Preserve `GET /health` and the existing `{"status":"ok"}` response.
- Update the endpoint test to cover the controller-backed route.
- Verify the API changes and run the full repository checks.
- No other behavior or infrastructure changes are in scope.

Reply here or in the Agents chat:
`approved` (take the recommendation and build) ·
`approved, but <tweak>`
<!-- pr-description:end -->
