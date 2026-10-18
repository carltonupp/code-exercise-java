# Link Deletion — Product Specification

Status: Implemented

## Summary
Creators can delete a short link so it no longer sends visitors to its saved destination. The alias remains reserved, the link disappears from the active list, and Link Resolution uses the deleted state to show visitors a tombstone.

## Why this matters
People may keep or share short links after deletion. A tombstone tells them the link was deliberately removed instead of making it look mistyped or never created. Keeping the alias reserved prevents an old shared link from silently pointing to an unrelated destination.

## Personas
- **Link creator (assumption):** wants to remove a destination from use while ensuring old copies of the link do not redirect somewhere unexpected.
- **Link visitor (assumption):** opens a previously shared link and needs to know it is no longer available.

## Scenarios
- A creator deletes an active short link.
- A creator selects one of their links from the link list and deletes it.
- The deleted link no longer appears in the active link list.
- Someone attempts to assign the deleted alias to another destination and is told that the alias is unavailable.

## Scope
- Included: find a link in the application's [link list](../link-listing/spec.md); delete an active link; stop redirecting visitors to its saved destination; preserve a tombstone for the alias; prevent the alias from being assigned again.
- Excluded: link restoration, destination editing, multiple user accounts, analytics, and deletion of the tombstone itself.

## Acceptance criteria
- **AC-1:** Given an active short link, when its creator deletes it, then deletion succeeds, the saved destination is cleared, and subsequent visits show the tombstone, subject to the bounded cache-race limitation below.
- **AC-2:** Given a deleted short link, when the creator views the active link list, then the deleted link is no longer included.
- **AC-3:** Given a deleted short link, when someone attempts to create another link with the same alias regardless of casing, then the alias remains unavailable.
- **AC-4:** Given an alias that was never assigned, when it is requested, then it is treated as not found rather than as a deleted link.

## Behavioral test cases
- **TC-1:** Delete an active link → deletion succeeds and the link disappears from the active list.
- **TC-2:** Delete a link, then submit its alias for a new link with different casing → creation is rejected because the alias remains reserved.
- **TC-3:** Request an alias that was never assigned → receive the ordinary not-found result, not the tombstone.
- **TC-4:** Delete an already deleted link → return HTTP 404 with the not-found problem, without restoring or reassigning the alias.

## Constraints, assumptions, and open questions
- Deleted aliases remain reserved permanently, following [ADR 0003](../../adr/0003-use-normalized-alias-as-short-link-primary-key.md).
- The tombstone must be distinguishable from an alias that was never assigned and should not reveal the deleted destination.
- Deletion clears the saved destination while preserving the alias and deleted state.
- Repeating a delete request returns not found, matching requests for unknown aliases.
- The application has one user; deletion does not require per-user ownership checks or account identity.

- Cache eviction follows the successful deletion commit. A resolution request already in flight can repopulate an active cache entry after eviction, so a visitor can still be redirected until that entry expires (60 seconds after it is cached). Stronger deletion consistency is deferred in [ADR 0007](../../adr/0007-cache-link-resolution-lookups.md).
