import "server-only";
import { isValidAlias } from "@/features/short-links/validation";
import { apiBaseUrl, apiRequestOptions } from "./api";

export type LinkResolution =
  | { kind: "active"; location: string }
  | { kind: "deleted" | "not-found" }
  | { kind: "unavailable"; status: 502 | 503 };

function isDeletedProblem(value: unknown) {
  // Both API 404s share the same problem type. Preserve this compatibility
  // check here until the contract provides a machine-readable distinction.
  return (
    typeof value === "object" && value !== null &&
    "title" in value && value.title === "Link deleted"
  );
}

export async function resolveLink(alias: string): Promise<LinkResolution> {
  if (!isValidAlias(alias)) return { kind: "not-found" };
  try {
    const response = await fetch(`${apiBaseUrl()}/${encodeURIComponent(alias)}`, {
      ...apiRequestOptions(),
      redirect: "manual",
    });
    if (response.status === 302) {
      const location = response.headers.get("location");
      return location
        ? { kind: "active", location }
        : { kind: "unavailable", status: 502 };
    }
    if (response.status === 404) {
      const problem: unknown = await response.json().catch(() => null);
      return { kind: isDeletedProblem(problem) ? "deleted" : "not-found" };
    }
  } catch {
    return { kind: "unavailable", status: 503 };
  }
  return { kind: "unavailable", status: 503 };
}
