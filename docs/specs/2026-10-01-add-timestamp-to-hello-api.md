# Add Timestamp to Hello API Response

- **Status:** draft
- **Started:** 2026-10-01, from the Agents tab · **PR:** pending
- **Mode:** interactive

## Progress

- [x] Spec and plan written
- [ ] Approved (by @<user>, <date>, tweaks: <none>)
- [ ] Acceptance tests written
- [ ] Implementation (all Plan tasks ticked)
- [ ] Verify gate green
- [ ] Peer review clean
- [ ] Final review: SHIP
- [ ] PR description updated, ready for human review

## Story

Add a timestamp to the Hello World API response.

## Problem

The Hello World API currently returns only a greeting, so clients cannot tell when the response was generated. Including a timestamp provides that context while retaining the existing greeting contract.

## Goals

- Include a UTC timestamp in the Hello World API response.
- Preserve the existing greeting and verify the timestamp in an API test.

## Non-goals

- Displaying the timestamp in the UI.
- Changing the endpoint, status code, or existing greeting.

## Acceptance criteria

Each criterion is testable: given <state>, when <action>, then <observable result>.

1. **AC1 (proposed):** Given the API is running, when a client requests `GET /api/gh-api/hello`, then the HTTP 200 JSON response contains the unchanged `message: "Hello, world!"` and a `timestamp` representing the response time in UTC, serialized in an ISO 8601-compatible format.

## Affected areas

- [ ] ui (`/ui`)  - [x] api (`/api`)  - [ ] infra  - [x] workflows / docs

Contracts that apply (see `REVIEW.md`): API contract; auth, data, and blobs are n/a.

## Assumptions

- The unspecified field name is `timestamp`; the timestamp is generated for each response in UTC and serialized using the existing .NET JSON defaults. This keeps the response additive and makes the time unambiguous.
- The only acceptance criterion was derived from the brief and is marked proposed for human confirmation.
- The UI does not need changes because it reads the existing `message` property and can ignore additional JSON properties.

## Plan

- [ ] 1. Add the UTC timestamp to `HelloResponse` and the `/api/gh-api/hello` endpoint in `api/gh-api/Program.cs`; extend `api/gh-api.tests/HelloEndpointTests.cs` to assert the message and timestamp format/UTC value. Verify with `scripts/verify.sh api`.

### Acceptance test files

- `api/gh-api.tests/HelloEndpointTests.cs`

## Revisions

| Rev | Request (verbatim) | Starting sha | Approved |
|---|---|---|---|

## Review log

| Round | Gate | Findings | Resolution (commit / reason) |
|---|---|---|---|

## Open issues

None.
