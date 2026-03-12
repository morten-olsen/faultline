# Faultline

Autonomous infrastructure management system — monitors a Kubernetes cluster and Unifi network, triages alerts, applies fixes, and tracks resolution.

See [docs/architecture.md](docs/architecture.md) for system design and [docs/coding-standards.md](docs/coding-standards.md) for full standards.

## Monorepo

```
packages/
├── protocol/   @faultline/protocol — shared message schemas and types (leaf, no internal deps)
├── client/     @faultline/client   — typed WebSocket client (depends on protocol)
├── server/     @faultline/server   — Fastify server, router, services, DB (depends on protocol)
└── web/        @faultline/web      — React frontend (Vite + Tailwind + TanStack Router/Query)
```

- **pnpm** workspaces with catalogs in `pnpm-workspace.yaml`
- **tsc** for backend/package builds — no bundler; **Vite** for frontend
- **Taskfile** for tasks, **mise** for tool versions

## Key Conventions

- **`type` over `interface`** — always
- **Arrow functions** — always, including class methods
- **Exports at end of file** — single `export type {}` and/or `export {}`; no scattered `export` keywords
- **No default exports**
- **No index files** — use `{module}/{module}.ts` as the public API
- **File naming** — kebab-case (`user-service.ts`)
- **Module pattern** — `{module}/{module}.ts` with support files as `{module}/{module}.{area}.ts`
- **Private fields** — use `#` syntax, never `private` keyword
- **Explicit return types** on all functions

## Import Gotchas

- **Always include file extensions** in imports
- Use **`.js`** for all tsc-compiled code (backend + packages) — matches compiled output
- Use **`.tsx`** for JSX files in frontend (Vite won't resolve `.ts` → `.tsx`)

## Zod Gotchas

- Schema naming: `{name}Schema` (camelCase) → type: `{Name}` (PascalCase) via `z.infer<typeof schema>`
- **`z.record()` requires two arguments** — always provide key and value schemas: `z.record(z.string(), z.unknown())`
- **`.default()` must come before `.transform()`** in chains
- OpenAPI registration via `z.globalRegistry.add(schema, { id: "Name" })` in `api.schemas.ts`
- JSON Schema conversion: `z.toJSONSchema(schema, { target: "draft-07" })`

## Tailwind CSS (Frontend)

- **v4 syntax** — use `bg-linear-*` not `bg-gradient-*`
- Prefer standard spacing tokens over arbitrary `[Npx]` values
- Use bare opacity modifiers: `bg-white/3` not `bg-white/[0.03]`

## DI Pattern

Lightweight service locator — services receive the container, resolve deps lazily in methods (not constructor). See [docs/services.md](docs/services.md).
