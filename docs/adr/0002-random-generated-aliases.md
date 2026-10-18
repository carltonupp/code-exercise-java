# ADR 0002: Generate Random Eight-Character Aliases

- Status: Accepted
- Date: 2026-10-17

## Context
Users may omit a custom alias and still need a short link. Generated aliases must be unique, compact, and compatible with the case-insensitive lookup decision in [ADR 0001](0001-case-insensitive-aliases.md). Sequential aliases expose creation order, while aliases derived from destination URLs can reveal information about those URLs and may not distribute evenly.

With lowercase letters and digits, an eight-character alias has `36^8 = 2,821,109,907,456` possible values. At one million existing aliases, the chance that one random candidate is already occupied is about 1 in 2.8 million. At ten million, it is about 1 in 282,000. These are candidate collision probabilities; checking uniqueness and retrying means a collision does not create a duplicate.

## Decision
When no custom alias is supplied, generate an alias by selecting eight characters uniformly at random from `abcdefghijklmnopqrstuvwxyz0123456789`. Check uniqueness using the case-insensitive alias rule. If the candidate is already in use, generate another candidate and retry, up to ten candidates for a request. Only return a link after its alias has been saved successfully. If all ten candidates collide, return a temporary service error so the caller can retry later.

Instrument generated alias allocation with Micrometer counters: `urlshortener.alias.generation.collisions` increments for each occupied candidate, and `urlshortener.alias.generation.successes` increments for each available candidate successfully persisted. These counters cover generated aliases only, not user-supplied aliases. Calculate the candidate collision rate as `collisions / (collisions + successes)` over the same time window. Do not attach the alias itself or other high-cardinality values as metric tags. Use the collision rate trend to assess when the alias length or generation approach needs to change.

The API registers these counters with Micrometer and includes the OTLP metrics registry. Export is disabled by default and is enabled with an externally supplied collector URL. Metrics use OTLP/HTTP protobuf; the repository does not provision a collector. The service resource is named from `spring.application.name` (`urlshortener`). See the [OTLP configuration instructions](../configuration.md#otlp-metrics).

## Alternatives considered
- **Sequential aliases:** simple and collision-free, but expose approximate creation order and volume.
- **Destination-derived aliases:** can leak information about the destination and require collision handling.
- **Shorter random aliases:** use fewer characters, but occupy the alias space more quickly and increase retry frequency.

## Consequences
- Positive: Generated links are compact, unpredictable, and use the same lowercase alphanumeric character set as the custom alias rules. The counters show the percentage of generated candidates that collide.
- Tradeoffs: Random collisions remain possible and must be handled with uniqueness enforcement and retries. The alias space is finite and collision retries become more frequent as it fills; metrics show this trend but do not themselves prevent exhaustion. Ten consecutive collisions fail that request and require a later retry or a future generator change.
