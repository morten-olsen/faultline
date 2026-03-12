# Protocol

The Faultline protocol defines all communication between client and server over a single WebSocket connection. It supports two message patterns:

- **Calls** — client-initiated request/response (RPC)
- **Events** — server-initiated push notifications

All messages are JSON-encoded and validated with Zod schemas at both ends.

---

## Wire Format

Every message has a `type` discriminator field.

### Call (client → server)

```json
{
  "type": "call",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "ping",
  "params": {}
}
```

| Field | Type | Description |
|---|---|---|
| `type` | `"call"` | Message discriminator |
| `id` | `string` | Unique request ID (UUID), used to correlate responses |
| `method` | `string` | The call method name, must match a key in `protocol.calls` |
| `params` | `unknown` | Call input, validated against the method's input schema |

### Response (server → client)

```json
{
  "type": "response",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "result": { "pong": true }
}
```

| Field | Type | Description |
|---|---|---|
| `type` | `"response"` | Message discriminator |
| `id` | `string` | Matches the `id` from the originating call |
| `result` | `unknown` | Call output, validated against the method's output schema |

### Error (server → client)

```json
{
  "type": "error",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Something went wrong"
  }
}
```

| Field | Type | Description |
|---|---|---|
| `type` | `"error"` | Message discriminator |
| `id` | `string` | Matches the `id` from the originating call |
| `error.code` | `string` | Machine-readable error code |
| `error.message` | `string` | Human-readable error description |

**Standard error codes:**

| Code | Meaning |
|---|---|
| `METHOD_NOT_FOUND` | The requested method does not exist |
| `INTERNAL_ERROR` | Handler threw an error or output validation failed |

### Event (server → client)

```json
{
  "type": "event",
  "event": "connected",
  "payload": { "clientId": "550e8400-e29b-41d4-a716-446655440000" }
}
```

| Field | Type | Description |
|---|---|---|
| `type` | `"event"` | Message discriminator |
| `event` | `string` | Event name, must match a key in `protocol.events` |
| `payload` | `unknown` | Event data, validated against the event's payload schema |

---

## Defining the Protocol

The protocol is defined in `@faultline/protocol` as a plain object with Zod schemas:

```typescript
import { z } from "zod";

const protocol = {
  calls: {
    ping: {
      input: z.object({}),
      output: z.object({ pong: z.literal(true) }),
    },
  },
  events: {
    connected: {
      payload: z.object({ clientId: z.string().uuid() }),
    },
  },
};
```

Each call defines an `input` and `output` schema. Each event defines a `payload` schema. TypeScript infers exact types from these schemas, so both the router and client are fully typed.

### Adding a New Call

1. Add the call definition to `protocol.calls` in `packages/protocol/src/protocol.schemas.ts`
2. The server will produce a **compile error** until a handler is added to the router
3. The client's `call` object automatically gains the new method

```typescript
// 1. Define the schema
const protocol = {
  calls: {
    // ...existing calls
    "issues.create": {
      input: z.object({
        title: z.string().min(1),
        description: z.string().optional(),
      }),
      output: z.object({
        id: z.string().uuid(),
        title: z.string(),
      }),
    },
  },
  // ...
};

// 2. Server handler (required by compiler)
const router = createRouter(protocol, {
  // ...existing handlers
  "issues.create": async (input, { services }) => {
    // implementation
  },
});

// 3. Client usage (automatically typed)
const issue = await client.call["issues.create"]({
  title: "AlertManager: pod crash loop",
});
```

### Adding a New Event

1. Add the event definition to `protocol.events` in `packages/protocol/src/protocol.schemas.ts`
2. Emit the event from the server by sending an `EventMessage` over the WebSocket
3. The client's `on` object automatically gains the new event

```typescript
// 1. Define the schema
const protocol = {
  events: {
    // ...existing events
    "issue.updated": {
      payload: z.object({
        id: z.string().uuid(),
        status: z.enum(["open", "triaging", "fixing", "resolved", "regressed"]),
      }),
    },
  },
  // ...
};

// 2. Emit from server
const event: EventMessage = {
  type: "event",
  event: "issue.updated",
  payload: { id: issueId, status: "resolved" },
};
socket.send(JSON.stringify(event));

// 3. Subscribe from client (automatically typed)
const unsubscribe = client.on["issue.updated"]((payload) => {
  console.log(payload.id, payload.status);
});
```

---

## Type Utilities

The protocol package exports type utilities for working with protocol definitions:

| Type | Description |
|---|---|
| `ProtocolDefinition` | Shape of a protocol object (calls + events) |
| `CallDefinition` | Shape of a single call (input + output schemas) |
| `EventDefinition` | Shape of a single event (payload schema) |
| `InferCallInput<T>` | Infer the TypeScript input type from a call definition |
| `InferCallOutput<T>` | Infer the TypeScript output type from a call definition |
| `InferEventPayload<T>` | Infer the TypeScript payload type from an event definition |

The `defineProtocol` helper preserves the narrow type of the protocol object while checking it satisfies `ProtocolDefinition`:

```typescript
import { defineProtocol } from "@faultline/protocol";

const myProtocol = defineProtocol({
  calls: { /* ... */ },
  events: { /* ... */ },
});
// typeof myProtocol preserves the exact schema types
```
