import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ShortLinkList from "./ShortLinkList";

function listResponse(
  items: { alias: string; fullUrl: string; shortUrl: string }[],
  currentPage = 1,
  totalPages = 1,
  totalItems = items.length,
) {
  return new Response(JSON.stringify({
    items,
    currentPage,
    totalPages,
    totalItems,
    pageSize: 20,
  }), { status: 200, headers: { "Content-Type": "application/json" } });
}

const firstLink = {
  alias: "first-link",
  fullUrl: "https://example.com/first",
  shortUrl: "http://sho.rt/first-link",
};

describe("ShortLinkList", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows the result count, link details, and paginates through the proxy", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(listResponse([firstLink], 1, 2, 21))
      .mockResolvedValueOnce(listResponse([{
        alias: "last-link",
        fullUrl: "https://example.com/last",
        shortUrl: "http://sho.rt/last-link",
      }], 2, 2, 21));
    vi.stubGlobal("fetch", fetchMock);

    render(<ShortLinkList />);

    expect(await screen.findByText("21 results")).toBeInTheDocument();
    expect(screen.getByText("first-link")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: firstLink.shortUrl })).toHaveAttribute(
      "href", firstLink.shortUrl,
    );
    expect(screen.getByRole("link", { name: firstLink.fullUrl })).toHaveAttribute(
      "href", firstLink.fullUrl,
    );
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByText("last-link")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/urls?page=2",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("shows an empty state with a link to the creation form", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(listResponse([], 1, 0, 0)));

    render(<ShortLinkList />);

    expect(await screen.findByText("No active links yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create a link" })).toHaveAttribute(
      "href", "#create-link",
    );
    expect(screen.getByText("0 results")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Link list pages" })).not.toBeInTheDocument();
  });

  it("shows a helpful error when the proxy returns a problem", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "The service is unavailable." }), { status: 503 }),
      ),
    );

    render(<ShortLinkList />);

    expect(await screen.findByRole("alert")).toHaveTextContent("The service is unavailable.");
  });

  it("reloads the first page when the refresh token changes", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(listResponse([], 1, 0, 0))
      .mockResolvedValueOnce(listResponse([firstLink]));
    vi.stubGlobal("fetch", fetchMock);
    const { rerender } = render(<ShortLinkList refreshToken={0} />);
    await screen.findByText("No active links yet");

    rerender(<ShortLinkList refreshToken={1} />);

    expect(await screen.findByText("first-link")).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
