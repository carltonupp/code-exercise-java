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

  it.each([
    { ok: false, connected: true },
    { ok: true, connected: false },
  ])("shows unavailable unless both the response and health payload are healthy", async (result) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: result.ok,
      json: async () => ({ connected: result.connected }),
    }));

    render(<ConnectionStatus />);

    expect(await screen.findByText("API unavailable")).toBeInTheDocument();
  });

  it("aborts an in-flight health check when unmounted", async () => {
    let resolveFetch: ((response: { ok: boolean; json: () => Promise<{ connected: boolean }> }) => void) | undefined;
    const pendingFetch = new Promise<{ ok: boolean; json: () => Promise<{ connected: boolean }> }>(
      (resolve) => { resolveFetch = resolve; },
    );
    const fetchMock = vi.fn().mockReturnValue(pendingFetch);
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = render(<ConnectionStatus />);
    const options = fetchMock.mock.calls[0][1] as RequestInit;
    unmount();

    expect(options.signal?.aborted).toBe(true);
    resolveFetch?.({ ok: true, json: async () => ({ connected: true }) });
    await new Promise((resolve) => setTimeout(resolve, 0));
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
