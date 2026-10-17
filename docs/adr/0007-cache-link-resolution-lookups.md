# ADR 0007: Cache Link Resolution Lookups

- Status: Accepted
- Date: 2026-10-17

## Context
Short links may be opened repeatedly, including from slide decks and videos that remain in use for a long time. Resolving every visit from persistent storage adds avoidable read load. At the same time, deleted links must stop redirecting promptly so old links can show their tombstone.

The current Compose setup runs one API instance with SQLite. The application does not currently include a distributed cache.

## Decision
Use Spring's cache abstraction with Caffeine as the in-process provider. Cache known link states by normalized alias, with a maximum of 10,000 entries and a 60-second expire-after-write TTL. Do not cache unknown aliases. Evict the alias after its deletion transaction completes. Do not add cache-load/deletion locking at this stage; accept that a concurrent resolution can repopulate a stale active entry after deletion evicts it. The TTL bounds how long that stale entry can survive. Revisit this tradeoff if the service scales beyond its current single API instance or requires stronger deletion consistency.

## Alternatives considered
- **Coordinate cache loads and deletion with striped locks:** prevents a concurrent read from repopulating stale active state after deletion, but adds synchronization complexity. Defer this until stronger consistency is required.
- **No cache:** simplest consistency behavior, but every visit reads persistent storage.
- **Long-lived browser or shared HTTP caching:** reduces API reads, but can continue redirecting visitors after a link is deleted and is harder to invalidate across browsers and CDNs.
- **Shared distributed cache:** supports multiple API instances and shared invalidation, but adds infrastructure that the current single-instance deployment does not use.

## Consequences
- Positive: Repeated resolutions can avoid database reads; Caffeine supplies bounded size and expiry through the standard Spring cache abstraction.
- Tradeoffs: A concurrent resolution can repopulate an active entry after deletion has evicted it, so a deleted link may redirect until that entry expires. Cache entries are process-local; multiple API instances would each have independent caches and invalidation. Revisit coordination or shared caching if deployment or consistency requirements change.
