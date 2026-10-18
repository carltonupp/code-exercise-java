# Link Deletion — Implementation Plan

Status: Implemented; validation evidence and limits are recorded below.

## Task sequence
| ID | Outcome and acceptance criteria | Dependencies | Area/owner | Parallelizable | Completion evidence |
|---|---|---|---|---|---|
| T1 | Confirm the existing delete contract, including successful deletion and permanent alias reservation (AC-1–AC-4). Regenerate contract-derived Java artifacts after Link Listing T1. | Link Listing T1 | OpenAPI contract and generated API | No | Contract validation describes delete outcomes. |
| T2 | Implement deletion as a tombstone transition: stop active redirects, preserve the normalized alias reservation, clear the destination, reject reuse regardless of casing, and evict the cached alias after the deletion transaction commits. Use the accepted cache-race tradeoff in ADR 0007 (AC-1–AC-4). | T1 | API and persistence | No | API behavior verifies deletion, tombstone state, case-insensitive alias reservation, cache eviction, unknown aliases, and the chosen repeated-delete response; API formatting and tests pass. |
| T3 | Add an immediate delete action to links in the application list, with clear outcome feedback (AC-1, AC-2). | T2, Link Listing T1 | Web | No | Frontend behavior covers deleting a listed link and explaining a failed deletion without removing the row. |
| T4 | Validate the deletion flow through the configured local/Compose API (AC-1–AC-4). | T3, Link Listing T2 | API integration / Compose | No | A Compose smoke check creates and lists a link, deletes it from the list, confirms the deleted status and alias reservation, and verifies future visits do not redirect to the original destination. |

## Integration and validation
- This feature owns the transition from active to deleted state and the rule that deleted aliases remain reserved. Link Resolution consumes that state to return the tombstone page.
- The single application user finds links in Link Listing; this feature adds the delete action to that list.
- Keep the existing OpenAPI paths, response codes, and schemas unchanged. Listing, deletion, and resolution implement their generated interfaces against that contract.
- Retain the existing row with its alias key, display alias, creation timestamp, and deleted marker. Clear the destination to an empty string and do not expose the previous destination in the tombstone response.
- `ShortLinkDeletionTransaction` commits the tombstone transition before `ShortLinkService.delete` evicts the cache entry. A failed transaction does not trigger eviction. Striped locking is deferred; a racing resolution may repopulate stale active state until the cache TTL expires, following [ADR 0007](../../adr/0007-cache-link-resolution-lookups.md).
- Follow [ADR 0001](../../adr/0001-case-insensitive-aliases.md) and [ADR 0003](../../adr/0003-use-normalized-alias-as-short-link-primary-key.md) for case-insensitive lookup and permanent alias reservation.
- Repeated deletes return not found, and deletion clears the saved destination while retaining the alias and deleted state, as recorded in the spec and [ADR 0005](../../adr/0005-retain-tombstones-for-deleted-links.md).

## Completion evidence
- T1–T4 are implemented. `UrlsController` owns deletion and listing; domain exceptions are mapped to HTTP Problem Details by `ApiProblemHandler`.
- `ShortLinkDeletionTests` covers clearing destinations, unknown/deleted aliases, case normalization, and permanent alias reservation. `UrlsControllerTests` covers HTTP 204 and 404 mapping.
- Frontend component and route tests cover successful and failed deletion. The Playwright lifecycle test creates, lists, resolves, deletes, and visits a tombstone through an isolated Compose stack.
- API checks, frontend checks/build, and the two Playwright scenarios passed on 2026-10-18. Dedicated automated tests for transaction-commit failure, cache eviction timing, and concurrent cache repopulation are not present; those behaviors are not claimed as tested by the lifecycle scenario.
