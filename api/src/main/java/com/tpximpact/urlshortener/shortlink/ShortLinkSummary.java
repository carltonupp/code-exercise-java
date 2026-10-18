package com.tpximpact.urlshortener.shortlink;

import java.net.URI;

public record ShortLinkSummary(String alias, URI fullUrl, URI shortUrl) {}
