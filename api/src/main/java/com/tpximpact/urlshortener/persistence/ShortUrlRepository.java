package com.tpximpact.urlshortener.persistence;

import com.tpximpact.urlshortener.shortlink.ShortUrl;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShortUrlRepository extends JpaRepository<ShortUrl, String> {}
