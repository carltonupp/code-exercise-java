package com.tpximpact.urlshortener;

import java.net.URI;

public record AliasResolution(URI destination, boolean deleted) {}
