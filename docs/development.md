# Development

## Prerequisites

- [mise](https://mise.jdx.dev/) — manages Node.js version
- [Taskfile](https://taskfile.dev/) — task runner

## Setup

```bash
# Install the correct Node.js version
mise install

# Install dependencies
task install

# Build all packages
task build
```

## Common Tasks

```bash
task install     # Install dependencies
task build       # Build all packages (tsc)
task dev         # Start the server in watch mode
task typecheck   # Type-check all packages without emitting
task clean       # Remove all dist/ directories
```

## Project Structure

```
packages/
├── protocol/           @faultline/protocol
│   └── src/
│       ├── protocol.ts           # Public API (re-exports)
│       ├── protocol.types.ts     # Type utilities
│       └── protocol.schemas.ts   # Wire messages + protocol definition
├── client/             @faultline/client
│   └── src/
│       └── client.ts             # WebSocket client
└── server/             @faultline/server
    └── src/
        ├── main.ts               # Entry point (Fastify + WS)
        ├── services/
        │   └── services.ts       # Service locator container
        ├── database/
        │   └── database.ts       # Kysely + SQLite service
        └── router/
            └── router.ts         # Typed WebSocket router
```

## Build Order

pnpm handles build order automatically based on workspace dependencies:

1. `@faultline/protocol` — no internal deps, builds first
2. `@faultline/client` and `@faultline/server` — depend on protocol, build in parallel

## Adding a Package

1. Create `packages/<name>/` with `package.json`, `tsconfig.json`, and `src/`
2. Use `catalog:` references in `package.json` for shared dependencies
3. Add new shared dependencies to `pnpm-workspace.yaml` catalogs

## Dependency Catalogs

Shared dependency versions are defined once in `pnpm-workspace.yaml` and referenced with `"catalog:"` in each package's `package.json`. This ensures consistent versions across the monorepo.

```yaml
# pnpm-workspace.yaml
catalogs:
  default:
    zod: ^3.24.0
    typescript: ^5.8.0
```

```json
// packages/*/package.json
{
  "dependencies": {
    "zod": "catalog:"
  }
}
```

## Code Style

See [Coding Standards](./coding-standards.md) for TypeScript conventions. Key points:

- `type` over `interface`
- Arrow functions everywhere
- Explicit return types
- Consolidated exports at end of file
- `.js` import extensions (tsc output)
- Zod for all runtime validation
- `{module}/{module}.ts` file naming
