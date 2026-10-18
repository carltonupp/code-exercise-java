import type { Problem, ShortenRequest, ShortenResponse } from "@/api";
import { isProblem } from "@/api/validation";
import { isLinkListResponse, type LinkListResponse } from "./types";

export class ShortLinkRequestError extends Error {
  constructor(message: string, readonly problem?: Problem) {
    super(message);
    this.name = "ShortLinkRequestError";
  }
}

function problemDetail(value: unknown) {
  if (typeof value === "object" && value !== null && "detail" in value &&
    typeof value.detail === "string") {
    return value.detail;
  }
  return "The link list could not be loaded. Please try again.";
}

export async function createShortLink(request: ShortenRequest): Promise<ShortenResponse> {
  const response = await fetch("/api/shorten", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const body: unknown = await response.json();
    const problem = isProblem(body) ? body : undefined;
    throw new ShortLinkRequestError(
      problem?.detail || "The short link could not be created. Please try again.", problem,
    );
  }
  if (response.status !== 201) {
    throw new ShortLinkRequestError("The service returned an unexpected response. Please try again.");
  }
  const body: unknown = await response.json();
  if (typeof body !== "object" || body === null ||
    !("shortUrl" in body) || typeof body.shortUrl !== "string") {
    throw new ShortLinkRequestError("The service returned an unexpected response. Please try again.");
  }
  return { shortUrl: body.shortUrl };
}

export async function listShortLinks(page: number, signal: AbortSignal): Promise<LinkListResponse> {
  const response = await fetch(`/api/urls?page=${page}`, { cache: "no-store", signal });
  const body: unknown = await response.json();
  if (!response.ok) throw new ShortLinkRequestError(problemDetail(body));
  if (!isLinkListResponse(body)) {
    throw new ShortLinkRequestError("The link service returned an unexpected response.");
  }
  return body;
}

export async function deleteShortLink(alias: string): Promise<void> {
  const response = await fetch(`/api/urls/${encodeURIComponent(alias)}`, {
    method: "DELETE",
    cache: "no-store",
  });
  if (response.status !== 204) {
    const body: unknown = await response.json().catch(() => null);
    throw new ShortLinkRequestError(problemDetail(body));
  }
}
