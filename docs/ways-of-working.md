# Ways of Working

How we design and build features in Faultline.

---

## Feature Development Flow

Every feature follows three phases, in order. Each phase has a clear output and a clear set of inputs to draw from.

### 1. Design in Storybook

**Goal:** Sketch the user interaction before writing any backend or wiring code.

Start in `packages/web/src/stories/pages/` and build a full-page story that shows the feature in all its meaningful states. Use hardcoded data — no API calls, no hooks. The focus is on what the user sees, how they interact, and how the feature feels.

**What to produce:**
- A page story with multiple named variants (e.g. `Empty`, `Active`, `Complete`, `Error`)
- New component stories in `packages/web/src/components/*/` if the feature introduces new building blocks
- Each story has a comment block explaining the design intent

**What to draw from:**
- [`docs/design-principles.md`](design-principles.md) — the source of truth for tone, visual language, interaction patterns, and anti-patterns. Every design decision should trace back here.
- Existing stories in `packages/web/src/stories/` — for established patterns: animation presets (`fadeUp`, `stagger`), page shell layout, section labels, component composition.
- Existing components in `packages/web/src/components/` — reuse before creating. Check what's there and compose from it.
- The Storybook principles section of the design doc — stories are narrative, not catalogues. Every page explains intent.

**Key rules:**
- Design for the glance first. If it takes more than 3 seconds to know what's happening, redesign.
- Calm over urgent. Default to quiet. Escalate through subtlety.
- Reuse components across contexts. The same `TranscriptStep` appears in both issue transcripts and ad-hoc chat. The same `ChatBubble` works everywhere the agent speaks.
- Hardcode realistic data in stories. Real node names, real latencies, real error messages. The story should feel like a screenshot of the running system.
- **Build components, not page copies.** See [Shared Components](#shared-components-between-stories-and-routes) below.

### 2. Implement the Backend

**Goal:** Build the API surface the frontend will consume.

Once the design is settled, work out what data and operations the UI needs, then implement them in the server.

**What to produce:**
- Protocol additions in `packages/protocol/src/protocol.schemas.ts` — new calls, events, or domain schemas
- Service methods in `packages/server/src/` — business logic behind the new calls
- Route handlers in `packages/server/src/main.ts` — wiring protocol calls to service methods
- Database migrations if new tables are needed

**What to draw from:**
- [`docs/architecture.md`](architecture.md) — system structure, package dependencies, technology choices
- [`docs/protocol.md`](protocol.md) — how calls and events are defined, message envelope format
- [`docs/services.md`](services.md) — the DI pattern for service creation and dependency resolution
- [`docs/coding-standards.md`](coding-standards.md) — TypeScript conventions, file naming, export patterns
- `CLAUDE.md` — quick reference for import gotchas, Zod patterns, module structure
- The storybook stories from phase 1 — they define what data shapes the frontend expects

**Key rules:**
- The protocol is the contract. Define the schema first, then implement. The types flow from Zod schemas — don't hand-write interfaces that duplicate them.
- Follow the existing pattern: schemas in protocol, service logic in the server, row-to-protocol conversion in `main.ts`.
- Build only what the UI needs. The stories tell you exactly which calls and fields are required.

### 3. Build the Real Frontend

**Goal:** Wire the designed UI to the real backend.

Replace the hardcoded story data with actual API calls, state management, and routing.

**What to produce:**
- Route pages in `packages/web/src/routes/`
- Hooks or client calls using `useClient()` and React Query
- Any new shared components extracted during implementation (with their own stories)

**What to draw from:**
- The storybook stories from phase 1 — the visual structure, component composition, and animation patterns are already solved. Translate them into live code.
- The protocol from phase 2 — the API surface is defined. Use `client.call["method.name"](input)` with React Query for data fetching.
- `packages/web/src/client/` — the browser WebSocket client and React context
- Existing route implementations in `packages/web/src/routes/` — for patterns on navigation, layout, and data loading

**Key rules:**
- The real page should look identical to the story. If you're making visual changes during implementation, go back and update the story first.
- Use React Query for all server state. Poll with `refetchInterval` for live-updating data (agent steps, loop status).
- Keep component logic in components, page orchestration in routes. A component shouldn't know about routing; a route shouldn't know about styling.
- **Routes compose the same components as stories.** The route adds data fetching and interactivity; it does not rebuild the layout. See [Shared Components](#shared-components-between-stories-and-routes) below.

---

## Shared Components Between Stories and Routes

Stories and routes must use the same presentational components. If a layout or visual pattern exists in a story but not as a component, it will be duplicated in the route — and those copies will drift apart. The rule: **if a story builds it, a component owns it.**

### The pattern

Split every page into three layers:

| Layer | Lives in | Knows about |
|---|---|---|
| **Layout components** | `components/` | Structure, slots, styling |
| **Stories** | `stories/pages/` | Layout + hardcoded mock data |
| **Routes** | `routes/` | Layout + data fetching + navigation |

Layout components are **presentational** — they accept `children`, slots (like `composer`, `trailing`), and callbacks (like `onBack`). They never fetch data or know about routing.

### Example: Chat page

```
ChatLayout          ← owns the shell: nav bar, scroll area, composer slot
ChatEmptyState      ← owns the empty state visuals
AgentStepsView      ← owns step rendering: work block, message bubble, typing indicator
WorkBlock           ← owns the subtle card wrapper for agent work
ChatBubble          ← owns a single message bubble
ChatComposer        ← owns the input area
```

**Story** composes these with mock data:
```tsx
<ChatLayout composer={<ChatComposer />}>
  <ChatBubble role="user">Is the cluster okay?</ChatBubble>
  <AgentStepsView steps={mockSteps} isRunning={false} />
</ChatLayout>
```

**Route** composes the same components with live data:
```tsx
<ChatLayout
  ref={scrollRef}
  onBack={() => navigate({ to: "/" })}
  trailing={<StopButton />}
  composer={<ChatComposer onSend={handleSend} disabled={isWorking} />}
>
  {entries.map(entry =>
    entry.type === "user"
      ? <ChatBubble role="user">{entry.content}</ChatBubble>
      : <AgentEntry agentLoopId={entry.agentLoopId} isActive={...} />
  )}
</ChatLayout>
```

The `AgentEntry` in the route is a thin data-fetching wrapper around `AgentStepsView`:
```tsx
const AgentEntry = ({ agentLoopId, isActive }) => {
  const steps = useQuery(...)   // fetch from server
  const loop = useQuery(...)    // poll for status
  return <AgentStepsView steps={steps} isRunning={loop.status === "running"} />
}
```

### Rules

1. **Extract layout during the story phase.** When you design a page story and find yourself building a shell, a card layout, or a list pattern — make it a component in `components/` immediately. Don't wait for the route phase.

2. **Presentational components take plain data, not API types.** `AgentStepsView` takes a `StepData[]` array, not an `AgentStep[]` from the protocol. The route maps protocol types to component props; the story provides the same shape directly. This keeps components decoupled from the wire format.

3. **One visual truth.** If a story and a route render differently for the same state, the component is wrong. Fix the component, not the consumers. The story is the visual spec — the route must match it.

4. **Mock data lives in stories, not components.** Components are parameterised. Stories provide the scenarios. This keeps components reusable and stories readable.

---

## Reference Map

| Question | Where to look |
|---|---|
| How should this feel? | [`docs/design-principles.md`](design-principles.md) |
| What components exist? | `packages/web/src/components/` and their stories |
| What does the page look like? | `packages/web/src/stories/pages/` |
| What's the API contract? | `packages/protocol/src/protocol.schemas.ts` |
| How do services work? | [`docs/services.md`](services.md) |
| How is the system structured? | [`docs/architecture.md`](architecture.md) |
| What are the code conventions? | [`docs/coding-standards.md`](coding-standards.md) and `CLAUDE.md` |
| How do I run things? | [`docs/development.md`](development.md) and `Taskfile.yml` |
