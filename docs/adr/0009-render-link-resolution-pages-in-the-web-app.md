# ADR 0009: Render Link Resolution Pages in the Web App

- Status: Accepted
- Date: 2026-10-17

## Context
Deleted short links need a tombstone page, and unknown aliases need a not-found page. These are browser-facing experiences that should use the same UI and navigation as the rest of the application. The API also serves non-browser clients and must retain its REST behavior and the existing OpenAPI contract.

The API already owns alias lookup and determines whether a link is active, deleted, or unknown. Active links should continue to redirect to their destination. Error responses use the existing 404 status and Problem Details body; deleted aliases and unknown aliases have distinguishable response details.

## Decision
Public short-link URLs use the web application's origin. A Next.js route handles browser requests for aliases and calls the API to resolve them. When the API returns an active-link redirect, the web route forwards the redirect. When the API returns a deleted-link or unknown-alias 404, the web route renders the corresponding UI-owned HTML page with the same 404 status.

The API continues to return REST responses, including Problem Details for 404 errors. Keep `openapi.yaml` and the existing API response contract unchanged.

## Alternatives considered
- **Render tombstone HTML from the API:** couples browser presentation to the API and makes API error responses behave differently for browsers and other clients.
- **Have the browser call the API directly:** would expose API-origin error pages to visitors and split link navigation across application origins.
- **Render all link-resolution pages in the web app:** chosen because it keeps browser presentation with the UI while the API remains responsible for resolution and redirects.

## Consequences
- Deleted and unknown links show application-branded pages owned by the web app; active links still reach their destinations through the API's redirect decision.
- The API remains usable by non-browser clients and returns Problem Details for missing or deleted aliases.
- Public short-link configuration must point at the web app, and the web app must be able to reach the API.
- The web app maps the API's 404 response details to the deleted-link or unknown-alias page without changing the API contract.
