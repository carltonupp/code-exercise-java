# Link Listing — Product Specification

Status: Draft

## Summary
The single user of this application can view the short links created in it, so they can find and manage links after the creation form has closed.

## Why this matters
The creation flow currently shows a link only when it is created. A persistent list lets the operator return to links, find one to share, and find one to delete. This application is being planned for a single user, so the list is shared across the app rather than partitioned by accounts or browser profiles.

## Personas
- **Application user (assumption based on the stated single-user context):** wants to return to links created earlier in the application and manage their status.

## Scenarios
- The user opens the list after creating links and sees them.
- The user opens the list before creating any links and sees a helpful empty state.
- The user returns after deleting a link and can identify it as deleted without mistaking it for an active link.

## Scope
- Included: show the links created in the application; show active links and deleted tombstones with their status; provide a place to find links to share or delete.
- Excluded: multiple user accounts, per-user access control, cross-user sharing, analytics, and collection recovery.

## Acceptance criteria
- **AC-1:** Given a link has been created in the application, when the user opens the list, then the link appears.
- **AC-2:** Given links in the list, when it is shown, then each active link includes its alias, short URL, and destination, and each deleted link is clearly marked deleted without displaying its removed destination.
- **AC-3:** Given no links have been created, when the user opens the list, then they see an empty state that explains how to create a link.
- **AC-4:** Given multiple links have been created, when the list is shown, then links are ordered newest first.
- **AC-5:** Given more links exist than fit on one page, when the user views the list, then they can move between pages and see the current page and total page count.
- **AC-6:** Given the user is on the first or last page, then the previous or next control is disabled respectively, and navigating between pages does not duplicate or skip links.

## Behavioral test cases
- **TC-1:** Create a link, then open the list → the link is shown with its destination and short URL.
- **TC-2:** Delete a listed link → it remains identifiable in the list as deleted and its previous destination is not shown.
- **TC-3:** Open the list when there are no links → show the create-link empty state.
- **TC-4:** Create multiple links → the newest link appears first.
- **TC-5:** Create 21 links → show 20 on the first page and the remaining link on the second page.
- **TC-6:** Navigate forward and back through pages → each link appears once, in newest-first order, and controls are disabled at the first and last page.

## Constraints, assumptions, and open questions
- The application has one user, as clarified for this plan. The list contains all links created by the application and does not require ownership tokens or accounts.
- Assumption: deleted links remain visible as tombstones and are ordered by their original creation time.
- Assumption: the list shows 20 links per page. Confirm if a different page size is preferred.
- Confirm whether newest-first ordering is sufficient or search and sorting controls are needed.
