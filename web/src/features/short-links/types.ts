import type { UrlEntry } from "@/api";
import { isUrlEntry } from "@/api/validation";

// This is the web proxy's pagination envelope, not the Spring API collection.
export type LinkListResponse = {
  items: UrlEntry[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
};

export function isLinkListResponse(value: unknown): value is LinkListResponse {
  return (
    typeof value === "object" && value !== null &&
    "items" in value && Array.isArray(value.items) && value.items.every(isUrlEntry) &&
    "currentPage" in value && Number.isInteger(value.currentPage) &&
    "totalPages" in value && Number.isInteger(value.totalPages) &&
    "totalItems" in value && Number.isInteger(value.totalItems) &&
    "pageSize" in value && Number.isInteger(value.pageSize)
  );
}
