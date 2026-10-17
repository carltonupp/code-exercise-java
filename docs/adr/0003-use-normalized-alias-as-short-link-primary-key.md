# ADR 0003: Use the Normalized Alias as the Short Link Primary Key

- Status: Accepted
- Date: 2026-10-17

## Context
Short links are looked up by alias, and aliases are unique without regard to letter casing as decided in [ADR 0001](0001-case-insensitive-aliases.md). The application stores the normalized alias as `alias_key` and preserves the submitted or generated casing separately as `alias` for display. Aliases are not reused, including if a link is retired in future work.

A primary key based on the alias makes the lookup key the row identity. A separate generated identifier would keep row identity independent of the public alias, at the cost of maintaining an additional unique index and identifier.

## Decision
Use the lowercase normalized alias (`alias_key`) as the primary key for a short link. Preserve the display alias separately. Enforce alias uniqueness through the primary key, and continue to normalize aliases consistently for creation and lookup.

## Alternatives considered
- **Generated UUID primary key with a unique normalized alias:** separates internal identity from the public alias and makes alias changes easier, but adds an identifier and a separate uniqueness constraint for a value already used to locate the row.
- **Display alias as primary key:** avoids a second alias field, but case-insensitive uniqueness and lookup would depend on database-specific collation or functional indexes rather than an explicit normalized key.

## Consequences
- Positive: The row key directly represents the value used for short-link lookup, and the database primary key enforces alias uniqueness.
- Tradeoffs: The public alias becomes the stable internal identity. Changing an alias would require changing a primary key and updating any references to it. This choice relies on the policy that aliases are never reused.
- Revisit this decision if aliases become mutable or other persistent records need a stable reference that must survive alias changes.
