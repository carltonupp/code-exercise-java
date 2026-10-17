import { execFileSync } from "node:child_process";

const projectName = "urlshortener-playwright";
const composeArgs = [
  "compose",
  "--project-name", projectName,
  "-f", "../compose.yaml",
];

const composeEnv = {
  ...process.env,
  API_PORT: "18080",
  WEB_PORT: "13000",
  SHORT_URL_BASE_URL: "http://localhost:13000",
};

export function runCompose(args: string[]) {
  execFileSync("docker", [...composeArgs, ...args], {
    cwd: process.cwd(),
    env: composeEnv,
    stdio: "inherit",
  });
}

export const appUrl = "http://127.0.0.1:13000";
