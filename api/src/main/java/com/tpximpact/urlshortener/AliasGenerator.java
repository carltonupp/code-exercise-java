package com.tpximpact.urlshortener;

import java.security.SecureRandom;
import java.util.random.RandomGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class AliasGenerator {
  private static final String ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
  private static final int ALIAS_LENGTH = 8;

  private final RandomGenerator random;

  @Autowired
  public AliasGenerator() {
    this(new SecureRandom());
  }

  AliasGenerator(RandomGenerator random) {
    this.random = random;
  }

  public String generate() {
    StringBuilder alias = new StringBuilder(ALIAS_LENGTH);
    for (int index = 0; index < ALIAS_LENGTH; index++) {
      alias.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
    }
    return alias.toString();
  }
}
