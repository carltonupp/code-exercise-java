package com.tpximpact.urlshortener.api;

import com.tpximpact.urlshortener.generated.api.ShortLinkRedirectApi;
import com.tpximpact.urlshortener.generated.api.UrlsApi;
import com.tpximpact.urlshortener.generated.model.UrlEntry;
import com.tpximpact.urlshortener.shortlink.AliasResolution;
import com.tpximpact.urlshortener.shortlink.ShortLinkService;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@RestController
public class UrlsController implements UrlsApi, ShortLinkRedirectApi {
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

  @Override
  public void redirectToUrl(String alias) {
    AliasResolution resolution = shortLinkService.resolve(alias);
    if (resolution == null) {
      throw ApiProblems.aliasNotFound();
    }
    if (resolution.deleted()) {
      throw ApiProblems.aliasDeleted();
    }
    HttpServletResponse response = currentResponse();
    response.setStatus(HttpServletResponse.SC_FOUND);
    response.setHeader("Location", resolution.destination().toASCIIString());
  }

  private HttpServletResponse currentResponse() {
    return ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes())
        .getResponse();
  }
}
