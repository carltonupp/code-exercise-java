package com.tpximpact.urlshortener;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.tpximpact.urlshortener.generated.model.ValidationError;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

class ShortLinkServiceTests {
  @Test
  void createsCustomAliasPreservingDisplayCaseAndCanonicalizingStorageKey() {
    ShortUrlRepository repository = mock(ShortUrlRepository.class);
    when(repository.existsById("spring-link")).thenReturn(false);
    ShortLinkService service =
        new ShortLinkService(
            repository,
            new AliasGenerator(),
            new AliasGenerationMetrics(new SimpleMeterRegistry()),
            "http://sho.rt/");

    URI shortUrl = service.create(URI.create("https://example.com/article"), "Spring-Link");

    assertEquals(URI.create("http://sho.rt/Spring-Link"), shortUrl);
    org.mockito.ArgumentCaptor<ShortUrl> saved =
        org.mockito.ArgumentCaptor.forClass(ShortUrl.class);
    verify(repository).saveAndFlush(saved.capture());
    assertEquals("spring-link", saved.getValue().getAliasKey());
    assertEquals("Spring-Link", saved.getValue().getAlias());
    assertEquals(URI.create("https://example.com/article"), saved.getValue().getFullUrl());
  }

  @Test
  void rejectsInvalidCustomAliasesWithoutWritingToRepository() {
    ShortUrlRepository repository = mock(ShortUrlRepository.class);
    ShortLinkService service = service(repository);

    for (String alias : List.of("", "ab", "a".repeat(17), "has_underscore", "ééé")) {
      ErrorResponseException exception =
          assertThrows(
              ErrorResponseException.class,
              () -> service.create(URI.create("https://example.com"), alias));
      assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
      assertEquals(
          URI.create("urn:urlshortener:problem:validation-failed"), exception.getBody().getType());
    }

    org.mockito.Mockito.verifyNoInteractions(repository);
  }

  @Test
  void acceptsCustomAliasesAtBothLengthBoundaries() {
    ShortUrlRepository repository = mock(ShortUrlRepository.class);
    when(repository.existsById(any())).thenReturn(false);
    when(repository.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));
    ShortLinkService service = service(repository);

    assertEquals(
        URI.create("http://sho.rt/abc"), service.create(URI.create("HTTP://example.com"), "abc"));
    assertEquals(
        URI.create("http://sho.rt/abcdefghijklmnop"),
        service.create(URI.create("https://example.com"), "abcdefghijklmnop"));
  }

  @Test
  void invalidDestinationsAreRejectedBeforeRepositoryAccess() {
    ShortUrlRepository repository = mock(ShortUrlRepository.class);
    ShortLinkService service = service(repository);

    for (URI destination :
        new URI[] {
          null, URI.create("/relative"), URI.create("ftp://example.com"), URI.create("http:/")
        }) {
      assertThrows(ErrorResponseException.class, () -> service.create(destination, null));
    }

    org.mockito.Mockito.verifyNoInteractions(repository);
  }

  @Test
  void customAliasRaceBecomesAliasConflictWhenAliasWasClaimedConcurrently() {
    ShortUrlRepository repository = mock(ShortUrlRepository.class);
    when(repository.existsById("taken")).thenReturn(false, true);
    when(repository.saveAndFlush(any()))
        .thenThrow(new DataIntegrityViolationException("concurrent insert"));
    ShortLinkService service = service(repository);

    ErrorResponseException exception =
        assertThrows(
            ErrorResponseException.class,
            () -> service.create(URI.create("https://example.com"), "Taken"));

    assertEquals(
        URI.create("urn:urlshortener:problem:alias-in-use"), exception.getBody().getType());
  }

  @Test
  void customAliasRaceRethrowsUnrelatedIntegrityFailure() {
    ShortUrlRepository repository = mock(ShortUrlRepository.class);
    when(repository.existsById("taken")).thenReturn(false);
    DataIntegrityViolationException failure = new DataIntegrityViolationException("other failure");
    when(repository.saveAndFlush(any())).thenThrow(failure);
    ShortLinkService service = service(repository);

    assertEquals(
        failure,
        assertThrows(
            DataIntegrityViolationException.class,
            () -> service.create(URI.create("https://example.com"), "Taken")));
  }

  @Test
  void generatedAliasRaceRetriesAfterConcurrentInsertAndRecordsCollision() {
    ShortUrlRepository repository = mock(ShortUrlRepository.class);
    when(repository.existsById("aaaaaaaa")).thenReturn(false, true);
    when(repository.existsById("bbbbbbbb")).thenReturn(false);
    when(repository.saveAndFlush(any()))
        .thenThrow(new DataIntegrityViolationException("concurrent insert"))
        .thenAnswer(invocation -> invocation.getArgument(0));
    SimpleMeterRegistry meterRegistry = new SimpleMeterRegistry();
    ShortLinkService service =
        new ShortLinkService(
            repository,
            new AliasGenerator(new SequenceRandom(0, 1)),
            new AliasGenerationMetrics(meterRegistry),
            "http://sho.rt");

    assertEquals(
        URI.create("http://sho.rt/bbbbbbbb"),
        service.create(URI.create("https://example.com"), null));
    assertEquals(
        1, meterRegistry.get("urlshortener.alias.generation.collisions").counter().count());
    assertEquals(1, meterRegistry.get("urlshortener.alias.generation.successes").counter().count());
  }

  @Test
  void generatedAliasRaceRethrowsUnrelatedIntegrityFailure() {
    ShortUrlRepository repository = mock(ShortUrlRepository.class);
    when(repository.existsById("aaaaaaaa")).thenReturn(false);
    DataIntegrityViolationException failure = new DataIntegrityViolationException("other failure");
    when(repository.saveAndFlush(any())).thenThrow(failure);
    ShortLinkService service =
        new ShortLinkService(
            repository,
            new AliasGenerator(new SequenceRandom(0)),
            new AliasGenerationMetrics(new SimpleMeterRegistry()),
            "http://sho.rt");

    assertSame(
        failure,
        assertThrows(
            DataIntegrityViolationException.class,
            () -> service.create(URI.create("https://example.com"), null)));
  }

  @Test
  void resolveReturnsActiveDeletedAndMissingStatesUsingCanonicalAlias() {
    ShortUrlRepository repository = mock(ShortUrlRepository.class);
    ShortUrl active = new ShortUrl("active", "Active", URI.create("https://example.com/active"));
    ShortUrl deleted =
        new ShortUrl("deleted", "Deleted", URI.create("https://example.com/deleted"));
    deleted.markDeleted();
    when(repository.findById("active")).thenReturn(Optional.of(active));
    when(repository.findById("deleted")).thenReturn(Optional.of(deleted));
    when(repository.findById("missing")).thenReturn(Optional.empty());
    ShortLinkService service = service(repository);

    AliasResolution activeResolution = service.resolve("ACTIVE");
    AliasResolution deletedResolution = service.resolve("Deleted");

    assertEquals(URI.create("https://example.com/active"), activeResolution.destination());
    assertFalse(activeResolution.deleted());
    assertNull(deletedResolution.destination());
    assertTrue(deletedResolution.deleted());
    assertNull(service.resolve("Missing"));
    verify(repository).findById("active");
    verify(repository).findById("deleted");
    verify(repository).findById("missing");
  }

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

  private ShortLinkService service(ShortUrlRepository repository) {
    return new ShortLinkService(
        repository,
        new AliasGenerator(),
        new AliasGenerationMetrics(new SimpleMeterRegistry()),
        "http://sho.rt");
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
