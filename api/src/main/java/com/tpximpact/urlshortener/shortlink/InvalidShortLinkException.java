package com.tpximpact.urlshortener.shortlink;

public class InvalidShortLinkException extends RuntimeException {
  private final String field;

  public InvalidShortLinkException(String field, String message) {
    super(message);
    this.field = field;
  }

  public String getField() {
    return field;
  }
}
