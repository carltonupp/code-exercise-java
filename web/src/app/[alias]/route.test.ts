import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

function request(alias: string) {
  return new Request(`http://localhost/${alias}`);
}

function context(alias: string) {
  return { params: Promise.resolve({ alias }) };
}

describe("GET /[alias]", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("rejects invalid aliases without calling the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(request("bad_alias"), context("bad_alias"));

    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.text()).toContain("LINK NOT FOUND");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards active-link redirects and asks the API not to follow them", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, { status: 302, headers: { Location: "https://example.com/page" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("API_BASE_URL", "http://api.internal:8080/");

    const response = await GET(request("My-Link"), context("My-Link"));

    expect(fetchMock.mock.calls[0][0]).toBe("http://api.internal:8080/My-Link");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: "no-store", redirect: "manual" });
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("https://example.com/page");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("shows a temporary error when an upstream redirect has no destination", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 302 })));

    const response = await GET(request("alias"), context("alias"));

    expect(response.status).toBe(502);
    expect(await response.text()).toContain("We can&#39;t open this link right now");
  });

  it("distinguishes deleted and unknown links from API problem details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ title: "Link deleted" }), { status: 404 }),
        )
        .mockResolvedValueOnce(new Response(JSON.stringify({ title: "Link not found" }), { status: 404 })),
    );

    const deleted = await GET(request("deleted"), context("deleted"));
    const missing = await GET(request("missing"), context("missing"));

    expect(deleted.status).toBe(404);
    expect(await deleted.text()).toContain("This link has been retired");
    expect(missing.status).toBe(404);
    expect(await missing.text()).toContain("We couldn&#39;t find that link");
  });

  it("treats malformed error JSON as an unknown link", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not json", { status: 404 })));

    const response = await GET(request("missing"), context("missing"));

    expect(response.status).toBe(404);
    expect(await response.text()).toContain("We couldn&#39;t find that link");
  });

  it("returns service unavailable when the API fails or returns an unexpected status", async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    const rejected = await GET(request("offline"), context("offline"));
    const unexpected = await GET(request("broken"), context("broken"));

    expect(rejected.status).toBe(503);
    expect(unexpected.status).toBe(503);
    expect(await rejected.text()).toContain("The short link service couldn&#39;t be reached");
    expect(await unexpected.text()).toContain("The short link service couldn&#39;t be reached");
  });
});
