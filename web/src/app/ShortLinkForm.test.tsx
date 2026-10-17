import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ShortLinkForm from "./ShortLinkForm";

describe("ShortLinkForm", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("creates a generated alias and displays a copyable short link", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ shortUrl: "http://sho.rt/abc12345" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

    render(<ShortLinkForm />);
    fireEvent.change(screen.getByLabelText("Long URL"), {
      target: { value: "https://example.com/long" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create short link" }));

    expect(await screen.findByText("http://sho.rt/abc12345")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/shorten", expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullUrl: "https://example.com/long" }),
    }));

    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("http://sho.rt/abc12345"));
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
  });

  it("submits an optional custom alias", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ shortUrl: "http://sho.rt/My-Link" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<ShortLinkForm />);
    fireEvent.change(screen.getByLabelText("Long URL"), {
      target: { value: "https://example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Custom alias/), { target: { value: "My-Link" } });
    fireEvent.click(screen.getByRole("button", { name: "Create short link" }));

    await screen.findByText("http://sho.rt/My-Link");
    expect(fetchMock).toHaveBeenCalledWith("/api/shorten", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ fullUrl: "https://example.com/", customAlias: "My-Link" }),
    }));
  });

  it("adds https to a destination entered without a scheme", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ shortUrl: "http://sho.rt/abc12345" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<ShortLinkForm />);
    const urlInput = screen.getByLabelText("Long URL");
    fireEvent.change(urlInput, { target: { value: "google.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Create short link" }));

    await screen.findByText("http://sho.rt/abc12345");
    expect(fetchMock).toHaveBeenCalledWith("/api/shorten", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ fullUrl: "https://google.com/" }),
    }));
    expect(urlInput).toHaveValue("https://google.com/");
  });

  it("shows validation errors without sending invalid values", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<ShortLinkForm />);
    fireEvent.change(screen.getByLabelText("Long URL"), { target: { value: "https://example.com" } });
    fireEvent.change(screen.getByLabelText(/Custom alias/), { target: { value: "ééé" } });
    fireEvent.click(screen.getByRole("button", { name: "Create short link" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Custom aliases must be 3–16 letters, numbers, or hyphens.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("explains alias conflicts and keeps the entered values", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({
          type: "urn:urlshortener:problem:alias-in-use",
          title: "Alias already in use",
          status: 400,
          detail: "The requested identifier cannot be allocated.",
          instance: "/shorten",
        }), {
          status: 400,
          headers: { "Content-Type": "application/problem+json" },
        }),
      ),
    );

    render(<ShortLinkForm />);
    const urlInput = screen.getByLabelText("Long URL");
    const aliasInput = screen.getByLabelText(/Custom alias/);
    fireEvent.change(urlInput, { target: { value: "https://example.com" } });
    fireEvent.change(aliasInput, { target: { value: "taken" } });
    fireEvent.click(screen.getByRole("button", { name: "Create short link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That alias is already in use. Choose another one.",
    );
    expect(urlInput).toHaveValue("https://example.com/");
    expect(aliasInput).toHaveValue("taken");
  });

  it("associates problem field errors with their inputs", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      type: "urn:urlshortener:problem:validation-failed",
      title: "Validation failed",
      status: 400,
      detail: "Correct the invalid fields and try again.",
      instance: "/shorten",
      errors: [
        { field: "fullUrl", message: "This destination cannot be used." },
        { field: "customAlias", message: "This alias does not meet the requirements." },
      ],
    }), { status: 400, headers: { "Content-Type": "application/problem+json" } })));

    render(<ShortLinkForm />);
    const urlInput = screen.getByLabelText("Long URL");
    const aliasInput = screen.getByLabelText(/Custom alias/);
    fireEvent.change(urlInput, { target: { value: "https://example.com" } });
    fireEvent.change(aliasInput, { target: { value: "chosen" } });
    fireEvent.click(screen.getByRole("button", { name: "Create short link" }));

    await screen.findByRole("alert");
    expect(urlInput).toHaveAttribute("aria-invalid", "true");
    expect(urlInput).toHaveAccessibleDescription(expect.stringContaining("This destination cannot be used."));
    expect(aliasInput).toHaveAttribute("aria-invalid", "true");
    expect(aliasInput).toHaveAccessibleDescription(expect.stringContaining("This alias does not meet the requirements."));

    fireEvent.change(aliasInput, { target: { value: "changed" } });
    expect(aliasInput).toHaveAttribute("aria-invalid", "false");
    expect(urlInput).toHaveAttribute("aria-invalid", "true");
  });

  it("shows the detail for an unrecognized problem type", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      type: "urn:urlshortener:problem:future-problem",
      title: "Request failed",
      status: 500,
      detail: "Please try again later.",
      instance: "/shorten",
    }), { status: 500, headers: { "Content-Type": "application/problem+json" } })));

    render(<ShortLinkForm />);
    fireEvent.change(screen.getByLabelText("Long URL"), { target: { value: "https://example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Create short link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Please try again later.");
  });

  it("shows network failures without clearing entered values", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    render(<ShortLinkForm />);
    const urlInput = screen.getByLabelText("Long URL");
    fireEvent.change(urlInput, { target: { value: "https://example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Create short link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("service is unavailable");
    expect(urlInput).toHaveValue("https://example.com/");
  });
});
