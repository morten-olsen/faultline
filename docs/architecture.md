# Architecture

Faultline is an autonomous infrastructure management system. It monitors a Kubernetes cluster and Unifi network, automatically triaging alerts, applying fixes, and tracking resolution over time.

---

## System Overview

```
AlertManager / Manual Issue
        │
        ▼
┌─────────────────┐
│  Faultline Server│
│  (Fastify + WS) │
│                 │
│  ┌───────────┐  │     ┌─────────────┐
│  │  Router    │◄─┼─────│   Client    │
│  └─────┬─────┘  │     │  (Browser)  │
│        │        │     └─────────────┘
│  ┌─────▼─────┐  │
│  │  Services  │  │
│  │  Container │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │  SQLite    │  │
│  │  (Kysely)  │  │
│  └───────────┘  │
└─────────────────┘
```

### Lifecycle of an Issue

1. **Alert fires** — AlertManager webhook or manual creation
2. **Ticket created** — Persisted in SQLite with metadata
3. **Triage agent** — AI diagnoses the problem, adds findings to the ticket
4. **Engineer agent** — Makes changes in GitOps repos, Kubernetes resources, or Unifi config
5. **Monitoring** — System watches whether the fix resolves the issue over time
6. **Resolution** — Ticket closes on confirmed fix, or regresses if the alert recurs

---

## Monorepo Structure

```
packages/
├── protocol/     @faultline/protocol — shared message schemas and types
├── client/       @faultline/client   — typed WebSocket client
└── server/       @faultline/server   — Fastify server, router, services, database
```

All packages are compiled with `tsc` and use `.js` import extensions. Shared dependency versions are pinned via pnpm catalogs in `pnpm-workspace.yaml`.

### Package Dependencies

```
@faultline/protocol  ← no internal deps (leaf package)
       ▲
       │
@faultline/client    ← depends on protocol

@faultline/server    ← depends on protocol
```

The client and server both depend on the protocol package but not on each other.

---

## Packages

### `@faultline/protocol`

The protocol package is the single source of truth for all communication between client and server. It defines:

- **Calls** — request/response pairs with Zod-validated input and output schemas
- **Events** — server-to-client push notifications with Zod-validated payloads
- **Wire message envelopes** — the JSON structure of messages on the WebSocket

The protocol object is defined using Zod schemas, which allows the same definition to be used for:
- TypeScript type inference (compile-time safety)
- Runtime validation (both sides validate messages)
- Future OpenAPI/JSON Schema generation

See [Protocol](./protocol.md) for the full specification.

### `@faultline/client`

A WebSocket client that derives its API from the protocol definition:

- **`client.call.<method>(input)`** — typed RPC calls that return a `Promise` of the output
- **`client.on.<event>(handler)`** — typed event subscriptions that return an unsubscribe function

The client uses JavaScript `Proxy` objects to dynamically create methods from the protocol at runtime while preserving full type safety at compile time.

### `@faultline/server`

A Fastify-based server with WebSocket support. Key subsystems:

- **Router** — maps incoming WebSocket calls to handlers, validates input/output against protocol schemas, and enforces at compile time that every call has a handler
- **Service locator** — lightweight DI container for managing service lifecycle
- **Database** — Kysely + SQLite with lazy connection initialization

See [Services](./services.md) for the DI pattern documentation.

---

## Technology Choices

| Concern | Choice | Rationale |
|---|---|---|
| Language | TypeScript (strict) | Type safety across the full stack |
| Runtime | Node.js 24 | Latest LTS features, native crypto |
| Build | tsc | Simple, no bundler complexity |
| Package manager | pnpm | Workspaces, catalogs, fast installs |
| Task runner | Taskfile | Simple YAML-based task definitions |
| Tool management | mise | Declarative tool versions |
| Validation | Zod | Runtime validation + type inference |
| HTTP framework | Fastify | Fast, plugin ecosystem, WS support |
| Transport | Raw WebSocket | Full-duplex, low overhead |
| Database | SQLite via Kysely | Zero-config, type-safe query builder |
| DI | Service locator | Minimal, lazy init, easy testing |
