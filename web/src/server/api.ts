import "server-only";
import { createApiClient } from "@/api";

export function apiBaseUrl({ allowPublicFallback = false } = {}) {
  return (
    process.env.API_BASE_URL ??
    (allowPublicFallback ? process.env.NEXT_PUBLIC_API_BASE_URL : undefined) ??
    "http://localhost:8080"
  ).replace(/\/+$/, "");
}

export function apiClient(options?: { allowPublicFallback?: boolean }) {
  return createApiClient(apiBaseUrl(options));
}

export function apiRequestOptions(timeoutMs = 5000) {
  return { cache: "no-store" as const, signal: AbortSignal.timeout(timeoutMs) };
}
