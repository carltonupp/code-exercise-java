# ADR 0001: Treat Short Link Aliases as Case-Insensitive

- Status: Accepted
- Date: 2026-10-17

## Context
Short links are URL paths, and users generally expect a shared link to work when its letters are capitalized differently. Allowing aliases that differ only by letter casing would make visually similar links point to different destinations and make links less predictable when typed or reformatted.

## Decision
Treat aliases as case-insensitive for uniqueness and lookup. Preserve the casing selected by the user when presenting a custom alias. Generated aliases must also resolve consistently regardless of casing.

## Alternatives considered
- **Case-sensitive aliases:** allows more possible aliases, but links that differ only by capitalization resolve to different destinations.
- **Normalize all displayed aliases to lowercase:** provides consistent appearance, but discards the casing supplied by users.

## Consequences
- Positive: Changing capitalization does not create a different alias or destination.
- Tradeoffs: Aliases that differ only by casing cannot be assigned to separate destinations; persistence and lookup must use consistent case-insensitive comparison.
