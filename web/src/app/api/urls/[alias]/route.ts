import { NextResponse } from "next/server";
import { isValidAlias } from "@/features/short-links/validation";
import { apiClient, apiRequestOptions } from "@/server/api";
import {
  invalidUpstreamResponse,
  problemResponse,
  upstreamFailureResponse,
  upstreamProblemResponse,
} from "@/server/problems";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ alias: string }> };

export async function DELETE(request: Request, { params }: RouteContext) {
  const { alias } = await params;
  if (!isValidAlias(alias)) {
    return problemResponse(
      request,
      "invalid-alias",
      400,
      "Invalid alias",
      "Provide an alias containing 3–16 letters, numbers, or hyphens.",
    );
  }

  try {
    const { error, response } = await apiClient().DELETE("/{alias}", {
      params: { path: { alias } },
      ...apiRequestOptions(),
    });
    if (response.status === 204) return new NextResponse(null, { status: 204 });

    const problem = upstreamProblemResponse(error, response);
    if (problem) return problem;
    if (response.status === 404) {
      return problemResponse(
        request,
        "not-found",
        404,
        "Link not found",
        "No active link exists for this alias.",
      );
    }
    return invalidUpstreamResponse(request);
  } catch (error) {
    return upstreamFailureResponse(request, error);
  }
}
