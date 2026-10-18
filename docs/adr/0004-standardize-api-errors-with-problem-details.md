# ADR 0004: Standardize API Errors with Problem Details

- Status: Accepted
- Date: 2026-10-17

## Context
The creation form needs predictable error responses to explain failures and associate validation messages with inputs. Defining error bodies in the OpenAPI contract lets the generated client describe them. Matching human-readable error messages also makes client behavior dependent on wording.

Spring provides `ProblemDetail` support for [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html). This supplies a standard response format that can be represented in OpenAPI and used by the generated client.

## Decision
Use RFC 9457 Problem Details for errors, with the media type `application/problem+json`. Use Spring's existing `ProblemDetail` support to produce API responses. Errors produced by the frontend API proxy must follow the same format.

Provide the following standard fields:

- `type`: a stable problem identifier, using `urn:urlshortener:problem:<name>` for application-defined problems. Clients use this identifier for problem-specific behavior.
- `title`: a short, consistent description of the problem type.
- `status`: the HTTP status code, matching the actual response status.
- `detail`: a human-readable explanation of this occurrence.
- `instance`: the request path where the problem occurred; this need not uniquely identify an occurrence.

For example:

```json
{
  "type": "urn:urlshortener:problem:alias-in-use",
  "title": "Alias already in use",
  "status": 400,
  "detail": "This alias has already been assigned. Choose another.",
  "instance": "/shorten"
}
```

For field-validation failures, add an optional `errors` extension containing an array of objects with `field` and `message` properties. `field` names the request property and `message` explains its validation failure. For example, a validation problem may include:

```json
{
  "errors": [
    {
      "field": "customAlias",
      "message": "Must contain between 3 and 16 characters."
    }
  ]
}
```

Describe the shared problem schema and its field-error extension in OpenAPI and reference it from error responses. Generate client types from that contract. Clients use `type` for problem-specific logic rather than parsing `title`, `detail`, or field-message text, except for the existing resolution compatibility case described below.

## Resolution compatibility exception

Deleted and unknown aliases currently share HTTP 404 and the problem type `urn:urlshortener:problem:not-found`. The API distinguishes them with the titles `Link deleted` and `Link not found`. To preserve the existing contract and distinct browser pages, `web/src/server/linkResolution.ts` contains the single title-based compatibility check. Route tests cover both responses and the fallback for malformed 404 bodies. Other clients should continue to use stable problem types where those types distinguish the outcome.

This is a known wording dependency: changing the deleted-link title can change which browser page appears. Removing that dependency would require an explicitly agreed API response change; no such change is part of the current implementation.

## Alternatives considered
- **A custom JSON error envelope:** can provide the same information, but introduces a proprietary format where Spring already supports a standard.
- **HTTP status codes without a defined response body:** distinguish broad failure categories, but cannot reliably explain specific failures or identify invalid fields.
- **Client matching of error-message text:** avoids defining stable identifiers, but changing message wording changes application behavior.

## Consequences
- Positive: API and proxy failures have a consistent shape; generated client types describe errors; field-validation messages can appear beside the relevant inputs.
- Tradeoffs: Problem identifiers become part of the API contract and must remain stable. Error handlers and the frontend proxy must consistently produce the agreed format.

## References
- [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html)
- [Spring Framework error responses](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html)
