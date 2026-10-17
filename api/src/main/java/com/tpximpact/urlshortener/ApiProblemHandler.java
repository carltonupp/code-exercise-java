package com.tpximpact.urlshortener;

import com.tpximpact.urlshortener.generated.model.ValidationError;
import java.net.URI;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class ApiProblemHandler extends ResponseEntityExceptionHandler {
  @Override
  protected ResponseEntity<Object> handleMethodArgumentNotValid(
      MethodArgumentNotValidException exception,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {
    var errors =
        exception.getBindingResult().getFieldErrors().stream()
            .map(
                error ->
                    new ValidationError(
                        error.getField(),
                        error.getDefaultMessage() != null
                            ? error.getDefaultMessage()
                            : "Invalid value."))
            .toList();
    return handleExceptionInternal(
        exception, ApiProblems.validation(errors), headers, status, request);
  }

  @Override
  protected ResponseEntity<Object> handleHttpMessageNotReadable(
      HttpMessageNotReadableException exception,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {
    ProblemDetail problem =
        ApiProblems.problem(
            status,
            "invalid-request",
            "Invalid request",
            "The request body must contain valid JSON with the expected field types.");
    return handleExceptionInternal(exception, problem, headers, status, request);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Object> handleUnexpectedException(Exception exception, WebRequest request) {
    logger.error("Unhandled API error", exception);
    ProblemDetail problem =
        ApiProblems.problem(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "internal-error",
            "Internal server error",
            "The request could not be completed. Please try again later.");
    return createResponseEntity(
        problem, new HttpHeaders(), HttpStatus.INTERNAL_SERVER_ERROR, request);
  }

  @Override
  protected ResponseEntity<Object> createResponseEntity(
      Object body, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
    ProblemDetail problem =
        body instanceof ProblemDetail detail ? detail : ProblemDetail.forStatus(status);
    if (problem.getType() == null || URI.create("about:blank").equals(problem.getType())) {
      problem.setType(ApiProblems.type("http-" + status.value()));
    }
    problem.setStatus(status.value());
    if (problem.getTitle() == null) {
      problem.setTitle("Request failed");
    }
    if (problem.getDetail() == null) {
      problem.setDetail(problem.getTitle());
    }
    if (request instanceof ServletWebRequest servletRequest) {
      problem.setInstance(URI.create(servletRequest.getRequest().getRequestURI()));
    }
    return super.createResponseEntity(problem, headers, status, request);
  }
}
