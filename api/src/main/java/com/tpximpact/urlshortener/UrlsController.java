package com.tpximpact.urlshortener;

import com.tpximpact.urlshortener.generated.api.UrlsApi;
import com.tpximpact.urlshortener.generated.model.UrlEntry;
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
    return shortLinkService.listActive();
  }
}
