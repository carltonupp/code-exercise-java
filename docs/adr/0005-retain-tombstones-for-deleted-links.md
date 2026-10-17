# ADR 0005: Retain Tombstones for Deleted Links

- Status: Accepted
- Date: 2026-10-17

## Context
Short-link aliases are permanent identifiers and cannot be reused, as decided in [ADR 0003](0003-use-normalized-alias-as-short-link-primary-key.md). Visitors also need a different result for a deleted link than for an alias that was never assigned: a deleted link should show a tombstone page.

Short links can be embedded in slide decks and videos, then viewed or shared long after the creator deletes the link. Those copies can persist beyond the creator's ability to update them. Treating a deliberately deleted link like an unknown alias hides that history and can make the visitor think the URL is mistyped. Reusing the alias could make an old embedded link lead to an unrelated destination.

Physically deleting a link removes the information needed to distinguish those states. Keeping the full destination after deletion is unnecessary for serving a tombstone and retains data the link creator intended to delete.

## Decision
Deletion changes a link into a tombstone. Retain its normalized alias key and deleted state so the alias remains reserved and resolves to a tombstone page. Use the existing HTTP 404 response status for deleted aliases to keep the API contract unchanged; distinguish a deleted link from an unknown alias through the browser-readable response body. Remove the saved destination when the link is deleted. Unknown aliases continue to return the standard HTTP 404 not-found problem.

## Alternatives considered
- **Physically delete the link row:** frees the stored destination, but makes deleted aliases indistinguishable from aliases that were never assigned and cannot serve a tombstone.
- **Retain the link and destination unchanged:** supports restoration, but retains destination data after deletion even though the tombstone does not need it.
- **Reuse deleted aliases:** allows more alias capacity, but can send old shared links to an unrelated destination and conflicts with the permanent-reservation rule.

## Consequences
- Positive: Old shared links explain that they were deleted, unknown aliases remain distinguishable, and deleted aliases cannot unexpectedly point to new destinations.
- Tradeoffs: Tombstone records occupy storage indefinitely. The destination must be nullable or stored separately so deletion can erase it while preserving the alias reservation.
