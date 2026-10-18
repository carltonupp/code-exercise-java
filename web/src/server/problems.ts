import "server-only";
import { NextResponse } from "next/server";
import type { Problem } from "@/api";
import { isProblem } from "@/api/validation";

export function problemResponse(
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

export function upstreamProblemResponse(body: unknown, response: Response) {
  if (response.ok || !isProblem(body) || body.status !== response.status) return null;
  return NextResponse.json(body, {
    status: response.status,
    headers: { "Content-Type": "application/problem+json" },
  });
}

export function invalidUpstreamResponse(request: Request) {
  return problemResponse(
    request,
    "invalid-upstream-response",
    502,
    "Invalid service response",
    "The short link service returned an unexpected response. Please try again.",
  );
}

export function upstreamFailureResponse(request: Request, error: unknown) {
  if (error instanceof SyntaxError) return invalidUpstreamResponse(request);
  return problemResponse(
    request,
    "service-unavailable",
    503,
    "Service unavailable",
    "The short link service is unavailable. Please try again.",
  );
}
