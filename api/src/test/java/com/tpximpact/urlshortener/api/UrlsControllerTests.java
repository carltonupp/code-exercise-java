package com.tpximpact.urlshortener.api;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.tpximpact.urlshortener.shortlink.AliasNotFoundException;
import com.tpximpact.urlshortener.shortlink.ShortLinkService;
import com.tpximpact.urlshortener.shortlink.ShortLinkSummary;
import java.net.URI;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(UrlsController.class)
class UrlsControllerTests {
  @Autowired private MockMvc mockMvc;
  @MockitoBean private ShortLinkService service;

  @Test
  void listsActiveLinks() throws Exception {
    when(service.listActive())
        .thenReturn(
            List.of(
                new ShortLinkSummary(
                    "alpha",
                    URI.create("https://example.com/article"),
                    URI.create("http://sho.rt/alpha"))));

    mockMvc
        .perform(get("/urls"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].alias").value("alpha"))
        .andExpect(jsonPath("$[0].fullUrl").value("https://example.com/article"))
        .andExpect(jsonPath("$[0].shortUrl").value("http://sho.rt/alpha"));
  }

  @Test
  void deletesAnAlias() throws Exception {
    mockMvc.perform(delete("/My-Link")).andExpect(status().isNoContent());

    verify(service).delete("My-Link");
  }

  @Test
  void unavailableAliasMapsToNotFoundProblem() throws Exception {
    doThrow(new AliasNotFoundException()).when(service).delete("missing");

    mockMvc
        .perform(delete("/missing"))
        .andExpect(status().isNotFound())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.type").value("urn:urlshortener:problem:not-found"))
        .andExpect(jsonPath("$.title").value("Link not found"))
        .andExpect(jsonPath("$.status").value(404))
        .andExpect(jsonPath("$.instance").value("/missing"));
  }
}
