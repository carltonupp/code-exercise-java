package com.tpximpact.urlshortener;

import com.tpximpact.urlshortener.generated.model.ValidationError;
import java.net.URI;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

final class ApiProblems {
  private ApiProblems() {}

  static URI type(String name) {
    return URI.create("urn:urlshortener:problem:" + name);
  }

  static ProblemDetail problem(HttpStatusCode status, String name, String title, String detail) {
    ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
    problem.setType(type(name));
    problem.setTitle(title);
    return problem;
  }

  static ProblemDetail validation(List<ValidationError> errors) {
    ProblemDetail problem =
        problem(
            HttpStatus.BAD_REQUEST,
            "validation-failed",
            "Validation failed",
            "Correct the invalid fields and try again.");
    problem.setProperty("errors", errors);
    return problem;
  }

  static ErrorResponseException invalidField(String field, String message) {
    return new ErrorResponseException(
        HttpStatus.BAD_REQUEST, validation(List.of(new ValidationError(field, message))), null);
  }

  static ErrorResponseException aliasInUse() {
    return new ErrorResponseException(
        HttpStatus.BAD_REQUEST,
        problem(
            HttpStatus.BAD_REQUEST,
            "alias-in-use",
            "Alias already in use",
            "This alias has already been assigned. Choose another."),
        null);
  }

  static ErrorResponseException aliasGenerationExhausted() {
    return new ErrorResponseException(
        HttpStatus.SERVICE_UNAVAILABLE,
        problem(
            HttpStatus.SERVICE_UNAVAILABLE,
            "alias-generation-exhausted",
            "Alias generation exhausted",
            "Could not allocate a unique alias; please try again."),
        null);
  }

  static ErrorResponseException aliasNotFound() {
    return new ErrorResponseException(
        HttpStatus.NOT_FOUND,
        problem(
            HttpStatus.NOT_FOUND,
            "not-found",
            "Link not found",
            "No active link exists for this alias."),
        null);
  }
}
