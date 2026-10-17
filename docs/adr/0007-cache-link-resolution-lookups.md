# ADR 0007: Cache Link Resolution Lookups

- Status: Proposed
- Date: 2026-10-17

## Context
Short links may be opened repeatedly, including from slide decks and videos that remain in use for a long time. Resolving every visit from persistent storage adds avoidable read load. At the same time, deleted links must stop redirecting promptly so old links can show their tombstone.

The current Compose setup runs one API instance with SQLite. The application does not currently include a distributed cache.

## Decision
Use a bounded in-process cache keyed by the normalized alias for known link states. Give entries a configurable short TTL, proposed to default to 60 seconds. Do not cache unknown aliases. Use a bounded set of striped locks, selected by normalized alias, for both cache loading and deletion. Resolution holds the lock across cache lookup, repository load, and cache fill. Deletion holds the same lock through its database transaction and evicts the entry after commit before releasing the lock. This prevents an in-flight cache miss from publishing an active entry after deletion has committed.

## Alternatives considered
- **Evict after commit without coordinating cache loads:** simpler, but an in-flight read can repopulate a stale active redirect after the delete evicts the entry.
- **No cache:** simplest consistency behavior, but every visit reads persistent storage.
- **Long-lived browser or shared HTTP caching:** reduces API reads, but can continue redirecting visitors after a link is deleted and is harder to invalidate across browsers and CDNs.
- **Shared distributed cache:** supports multiple API instances and shared invalidation, but adds infrastructure that the current single-instance deployment does not use.

## Consequences
- Positive: Repeated resolutions can avoid database reads while requests serialized after a deletion observe the tombstone within the current single-instance deployment.
- Tradeoffs: A resolution already holding the alias lock before deletion may finish with the active destination. Cache entries and locks are process-local; multiple API instances would need shared invalidation or a shared cache. A short TTL bounds stale state if an invalidation is missed.
