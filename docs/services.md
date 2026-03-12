# Services

The server uses a service locator pattern for dependency injection. This provides lazy initialization, simple testing, and graceful cleanup without any framework dependencies.

Reference: https://mortenolsen.pro/posts/simple-service-pattern/

---

## The Container

The `Services` class is a lightweight container that manages service instances:

```typescript
import { Services } from "./services/services.js";

const services = new Services();

// Get a service (lazily instantiated on first access)
const db = services.get(DatabaseService);

// Override a service (for testing)
services.set(DatabaseService, mockDb);

// Cleanup all services
await services.destroy();
```

### How It Works

1. **`get(ServiceClass)`** — returns the singleton instance, creating it on first access
2. **`set(ServiceClass, instance)`** — replaces the instance (used in tests to inject mocks)
3. **`destroy()`** — calls the `[destroy]()` method on every service that implements it

Services are keyed by their constructor, so each class has exactly one instance per container.

---

## Writing a Service

A service is any class that accepts `Services` in its constructor:

```typescript
import { destroy } from "../services/services.js";

import type { Services } from "../services/services.js";

class MyService {
  #services: Services;

  constructor(services: Services) {
    this.#services = services;
  }

  doWork = async (): Promise<void> => {
    // Resolve dependencies lazily in methods, not in constructor
    const db = this.#services.get(DatabaseService);
    const instance = await db.instance;
    // ...
  };

  // Optional: implement cleanup
  [destroy] = async (): Promise<void> => {
    // Close connections, flush buffers, etc.
  };
}

export { MyService };
```

### Key Rules

1. **Accept the container in the constructor** — store a reference for later use
2. **Resolve dependencies in methods, not the constructor** — this prevents circular dependencies and ensures services are only created when actually needed
3. **Implement `[destroy]()` for cleanup** — the container calls this on shutdown for every service that has it

---

## Lazy Initialization

For services that manage expensive resources (database connections, external clients), use the deferred `Promise` pattern:

```typescript
class DatabaseService {
  #instance: Promise<Kysely<DatabaseSchema>> | undefined;

  constructor(_services: Services) {}

  #setup = async (): Promise<Kysely<DatabaseSchema>> => {
    const dialect = new SqliteDialect({
      database: new BetterSqlite3("faultline.db"),
    });
    const db = new Kysely<DatabaseSchema>({ dialect });
    // Run migrations, etc.
    return db;
  };

  get instance(): Promise<Kysely<DatabaseSchema>> {
    if (!this.#instance) {
      this.#instance = this.#setup();
    }
    return this.#instance;
  }

  [destroy] = async (): Promise<void> => {
    if (this.#instance) {
      const db = await this.#instance;
      await db.destroy();
    }
  };
}
```

The `#instance` field stores a `Promise`, not the resolved value. This means:

- The first call to `.instance` triggers setup
- Concurrent calls while setup is in progress share the same `Promise` (no duplicate connections)
- Subsequent calls return immediately with the cached `Promise`

---

## Testing

The `set()` method allows injecting mocks without any test framework magic:

```typescript
import { Services } from "./services/services.js";

test("creates an issue", async () => {
  const services = new Services();

  // Inject a mock database
  services.set(DatabaseService, {
    instance: Promise.resolve({
      insertInto: () => ({ values: () => ({ execute: async () => ({}) }) }),
    }),
  });

  const issueService = services.get(IssueService);
  const issue = await issueService.create({ title: "Test" });

  expect(issue.title).toBe("Test");
});
```

Because `set()` accepts `Partial<T>`, you only need to mock the methods your test actually calls.

---

## Lifecycle

```
Application Start
       │
       ▼
  new Services()          ← container created (empty)
       │
       ▼
  services.get(Foo)       ← Foo instantiated on first access
       │
       ▼
  foo.doWork()            ← Foo resolves Bar lazily
       │                     services.get(Bar) → Bar instantiated
       ▼
  await services.destroy() ← [destroy]() called on Foo and Bar
```

Services are created on demand and destroyed together at shutdown. The server wires this up with process signal handlers:

```typescript
const shutdown = async (): Promise<void> => {
  await services.destroy();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```
