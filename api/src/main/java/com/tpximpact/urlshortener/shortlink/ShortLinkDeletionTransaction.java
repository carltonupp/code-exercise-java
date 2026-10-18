package com.tpximpact.urlshortener.shortlink;

import com.tpximpact.urlshortener.persistence.ShortUrlRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ShortLinkDeletionTransaction {
  private final ShortUrlRepository repository;

  public ShortLinkDeletionTransaction(ShortUrlRepository repository) {
    this.repository = repository;
  }

  @Transactional
  public void delete(String aliasKey) {
    ShortUrl shortUrl = repository.findById(aliasKey).orElseThrow(AliasNotFoundException::new);
    if (shortUrl.isDeleted()) {
      throw new AliasNotFoundException();
    }
    shortUrl.markDeleted();
    repository.saveAndFlush(shortUrl);
  }
}
