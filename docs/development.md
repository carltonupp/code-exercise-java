# Development and local setup

Run commands from the repository root unless a command explicitly changes directory. See [configuration](configuration.md) for environment settings and OTLP metrics.

## Start the app

You’ll need Docker Engine or Docker Desktop with the Compose plugin.

```sh
docker compose up --build
```

Open the app at <http://localhost:3000>. The API is available at <http://localhost:8080> and its health endpoint is <http://localhost:8080/actuator/health>.

The Compose setup persists SQLite data in the `api-data` volume. Stop the services with `Ctrl+C`, or run:

```sh
docker compose down
```

To remove the database volume too, run `docker compose down -v`. **This permanently deletes the saved links.**

## Declarative development environment

The repository uses [mise](https://mise.jdx.dev/) to declare its local Java and Node.js toolchains in [`mise.toml`](../mise.toml). Install mise using its [installation guide](https://mise.jdx.dev/getting-started.html), then from the repository root run:

```sh
mise install
mise run setup
```

This installs Temurin Java 21, Node.js 22.12.0, and the frontend dependencies. Docker is required for the Compose stack and is managed separately by Docker Desktop or Docker Engine.

Run the API and frontend in separate terminals with `mise run api` and `mise run web`. Use `mise run stack` to build and run both services with Docker Compose. Common checks are available as `mise run test-api` and `mise run test-web`.

## Run the source locally

Use separate terminals, starting from the repository root:

```sh
cd api && ./gradlew bootRun
```

```sh
cd web && npm ci && API_BASE_URL=http://localhost:8080 npm run dev
```

Frontend development and production builds refresh the generated OpenAPI types automatically. The typed API client uses those types with `openapi-fetch`.

## Develop and validate

Requirements: Java 21 and Node.js 22.12 or newer.

```sh
# API formatting, OpenAPI validation, and API tests
(cd api && ./gradlew spotlessCheck test)

# Frontend tests, lint, and TypeScript checks
npm --prefix web test && npm --prefix web run lint && npm --prefix web run typecheck

# Frontend tests with coverage (excludes generated OpenAPI types)
npm --prefix web run test:coverage

# Browser end-to-end tests (requires Docker Compose and Chromium)
(cd web && npx playwright install chromium && npm run test:e2e)
```

The HTML coverage report is written to `web/coverage/index.html`.
Playwright starts an isolated Compose project on ports 13000 and 18080, then removes its containers and database volume when the suite finishes.

Regenerate the Java API interfaces and models with `cd api && ./gradlew openApiGenerate`. Generate the TypeScript contract types with `cd web && npm run api:generate`. Generated files live under `api/build/generated/openapi/` and `web/src/generated/`; edit the OpenAPI source rather than generated output.

Install the repository’s Git hooks in a fresh clone with:

```sh
./.agents/skills/repo-setup/scripts/install-git-hooks.sh
```
