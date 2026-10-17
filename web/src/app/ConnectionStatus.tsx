"use client";

import { useEffect, useState } from "react";

type ConnectionState = "checking" | "connected" | "disconnected";

const statusLabels: Record<ConnectionState, string> = {
  checking: "Checking API connection",
  connected: "API connected",
  disconnected: "API unavailable",
};

export default function ConnectionStatus() {
  const [connection, setConnection] = useState<ConnectionState>("checking");

  useEffect(() => {
    let disposed = false;
    let activeRequest: AbortController | undefined;

    const checkConnection = async () => {
      const controller = new AbortController();
      activeRequest = controller;

      try {
        const response = await fetch("/api/health", {
          cache: "no-store",
          signal: controller.signal,
        });
        const result: { connected?: boolean } = await response.json();
        if (!disposed) {
          setConnection(response.ok && result.connected ? "connected" : "disconnected");
        }
      } catch {
        if (!disposed) setConnection("disconnected");
      }
    };

    void checkConnection();
    const intervalId = window.setInterval(() => void checkConnection(), 5000);

    return () => {
      disposed = true;
      activeRequest?.abort();
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className={`connection-status ${connection}`} role="status" aria-live="polite">
      <span className="connection-dot" aria-hidden="true" />
      <span>{statusLabels[connection]}</span>
    </div>
  );
}
