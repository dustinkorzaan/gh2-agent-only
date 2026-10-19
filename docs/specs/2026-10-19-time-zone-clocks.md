# Time-zone clocks

- **Status:** discovery
- **Started:** 2026-10-19, discovery request · **PR:** #8
- **Draft version:** 2 — kickoff interview; NOT approved or approval-ready.

## Progress

Resume hints only; approval requires the separate verified human event below.

- [ ] Spec and plan written
- [ ] Approved (see `## Approval record`)
- [ ] Acceptance tests written
- [ ] Implementation (all Plan tasks ticked)
- [ ] Verify gate green
- [ ] Peer review clean
- [ ] QA clean
- [ ] PR description updated, ready for human review

Spec/plan completion remains unchecked while blocking interview answers and
design reviews are outstanding. No implementation is authorized.

## Approved scope

**Proposed contract only, despite this template heading.** Firm constraints are
identified below; every other product choice awaits explicit human acceptance.
Approval would cover this section, including test paths and ordered plan, not
the mutable progress/evidence sections.

### Risk tier

**Proposed: moderate.** This introduces an API/RTK contract and date arithmetic
with DST and date-rollover correctness risk. It changes no auth, personal data,
storage, infrastructure or deployment. The template/playbook identify auth
changes, destructive migrations and production deployment as high-risk pilot
exclusions; none are proposed. Architect confirmed moderate for snapshots.

### Problem

The current shell shows the hello endpoint's timestamp in the browser's local
zone only. Users cannot compare a common instant across selected regions.

### Goals

- Display one labelled local-time clock per selected zone from one API instant.
- Keep the API authoritative for time; perform local-time conversion in the UI.

### Non-goals

- Product implementation during discovery.
- Arbitrary zone search, user accounts, saved preferences, server-side selection,
  browser geolocation, analog clock faces or a full world-zone catalogue.
- Under the proposed snapshot model: continuous ticking, offline extrapolation,
  scheduled refresh and synchronization/latency compensation.
- Auth, database, blob/SAS, infrastructure, workflow or dependency changes.
- Replacing or weakening the existing hello/health contracts or tests.

### Acceptance criteria

All criteria below are **proposals**, contingent on Q1–Q3 in Open issues.

1. **AC1 — shared API instant:** Given the running API, when
   `GET /api/gh-api/clocks` succeeds, then HTTP 200 JSON contains exactly one
   timestamp field, `timestampUtc`, in `YYYY-MM-DDTHH:mm:ss.sssZ` format
   representing a current UTC instant, and
   `timeZones`, the ordered catalogue agreed in Q1. Each zone has only `id`,
   `label`, and signed `offsetMinutes` applicable at that same instant; there
   are no per-zone timestamps. Offset direction is local minus UTC:
   New York standard time is `-300`, Kolkata is `+330`, UTC is `0`.
2. **AC2 — selection:** Given a successfully bound response, when the page first
   loads, then all catalogue zones are selected with one clock per zone. When
   the user toggles labelled checkboxes, only selected clocks appear, in
   catalogue order, without requesting another timestamp. Selection is
   page-local and resets on full reload.
3. **AC3 — conversion and display:** Given a valid response and selected zones,
   when clocks render, then each shows its zone label/ID and
   `YYYY-MM-DD HH:mm:ss` (24-hour) calculated as
   `timestampUtc + offsetMinutes * 60,000`. Output is independent of the
   browser's locale, zone and wall-clock setting. Date rollover and fractional
   hour offsets are correct. Offsets are valid only at the supplied instant,
   including the applicable DST rules.
4. **AC4 — API-authoritative snapshots:** Given a loaded snapshot, when browser
   time advances or its wall clock changes, then the displayed instant stays
   unchanged. When the user activates Refresh, one new API snapshot replaces
   all clocks together and retains current selections by zone ID; a visible
   “Snapshot — refresh to update” status and the UTC as-of value explain that
   these clocks do not tick. While Refresh is pending, hide the previous clocks
   and as-of value and show loading; bind the entire validated snapshot atomically.
   Preserve an intentionally empty selection through failure and recovery.
5. **AC5 — useful non-success states:** Given an initial request is pending,
   when rendered, then a loading status appears without fabricated times.
   Given a failed request or invalid payload, then an accessible error appears
   and no clocks are shown; Refresh allows recovery. Given no selection or an
   empty valid catalogue, then an explicit empty state appears, not an error.

### Negative / edge cases

- **AC1:** API integration tests bracket the timestamp with request/response
  times, assert zero UTC offset, exact JSON shape and unique nonempty zone IDs;
  check offsets against zone rules at the returned instant. No input parameters
  or user data are introduced; no new auth behavior is proposed.
- **AC2:** Deselect all, toggle repeatedly, then reselect: no duplicate clocks
  or hidden selected clocks. Full reload restores defaults, not persistence.
- **AC3:** Synthetic UTC instants before/after DST changes (winter/summer and
  both sides of a transition), negative offsets, UTC, `+330` minutes, and
  previous/next-day rollover. A repeated fall-back local hour is disambiguated
  by zone ID, signed UTC offset and shared UTC as-of value. Never use a fixed
  zone offset as a forever-valid DST rule.
- **AC4:** Freeze/advance browser time and skew its wall clock; only a successful
  API refresh changes clocks. Disable Refresh while pending to avoid races.
  On refresh failure, hide stale clocks and show the error; do not silently
  substitute client time. Snapshot offsets must be replaced with each snapshot.
- **AC5:** Network/HTTP failure, missing or unparseable/non-UTC timestamp,
  missing catalogue, duplicate/empty IDs, missing labels, non-integer offsets
  or offsets outside ±840 minutes invalidate the entire payload. Require exact
  JSON types, non-null zone entries, a real calendar date in years 0001–9999,
  the specified UTC grammar, a finite parsed instant and a shifted result in
  that year range for every zone. Reject invalid dates rather than normalizing
  them (for example February 30). Empty array is valid. A subsequent valid
  refresh recovers without resetting selection. No unbounded user input exists.

### Constraints

**Firm product constraints supplied by the requester:**

- API returns exactly one UTC timestamp and a collection of time zones, never
  multiple localized timestamps.
- UI binds that response and computes/displays each local time using client-side
  offset math. API source-of-time authority must be preserved.

**Provisional boundaries:** snapshot/refresh behavior, catalogue, selection and
display format below require answers; they are not accepted decisions.

### Assumptions

- The raw story is split into AC1 contract, AC2 selection, AC3 arithmetic,
  AC4 update semantics and AC5 failure states to make it testable.
- Q1 proposes four curated IANA zone IDs, all initially selected, page-local
  checkboxes and no persistence, to bound selection scope.
- Q2 proposes snapshots with manual refresh rather than ticking. If live clocks
  are required, revise the contract for API anchoring, elapsed-time handling,
  resynchronization and offset validity across DST before approval.
- Q3 proposes deterministic 24-hour date/time and API-calculated offsets for the
  exact shared instant. No proposed default has been accepted.

### Design

- Existing API: `api/gh-api/Program.cs` maps hello and controllers;
  `Controllers/HealthController.cs` serves health. Add a separate clocks endpoint
  using current .NET facilities, leaving those contracts intact.
- Proposed response shape:
  `{ "timestampUtc": "<ISO-8601 UTC instant>", "timeZones": [{ "id":
  "Europe/London", "label": "London", "offsetMinutes": 60 }] }`.
  This illustrative offset is not static configuration or valid year-round.
- Capture `DateTimeOffset.UtcNow` once, truncate to millisecond precision and
  serialize that instant in the specified UTC format. Resolve each curated IANA
  ID with .NET `TimeZoneInfo.GetUtcOffset(DateTimeOffset)` at that same instant,
  not at a separate “now” or a host-local `DateTime`. Confirm every chosen IANA
  ID resolves on the intended runtime before approval. If unavailable, fail
  the whole request rather than guess; any required runtime configuration change
  needs a scope revision.
- UI currently uses `helloApi.ts`, `store.ts`, `Hello.tsx` and `App.tsx`.
  Add a typed clocks query to the existing RTK API slice, validate the payload,
  add a separate clocks component and render it alongside the existing hello
  shell without a second `main` landmark. Keep selection in React local state;
  no unnecessary slice is required. Render clocks only from fully validated
  successful data, never cached RTK data during loading/error states.
- Convert the parsed UTC epoch by signed offset milliseconds and format with UTC
  getters; do not apply browser local-time conversion a second time. Show each
  signed offset as well as the zone ID to distinguish repeated local times.
- Proposed success status is 200. Failures use non-2xx responses and a generic
  UI error without assuming an error-body schema; never return partial clocks
  or localized timestamps. No new config or dependency is proposed.

### Verification

- AC1: xUnit endpoint contract/current-instant checks plus deterministic
  winter/summer/transition offset cases using synthetic instants in a testable
  conversion seam (not a production “set time” endpoint). Use literal expected
  offsets immediately before/at transitions and test whole-request lookup failure.
- AC2–AC5: Vitest/Testing Library response fixtures, selection, conversion,
  loading/error/empty/retry and fake-time cases. Assert exact outputs rather
  than duplicating production conversion in test expectations.
- AC1–AC5: Playwright real API/UI flow checks response shape, default selection,
  toggles and refresh; deterministic intercepted fixtures cover DST, rollover
  and error cases, including success → pending → failure → recovery with no
  selection. Exercise a non-UTC browser context. Retain every existing hello
  regression assertion, updating fetch mocks to route-aware fixtures and scoping
  status/alert queries as needed when App hosts both features.
- Run only the canonical `scripts/verify.sh --all` for delivery checks. Existing
  suite results during discovery are baseline evidence, not proof of new ACs.

### Acceptance test files

Proposed test paths, to be finalized after interview/design and covered by approval:

- `api/gh-api.tests/ClocksEndpointTests.cs` — AC1 and offset semantics.
- `ui/src/Clocks.test.tsx` — AC2–AC5 and malformed contract handling.
- `ui/src/Hello.test.tsx` — preserve hello assertions while adapting App-level
  mocks and queries for the additional clocks request and status elements.
- `ui/e2e/clocks.spec.ts` — cross-stack AC1–AC5.

### Plan (draft)

1. Resolve Q1–Q3, confirm IANA runtime support, obtain architect design and
   independent spec-reviewer challenge, revise this scope, and request explicit
   human approval of the exact version.
2. After verified approval AND a separate explicit delivery start, write
   failing-first acceptance tests in the approved paths, mapped to every AC.
3. Implement the separate API endpoint and instant-specific zone offsets.
4. Bind the response through RTK, add selection/snapshot UI and offset arithmetic;
   preserve hello/health behavior and tests.
5. Run `scripts/verify.sh --all`; obtain independent peer review and running-system
   QA at the exact candidate SHA, then present for human review. Never self-merge.

## Approval record

- **Approved by:** unset — no human answers or approval received.
- **Approved at commit:** unset.
- **Delivery started by:** unset — discovery request is not delivery start.

Approval must later be a linked PR #8 comment `@copilot approved <full-head-sha>`
from a human whose write/maintain/admin permission is verified. Any subsequent
Approved scope edit voids it. Approval alone never starts implementation; a
separate explicit human start is required.

## Story

As a user, I want to see a clock for each selected time zone so I can quickly compare the local time across multiple regions.

## Affected areas

- [x] ui (`/ui`) - [x] api (`/api`) - [ ] infra - [x] docs - [ ] workflows

These are proposed delivery areas; this discovery changes only this spec.
`REVIEW.md` contracts: API DTO ↔ RTK response/status/error handling and UI
loading/error/selection state apply. Blob/SAS, Entra auth and EF migrations are
not involved. No new unauthenticated user-data exposure is proposed.

## Plan status

- [ ] 1. Interview, design challenge, finalized spec and human approval.
- [ ] 2. Verified start and failing-first acceptance tests.
- [ ] 3. API endpoint.
- [ ] 4. RTK/UI implementation.
- [ ] 5. Verification, peer review and QA.

## Revisions

No approved scope revisions; this is an unapproved discovery draft.

| Rev | Request (verbatim) | Starting sha | Approved (comment link, @user, timestamp) |
|---|---|---|---|

## Risk tier

Proposed moderate as declared in Approved scope; architect confirmed for snapshots.
High-risk auth, destructive migration and production deployment remain excluded.

## Review log (advisory gates)

| Round | Gate | Candidate sha (→ HEAD if bookkeeping-only) | Findings | Resolution (commit / reason) |
|---|---|---|---|---|
| 1 | Architect | Draft v1 working tree on e54ddc4e653c15dbf9119a1ab91d7e38763c43d2; not a delivery candidate | Revise: clarify offset direction, timestamp validation, refresh state, runtime lookup and hello test integration; moderate risk confirmed for snapshots | Clarifications incorporated in draft v2; runtime support and human answers remain open; finalized scope needs review |
| 1 | Spec-reviewer | Draft v1 working tree on e54ddc4e653c15dbf9119a1ab91d7e38763c43d2; not a delivery candidate | Spec-ok for discovery only; Q1–Q3 block approval readiness; no draft defects identified | No approval granted; finalized scope needs review |
| 0 | Discovery baseline checks | e54ddc4e653c15dbf9119a1ab91d7e38763c43d2 plus uncommitted spec | `scripts/verify.sh --all` exit 0; all 9 checks PASS | Existing baseline only; not delivery verification |

Executed 2026-10-19: PASS `ui:install`, `ui:lint`, `ui:build`, `ui:test`,
`api:restore`, `api:build`, `api:test`, `e2e:playwright`, `shell:syntax`.
Vitest: 1 file, 3 tests passed. xUnit: 2 passed, 0 failed, 0 skipped.
Playwright: 1 passed. The lint check uses `--if-present`; no lint script exists,
so its PASS is not evidence of lint analysis. Existing local logs:
`.git/verify-logs/ui_test.log`, `.git/verify-logs/api_test.log`,
`.git/verify-logs/e2e_playwright.log` (not committed). No clock AC was exercised.
`git diff --check` returned exit 0; status showed only this new spec.
Automated validation was also requested: code review was unavailable because its
configured model was not in the registry (despite the wrapper's success label);
no review pass is claimed. CodeQL skipped the documentation-only change.
Neither result substitutes for architect/spec-reviewer review of finalized scope.

The architect and spec-reviewer were separate read-only agent invocations;
model diversity is unverified. Peer review and QA have not run. Draft feedback
is not a delivery gate pass or a human approval.

## QA / UX matrix

| Case | Data (synthetic) | Baseline | Result | Artifact |
|---|---|---|---|---|
| Proposed clock flows, DST, failure and empty states | Fixed UTC fixtures | Proposed AC1–AC5 | unverified; no clock implementation | none |

## Open issues

All three questions block scope completion; answer each explicitly.

1. **Selection and catalogue:** Which zones, defaults and selection lifetime?
   **Recommend:** UTC (`Etc/UTC`), London (`Europe/London`), New York
   (`America/New_York`) and Kolkata (`Asia/Kolkata`), in that order; all selected
   initially, page-local labelled checkboxes, no saved preferences or search.
2. **Update behavior:** Must clocks tick or is a snapshot sufficient?
   **Recommend:** clearly labelled API-authoritative snapshot plus manual Refresh,
   no ticking or client wall-clock fallback. Live ticking requires revised DST/
   offset-validity and resynchronization design before approval.
3. **Presentation and DST semantics:** What format and offset source?
   **Recommend:** `YYYY-MM-DD HH:mm:ss` 24-hour, zone label/ID and signed UTC offset,
   plus one UTC as-of value; API supplies each offset at the single timestamp
   using zone rules, UI applies arithmetic. No forever-fixed offsets.

Before approval, confirm selected IANA IDs on the intended runtime; availability
has not been demonstrated by this discovery session. If live ticking is chosen,
revise the snapshot proposal before final design review.

Next: human answers → finalize scope and runtime feasibility → review finalized
scope with architect/spec-reviewer → exact spec version for human approval.
This draft is not yet an approval request.

## PR description

<!-- pr-description:start -->
Discovery only: time-zone clocks. Draft spec and kickoff interview; not approval-ready.

- Firm: one API UTC timestamp plus zones; UI offset math; API time authority.
- Proposed: curated selectable zones, manual-refresh snapshots, 24-hour format
  and instant-specific DST offsets. Three blocking questions await human answers.
- Risk proposed moderate, confirmed by architect for snapshots; draft reviewed
  by architect/spec-reviewer. Final scope review and runtime support remain pending.
- No product implementation, approval or delivery start. Explicit human approval
  of finalized scope and a separate delivery start are required before code.
<!-- pr-description:end -->
