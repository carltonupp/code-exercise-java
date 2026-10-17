import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/health", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("reports connected when the API health status is UP", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "UP" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("API_BASE_URL", "http://api.internal:8080/");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://public-api.internal");

    const response = await GET();

    expect(fetchMock.mock.calls[0][0].url).toBe("http://api.internal:8080/actuator/health");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ connected: true });
  });

  it("uses the public API URL when the server URL is unset", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "UP" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://public-api.internal/");

    await GET();

    expect(fetchMock.mock.calls[0][0].url).toBe("http://public-api.internal/actuator/health");
  });

  it("defaults to the local API URL when no environment URL is set", async () => {
    vi.unstubAllEnvs();
    delete process.env.API_BASE_URL;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "UP" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await GET();

    expect(fetchMock.mock.calls[0][0].url).toBe("http://localhost:8080/actuator/health");
  });

  it("reports unavailable for a down API or a non-success response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ status: "DOWN" }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ status: "UP" }), { status: 503 })),
    );

    const down = await GET();
    const failed = await GET();

    expect(down.status).toBe(503);
    await expect(down.json()).resolves.toEqual({ connected: false });
    expect(failed.status).toBe(503);
    await expect(failed.json()).resolves.toEqual({ connected: false });
  });

  it("reports unavailable when the API request throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ connected: false });
  });
});
