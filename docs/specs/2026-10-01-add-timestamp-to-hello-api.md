# Add Timestamp to Hello API Response

- **Status:** draft
- **Started:** 2026-10-01, from the Agents tab · **PR:** pending
- **Mode:** interactive

## Progress

- [x] Spec and plan written
- [ ] Approved (for rev 1, by @<user>, <date>, tweaks: <none>)
- [ ] Acceptance tests written (rev 1)
- [ ] Implementation (rev 1 Plan tasks)
- [ ] Verify gate green (rev 1)
- [ ] Peer review clean (rev 1)
- [ ] Final review: SHIP (rev 1)
- [ ] PR description updated, ready for human review

## Story

Add a timestamp to the Hello World API response.

## Problem

The Hello World API currently returns only a greeting, so clients cannot tell when the response was generated. The response needs a UTC timestamp, and the UI should present that timestamp in the viewer's local time alongside the greeting.

## Goals

- Return a DTO containing the `Hello World` message and a UTC timestamp.
- Display the message followed by the timestamp converted to the browser's local time.
- Verify the API response and UI rendering with automated tests.

## Non-goals

- Changing the endpoint or its HTTP status code.
- Adding infrastructure or changing the API transport.

## Acceptance criteria

Each criterion is testable: given <state>, when <action>, then <observable result>.

1. **AC1 (changed in rev 1):** Given the API is running, when a client requests `GET /api/gh-api/hello`, then the HTTP 200 JSON response contains `message: "Hello World"` and `timestampUtc` as an ISO 8601 UTC timestamp.
2. **AC2 (rev 1):** Given the UI receives the Hello response DTO, when it renders a successful response, then it displays the message followed by the timestamp converted to the browser's local time.
3. **AC3 (rev 1):** Given the UI and API are running together, when the Playwright shell test loads the UI, then it observes `Hello World` followed by the local-time rendering of the API's `timestampUtc`.

## Affected areas

- [x] ui (`/ui`)  - [x] api (`/api`)  - [ ] infra  - [x] workflows / docs

Contracts that apply (see `REVIEW.md`): API contract; auth, data, and blobs are n/a.

## Assumptions

- `timestampUtc` is generated for each response as a UTC timestamp and serialized in ISO 8601 form; the UI uses the browser's local timezone and locale formatting for display.
- The timestamp and UI display are verified with API, UI, and cross-stack tests. No infrastructure changes are needed.

## Plan

- [ ] 1. Original proposal: add a timestamp to the endpoint and API test. Superseded by rev 1 below.
- [ ] **rev 1**
  - [ ] 1. Update the API DTO and endpoint in `api/gh-api/Program.cs` to return `message: "Hello World"` and `timestampUtc`; update `api/gh-api.tests/HelloEndpointTests.cs` to verify both fields and UTC serialization. Verify with `scripts/verify.sh api`.
  - [ ] 2. Update the UI DTO and rendering in `ui/src/helloApi.ts` and `ui/src/Hello.tsx` to display the message followed by browser-local time. Extend `ui/src/Hello.test.tsx` to verify the conversion/display, and update `ui/e2e/hello.spec.ts` to assert the full response rendering. Verify with `scripts/verify.sh ui`.

### Acceptance test files

- `api/gh-api.tests/HelloEndpointTests.cs`
- `ui/src/Hello.test.tsx`
- `ui/e2e/hello.spec.ts`

## Revisions

| Rev | Request (verbatim) | Starting sha | Approved |
|---|---|---|---|
| 1 | Revise the plan to return a DTO with a "Hello World" message and a timestampUtc.<br><br>Refactor the UI to accept the DTO and display the message followed by local time based on timestamp...... something like "{message} {timestampUtc as local browser time}" | ce009d62dec22416b81d18781cc828adb9a1dbb1 | |

## Review log

| Round | Gate | Findings | Resolution (commit / reason) |
|---|---|---|---|

## Open issues

None.
