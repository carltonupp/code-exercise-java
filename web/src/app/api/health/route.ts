import { NextResponse } from "next/server";
import { apiClient, apiRequestOptions } from "@/server/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = apiClient({ allowPublicFallback: true });
    const { data, response } = await client.GET("/actuator/health", {
      ...apiRequestOptions(3000),
    });
    const connected = response.ok && data?.status === "UP";

    return NextResponse.json({ connected }, { status: connected ? 200 : 503 });
  } catch {
    return NextResponse.json({ connected: false }, { status: 503 });
  }
}
