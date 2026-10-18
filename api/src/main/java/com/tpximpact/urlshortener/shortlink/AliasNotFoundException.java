package com.tpximpact.urlshortener.shortlink;

public class AliasNotFoundException extends RuntimeException {
  public AliasNotFoundException() {
    super("No active link exists for this alias.");
  }
}
