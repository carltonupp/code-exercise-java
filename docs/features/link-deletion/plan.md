# Link Deletion — Implementation Plan

## Task sequence
| ID | Outcome and acceptance criteria | Dependencies | Area/owner | Parallelizable | Completion evidence |
|---|---|---|---|---|---|
| T1 | Define the delete contract, including successful deletion and permanent alias reservation (AC-1–AC-4). Regenerate contract-derived Java artifacts after Link Listing T1. | Link Listing T1 | OpenAPI contract and generated API | No | Contract validation describes delete outcomes. |
| T2 | Implement deletion as a tombstone transition: stop active redirects, preserve the normalized alias reservation, clear the destination under the current assumption, reject reuse regardless of casing, and coordinate with resolution on the same normalized-alias lock. Hold the lock through commit and evict the cached entry after commit before releasing it (AC-1–AC-4). | T1 | API and persistence | No | API behavior verifies deletion, tombstone state, case-insensitive alias reservation, cache eviction, unknown aliases, and the chosen repeated-delete response; API formatting and tests pass. |
| T3 | Add an immediate delete action to links in the application list, with clear outcome feedback (AC-1, AC-2). | T2, Link Listing T1 | Web | No | Frontend behavior covers deleting a listed link and explaining a failed deletion without removing the row. |
| T4 | Validate the deletion flow through the configured local/Compose API (AC-1–AC-4). | T3, Link Listing T2 | API integration / Compose | No | A Compose smoke check creates and lists a link, deletes it from the list, confirms the deleted status and alias reservation, and verifies future visits do not redirect to the original destination. |

## Integration and validation
- This feature owns the transition from active to deleted state and the rule that deleted aliases remain reserved. Link Resolution consumes that state to return the tombstone page.
- The single application user finds links in Link Listing; this feature adds the delete action to that list.
- Coordinate edits to `openapi.yaml` with Link Listing and Link Resolution. Complete Link Listing T1, then this plan's T1, then Link Resolution T1 so shared contract edits are sequenced.
- Retain only the alias and deleted state after deletion under the current assumption; do not expose the previous destination in the tombstone response.
- Use the same bounded striped alias locks as Link Resolution. Hold the alias lock through the delete transaction and post-commit cache eviction; a failed delete must not change what the cache returns.
- Follow [ADR 0001](../../adr/0001-case-insensitive-aliases.md) and [ADR 0003](../../adr/0003-use-normalized-alias-as-short-link-primary-key.md) for case-insensitive lookup and permanent alias reservation.
- Repeated deletes return not found, and deletion clears the saved destination while retaining the alias and deleted state, as recorded in the spec and [ADR 0005](../../adr/0005-retain-tombstones-for-deleted-links.md).
