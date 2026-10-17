# ADR 0008: Paginate the Link List at the Web Boundary

- Status: Accepted
- Date: 2026-10-17

## Context
The link list must be paginated, and the browser should receive only the requested page. The API contract is fixed for this work: `openapi.yaml` must not change, and the existing `GET /urls` operation returns the active-link collection without page parameters or pagination metadata. The application currently has a single user and a small expected link collection.

Client-side pagination would require sending the complete list to the browser and slicing it there. Adding API or database pagination would reduce the amount transferred from persistent storage, but requires changing the API contract. The current constraint rules out that option.

## Decision
Implement pagination in a Next.js server route. The existing `GET /urls` operation returns active links newest first. For each requested page, the route fetches that existing response, slices the requested page (20 links by default), and returns only that page with the page metadata to the browser. Keep the API request and response contract unchanged.

## Alternatives considered
- **Client-side pagination:** fetch the existing complete list in the browser and slice it there. This is simpler, but sends and processes the full collection in the browser, which the chosen approach avoids.
- **API/database pagination:** add page inputs and pagination metadata to the API, then fetch only the requested database page. This is the most efficient option as the collection grows, but violates the constraint against modifying the API contract.
- **Web-server pagination over the existing API response:** fetch the full list from the API and slice it in the Next.js server route. This preserves the API contract and limits the browser response to one page, at the cost of transferring the full list to the web server for every page request. Chosen.

## Consequences
- The browser receives only one page and its metadata at a time; pagination logic stays in the web server.
- `openapi.yaml`, generated API code, and the existing `/urls` operation remain unchanged.
- This is not database pagination. Every page request transfers the full active-link array from the API to the Next.js server and requires it to sort/slice that array.
- If the collection grows enough for this transfer or processing to matter, revisit the API contract constraint and adopt API/database pagination.
- The default page size is 20; newest-first ordering is required for stable user expectations.
