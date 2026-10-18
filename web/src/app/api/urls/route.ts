import { NextResponse } from "next/server";
import { isUrlEntry } from "@/api/validation";
import type { LinkListResponse } from "@/features/short-links/types";
import { apiClient, apiRequestOptions } from "@/server/api";
import {
  invalidUpstreamResponse,
  problemResponse,
  upstreamFailureResponse,
  upstreamProblemResponse,
} from "@/server/problems";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

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
    const { data, error, response } = await apiClient().GET("/urls", {
      ...apiRequestOptions(),
    });
    if (response.status !== 200) {
      return upstreamProblemResponse(error, response) ?? invalidUpstreamResponse(request);
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
      } satisfies LinkListResponse,
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return upstreamFailureResponse(request, error);
  }
}
