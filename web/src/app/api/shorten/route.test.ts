import { afterEach, describe, expect, it, vi } from "vitest";
import type { components } from "../../../generated/openapi";
import { POST } from "./route";

function creationRequest(body = JSON.stringify({ fullUrl: "https://example.com" })) {
  return new Request("http://localhost/api/shorten", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

const validationProblem: components["schemas"]["Problem"] = {
  type: "urn:urlshortener:problem:validation-failed",
  title: "Validation failed",
  status: 400,
  detail: "Correct the invalid fields and try again.",
  instance: "/shorten",
  errors: [{ field: "customAlias", message: "Must contain between 3 and 16 characters." }],
};

describe("POST /api/shorten", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("forwards creation through the generated client using the configured API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ shortUrl: "http://sho.rt/abc12345" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("API_BASE_URL", "http://api.internal:8080/");

    const response = await POST(creationRequest());

    const request: Request = fetchMock.mock.calls[0][0];
    expect(request.url).toBe("http://api.internal:8080/shorten");
    expect(request.method).toBe("POST");
    await expect(request.json()).resolves.toEqual({ fullUrl: "https://example.com" });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ shortUrl: "http://sho.rt/abc12345" });
  });

  it("preserves the API problem and its field errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(validationProblem), {
      status: 400,
      headers: { "Content-Type": "application/problem+json" },
    })));

    const response = await POST(creationRequest());

    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe("application/problem+json");
    await expect(response.json()).resolves.toEqual(validationProblem);
  });

  it("returns a complete problem response when the API cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const response = await POST(creationRequest());

    expect(response.status).toBe(503);
    expect(response.headers.get("Content-Type")).toBe("application/problem+json");
    await expect(response.json()).resolves.toEqual({
      type: "urn:urlshortener:problem:service-unavailable",
      title: "Service unavailable",
      status: 503,
      detail: "The short link service is unavailable. Please try again.",
      instance: "/api/shorten",
    });
  });

  it.each(["{", "null", "{}", '{"fullUrl":123}'])(
    "returns an invalid-request problem for body %s without calling the API",
    async (body) => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      const response = await POST(creationRequest(body));

      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe("application/problem+json");
      await expect(response.json()).resolves.toMatchObject({
        type: "urn:urlshortener:problem:invalid-request",
        status: 400,
        instance: "/api/shorten",
      });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    new Response("upstream internal details", { status: 500 }),
    new Response(JSON.stringify({ ...validationProblem, status: 409 }), { status: 400 }),
    new Response(JSON.stringify({ ...validationProblem, errors: [null] }), { status: 400 }),
    new Response("not JSON", { status: 201 }),
  ])("converts a nonconforming upstream response to a problem", async (upstream) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(upstream));
    const response = await POST(creationRequest());

    expect(response.status).toBe(502);
    expect(response.headers.get("Content-Type")).toBe("application/problem+json");
    await expect(response.json()).resolves.toEqual({
      type: "urn:urlshortener:problem:invalid-upstream-response",
      title: "Invalid service response",
      status: 502,
      detail: "The short link service returned an unexpected response. Please try again.",
      instance: "/api/shorten",
    });
  });
});
