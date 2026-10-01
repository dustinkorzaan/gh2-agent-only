# Add a GET /health endpoint to the API

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

Story: Add a GET /health endpoint to the API so uptime checks and Azure
Container Apps probes can tell the API is running.
Acceptance criteria:
- Given the API is running, when I call GET /health, then it returns 200
  with JSON {"status":"ok"}.

## Problem

The API has no endpoint that uptime monitors or Azure Container Apps health
probes can call to confirm the service is up. Without one, ACA can't do
liveness/readiness checks and external uptime checks have nothing to poll.

## Goals

- Provide a simple, unauthenticated endpoint that reports the API is running.

## Non-goals

- Deep health checks (DB connectivity, dependency checks, etc.) — this is a
  liveness-style check only.
- Wiring the endpoint into ACA probe configuration (Bicep/ACA manifests)
  since those don't exist yet in this repo.

## Acceptance criteria

Each criterion is testable: given <state>, when <action>, then <observable result>.

1. **AC1:** Given the API is running, when I call `GET /health`, then it
   returns HTTP 200 with JSON body `{"status":"ok"}`.

## Affected areas

- [ ] ui (`/ui`)  - [x] api (`/api`)  - [ ] infra  - [ ] workflows / docs

Contracts that apply (see `REVIEW.md`): n/a (no UI consumer, no auth, no
blob/SAS, no data access).

## Assumptions

- No question rounds needed: the story is small and unambiguous, so this
  spec goes straight to "Plan ready for approval".

## Plan

- [ ] 1. Add `GET /health` to `api/gh-api/Program.cs`, returning
      `Results.Ok(new { status = "ok" })`, alongside the existing
      `/api/gh-api/hello` mapping.
- [ ] 2. Add `api/gh-api.tests/HealthEndpointTests.cs` (xUnit, following the
      pattern in `HelloEndpointTests.cs`) asserting AC1: 200 status and JSON
      body `{"status":"ok"}`.
- [ ] 3. Run `scripts/verify.sh` (api) then `scripts/verify.sh --all`.

### Acceptance test files

- api/gh-api.tests/HealthEndpointTests.cs

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

Add a `GET /health` endpoint to the API that returns `200` with JSON
`{"status":"ok"}`, backed by an xUnit test, for uptime checks and ACA probes.
No UI, infra or auth changes needed.

Reply here or in the Agents chat:
`approved` (take all recommendations and build) ·
`approved, but <tweak>`
<!-- pr-description:end -->
