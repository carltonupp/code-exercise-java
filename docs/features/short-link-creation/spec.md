# Short Link Creation — Product Specification

Status: Draft

## Summary
Users can create a short link for a URL. They may provide a custom alias, or leave it blank and have one generated for them.

## Personas
- **Link creator (assumption):** wants a compact link to share and may want to choose a memorable alias.

## Scenarios
- A user submits a URL without an alias and receives a short link with a generated alias.
- A user supplies an alias that meets the format rules and receives a short link using it.
- A user supplies an alias that is too short, too long, contains disallowed characters, or is already in use and sees an error.

## Scope
- Included: create short links for valid URLs; accept optional custom aliases; generate an alias when omitted; enforce alias length, character, and uniqueness rules; show the resulting short link or an error.
- Excluded: link analytics, expiry, editing, authentication, and other link management features.

## Acceptance criteria
- **AC-1:** Given a valid URL and no custom alias, when the user submits it, then a short link is created with a unique, randomly generated 8-character lowercase alphanumeric alias and shown to the user.
- **AC-2:** Given a valid URL and a unique custom alias of 3–16 ASCII letters (`A–Z`, `a–z`), numbers, or hyphens, when the user submits it, then a short link using that alias is created and shown.
- **AC-3:** Given an alias shorter than 3 characters, longer than 16 characters, containing any character other than an ASCII letter, number, or hyphen (including accented letters), or already in use regardless of letter casing, when submitted, then no link is created and the user sees a clear error.
- **AC-4:** Given a created short link, when opened, then it redirects to the original URL.
- **AC-5:** Given an invalid URL, when submitted, then no link is created and the user sees a clear error.

## Behavioral test cases
- **TC-1:** Submit a valid URL with no alias → receive and display a generated short link with an 8-character lowercase alphanumeric alias.
- **TC-2:** Submit a valid URL with a unique 3-character alias → create and display that alias.
- **TC-3:** Submit a valid URL with a unique 16-character alias → create and display that alias.
- **TC-4:** Submit aliases of 2 and 17 characters → show validation errors and create no link.
- **TC-5:** Submit an alias containing punctuation, whitespace, or an accented letter → show a validation error and create no link.
- **TC-6:** Submit an alias that is already in use, including one that differs from an existing alias only by letter casing → show an error and create no link.
- **TC-7:** Submit an invalid URL → show a validation error and create no link.
- **TC-8:** Open a created short link → redirect to the original URL.

## Constraints, assumptions, and open questions
- Custom aliases contain only ASCII `A–Z`, `a–z`, `0–9`, and `-`. Preserve the casing supplied by the user for display, but treat aliases that differ only by letter casing as the same alias.
- Generated aliases use eight randomly selected lowercase letters or digits; collisions are checked and retried as described in [ADR 0002](../../adr/0002-random-generated-aliases.md).
- Once assigned, an alias is permanently unavailable for reuse, including if link retirement or deletion is added in future work. Retirement and deletion behavior are outside this feature's scope.
- The user-facing flow includes entering a URL, optionally entering an alias, and seeing the created short link.
