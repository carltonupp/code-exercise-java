# Link Resolution — Implementation Plan

Status: Implemented; validation evidence and limits are recorded below.

## Dependency
- Depends on [Link Deletion](../link-deletion/plan.md) to define and implement the deleted-link state and permanent alias reservation. The contract remains unchanged. Resolution consumes the persisted deleted state delivered by Link Deletion T2.

## Task sequence
| ID | Outcome and acceptance criteria | Dependencies | Area/owner | Parallelizable | Completion evidence |
|---|---|---|---|---|---|
| T1 | Confirm the existing resolution contract for `GET /{alias}`: 302 redirect for active links and 404 for deleted or never-assigned aliases (AC-1–AC-4). Regenerate contract-derived Java artifacts after Link Deletion T1. | Link Deletion T1 | OpenAPI contract and generated API | No | Contract validation and generated interface preserve the existing response codes. |
| T2 | Implement resolution using the active and deleted states delivered by Link Deletion T2. Cache known alias states by normalized alias with a bounded TTL using Spring Cache and Caffeine. The API returns a 302 for active links and distinguishable 404 Problem Details for deleted and never-assigned aliases (AC-1–AC-5). | T1, Link Deletion T2 | API | No | Service and controller tests verify canonical lookup, active/deleted/missing results, redirect status, `Location`, and distinct deleted/not-found responses. Cache configuration is implemented; dedicated cache-hit and eviction tests remain a coverage gap. |
| T3 | Route public short links through the web application. Forward active redirects from the API and render distinct deleted and not-found 404 pages in the UI (AC-1–AC-5). | T2 | Web and Compose | No | A Compose smoke check confirms active aliases redirect, deleted aliases show the UI tombstone, and unknown aliases show the UI not-found page. |

## Integration and validation
- Use the existing normalized alias key for lookup, following [ADR 0001](../../adr/0001-case-insensitive-aliases.md) and [ADR 0003](../../adr/0003-use-normalized-alias-as-short-link-primary-key.md).
- Keep alias state, lookup, caching, and redirects in the API. Public short URLs point to the web application, which forwards API redirects and renders browser-facing error pages.
- Cache known active and deleted resolution states in Caffeine, bounded to 10,000 entries with a 60-second expire-after-write TTL. Do not cache unknown aliases.
- Evict after the deletion transaction completes. Follow [ADR 0007](../../adr/0007-cache-link-resolution-lookups.md).
- Cache-load/deletion locking is deferred. A concurrent resolution may repopulate a stale active result after deletion evicts the cache entry, and that result may be used until its TTL expires.
- The current Compose setup runs one API instance. If the API scales to multiple instances, revisit local cache invalidation and shared-cache behavior before deployment.
- Return a redirect response with the stored destination in `Location`; do not use the destination as a response body.
- Consume the alias reservation and deleted marker provided by Link Deletion; this feature does not implement the delete action.
- Distinguish three states: active aliases redirect, deleted aliases return a 404 Problem Details response marked as deleted, and never-assigned aliases return a 404 Problem Details response marked not found. The web application renders the appropriate HTML page. Preserve the existing OpenAPI contract unchanged.
- Use the shared Problem Details format for API resolution errors, following [ADR 0004](../../adr/0004-standardize-api-errors-with-problem-details.md). Browser navigation receives an error page from the web application, following [ADR 0009](../../adr/0009-render-link-resolution-pages-in-the-web-app.md).
- Treat the destination as stored; do not forward the request's query string unless the product decision changes.
- At integration, check that redirect responses are not cached beyond the intended 302 behavior and that unknown aliases cannot fall through to a redirect or tombstone.

## Implemented query behavior
- Incoming query parameters are discarded; the saved destination is used as-is. Query forwarding is a future product decision and would require updated acceptance cases.

## Completion evidence
- T1–T3 are implemented. `ShortLinkRedirectController` implements only the generated redirect interface; alias lookup and caching remain in the service.
- `web/src/server/linkResolution.ts` maps API outcomes to active, deleted, not-found, or unavailable states. It contains the title-based compatibility check required by the existing indistinguishable 404 problem types, as documented in ADR 0004.
- API service/controller tests verify resolution states and HTTP behavior. Web route tests cover redirects, distinct 404 pages, malformed responses, and timeout/unavailable handling. The Playwright lifecycle scenario verifies an active redirect and the subsequent deleted-link page, including the shared stylesheet.
- API checks, frontend tests/lint/typecheck/build, and the two Playwright scenarios passed on 2026-10-18. Automated cache-hit, eviction-timing, concurrent-race, and explicit query-forwarding tests are not present.
