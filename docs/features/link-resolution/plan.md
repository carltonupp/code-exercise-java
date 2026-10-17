# Link Resolution — Implementation Plan

## Dependency
- Depends on [Link Deletion](../link-deletion/plan.md) to define and implement the deleted-link state and permanent alias reservation. Complete Link Listing T1, Link Deletion T1, then Link Resolution T1 because they update the shared `openapi.yaml`; complete Link Deletion T2 before Link Resolution T2 because resolution consumes the persisted deleted state.

## Task sequence
| ID | Outcome and acceptance criteria | Dependencies | Area/owner | Parallelizable | Completion evidence |
|---|---|---|---|---|---|
| T1 | Complete the resolution contract: document `GET /{alias}` as a 302 redirect for active links, 410 with a tombstone page for deleted links, and 404 for never-assigned aliases (AC-1–AC-4). Regenerate contract-derived Java artifacts after Link Deletion T1. | Link Deletion T1 | OpenAPI contract and generated API | No | Contract validation and generated interface describe redirect, tombstone, and not-found responses. |
| T2 | Implement resolution using the active and deleted states delivered by Link Deletion T2. Cache known alias states by normalized alias with a bounded TTL; coordinate cache loads and deletion with the same bounded striped lock so a lookup cannot repopulate a stale redirect after deletion commits. Return a 302 for active links, an HTML tombstone with 410 for deleted links, and 404 for unknown aliases (AC-1–AC-5). | T1, Link Deletion T2 | API | No | API behavior verifies cache hits, case variants sharing a cache entry, unknown aliases, redirect status, `Location`, tombstone content, and that a concurrent cache miss cannot refill a stale redirect after deletion; API formatting and tests pass. |
| T3 | Validate browser navigation and cache invalidation through the configured local/Compose API origin (AC-1–AC-5). | T2 | API integration / Compose | No | A Compose smoke check confirms repeated active visits use the cache, deletion makes the next visit return a 410 tombstone, and an unknown alias returns 404. |

## Integration and validation
- Use the existing normalized alias key for lookup, following [ADR 0001](../../adr/0001-case-insensitive-aliases.md) and [ADR 0003](../../adr/0003-use-normalized-alias-as-short-link-primary-key.md).
- Keep resolution in the API. The short URL returned by creation already points to the API origin, so the web application does not need a separate redirect page.
- Cache resolution lookups in the API using a bounded in-memory cache keyed by normalized alias; use a configurable short TTL (proposed default: 60 seconds). Cache known active and deleted states, but do not cache unknown aliases.
- Link Deletion must coordinate on the same normalized-alias lock as resolution, hold it through the delete transaction, and evict the cache entry after commit before releasing it. Resolution holds that lock across cache lookup, repository load, and cache fill. This prevents a load started before deletion from publishing stale active state afterward. See proposed [ADR 0007](../../adr/0007-cache-link-resolution-lookups.md).
- A resolution that acquired the alias lock before deletion may complete using the active destination; requests serialized after deletion commits must observe the tombstone.
- The current Compose setup runs one API instance. If the API scales to multiple instances, revisit local cache invalidation and shared-cache behavior before deployment.
- Return a redirect response with the stored destination in `Location`; do not use the destination as a response body.
- Consume the alias reservation and deleted marker provided by Link Deletion; this feature does not implement the delete action.
- Distinguish three states: active aliases redirect, deleted aliases return an HTML tombstone with 410 Gone, and never-assigned aliases return 404. Describe the response content types in OpenAPI.
- Use the shared Problem Details format for API errors such as unknown aliases, following [ADR 0004](../../adr/0004-standardize-api-errors-with-problem-details.md). Browser navigation to a deleted alias receives the HTML tombstone.
- Treat the destination as stored; do not forward the request's query string unless the product decision changes.
- At integration, check that redirect responses are not cached beyond the intended 302 behavior and that unknown aliases cannot fall through to a redirect or tombstone.

## Open decision
- Confirm whether incoming query parameters should be discarded (the current assumption) or appended to the saved destination. If this changes, update the product specification and redirect acceptance cases before implementation.
