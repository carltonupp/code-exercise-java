package com.tpximpact.urlshortener.shortlink;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.tpximpact.urlshortener.persistence.ShortUrlRepository;
import java.net.URI;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

class ShortLinkDeletionTests {
  @Test
  void deleteMarksLinkDeletedAndErasesDestinationUsingCaseInsensitiveAlias() {
    ShortUrlRepository repository = mock(ShortUrlRepository.class);
    ShortUrl shortUrl = new ShortUrl("my-alias", "My-Alias", URI.create("https://example.com"));
    when(repository.findById("my-alias")).thenReturn(Optional.of(shortUrl));
    ShortLinkService service = service(repository);

    service.delete("MY-ALIAS");

    verify(repository).saveAndFlush(shortUrl);
    assertTrue(shortUrl.isDeleted());
    assertEquals("", shortUrl.getFullUrl().toString());
  }

  @Test
  void deletingUnknownOrAlreadyDeletedAliasReturnsNotFound() {
    ShortUrlRepository repository = mock(ShortUrlRepository.class);
    when(repository.findById("missing")).thenReturn(Optional.empty());
    ShortUrl deleted = new ShortUrl("gone", "Gone", URI.create("https://example.com"));
    deleted.markDeleted();
    when(repository.findById("gone")).thenReturn(Optional.of(deleted));
    ShortLinkService service = service(repository);

    ErrorResponseException unknown =
        assertThrows(ErrorResponseException.class, () -> service.delete("missing"));
    ErrorResponseException repeated =
        assertThrows(ErrorResponseException.class, () -> service.delete("gone"));

    assertEquals(HttpStatus.NOT_FOUND, unknown.getStatusCode());
    assertEquals(HttpStatus.NOT_FOUND, repeated.getStatusCode());
  }

  @Test
  void deletedAliasRemainsReservedRegardlessOfCasing() {
    ShortUrlRepository repository = mock(ShortUrlRepository.class);
    when(repository.existsById("gone")).thenReturn(true);
    ShortLinkService service = service(repository);

    ErrorResponseException exception =
        assertThrows(
            ErrorResponseException.class,
            () -> service.create(URI.create("https://example.com/new"), "GONE"));

    assertEquals(
        URI.create("urn:urlshortener:problem:alias-in-use"), exception.getBody().getType());
    verify(repository, never()).saveAndFlush(any(ShortUrl.class));
  }

  private ShortLinkService service(ShortUrlRepository repository) {
    return new ShortLinkService(
        repository,
        new AliasGenerator(),
        new AliasGenerationMetrics(new io.micrometer.core.instrument.simple.SimpleMeterRegistry()),
        "http://sho.rt");
  }
}
