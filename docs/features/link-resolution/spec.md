# Link Resolution — Product Specification

Status: Draft

## Summary
When someone opens an active short link, send them to its saved destination. If the link was deleted, show the tombstone provided by the Link Deletion feature. If the alias has never been assigned, return a not-found response.

## Why this matters
People may keep or share short links after the creator deletes them. A tombstone tells visitors the link was deliberately removed, instead of making it look like a typo or a link that never existed. It also prevents an old shared link from silently pointing to a different destination if its alias is reused.

## Personas
- **Link visitor (assumption):** opens a short link shared with them and expects to reach its intended destination.
- **Link creator (assumption):** expects links they created to keep resolving consistently, regardless of alias letter casing.

## Scenarios
- A visitor opens a valid short link and their browser navigates to its saved destination.
- A visitor opens a short link with different capitalization and reaches the same destination.
- A visitor opens an alias that has never been assigned and sees a not-found result rather than being sent elsewhere.
- A visitor opens a link deleted through the Link Deletion feature and sees its tombstone rather than being redirected or seeing the unknown-alias result.

## Scope
- Included: resolve an active alias; redirect to its saved HTTP or HTTPS destination; resolve aliases without regard to letter casing; show the tombstone for a previously deleted link; report never-assigned aliases as not found.
- Excluded: creating or deleting links, analytics, destination editing, and forwarding request query parameters to the destination (assumption: resolution uses the saved destination as-is).

## Acceptance criteria
- **AC-1:** Given an active saved short link, when a visitor requests its alias, then the service redirects with HTTP 302 and a `Location` pointing to the saved destination.
- **AC-2:** Given an active saved short link, when a visitor requests its alias with different letter casing, then the service redirects to the same saved destination.
- **AC-3:** Given an alias that has never been assigned, when a visitor requests it, then the service returns an HTTP 404 error page explaining that the short link could not be found and does not redirect.
- **AC-4:** Given a link deleted through the Link Deletion feature, when a visitor requests its alias, then they see a tombstone explaining the link is no longer available. The response uses HTTP 404, matching the existing API contract's not-found status.
- **AC-5:** Given an active saved link, when it is resolved, then its destination and alias remain unchanged and available for later requests.

## Behavioral test cases
- **TC-1:** Create a link, request its alias → receive 302 with the saved destination in `Location`.
- **TC-2:** Request a saved custom alias with casing changed → receive 302 to the same saved destination.
- **TC-3:** Request an unknown valid alias → receive a browser-readable 404 page explaining that the short link could not be found, with no `Location` header.
- **TC-4:** Request an alias deleted through the Link Deletion feature → receive 404 and see the tombstone page; no redirect occurs.
- **TC-5:** Request a deleted alias with different casing → receive the same tombstone response.
- **TC-6:** Resolve an active link repeatedly → each request redirects to the same destination and the link remains available.
- **TC-7:** Resolve a generated alias → it follows the same redirect behavior as a custom alias.

## Constraints, assumptions, and open questions
- This feature depends on [Link Deletion](../link-deletion/spec.md) to retain a deleted-link state and reserve its alias, following [ADR 0003](../../adr/0003-use-normalized-alias-as-short-link-primary-key.md).
- The existing API contract advertises HTTP 302 for resolution; this plan treats that as the intended redirect behavior.
- Alias comparison follows [ADR 0001](../../adr/0001-case-insensitive-aliases.md): casing does not affect lookup.
- Assumption: incoming query parameters are not appended to or merged with the saved destination. Confirm whether query forwarding is needed before implementation if link creators expect campaign or tracking parameters to pass through.
- Unknown aliases return HTTP 404 with a browser-readable not-found page; deleted aliases return HTTP 404 with a browser-readable tombstone page. The pages use different text to distinguish never-assigned and deleted aliases while preserving the existing API status contract.
