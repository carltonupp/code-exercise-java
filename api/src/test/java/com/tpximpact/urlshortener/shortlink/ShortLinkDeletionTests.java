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

class ShortLinkDeletionTests {
  @Test
  void deleteMarksLinkDeletedAndErasesDestination() {
    ShortUrlRepository repository = mock(ShortUrlRepository.class);
    ShortUrl shortUrl = new ShortUrl("my-alias", "My-Alias", URI.create("https://example.com"));
    when(repository.findById("my-alias")).thenReturn(Optional.of(shortUrl));
    ShortLinkDeletionTransaction transaction = new ShortLinkDeletionTransaction(repository);

    transaction.delete("my-alias");

    verify(repository).saveAndFlush(shortUrl);
    assertTrue(shortUrl.isDeleted());
    assertEquals("", shortUrl.getFullUrl().toString());
  }

  @Test
  void deletingUnknownOrAlreadyDeletedAliasReportsNotFound() {
    ShortUrlRepository repository = mock(ShortUrlRepository.class);
    when(repository.findById("missing")).thenReturn(Optional.empty());
    ShortUrl deleted = new ShortUrl("gone", "Gone", URI.create("https://example.com"));
    deleted.markDeleted();
    when(repository.findById("gone")).thenReturn(Optional.of(deleted));
    ShortLinkDeletionTransaction transaction = new ShortLinkDeletionTransaction(repository);

    assertThrows(AliasNotFoundException.class, () -> transaction.delete("missing"));
    assertThrows(AliasNotFoundException.class, () -> transaction.delete("gone"));
    verify(repository, never()).saveAndFlush(any(ShortUrl.class));
  }

  @Test
  void deleteDelegatesToTransactionUsingCanonicalAlias() {
    ShortLinkDeletionTransaction transaction = mock(ShortLinkDeletionTransaction.class);
    ShortLinkService service =
        new ShortLinkService(
            mock(ShortUrlRepository.class),
            new AliasGenerator(),
            new AliasGenerationMetrics(
                new io.micrometer.core.instrument.simple.SimpleMeterRegistry()),
            "http://sho.rt",
            transaction);

    service.delete("MY-ALIAS");

    verify(transaction).delete("my-alias");
  }

  @Test
  void deletedAliasRemainsReservedRegardlessOfCasing() {
    ShortUrlRepository repository = mock(ShortUrlRepository.class);
    when(repository.existsById("gone")).thenReturn(true);
    ShortLinkService service = service(repository);

    assertThrows(
        AliasInUseException.class,
        () -> service.create(URI.create("https://example.com/new"), "GONE"));
    verify(repository, never()).saveAndFlush(any(ShortUrl.class));
  }

  private ShortLinkService service(ShortUrlRepository repository) {
    return new ShortLinkService(
        repository,
        new AliasGenerator(),
        new AliasGenerationMetrics(new io.micrometer.core.instrument.simple.SimpleMeterRegistry()),
        "http://sho.rt",
        mock(ShortLinkDeletionTransaction.class));
  }
}
