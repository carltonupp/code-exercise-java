import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ConnectionStatus from "./ConnectionStatus";

describe("ConnectionStatus", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("shows connected when the health check succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ connected: true }),
      }),
    );

    render(<ConnectionStatus />);

    expect(await screen.findByText("API connected")).toBeInTheDocument();
  });

  it("shows unavailable when the health check fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("API is offline")));

    render(<ConnectionStatus />);

    expect(await screen.findByText("API unavailable")).toBeInTheDocument();
  });

  it("polls again after five seconds", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ connected: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ConnectionStatus />);

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(5000);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
