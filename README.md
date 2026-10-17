# URL Shortener

A decoupled URL shortener with a Spring Boot API and a Next.js frontend. The API contract is in [`openapi.yaml`](./openapi.yaml).

## Project layout

- `api/` — Java 21 and Spring Boot 4 REST API (Gradle wrapper)
- `web/` — Next.js App Router frontend (React and TypeScript)
- `openapi.yaml` — source of truth for API operations and schemas

## Run with Docker Compose

Install Docker Engine or Docker Desktop with the Compose plugin, then run from the repository root:

```sh
docker compose up --build
```

Open <http://localhost:3000> for the frontend and <http://localhost:8080> for the API. The green/red status dot polls the API health endpoint every five seconds. Stop the services with `Ctrl+C`, or run `docker compose down` from another terminal.

The API stores its SQLite database in a named Compose volume, so data remains available after containers are recreated.

The API uses `SHORT_URL_BASE_URL` when returning created short links. It defaults to `http://localhost:8080` for local development; set it to the externally reachable API origin when hosting elsewhere.

To rebuild after changes, run `docker compose up --build`. To run either service outside Docker for development, use Java 21 and `cd api && ./gradlew bootRun`, or Node.js 22.12+ and `cd web && npm install && API_BASE_URL=http://localhost:8080 npm run dev`.

## Build and test

Compose builds both container images with `docker compose build`. Run `cd api && ./gradlew spotlessCheck test` to validate the OpenAPI contract, compile generated Java interfaces/models, and run API formatting and tests. Use `./gradlew openApiGenerate` from `api/` to regenerate the Spring interfaces and models. Controllers should implement their generated API interfaces so contract changes cause compile failures. Generate the UI's typed Fetch API client with `cd web && npm run api:generate`; this runs automatically before `npm run dev` and `npm run build`. Frontend component tests use Vitest and React Testing Library; run `cd web && npm test && npm run lint && npm run typecheck` to check tests, lint, and TypeScript.

In a fresh clone, enable the Git hooks with `./.agents/skills/repo-setup/scripts/install-git-hooks.sh`. The pre-commit hook validates the OpenAPI spec, compiles generated Java interfaces, and runs API formatting/tests plus frontend tests, lint, and TypeScript checks; install Java 21, Node.js 22.12+, and frontend dependencies with `cd web && npm install` first.

The URL-shortening endpoints and persistence are to be implemented against the supplied OpenAPI contract.
