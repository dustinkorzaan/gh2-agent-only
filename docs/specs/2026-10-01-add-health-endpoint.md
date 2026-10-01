# Add a GET /health endpoint to the API

- **Status:** shipped
- **Started:** 2026-10-01, from the Agents tab · **PR:** #<pr>
- **Mode:** interactive

## Progress

The `ship` agent ticks each item only after it is finished and pushed. A new
session resumes from the first unticked item.

- [x] Spec and plan written
- [x] Approved (by @dustinkorzaan, 2026-10-01, tweaks: none)
- [x] Acceptance tests written
- [x] Implementation (all Plan tasks ticked)
- [x] Verify gate green
- [x] Peer review clean
- [x] Final review: SHIP
- [x] PR description updated, ready for human review

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
- Approved as-is, no answers or tweaks.

## Plan

- [x] 1. Add `GET /health` to `api/gh-api/Program.cs`, returning
      `Results.Ok(new { status = "ok" })`, alongside the existing
      `/api/gh-api/hello` mapping.
- [x] 2. Add `api/gh-api.tests/HealthEndpointTests.cs` (xUnit, following the
      pattern in `HelloEndpointTests.cs`) asserting AC1: 200 status and JSON
      body `{"status":"ok"}`.
- [x] 3. Run `scripts/verify.sh` (api) then `scripts/verify.sh --all`.

### Acceptance test files

- api/gh-api.tests/HealthEndpointTests.cs

## Revisions

| Rev | Request (verbatim) | Starting sha | Approved |
|---|---|---|---|

## Review log

| Round | Gate | Findings | Resolution (commit / reason) |
|---|---|---|---|
| 1 | Verify | `scripts/verify.sh api` then `--all`: all PASS (ui, api, e2e, shell) | n/a — green first round |
| 1 | Peer review | Diff limited to Program.cs + new test file; matches REVIEW.md (tested, no secrets, no auth needed, unauthenticated health endpoints are conventional, no config/doc changes needed since no existing endpoint docs exist) | n/a — clean first round |
| 1 | Final review | AC1 proven by `HealthEndpointTests.GetHealthReturnsOkStatus`: asserts 200 + `{"status":"ok"}` against `Program.cs`'s `/health` mapping | SHIP |

## Open issues

<Anything still failing or deferred after 3 rounds, with the next step. Empty when shipped.>

## PR description

The `Story PR` workflow copies the text between the markers into the PR
description on every push. Keep the markers; edit only between them.

<!-- pr-description:start -->
✅ Ready for human review

## Summary

Added a `GET /health` endpoint to the API returning `200` with JSON
`{"status":"ok"}`, for uptime checks and Azure Container Apps probes.

## Spec

docs/specs/2026-10-01-add-health-endpoint.md

## Acceptance criteria → evidence

| # | Criterion | Evidence (test / check) |
|---|---|---|
| AC1 | `GET /health` returns 200 with `{"status":"ok"}` | `api/gh-api.tests/HealthEndpointTests.cs::GetHealthReturnsOkStatus` |

## Verify

`scripts/verify.sh --all`: PASS — ui:install, ui:lint, ui:build, ui:test,
api:restore, api:build, api:test, e2e:playwright, shell:syntax.

## Areas touched

api

## Config / infra changes

none

## Review notes and follow-ups

No assumptions, no open issues. Deep health checks (DB/dependency checks)
and ACA probe wiring are explicitly out of scope per the spec's Non-goals.
<!-- pr-description:end -->
