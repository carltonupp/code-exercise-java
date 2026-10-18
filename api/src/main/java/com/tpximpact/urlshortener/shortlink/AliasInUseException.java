package com.tpximpact.urlshortener.shortlink;

public class AliasInUseException extends RuntimeException {
  public AliasInUseException() {
    super("The alias is already assigned.");
  }
}
