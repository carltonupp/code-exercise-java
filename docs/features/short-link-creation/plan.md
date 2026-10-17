# Short Link Creation — Implementation Plan

## Task sequence
| ID | Outcome and acceptance criteria | Dependencies | Area/owner | Parallelizable | Completion evidence |
|---|---|---|---|---|---|
| T1 | Finalize the API contract for creation: required URL, optional alias with 3–16 ASCII character and allowed-character constraints, case-insensitive uniqueness, success response, and invalid/conflict response behavior (AC-1–AC-4). Generate the Java and TypeScript contract artifacts from the source contract. | — | OpenAPI contract and generated clients | No | Contract validation and generated types represent optional alias and creation responses/errors. |
| T2 | Implement API persistence and creation. Validate HTTP(S) destinations, accept a valid unused custom alias, generate an 8-character lowercase alphanumeric alias when omitted, prevent duplicates even when aliases differ only by case, track generated-alias collisions and successes, and return the created short link (AC-1–AC-4). Retry up to ten generated candidates, then return 503. | T1 | API | No | API behavior covers generated/custom creation, alias boundaries and character rules, case-insensitive duplicates, invalid URLs, and persistence across requests; telemetry exposes generated alias collision and success counters. |
| T3 | Add the web creation flow: URL input, optional alias input, submission state, success result, and understandable validation/conflict/network errors (AC-1–AC-4). Route the browser request through a Next.js API handler using the configured server-side API base URL. | T1, T2 | Web and API integration | No | Web checks cover successful generated/custom alias flow, validation and conflict errors, and API unavailability; manual run confirms browser requests work in the configured local/Compose setup. |

## Task details

### T1 — Contract
- Preserve the existing `POST /shorten` operation and response shape unless a contract gap prevents the agreed behavior.
- Specify `customAlias` as optional and constrain it to 3–16 ASCII letters (`A–Z`, `a–z`), numbers, or hyphens. Accented letters are invalid.
- Make the contract describe invalid URL/alias and alias conflict responses clearly enough for the web client to present them.
- Regenerate Java interfaces/models and the TypeScript client; generated files are outputs, not manual edit targets.

### T2 — Creation and persistence
- Store alias-to-destination mappings persistently so uniqueness checks remain valid across later requests and API restarts.
- Keep random character selection in a dedicated `AliasGenerator`; cover its output length and alphabet with unit tests. Keep collision checking and persistence in the service.
- Persist a canonical lowercase alias key as the unique primary key and keep the selected alias separately for display; use the canonical form for uniqueness checks.
- Keep the creation controller scoped to its generated OpenAPI interface so it does not require implementing unrelated list/delete operations in this feature.
- Preserve permanent alias reservation: future link retirement or deletion must not make an assigned alias available again. Do not add retirement/deletion behavior in this feature.
- Follow [ADR 0002](../../adr/0002-random-generated-aliases.md) for generated alias length, alphabet, random selection, and collision retries.
- Emit the Micrometer counters defined in ADR 0002 for OTLP export. Count occupied candidates and successfully persisted generated aliases; exclude custom aliases and do not add alias values as metric tags.
- Build response URLs from `shortener.public-base-url`, configurable with `SHORT_URL_BASE_URL`; default to `http://localhost:8080` for local development and Compose.
- Normalize aliases for uniqueness checks so case-only variations conflict, while preserving the user's chosen casing in the short link.
- Keep uniqueness enforcement at the persistence boundary so concurrent attempts cannot create two links with aliases that match regardless of case.
- For generated aliases, retry up to ten occupied candidates and return 503 if all attempts collide.
- Return client errors for invalid destination URLs, malformed aliases, and aliases already in use; do not persist rejected requests.
- Build the returned short URL from the externally visible API origin/configuration, not an internal Compose hostname.

### T3 — Web flow
- Follow [ADR 0004](../../adr/0004-standardize-api-errors-with-problem-details.md) for API and proxy error responses. Generate error types from OpenAPI, handle problems by `type`, and display field-validation messages beside their inputs.
- Add an optional custom alias field alongside the required URL field.
- Disable or otherwise guard duplicate submissions while a request is in flight and expose progress accessibly.
- On success, show the short link and provide a way to copy it.
- Map validation and alias-conflict responses to clear inline feedback; retain entered values so users can correct and resubmit.
- Handle network/API failures without losing the entered URL or alias.

## Integration and validation
- Apply [ADR 0001](../../adr/0001-case-insensitive-aliases.md): uniqueness and lookup ignore casing while custom alias casing is preserved for display.
- Sequence is contract → API creation → web integration; the web UI depends on the server-side proxy because `API_BASE_URL` is not a browser-visible setting.
- For each task, add focused tests for its observable behavior and run that task's relevant checks before presenting the task for review. Do not begin the next task until the user approves the review handoff.
- At integration, validate API formatting and tests, frontend tests/lint/typecheck/build, and the end-to-end creation flow with the configured API base URL.
- If the externally visible short URL origin cannot be implemented from existing configuration, surface that as a decision before starting the dependent task.
