import { runCompose } from "./compose";

export default function globalTeardown() {
  runCompose(["down", "--volumes", "--remove-orphans"]);
}
