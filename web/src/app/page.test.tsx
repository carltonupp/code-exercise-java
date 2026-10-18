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
    expect(screen.getByRole("link", { name: "View existing links ↓" })).toHaveAttribute(
      "href", "#view-links",
    );
    expect(document.getElementById("view-links")).toBeInTheDocument();

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

  it("returns to page one after creation while viewing page two", async () => {
    let created = false;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/health") {
        return new Response(JSON.stringify({ connected: true }));
      }
      if (url === "/api/shorten" && init?.method === "POST") {
        created = true;
        return new Response(JSON.stringify({ shortUrl: "http://sho.rt/new-link" }), { status: 201 });
      }
      const currentPage = url === "/api/urls?page=2" ? 2 : 1;
      const alias = currentPage === 2 ? "last-link" : created ? "new-link" : "first-link";
      return new Response(JSON.stringify({
        items: [{ alias, fullUrl: "https://example.com/page", shortUrl: `http://sho.rt/${alias}` }],
        currentPage, totalPages: 2, totalItems: created ? 22 : 21, pageSize: 20,
      }));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Home />);
    await screen.findByText("first-link");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("Page 2 of 2");
    const previousListSignal = fetchMock.mock.calls
      .find(([url]) => url === "/api/urls?page=2")?.[1]?.signal;

    fireEvent.change(screen.getByLabelText("Long URL"), {
      target: { value: "https://example.com/new" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create short link" }));

    await screen.findByText("new-link");
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("22 results")).toBeInTheDocument();
    expect(screen.queryByText("last-link")).not.toBeInTheDocument();
    expect(previousListSignal?.aborted).toBe(true);
    expect(fetchMock.mock.calls.filter(([url]) => String(url).startsWith("/api/urls?page=")))
      .toHaveLength(3);
  });

});
