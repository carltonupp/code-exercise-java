package com.tpximpact.urlshortener.shortlink;

import java.net.URI;

public record AliasResolution(URI destination, boolean deleted) {}
