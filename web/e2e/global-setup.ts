import { setTimeout as delay } from "node:timers/promises";
import { appUrl, runCompose } from "./compose";

export default async function globalSetup() {
  runCompose(["up", "--build", "--detach", "--remove-orphans"]);

  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${appUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // The containers may still be starting.
    }
    await delay(1_000);
  }

  runCompose(["logs", "--no-color"]);
  runCompose(["down", "--volumes", "--remove-orphans"]);
  throw new Error("The Playwright Compose stack did not become healthy within 180 seconds.");
}
