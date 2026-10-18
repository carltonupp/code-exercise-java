import { NextResponse } from "next/server";
import type { ShortenRequest } from "@/api";
import { apiClient, apiRequestOptions } from "@/server/api";
import {
  invalidUpstreamResponse,
  problemResponse,
  upstreamFailureResponse,
  upstreamProblemResponse,
} from "@/server/problems";

export const dynamic = "force-dynamic";

function isShortenRequest(body: unknown): body is ShortenRequest {
  return (
    typeof body === "object" && body !== null &&
    "fullUrl" in body && typeof body.fullUrl === "string" &&
    (!("customAlias" in body) || typeof body.customAlias === "string")
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
    const { data, error, response } = await apiClient().POST("/shorten", {
      body,
      ...apiRequestOptions(),
    });
    if (response.status === 201 && typeof data?.shortUrl === "string") {
      return NextResponse.json(data, { status: 201 });
    }
    const problem = upstreamProblemResponse(error, response);
    if (problem) return problem;
    return invalidUpstreamResponse(request);
  } catch (error) {
    return upstreamFailureResponse(request, error);
  }
}
