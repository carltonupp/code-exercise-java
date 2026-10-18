package com.tpximpact.urlshortener.api;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.tpximpact.urlshortener.shortlink.AliasResolution;
import com.tpximpact.urlshortener.shortlink.ShortLinkService;
import java.net.URI;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ShortLinkRedirectController.class)
class ShortLinkRedirectControllerTests {
  @Autowired private MockMvc mockMvc;
  @MockitoBean private ShortLinkService service;

  @Test
  void redirectsActiveAliasToItsDestination() throws Exception {
    when(service.resolve("my-link"))
        .thenReturn(new AliasResolution(URI.create("https://example.com/article"), false));

    mockMvc
        .perform(get("/my-link"))
        .andExpect(status().isFound())
        .andExpect(header().string("Location", "https://example.com/article"));
  }

  @Test
  void reportsUnknownAliasAsNotFound() throws Exception {
    when(service.resolve("missing")).thenReturn(null);

    mockMvc
        .perform(get("/missing"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.type").value("urn:urlshortener:problem:not-found"))
        .andExpect(jsonPath("$.title").value("Link not found"));
  }

  @Test
  void reportsDeletedAliasAsNotFoundWithDeletedDetails() throws Exception {
    when(service.resolve("deleted")).thenReturn(new AliasResolution(null, true));

    mockMvc
        .perform(get("/deleted"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.type").value("urn:urlshortener:problem:not-found"))
        .andExpect(jsonPath("$.title").value("Link deleted"));
  }
}
