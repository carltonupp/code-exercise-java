package com.tpximpact.urlshortener.api;

import com.tpximpact.urlshortener.generated.api.UrlsApi;
import com.tpximpact.urlshortener.generated.model.UrlEntry;
import com.tpximpact.urlshortener.shortlink.ShortLinkService;
import java.util.List;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UrlsController implements UrlsApi {
  private final ShortLinkService shortLinkService;

  public UrlsController(ShortLinkService shortLinkService) {
    this.shortLinkService = shortLinkService;
  }

  @Override
  public void deleteUrl(String alias) {
    shortLinkService.delete(alias);
  }

  @Override
  public List<UrlEntry> listUrls() {
    return shortLinkService.listActive().stream()
        .map(link -> new UrlEntry(link.alias(), link.fullUrl(), link.shortUrl()))
        .toList();
  }
}
