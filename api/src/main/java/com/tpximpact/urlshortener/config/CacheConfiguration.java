package com.tpximpact.urlshortener.config;

import java.util.Locale;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfiguration {
  @Bean
  public KeyGenerator aliasKeyGenerator() {
    return (target, method, params) -> ((String) params[0]).toLowerCase(Locale.ROOT);
  }
}
