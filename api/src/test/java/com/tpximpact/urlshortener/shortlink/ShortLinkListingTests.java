package com.tpximpact.urlshortener.shortlink;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.tpximpact.urlshortener.persistence.ShortUrlRepository;
import java.net.URI;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

class ShortLinkListingTests {
  @Test
  void listActiveReturnsNewestFirstWithAliasKeyTieBreakerAndExcludesDeletedLinks() {
    ShortUrlRepository repository = mock(ShortUrlRepository.class);
    Instant older = Instant.parse("2026-10-16T10:00:00Z");
    Instant newer = Instant.parse("2026-10-17T10:00:00Z");
    ShortUrl oldLink = link("old", older);
    ShortUrl tiedLaterAlias = link("zebra", newer);
    ShortUrl tiedEarlierAlias = link("alpha", newer);
    ShortUrl deletedLink = link("deleted", Instant.parse("2026-10-18T10:00:00Z"));
    deletedLink.markDeleted();
    when(repository.findAll())
        .thenReturn(List.of(oldLink, tiedLaterAlias, deletedLink, tiedEarlierAlias));
    ShortLinkService service = service(repository);

    List<String> aliases = service.listActive().stream().map(ShortLinkSummary::alias).toList();

    assertEquals(List.of("alpha", "zebra", "old"), aliases);
    assertEquals(
        new ShortLinkSummary(
            "alpha", URI.create("https://example.com/alpha"), URI.create("http://sho.rt/alpha")),
        service.listActive().getFirst());
  }

  @Test
  void listActiveReturnsEmptyWhenNoLinksExist() {
    ShortUrlRepository repository = mock(ShortUrlRepository.class);
    when(repository.findAll()).thenReturn(List.of());

    assertEquals(List.of(), service(repository).listActive());
  }

  private ShortUrl link(String alias, Instant createdAt) {
    return new ShortUrl(alias, alias, URI.create("https://example.com/" + alias), createdAt);
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
