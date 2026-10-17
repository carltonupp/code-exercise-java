import { NextResponse } from "next/server";
import type { components } from "../../../generated/openapi";
import { createApiClient } from "../../../lib/api-client";

type Problem = components["schemas"]["Problem"];
type ShortenRequest = components["schemas"]["ShortenRequest"];

export const dynamic = "force-dynamic";

function apiBaseUrl() {
  return (process.env.API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");
}

function problemResponse(
  request: Request,
  name: string,
  status: number,
  title: string,
  detail: string,
) {
  const problem: Problem = {
    type: `urn:urlshortener:problem:${name}`,
    title,
    status,
    detail,
    instance: new URL(request.url).pathname,
  };
  return NextResponse.json(problem, {
    status,
    headers: { "Content-Type": "application/problem+json" },
  });
}

function isShortenRequest(body: unknown): body is ShortenRequest {
  return (
    typeof body === "object" && body !== null &&
    "fullUrl" in body && typeof body.fullUrl === "string" &&
    (!("customAlias" in body) || typeof body.customAlias === "string")
  );
}

function isProblem(body: unknown): body is Problem {
  if (typeof body !== "object" || body === null) return false;
  return (
    "type" in body && typeof body.type === "string" &&
    "title" in body && typeof body.title === "string" &&
    "status" in body && Number.isInteger(body.status) &&
    "detail" in body && typeof body.detail === "string" &&
    "instance" in body && typeof body.instance === "string" &&
    (!("errors" in body) || (
      Array.isArray(body.errors) && body.errors.every((error: unknown) => (
        typeof error === "object" && error !== null &&
        "field" in error && typeof error.field === "string" &&
        "message" in error && typeof error.message === "string"
      ))
    ))
  );
}

function invalidUpstreamResponse(request: Request) {
  return problemResponse(
    request,
    "invalid-upstream-response",
    502,
    "Invalid service response",
    "The short link service returned an unexpected response. Please try again.",
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return problemResponse(
      request, "invalid-request", 400, "Invalid request", "Submit a valid JSON request.",
    );
  }
  if (!isShortenRequest(body)) {
    return problemResponse(
      request,
      "invalid-request",
      400,
      "Invalid request",
      "Provide a URL and, optionally, a custom alias as strings.",
    );
  }

  try {
    const { data, error, response } = await createApiClient(apiBaseUrl()).POST("/shorten", {
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 201 && typeof data?.shortUrl === "string") {
      return NextResponse.json(data, { status: 201 });
    }
    if (!response.ok && isProblem(error) && error.status === response.status) {
      return NextResponse.json(error, {
        status: response.status,
        headers: { "Content-Type": "application/problem+json" },
      });
    }
    return invalidUpstreamResponse(request);
  } catch (error) {
    if (error instanceof SyntaxError) return invalidUpstreamResponse(request);
    return problemResponse(
      request,
      "service-unavailable",
      503,
      "Service unavailable",
      "The short link service is unavailable. Please try again.",
    );
  }
}
