# Link Listing — Product Specification

Status: Draft

## Summary
The single user of this application can view the active short links created in it, so they can find and manage links after the creation form has closed.

## Why this matters
The creation flow currently shows a link only when it is created. A persistent list lets the operator return to active links, find one to share, and find one to delete. This application is planned for a single user, so the list is shared across the app rather than partitioned by accounts or browser profiles.

## Personas
- **Application user (assumption based on the stated single-user context):** wants to return to links created earlier in the application and manage their status.

## Scenarios
- The user opens the list after creating links and sees them.
- The user opens the list before creating any links and sees a helpful empty state.
- The user deletes a link from the list and sees it removed from the active list.
- The user moves between pages to find older links.

## Scope
- Included: show active links created in the application; paginate the list; provide a place to find active links to share or delete.
- Excluded: showing deleted links in the list, multiple user accounts, per-user access control, cross-user sharing, and analytics.

## Acceptance criteria
- **AC-1:** Given a link has been created in the application and is active, when the user opens the list, then the link appears.
- **AC-2:** Given links in the list, when it is shown, then each entry includes its alias, short URL, and destination.
- **AC-3:** Given no active links remain, when the user opens the list, then they see an empty state that explains how to create a link.
- **AC-4:** Given multiple active links, when the list is shown, then links are ordered newest first.
- **AC-5:** Given more links exist than fit on one page, when the user views the list, then they can move between pages and see the current page and total page count.
- **AC-6:** Given the user is on the first or last page, then the previous or next control is disabled respectively, and navigating between pages does not duplicate or skip links.
- **AC-7:** Given a link is deleted, when the user views the list, then that link is no longer included.

## Behavioral test cases
- **TC-1:** Create a link, then open the list → the active link is shown with its destination and short URL.
- **TC-2:** Delete a listed link → it disappears from the active list.
- **TC-3:** Delete all links → show the create-link empty state.
- **TC-4:** Create multiple links → the newest link appears first.
- **TC-5:** Create 21 links → show 20 on the first page and the remaining link on the second page.
- **TC-6:** Navigate forward and back through pages → each active link appears once, in newest-first order, and controls are disabled at the first and last page.

## Constraints, assumptions, and open questions
- The application has one user; the list contains all active links created by the application and does not require ownership tokens or accounts.
- Assumption: the list shows 20 links per page. Confirm if a different page size is preferred.
- Confirm whether newest-first ordering is sufficient or search and sorting controls are needed.
