import type { Problem, UrlEntry } from "./types";

export function isProblem(body: unknown): body is Problem {
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

export function isUrlEntry(value: unknown): value is UrlEntry {
  return (
    typeof value === "object" && value !== null &&
    "alias" in value && typeof value.alias === "string" &&
    "fullUrl" in value && typeof value.fullUrl === "string" &&
    "shortUrl" in value && typeof value.shortUrl === "string"
  );
}
