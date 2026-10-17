package com.tpximpact.urlshortener.shortlink;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Random;
import org.junit.jupiter.api.Test;

class AliasGeneratorTests {
  @Test
  void generatesEightLowercaseAlphanumericCharacters() {
    AliasGenerator generator = new AliasGenerator(new FixedRandom(35));

    assertEquals("99999999", generator.generate());
  }

  @Test
  void secureGeneratorAlwaysUsesTheAllowedAlphabet() {
    AliasGenerator generator = new AliasGenerator();

    for (int attempt = 0; attempt < 100; attempt++) {
      assertTrue(generator.generate().matches("[a-z0-9]{8}"));
    }
  }

  private static final class FixedRandom extends Random {
    private final int index;

    private FixedRandom(int index) {
      this.index = index;
    }

    @Override
    public int nextInt(int bound) {
      return index % bound;
    }
  }
}
