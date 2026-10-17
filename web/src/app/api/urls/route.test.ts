import { afterEach, describe, expect, it, vi } from "vitest";
import type { components } from "../../../generated/openapi";
import { GET } from "./route";

type UrlEntry = components["schemas"]["UrlEntry"];

function link(index: number): UrlEntry {
  return {
    alias: `alias${index}`,
    fullUrl: `https://example.com/${index}`,
    shortUrl: `http://sho.rt/alias${index}`,
  };
}

function request(url = "http://localhost/api/urls") {
  return new Request(url);
}

describe("GET /api/urls", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns the first page and metadata while fetching the existing API collection", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(Array.from({ length: 21 }, (_, index) => link(index))), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("API_BASE_URL", "http://api.internal:8080/");

    const response = await GET(request());
    const upstreamRequest: Request = fetchMock.mock.calls[0][0];
    const body = await response.json();

    expect(upstreamRequest.url).toBe("http://api.internal:8080/urls");
    expect(upstreamRequest.method).toBe("GET");
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toMatchObject({ currentPage: 1, totalPages: 2, totalItems: 21, pageSize: 20 });
    expect(body.items).toHaveLength(20);
    expect(body.items[0].alias).toBe("alias0");
    expect(body.items[19].alias).toBe("alias19");
  });

  it("returns only the remaining entry on the second page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(Array.from({ length: 21 }, (_, index) => link(index))), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const response = await GET(request("http://localhost/api/urls?page=2"));
    const body = await response.json();

    expect(body).toMatchObject({ currentPage: 2, totalPages: 2, totalItems: 21 });
    expect(body.items).toEqual([link(20)]);
  });

  it("clamps an out-of-range page and uses page one for an empty collection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([link(0)]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const response = await GET(request("http://localhost/api/urls?page=99"));
    await expect(response.json()).resolves.toMatchObject({
      items: [link(0)], currentPage: 1, totalPages: 1,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } }),
      ),
    );
    const emptyResponse = await GET(request("http://localhost/api/urls?page=99"));
    await expect(emptyResponse.json()).resolves.toMatchObject({
      items: [], currentPage: 1, totalPages: 0, totalItems: 0,
    });
  });

  it.each(["0", "-1", "1.5", "abc", "1&page=2"])(
    "rejects invalid page query %s without calling the API",
    async (page) => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      const response = await GET(request(`http://localhost/api/urls?page=${page}`));

      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe("application/problem+json");
      await expect(response.json()).resolves.toMatchObject({
        type: "urn:urlshortener:problem:invalid-page",
        instance: "/api/urls",
      });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("returns service unavailable when the API cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const response = await GET(request());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      type: "urn:urlshortener:problem:service-unavailable",
      instance: "/api/urls",
    });
  });

  it("preserves a valid upstream problem and rejects one with a mismatched status", async () => {
    const problem = {
      type: "urn:urlshortener:problem:not-found",
      title: "Link not found",
      status: 404,
      detail: "No active link exists for this alias.",
      instance: "/urls",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify(problem), {
            status: 404,
            headers: { "Content-Type": "application/problem+json" },
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ...problem, status: 400 }), {
            status: 404,
            headers: { "Content-Type": "application/problem+json" },
          }),
        ),
    );

    const forwarded = await GET(request());
    const invalid = await GET(request());

    expect(forwarded.status).toBe(404);
    expect(forwarded.headers.get("Content-Type")).toBe("application/problem+json");
    await expect(forwarded.json()).resolves.toEqual(problem);
    expect(invalid.status).toBe(502);
    await expect(invalid.json()).resolves.toMatchObject({
      type: "urn:urlshortener:problem:invalid-upstream-response",
    });
  });

  it.each(["not json", "null", "{}", "[null]"])(
    "returns a bad gateway problem for invalid upstream body %s",
    async (body) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(body, { status: 200, headers: { "Content-Type": "application/json" } }),
        ),
      );

      const response = await GET(request());

      expect(response.status).toBe(502);
      await expect(response.json()).resolves.toMatchObject({
        type: "urn:urlshortener:problem:invalid-upstream-response",
      });
    },
  );
});
