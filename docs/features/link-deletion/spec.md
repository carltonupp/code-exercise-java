# Link Deletion — Product Specification

Status: Draft

## Summary
Creators can delete a short link so it no longer sends visitors to its saved destination. The alias remains reserved and the creator's list marks it deleted. Link Resolution uses that deleted state to show visitors a tombstone.

## Why this matters
People may keep or share short links after deletion. A tombstone tells them the link was deliberately removed instead of making it look mistyped or never created. Keeping the alias reserved prevents an old shared link from silently pointing to an unrelated destination.

## Personas
- **Link creator (assumption):** wants to remove a destination from use while ensuring old copies of the link do not redirect somewhere unexpected.
- **Link visitor (assumption):** opens a previously shared link and needs to know it is no longer available.

## Scenarios
- A creator deletes an active short link.
- A creator selects one of their links from the link list and deletes it.
- The creator's link list marks a deleted link as no longer active.
- Someone attempts to assign the deleted alias to another destination and is told that the alias is unavailable.

## Scope
- Included: find a link in the application's [link list](../link-listing/spec.md); delete an active link; stop redirecting visitors to its saved destination; preserve a tombstone for the alias; prevent the alias from being assigned again.
- Excluded: link restoration, destination editing, multiple user accounts, analytics, and deletion of the tombstone itself.

## Acceptance criteria
- **AC-1:** Given an active short link, when its creator deletes it, then deletion succeeds and future visits no longer redirect to its saved destination.
- **AC-2:** Given a deleted short link, when the creator views their link list, then the link is marked deleted and its removed destination is not displayed.
- **AC-3:** Given a deleted short link, when someone attempts to create another link with the same alias regardless of casing, then the alias remains unavailable.
- **AC-4:** Given an alias that was never assigned, when it is requested, then it is treated as not found rather than as a deleted link.

## Behavioral test cases
- **TC-1:** Delete an active link → deletion succeeds and the creator's list marks it deleted.
- **TC-2:** Delete a link → the list does not display its removed destination.
- **TC-3:** Delete a link, then submit its alias for a new link with different casing → creation is rejected because the alias remains reserved.
- **TC-4:** Request an alias that was never assigned → receive the ordinary not-found result, not the tombstone.
- **TC-5:** Delete an already deleted link → return a consistent not-found or already-deleted result without restoring or reassigning the alias. (Exact response is an open question.)

## Constraints, assumptions, and open questions
- Deleted aliases remain reserved permanently, following [ADR 0003](../../adr/0003-use-normalized-alias-as-short-link-primary-key.md).
- The tombstone must be distinguishable from an alias that was never assigned and should not reveal the deleted destination.
- Assumption: deletion removes the saved destination while preserving only the alias and deleted state. Confirm if deletion should retain the destination for restoration or audit use.
- Confirm the behavior for repeating a delete request: not found, or an idempotent success.
- The application has one user; deletion does not require per-user ownership checks or account identity.
