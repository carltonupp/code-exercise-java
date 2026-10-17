package com.tpximpact.urlshortener;

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
    ShortUrl shortUrl = repository.findById(aliasKey).orElseThrow(ApiProblems::aliasNotFound);
    if (shortUrl.isDeleted()) {
      throw ApiProblems.aliasNotFound();
    }
    shortUrl.markDeleted();
    repository.saveAndFlush(shortUrl);
  }
}
