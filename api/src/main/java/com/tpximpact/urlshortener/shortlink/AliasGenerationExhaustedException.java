package com.tpximpact.urlshortener.shortlink;

public class AliasGenerationExhaustedException extends RuntimeException {
  public AliasGenerationExhaustedException() {
    super("Could not allocate a unique alias.");
  }
}
