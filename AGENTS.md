# Repository Guidelines

## Project Structure

This repository contains a decoupled URL shortener project. `api/` is the Spring Boot 4 API, built with Gradle and Java 21; production code is under `api/src/main/java/com/tpximpact/urlshortener/` and tests under `api/src/test/java/com/tpximpact/urlshortener/`. `web/` is the Next.js App Router frontend; pages and shared styles live in `web/src/app/`. `openapi.yaml` defines the API contract. Keep API and UI changes in their respective modules and update the contract when endpoint behavior changes.

## Build, Test, and Development

- `docker compose up --build` builds and starts the API and frontend; browse to `http://localhost:3000`.
- `docker compose down` stops and removes the Compose services.
- `cd api && ./gradlew test` runs API tests (JUnit 5 / Spring Boot Test).
- `cd web && npm run lint` checks frontend style; `npm run build` creates a production build.
- For source development, use `cd api && ./gradlew bootRun` or `cd web && npm install && npm run dev`.

Compose requires Docker with the Compose plugin. Its named `api-data` volume holds SQLite data across container recreations. Direct development requires Java 21 and Node.js 22.12 or newer. Set `API_BASE_URL` for the Next.js health proxy when the API is not at `http://localhost:8080`; Compose sets it to `http://api:8080`.

## OpenAPI and Generated Code

Treat root `openapi.yaml` as the API contract. Generate Java Spring interfaces and models with `cd api && ./gradlew openApiGenerate`; Gradle generates them under `api/build/generated/openapi/` and compiles them with the API. Implement API controllers against the generated interfaces so contract changes surface as compile errors. Gradle validates the contract during API tests. Generate the frontend API client with `cd web && npm run api:generate`; `predev` and `prebuild` run generation automatically. The client and its types live in `web/src/generated/`; do not edit generated files by hand.

## Spec-Driven Development Workflow

For requests that span discovery through full-stack implementation, use `.agents/skills/spec-driven-development/SKILL.md`. It defines the product-spec, task-plan, ADR, parallel work, validation, and code-review handoff conventions. Feature specs and plans belong under `docs/features/<slug>/`; accepted architectural decisions belong under `docs/adr/`. Implement in planned subtasks, then stop after each one for user review and explicit approval before committing it with a Conventional Commit message. Continue only after that checkpoint.

## Coding Style and Naming

Format Java with Spotless using Google Java Format (`./gradlew spotlessApply` to apply, `./gradlew spotlessCheck` to verify). Use two spaces for TypeScript, TSX, JSON, and CSS. Follow Java package and class naming conventions (lowercase packages, `PascalCase` classes); name React components with `PascalCase` and variables/functions with `camelCase`. Keep frontend route files aligned with Next.js App Router conventions. Prefer small, focused changes and validate inputs at API boundaries.

## Testing Guidelines

Add JUnit 5 tests under `api/src/test/java`, using `*Tests.java` names consistent with the generated `UrlshortenerApplicationTests`. Add frontend tests with Vitest and React Testing Library under `web/src/`, using `*.test.tsx` names. `cd api && ./gradlew spotlessCheck test` validates the OpenAPI file, compiles generated API interfaces/models, and runs API tests. `cd web && npm test && npm run lint && npm run typecheck` checks frontend tests, lint, and TypeScript. The pre-commit hook runs these checks; Java 21, Node.js 22.12+, and `cd web && npm install` are required for commits. Cover API contract behavior and meaningful error cases as endpoints are implemented.

## Commits and Pull Requests

Always use Conventional Commits: `<type>[optional scope][!]: <description>`. Use a lowercase type and concise imperative description, for example `feat(web): show API connection status`, `fix(api): handle invalid aliases`, or `refactor(api)!: replace the storage format` for a breaking change. The `commit-msg` hook in `.githooks/` rejects subjects that do not follow this format. In a fresh clone, run `./.agents/skills/repo-setup/scripts/install-git-hooks.sh` to enable it; the repo-setup skill documents the setup workflow. Pull requests should explain the change, note how it was validated, link related work when available, and include screenshots for visible frontend changes.

## Configuration and Security

Do not commit credentials or local `.env` files. Keep secrets in environment variables, and avoid changing `openapi.yaml` without keeping the API implementation and frontend integration in sync.
