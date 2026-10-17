---
name: repo-setup
description: Set up a fresh checkout of this repository, including installing its Git hooks and starting its Docker Compose services.
---

# Repository Setup

Use this skill when preparing a fresh checkout or helping someone get this project running.

## Enable Git Hooks

From the repository root, run:

```sh
./.agents/skills/repo-setup/scripts/install-git-hooks.sh
```

This sets the checkout's local `core.hooksPath` to `.githooks`. The `commit-msg` hook enforces Conventional Commit subject lines. Use `<type>[optional scope][!]: <description>`, such as `feat(web): show API connection status`.

The `pre-commit` hook runs `spotlessCheck test` for the API and `npm test` plus `npm run lint` for the frontend. Install Java 21, Node.js 22.12+, and run `cd web && npm install` before committing.

## Start the Project

With Docker Compose installed, run from the repository root:

```sh
docker compose up --build
```

The frontend is at `http://localhost:3000`; the API is at `http://localhost:8080`. The named `api-data` volume preserves the SQLite database across container recreations. Stop the services with `docker compose down`.
