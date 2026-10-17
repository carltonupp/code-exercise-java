package com.tpximpact.urlshortener;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.net.URI;
import java.util.Random;
import org.junit.jupiter.api.Test;

class ShortLinkServiceTests {
  @Test
  void recordsCollisionsAndSuccessfulCandidatesSeparately() {
    ShortUrlRepository repository = mock(ShortUrlRepository.class);
    SimpleMeterRegistry meterRegistry = new SimpleMeterRegistry();
    AliasGenerationMetrics metrics = new AliasGenerationMetrics(meterRegistry);
    AliasGenerator generator = new AliasGenerator(new SequenceRandom(0, 1, 2));
    ShortLinkService service =
        new ShortLinkService(repository, generator, metrics, "http://sho.rt");

    when(repository.existsById("aaaaaaaa")).thenReturn(true);
    when(repository.existsById("bbbbbbbb")).thenReturn(true);
    when(repository.existsById("cccccccc")).thenReturn(false);
    when(repository.saveAndFlush(any(ShortUrl.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    URI shortUrl = service.create(URI.create("https://example.com/long"), null);

    assertEquals(URI.create("http://sho.rt/cccccccc"), shortUrl);
    assertEquals(
        2, meterRegistry.get("urlshortener.alias.generation.collisions").counter().count());
    assertEquals(1, meterRegistry.get("urlshortener.alias.generation.successes").counter().count());
  }

  private static final class SequenceRandom extends Random {
    private final int[] values;
    private int index;

    private SequenceRandom(int... values) {
      this.values = values;
    }

    @Override
    public int nextInt(int bound) {
      return values[(index++ / 8) % values.length] % bound;
    }
  }
}
