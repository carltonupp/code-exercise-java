# Link Listing — Implementation Plan

Status: Implemented; validation evidence and limits are recorded below.

## Task sequence
| ID | Outcome and acceptance criteria | Dependencies | Area/owner | Parallelizable | Completion evidence |
|---|---|---|---|---|---|
| T1 | Implement the existing `GET /urls` operation for active links, ordered newest first with a deterministic tie-breaker (AC-1, AC-4, AC-7). Keep the OpenAPI request and response contract unchanged. | — | API and persistence | No | API behavior covers active-only results, newest-first ordering, ties, and an empty collection. |
| T2 | Add a Next.js server route that accepts a page number, fetches the existing API collection, slices 20 links per page, and returns the items plus current page and total page count (AC-5, AC-6). Reject or normalize invalid page values consistently. | T1 | Web server/API integration | No | Route behavior covers first, middle, last, out-of-range, and empty pages, including exactly-once coverage across page boundaries. |
| T3 | Add the paginated link list to the home page with alias, short URL, destination, newest-first display, total result count, previous/next controls, page status, and an empty state that links users to the creation form (AC-1–AC-6). | T2 | Web UI | No | Frontend behavior covers populated and empty states, total result count, page navigation, disabled boundary controls, and the link fields shown. |

## Integration and validation
- This is a single-user list of active links. Deleted links are excluded; deletion and tombstone behavior belong to [Link Deletion](../link-deletion/plan.md) and [Link Resolution](../link-resolution/plan.md).
- Keep `openapi.yaml` and generated clients unchanged, as recorded in [ADR 0008](../../adr/0008-paginate-link-list-at-web-boundary.md). Pagination happens in a Next.js server route: the API still returns the complete active collection, while the browser receives one page and metadata.
- Use 20 links per page. Sort newest first and use a stable tie-breaker so links created at the same time do not move between pages unpredictably.
- Keep the task sequence serial: T2 depends on the API's ordering and active-only behavior, and T3 depends on the server route response shape.
- Validate with the API checks after T1 and the web tests, lint, and typecheck after T2 and T3. Finish with the repository's API and web validation commands and create/list/page/delete integration checks.

## Completion evidence
- T1–T3 are implemented. `ShortLinkService.listActive` returns domain summaries; `UrlsController` maps them to the generated API response model.
- `ShortLinkListingTests` covers ordering, tie-breaking, deleted-link exclusion, and empty results. Web route tests cover pagination and clamping over the unchanged API collection.
- UI state is managed by `useShortLinks`; `ShortLinkList` renders its results. Tests cover navigation, refresh from page two after creation, stale-request cancellation, and page clamping after deletion.
- API checks, frontend tests/lint/typecheck/build, and the two Playwright lifecycle/creation scenarios passed on 2026-10-18. The pagination assertions are in the frontend tests; the Playwright scenarios do not exercise multi-page navigation.
