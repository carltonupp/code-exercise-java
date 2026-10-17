# Link Listing — Implementation Plan

## Task sequence
| ID | Outcome and acceptance criteria | Dependencies | Area/owner | Parallelizable | Completion evidence |
|---|---|---|---|---|---|
| T1 | Provide the paginated list operation and view for active links, including an empty state and deterministic newest-first order (AC-1, AC-3–AC-6). Update the existing `/urls` contract and implementation with a default page size of 20 and a bounded page-size parameter. | — | OpenAPI contract, API, persistence, and web | No | Contract validation and API/UI behavior cover page boundaries, total pages, stable ordering, populated lists, and empty lists. |
| T2 | Extend the paginated list to include deleted tombstones, mark them deleted, and omit their removed destination (AC-2, AC-5, AC-6). | Link Deletion T2 | API, contract, and web | No | API/UI behavior covers active and deleted rows across pages and confirms deleted destinations are not displayed. |

## Integration and validation
- The application has one user, so `/urls` returns the application's links without per-user ownership or access-control filtering.
- Use the existing `/urls` operation rather than adding another list route unless a contract gap requires it.
- Apply pagination in the API and expose page metadata so the UI does not need to fetch every link. Use a stable tie-breaker for links created at the same time so moving between pages does not duplicate or skip entries.
- Link Deletion depends on T1 for the list as the place to find a link to delete. Link Resolution depends on Link Deletion for deleted state.
- Complete this plan's T1 contract changes before Link Deletion T1 and Link Resolution T1, since all edit `openapi.yaml`. Link Listing T2 follows Link Deletion T2 because it needs the tombstone state.
- During implementation, validate API responses and list display with the repository's API and web checks.

