package com.tpximpact.urlshortener.api;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.tpximpact.urlshortener.shortlink.AliasGenerationExhaustedException;
import com.tpximpact.urlshortener.shortlink.AliasInUseException;
import com.tpximpact.urlshortener.shortlink.InvalidShortLinkException;
import com.tpximpact.urlshortener.shortlink.ShortLinkService;
import java.net.URI;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

@WebMvcTest(ShortLinkCreationController.class)
class ApiProblemHandlerTests {
  @Autowired private MockMvc mockMvc;
  @MockitoBean private ShortLinkService service;

  @Test
  void successfulCreationReturnsCreatedShortUrl() throws Exception {
    when(service.create(any(), any())).thenReturn(URI.create("http://sho.rt/my-link"));

    mockMvc
        .perform(
            post("/shorten")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullUrl\":\"https://example.com\",\"customAlias\":\"my-link\"}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.shortUrl").value("http://sho.rt/my-link"));
  }

  @Test
  void aliasConflictUsesStableProblemType() throws Exception {
    when(service.create(any(), any())).thenThrow(new AliasInUseException());

    expectProblem(
            """
            {"fullUrl":"https://example.com","customAlias":"taken"}
            """,
            "alias-in-use",
            400)
        .andExpect(jsonPath("$.title").value("Alias already in use"))
        .andExpect(
            jsonPath("$.detail").value("This alias has already been assigned. Choose another."))
        .andExpect(jsonPath("$.errors").doesNotExist());
  }

  @Test
  void generatedAliasExhaustionUsesServiceUnavailableProblem() throws Exception {
    when(service.create(any(), any())).thenThrow(new AliasGenerationExhaustedException());

    expectProblem("{\"fullUrl\":\"https://example.com\"}", "alias-generation-exhausted", 503);
  }

  @Test
  void serviceValidationMapsToFieldValidationProblem() throws Exception {
    when(service.create(any(), any()))
        .thenThrow(
            new InvalidShortLinkException("fullUrl", "Must be an absolute HTTP or HTTPS URL."));

    expectProblem("{\"fullUrl\":\"ftp://example.com\"}", "validation-failed", 400)
        .andExpect(jsonPath("$.errors[0].field").value("fullUrl"))
        .andExpect(jsonPath("$.errors[0].message").value("Must be an absolute HTTP or HTTPS URL."));
  }

  @Test
  void beanValidationIncludesInvalidFieldMessages() throws Exception {
    expectProblem(
            "{\"fullUrl\":\"https://example.com\",\"customAlias\":\"éé\"}",
            "validation-failed",
            400)
        .andExpect(jsonPath("$.errors[*].field", hasItem("customAlias")))
        .andExpect(jsonPath("$.errors[0].message").isNotEmpty());
  }

  @Test
  void missingRequiredUrlIncludesFieldError() throws Exception {
    expectProblem("{}", "validation-failed", 400)
        .andExpect(jsonPath("$.errors[*].field", hasItem("fullUrl")));
  }

  @Test
  void malformedJsonUsesInvalidRequestProblem() throws Exception {
    expectProblem("{", "invalid-request", 400);
  }

  @Test
  void unexpectedFailureHasSafeProblemDetails() throws Exception {
    when(service.create(any(), any()))
        .thenThrow(new IllegalStateException("secret database failure"));

    expectProblem("{\"fullUrl\":\"https://example.com\"}", "internal-error", 500)
        .andExpect(jsonPath("$.title").value("Internal server error"))
        .andExpect(content().string(not(containsString("secret"))));
  }

  @Test
  void frameworkErrorsKeepStatusAndHeadersWithProblemBody() throws Exception {
    mockMvc
        .perform(get("/shorten"))
        .andExpect(status().isMethodNotAllowed())
        .andExpect(header().string("Allow", containsString("POST")))
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.type").value("urn:urlshortener:problem:http-405"))
        .andExpect(jsonPath("$.status").value(405))
        .andExpect(jsonPath("$.instance").value("/shorten"));
  }

  private ResultActions expectProblem(String body, String type, int statusCode) throws Exception {
    return mockMvc
        .perform(post("/shorten").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().is(statusCode))
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.type").value("urn:urlshortener:problem:" + type))
        .andExpect(jsonPath("$.title").isNotEmpty())
        .andExpect(jsonPath("$.status").value(statusCode))
        .andExpect(jsonPath("$.detail").isNotEmpty())
        .andExpect(jsonPath("$.instance").value("/shorten"));
  }
}
