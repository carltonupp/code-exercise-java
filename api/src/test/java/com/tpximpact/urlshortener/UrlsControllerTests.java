package com.tpximpact.urlshortener;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.tpximpact.urlshortener.generated.model.UrlEntry;
import java.net.URI;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
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
                new UrlEntry(
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
