package com.tpximpact.urlshortener.shortlink;

import com.tpximpact.urlshortener.api.ApiProblems;
import com.tpximpact.urlshortener.generated.model.UrlEntry;
import com.tpximpact.urlshortener.persistence.ShortUrlRepository;
import java.net.URI;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

@Service
public class ShortLinkService {
  private static final Pattern ALIAS_PATTERN = Pattern.compile("[A-Za-z0-9-]{3,16}");
  private static final int MAX_GENERATION_ATTEMPTS = 10;

  private final ShortUrlRepository repository;
  private final AliasGenerator aliasGenerator;
  private final AliasGenerationMetrics aliasGenerationMetrics;
  private final String publicBaseUrl;
  private final ShortLinkDeletionTransaction deletionTransaction;

  public ShortLinkService(
      ShortUrlRepository repository,
      AliasGenerator aliasGenerator,
      AliasGenerationMetrics aliasGenerationMetrics,
      @Value("${shortener.public-base-url}") String publicBaseUrl,
      ShortLinkDeletionTransaction deletionTransaction) {
    this.repository = repository;
    this.aliasGenerator = aliasGenerator;
    this.aliasGenerationMetrics = aliasGenerationMetrics;
    this.publicBaseUrl = publicBaseUrl.replaceAll("/+$", "");
    this.deletionTransaction = deletionTransaction;
  }

  public URI create(URI fullUrl, String customAlias) {
    validateFullUrl(fullUrl);
    if (customAlias != null) {
      validateAlias(customAlias);
      saveCustomAlias(customAlias, fullUrl);
      return shortUrlFor(customAlias);
    }
    return createGeneratedAlias(fullUrl);
  }

  public List<UrlEntry> listActive() {
    return repository.findAll().stream()
        .filter(shortUrl -> !shortUrl.isDeleted())
        .sorted(
            Comparator.comparing(
                    ShortUrl::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(ShortUrl::getAliasKey))
        .map(
            shortUrl ->
                new UrlEntry(
                    shortUrl.getAlias(), shortUrl.getFullUrl(), shortUrlFor(shortUrl.getAlias())))
        .toList();
  }

  @CacheEvict(
      cacheNames = "alias-resolutions",
      key = "#alias.toLowerCase(T(java.util.Locale).ROOT)")
  public void delete(String alias) {
    String aliasKey = canonicalAlias(alias);
    deletionTransaction.delete(aliasKey);
  }

  @Cacheable(
      cacheNames = "alias-resolutions",
      key = "#alias.toLowerCase(T(java.util.Locale).ROOT)",
      unless = "#result == null")
  public AliasResolution resolve(String alias) {
    String aliasKey = canonicalAlias(alias);
    return repository
        .findById(aliasKey)
        .map(
            shortUrl ->
                new AliasResolution(
                    shortUrl.isDeleted() ? null : shortUrl.getFullUrl(), shortUrl.isDeleted()))
        .orElse(null);
  }

  private void validateFullUrl(URI fullUrl) {
    if (fullUrl == null
        || !fullUrl.isAbsolute()
        || fullUrl.getHost() == null
        || !("http".equalsIgnoreCase(fullUrl.getScheme())
            || "https".equalsIgnoreCase(fullUrl.getScheme()))) {
      throw ApiProblems.invalidField("fullUrl", "Must be an absolute HTTP or HTTPS URL.");
    }
  }

  private void validateAlias(String alias) {
    if (!ALIAS_PATTERN.matcher(alias).matches()) {
      throw ApiProblems.invalidField(
          "customAlias", "Must contain 3–16 ASCII letters, numbers, or hyphens.");
    }
  }

  private void saveCustomAlias(String alias, URI fullUrl) {
    String aliasKey = canonicalAlias(alias);
    if (repository.existsById(aliasKey)) {
      throw ApiProblems.aliasInUse();
    }
    try {
      repository.saveAndFlush(new ShortUrl(aliasKey, alias, fullUrl));
    } catch (DataIntegrityViolationException exception) {
      if (repository.existsById(aliasKey)) {
        throw ApiProblems.aliasInUse();
      }
      throw exception;
    }
  }

  private URI createGeneratedAlias(URI fullUrl) {
    for (int attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
      String alias = aliasGenerator.generate();
      String aliasKey = canonicalAlias(alias);
      if (repository.existsById(aliasKey)) {
        aliasGenerationMetrics.recordCollision();
        continue;
      }

      try {
        repository.saveAndFlush(new ShortUrl(aliasKey, alias, fullUrl));
        aliasGenerationMetrics.recordSuccess();
        return shortUrlFor(alias);
      } catch (DataIntegrityViolationException exception) {
        if (repository.existsById(aliasKey)) {
          aliasGenerationMetrics.recordCollision();
          continue;
        }
        throw exception;
      }
    }

    throw ApiProblems.aliasGenerationExhausted();
  }

  private URI shortUrlFor(String alias) {
    return URI.create(publicBaseUrl + "/" + alias);
  }

  private String canonicalAlias(String alias) {
    return alias.toLowerCase(Locale.ROOT);
  }
}
