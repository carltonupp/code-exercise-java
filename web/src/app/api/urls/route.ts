import { NextResponse } from "next/server";
import { createApiClient, type Problem, type UrlEntry } from "@/api";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

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

function isProblem(body: unknown): body is Problem {
  return (
    typeof body === "object" && body !== null &&
    "type" in body && typeof body.type === "string" &&
    "title" in body && typeof body.title === "string" &&
    "status" in body && Number.isInteger(body.status) &&
    "detail" in body && typeof body.detail === "string" &&
    "instance" in body && typeof body.instance === "string"
  );
}

function isUrlEntry(value: unknown): value is UrlEntry {
  return (
    typeof value === "object" && value !== null &&
    "alias" in value && typeof value.alias === "string" &&
    "fullUrl" in value && typeof value.fullUrl === "string" &&
    "shortUrl" in value && typeof value.shortUrl === "string"
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

function requestedPage(request: Request): number | null {
  const values = new URL(request.url).searchParams.getAll("page");
  if (values.length === 0) return 1;
  if (values.length !== 1 || !/^\d+$/.test(values[0])) return null;
  const page = Number(values[0]);
  return Number.isSafeInteger(page) && page > 0 ? page : null;
}

export async function GET(request: Request) {
  const page = requestedPage(request);
  if (page === null) {
    return problemResponse(
      request,
      "invalid-page",
      400,
      "Invalid page",
      "Page must be a single positive whole number.",
    );
  }

  try {
    const { data, error, response } = await createApiClient(apiBaseUrl()).GET("/urls", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (response.status !== 200) {
      const upstreamError: unknown = error;
      if (!response.ok && isProblem(upstreamError) && upstreamError.status === response.status) {
        return NextResponse.json(upstreamError, {
          status: response.status,
          headers: { "Content-Type": "application/problem+json" },
        });
      }
      return invalidUpstreamResponse(request);
    }
    if (!Array.isArray(data) || !data.every(isUrlEntry)) {
      return invalidUpstreamResponse(request);
    }

    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);
    const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    return NextResponse.json(
      {
        items: data.slice(start, start + PAGE_SIZE),
        currentPage,
        totalPages,
        totalItems,
        pageSize: PAGE_SIZE,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
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
