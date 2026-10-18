import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ShortLinkListView from "./ShortLinkList";
import { useShortLinks } from "@/features/short-links/useShortLinks";

function ShortLinkList() {
  const links = useShortLinks();
  return <>
    <button onClick={links.refreshFromFirstPage}>Refresh links</button>
    <ShortLinkListView links={links} />
  </>;
}

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
      }], 2, 2, 21))
      .mockResolvedValueOnce(listResponse([firstLink], 1, 2, 21));
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

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));

    expect(await screen.findByText("first-link")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
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

  it("shows an error when the list response has an unexpected shape", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: "bad" }))));

    render(<ShortLinkList />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The link service returned an unexpected response.",
    );
  });

  it("shows a helpful error when loading the list fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    render(<ShortLinkList />);

    expect(await screen.findByRole("alert")).toHaveTextContent("The link list is unavailable.");
  });

  it("explicitly refreshes page one after navigating to page two", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(listResponse([firstLink], 1, 2, 21))
      .mockResolvedValueOnce(listResponse([{ ...firstLink, alias: "last-link" }], 2, 2, 21))
      .mockResolvedValueOnce(listResponse([firstLink], 1, 2, 22));
    vi.stubGlobal("fetch", fetchMock);
    render(<ShortLinkList />);
    await screen.findByText("first-link");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("last-link");

    fireEvent.click(screen.getByRole("button", { name: "Refresh links" }));

    expect(await screen.findByText("first-link")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/urls?page=1", expect.anything());
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("ignores a superseded request even if it completes after the fresh result", async () => {
    let finishStale!: (response: Response) => void;
    const stale = new Promise<Response>((resolve) => { finishStale = resolve; });
    const fetchMock = vi.fn()
      .mockReturnValueOnce(stale)
      .mockResolvedValueOnce(listResponse([{ ...firstLink, alias: "fresh-link" }]));
    vi.stubGlobal("fetch", fetchMock);
    render(<ShortLinkList />);
    fireEvent.click(screen.getByRole("button", { name: "Refresh links" }));
    await screen.findByText("fresh-link");

    await act(async () => finishStale(listResponse([firstLink])));

    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    expect(screen.getByText("fresh-link")).toBeInTheDocument();
    expect(screen.queryByText("first-link")).not.toBeInTheDocument();
  });

  it("accepts a clamped page after deletion and uses it for subsequent reloads", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(listResponse([firstLink], 1, 2, 21))
      .mockResolvedValueOnce(listResponse([{ ...firstLink, alias: "last-link" }], 2, 2, 21))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(listResponse([firstLink], 1, 1, 20))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(listResponse([], 1, 0, 0));
    vi.stubGlobal("fetch", fetchMock);
    render(<ShortLinkList />);
    await screen.findByText("first-link");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("last-link");
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await screen.findByText("Page 1 of 1");
    expect(fetchMock).toHaveBeenNthCalledWith(4, "/api/urls?page=2", expect.anything());

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await screen.findByText("No active links yet");
    expect(fetchMock).toHaveBeenNthCalledWith(6, "/api/urls?page=1", expect.anything());
  });

  it("deletes immediately, shows success, and removes the link from the active list", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(listResponse([firstLink]))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(listResponse([], 1, 0, 0));
    vi.stubGlobal("fetch", fetchMock);
    const confirmSpy = vi.spyOn(window, "confirm");

    render(<ShortLinkList />);
    expect(await screen.findByText("first-link")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Deleted first-link.")).toBeInTheDocument();
    expect(await screen.findByText("No active links yet")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/urls/first-link",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("keeps the link visible when deletion fails", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(listResponse([firstLink]))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        detail: "The service is unavailable.",
      }), { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<ShortLinkList />);
    expect(await screen.findByText("first-link")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The service is unavailable.");
    expect(screen.getByText("first-link")).toBeInTheDocument();
  });

  it("shows a fallback when the deletion response is not valid JSON", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(listResponse([firstLink]))
      .mockResolvedValueOnce(new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<ShortLinkList />);
    await screen.findByText("first-link");
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The link list could not be loaded. Please try again.",
    );
    expect(screen.getByText("first-link")).toBeInTheDocument();
  });

  it("shows a helpful error when deleting a link fails to reach the proxy", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(listResponse([firstLink]))
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    render(<ShortLinkList />);
    await screen.findByText("first-link");
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The link could not be deleted.");
    expect(screen.getByText("first-link")).toBeInTheDocument();
  });
});
