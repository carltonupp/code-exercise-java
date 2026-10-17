package com.tpximpact.urlshortener;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.net.URI;

@Entity
@Table(name = "short_urls")
public class ShortUrl {
  @Id
  @Column(name = "alias_key", nullable = false, length = 16)
  private String aliasKey;

  @Column(nullable = false, length = 16)
  private String alias;

  @Column(name = "full_url", nullable = false, length = 4096)
  private String fullUrl;

  @Column(name = "deleted")
  private Boolean deleted;

  protected ShortUrl() {}

  public ShortUrl(String aliasKey, String alias, URI fullUrl) {
    this.aliasKey = aliasKey;
    this.alias = alias;
    this.fullUrl = fullUrl.toString();
    this.deleted = false;
  }

  public String getAlias() {
    return alias;
  }

  public URI getFullUrl() {
    return URI.create(fullUrl);
  }

  public boolean isDeleted() {
    return Boolean.TRUE.equals(deleted);
  }

  public void markDeleted() {
    fullUrl = "";
    deleted = true;
  }
}
