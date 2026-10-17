package com.tpximpact.urlshortener;

import com.tpximpact.urlshortener.generated.api.ShortLinkCreationApi;
import com.tpximpact.urlshortener.generated.model.ShortenRequest;
import com.tpximpact.urlshortener.generated.model.ShortenResponse;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ShortLinkCreationController implements ShortLinkCreationApi {
  private final ShortLinkService shortLinkService;

  public ShortLinkCreationController(ShortLinkService shortLinkService) {
    this.shortLinkService = shortLinkService;
  }

  @Override
  public ShortenResponse shortenUrl(ShortenRequest request) {
    return new ShortenResponse(
        shortLinkService.create(request.getFullUrl(), request.getCustomAlias()));
  }
}
