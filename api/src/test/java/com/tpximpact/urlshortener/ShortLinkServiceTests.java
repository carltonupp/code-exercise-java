package com.tpximpact.urlshortener;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.tpximpact.urlshortener.generated.model.ValidationError;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.net.URI;
import java.util.List;
import java.util.Random;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

class ShortLinkServiceTests {
  @Test
  void invalidDestinationIncludesProblemTypeAndFieldError() {
    ShortLinkService service =
        new ShortLinkService(
            mock(ShortUrlRepository.class),
            new AliasGenerator(),
            new AliasGenerationMetrics(new SimpleMeterRegistry()),
            "http://sho.rt");

    ErrorResponseException exception =
        assertThrows(
            ErrorResponseException.class,
            () -> service.create(URI.create("ftp://example.com"), null));

    assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    assertEquals(
        URI.create("urn:urlshortener:problem:validation-failed"), exception.getBody().getType());
    assertEquals(
        List.of(new ValidationError("fullUrl", "Must be an absolute HTTP or HTTPS URL.")),
        exception.getBody().getProperties().get("errors"));
  }

  @Test
  void exhaustedGenerationIncludesStableProblemType() {
    ShortUrlRepository repository = mock(ShortUrlRepository.class);
    when(repository.existsById("aaaaaaaa")).thenReturn(true);
    ShortLinkService service =
        new ShortLinkService(
            repository,
            new AliasGenerator(new SequenceRandom(0)),
            new AliasGenerationMetrics(new SimpleMeterRegistry()),
            "http://sho.rt");

    ErrorResponseException exception =
        assertThrows(
            ErrorResponseException.class,
            () -> service.create(URI.create("https://example.com"), null));

    assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatusCode());
    assertEquals(
        URI.create("urn:urlshortener:problem:alias-generation-exhausted"),
        exception.getBody().getType());
  }

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
