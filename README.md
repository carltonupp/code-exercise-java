# A little less link.

A small, self-hostable URL shortener for creating, sharing, and managing links in one shared workspace.

Create a short link with a generated alias or choose your own. Copy it to share, browse existing links, and delete links you no longer need. Visitors following a deleted link see a page explaining that it has been retired.

## What it does

- Creates short links for HTTP and HTTPS destinations, with optional custom aliases.
- Provides copyable results and clear validation feedback.
- Lists active links with pagination and one-click deletion.
- Resolves aliases regardless of letter casing and keeps deleted aliases reserved.
- Preserves saved links across restarts when run with the supplied Docker Compose setup.

The application has a shared link collection, with no accounts or per-user ownership controls.

## Try it locally

With Docker Engine or Docker Desktop and the Compose plugin installed, run:

```sh
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). See [development and local setup](docs/development.md) for source development, stopping the stack, and managing saved data.

## Documentation

| Area | Read more |
|---|---|
| Setup, development, builds, and checks | [Development guide](docs/development.md) |
| Endpoints and request/response contract | [API usage](docs/api.md) · [OpenAPI contract](openapi.yaml) |
| Environment settings and optional OTLP metrics | [Configuration](docs/configuration.md) |
| Application boundaries and source layout | [Architecture overview](docs/architecture/overview.md) |
| Proposed production hosting and scaling | [Azure hosting proposal](docs/architecture/azure-hosting.md) |
| Product behavior and implementation plans | [Feature documentation](docs/features/) |
| Technical decisions and tradeoffs | [Architecture decision records](docs/adr/) |
| AI-assisted development workflow | [Agentic development](docs/agentic-development.md) |

## Technology

The project combines a **Next.js 16 / TypeScript** web app with a **Spring Boot 4 / Java 21** API, **SQLite** persistence, and an **OpenAPI** contract. The [architecture overview](docs/architecture/overview.md) maps those parts to the source code.

The feature specs, implementation plans, and agent instructions demonstrate one way I use AI to keep development traceable. They are an example of my workflow, not the only way I work.
