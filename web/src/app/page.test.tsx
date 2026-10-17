import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "./page";

describe("Home link workspace", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("adds a created link to the list and updates the result count", async () => {
    let created = false;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/health") {
        return new Response(JSON.stringify({ connected: true }), { status: 200 });
      }
      if (url === "/api/shorten" && init?.method === "POST") {
        created = true;
        return new Response(JSON.stringify({ shortUrl: "http://sho.rt/new-link" }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url === "/api/urls?page=1") {
        const items = created ? [{
          alias: "new-link",
          fullUrl: "https://example.com/page",
          shortUrl: "http://sho.rt/new-link",
        }] : [];
        return new Response(JSON.stringify({
          items,
          currentPage: 1,
          totalPages: created ? 1 : 0,
          totalItems: items.length,
          pageSize: 20,
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<Home />);
    expect(await screen.findByText("No active links yet")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Long URL"), {
      target: { value: "https://example.com/page" },
    });
    fireEvent.change(screen.getByLabelText(/Custom alias/), {
      target: { value: "new-link" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create short link" }));

    expect(await screen.findByRole("link", { name: "http://sho.rt/new-link" }))
      .toHaveAttribute("href", "http://sho.rt/new-link");
    expect(screen.getByText("1 result")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/urls?page=1", expect.objectContaining({
      cache: "no-store",
    }));
  });
});
