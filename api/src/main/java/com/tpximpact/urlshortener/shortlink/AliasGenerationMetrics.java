package com.tpximpact.urlshortener.shortlink;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class AliasGenerationMetrics {
  // Count candidate outcomes, not link outcomes, so retries remain visible in the collision rate.
  // See docs/adr/0002-random-generated-aliases.md.
  private final Counter collisions;
  private final Counter successes;

  public AliasGenerationMetrics(MeterRegistry meterRegistry) {
    this.collisions =
        Counter.builder("urlshortener.alias.generation.collisions")
            .description("Occupied generated alias candidates")
            .baseUnit("candidate")
            .register(meterRegistry);
    this.successes =
        Counter.builder("urlshortener.alias.generation.successes")
            .description("Successfully persisted generated aliases")
            .baseUnit("alias")
            .register(meterRegistry);
  }

  public void recordCollision() {
    collisions.increment();
  }

  public void recordSuccess() {
    successes.increment();
  }
}
