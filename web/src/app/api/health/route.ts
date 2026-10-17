import { NextResponse } from "next/server";
import { createApiClient } from "@/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiBaseUrl = (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:8080"
  ).replace(/\/+$/, "");

  try {
    const client = createApiClient(apiBaseUrl);
    const { data, response } = await client.GET("/actuator/health", {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    const connected = response.ok && data?.status === "UP";

    return NextResponse.json({ connected }, { status: connected ? 200 : 503 });
  } catch {
    return NextResponse.json({ connected: false }, { status: 503 });
  }
}
