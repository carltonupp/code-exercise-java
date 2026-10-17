import { afterEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "./route";

function request(alias: string) {
  return new Request(`http://localhost/api/urls/${alias}`, { method: "DELETE" });
}

function context(alias: string) {
  return { params: Promise.resolve({ alias }) };
}

describe("DELETE /api/urls/[alias]", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("forwards a valid alias to the API and preserves the 204 response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("API_BASE_URL", "http://api.internal:8080/");

    const response = await DELETE(request("My-Alias"), context("My-Alias"));
    const upstreamRequest: Request = fetchMock.mock.calls[0][0];

    expect(upstreamRequest.url).toBe("http://api.internal:8080/My-Alias");
    expect(upstreamRequest.method).toBe("DELETE");
    expect(response.status).toBe(204);
  });

  it("rejects invalid aliases without calling the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await DELETE(request("x"), context("x"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      type: "urn:urlshortener:problem:invalid-alias",
      instance: "/api/urls/x",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a not-found problem for aliases absent from the API", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));

    const response = await DELETE(request("missing"), context("missing"));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      type: "urn:urlshortener:problem:not-found",
      instance: "/api/urls/missing",
    });
  });

  it("returns service unavailable when the API cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const response = await DELETE(request("alias"), context("alias"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      type: "urn:urlshortener:problem:service-unavailable",
    });
  });

  it("forwards a not-found problem from the API", async () => {
    const problem = {
      type: "urn:urlshortener:problem:not-found",
      title: "Link not found",
      status: 404,
      detail: "No active link exists for this alias.",
      instance: "/missing",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(problem), {
          status: 404,
          headers: { "Content-Type": "application/problem+json" },
        }),
      ),
    );

    const response = await DELETE(request("missing"), context("missing"));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual(problem);
  });
});
