import { NextResponse } from "next/server";
import { createApiClient, type Problem } from "@/api";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ alias: string }> };

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

export async function DELETE(request: Request, { params }: RouteContext) {
  const { alias } = await params;
  if (!/^[A-Za-z0-9-]{3,16}$/.test(alias)) {
    return problemResponse(
      request,
      "invalid-alias",
      400,
      "Invalid alias",
      "Provide an alias containing 3–16 letters, numbers, or hyphens.",
    );
  }

  try {
    const { error, response } = await createApiClient(apiBaseUrl()).DELETE("/{alias}", {
      params: { path: { alias } },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 204) return new NextResponse(null, { status: 204 });

    const upstreamError: unknown = error;
    if (!response.ok && isProblem(upstreamError) && upstreamError.status === response.status) {
      return NextResponse.json(upstreamError, {
        status: response.status,
        headers: { "Content-Type": "application/problem+json" },
      });
    }
    if (response.status === 404) {
      return problemResponse(
        request,
        "not-found",
        404,
        "Link not found",
        "No active link exists for this alias.",
      );
    }
    return problemResponse(
      request,
      "invalid-upstream-response",
      502,
      "Invalid service response",
      "The short link service returned an unexpected response. Please try again.",
    );
  } catch {
    return problemResponse(
      request,
      "service-unavailable",
      503,
      "Service unavailable",
      "The short link service is unavailable. Please try again.",
    );
  }
}
