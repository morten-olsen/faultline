# Agent

The agent is an autonomous loop that investigates and resolves infrastructure issues. It receives a prompt, has access to a set of tools, and streams its work back as steps that are persisted to the database and displayed in the UI.

---

## Architecture

```
User prompt (chat or orchestrator)
        │
        ▼
  AgentService.run()
        │
        ├─ Create AgentLoop + timeline entry (DB)
        ├─ Assemble tools (faultline + infra)
        ├─ Build system prompt with integration summary
        └─ Start #consume() in background
               │
               ▼
         AgentProvider.run()    ←── pluggable (Claude SDK today)
               │
               ├─ step events  →  DB (agent_steps)
               ├─ result event →  DB (timeline entry)
               └─ done         →  cleanup temp files, mark loop complete
```

The frontend polls `agentSteps.list` and `agentLoops.get` to render progress in real time.

---

## Provider Interface

`AgentProvider` is the abstraction boundary between the orchestration layer and the LLM backend. Any provider must implement a single method:

```typescript
type AgentProvider = {
  run: (task: AgentTask, signal: AbortSignal) => AsyncIterable<AgentEvent>;
};
```

The provider receives an `AgentTask` (prompt, system prompt, tools, cwd) and yields a stream of events: `step`, `result`, `error`, and `done`.

### Claude Provider

The default provider (`agent.provider.claude.ts`) uses the Claude Agent SDK:

- Custom tools are served via an in-process MCP server under the `"faultline"` namespace — tool names become `mcp__faultline__<name>`.
- Builtin SDK tools (Read, Glob, Grep, Bash, Write, Edit, WebSearch, WebFetch) are passed via `allowedTools`.
- Runs with `permissionMode: "bypassPermissions"` and `maxTurns: 30`.
- Streams back thinking blocks, text blocks, tool calls, tool results, and the final result.

---

## Tools

Tools are the agent's capabilities. Each tool has a name, description, Zod input/output schemas, and an `execute` function.

```typescript
defineTool({
  name: "tool-name",
  description: "What this tool does",
  access: "read" | "write" | "dangerous",
  input: { /* zod shape */ },
  output: z.object({ /* zod shape */ }),
  execute: async (args) => { /* ... */ },
});
```

### Access Levels

Tools declare an access level: `read`, `write`, or `dangerous`. This is not currently enforced — all tools are provided to the agent regardless. Access-level filtering will be introduced when orchestration is implemented.

### Builtin Tools

These are SDK-provided tools (file I/O, search, shell). The agent currently receives the write-level set:

| Tool | Description |
|------|-------------|
| Read, Glob, Grep | File system reading and search |
| Write, Edit | File system writing |
| Bash | Shell command execution |
| WebSearch, WebFetch | Web access |

### Faultline Tools

Issue management tools (`agent.tools.faultline.ts`). Created via `createFaultlineTools(services)`.

| Tool | Access | Description |
|------|--------|-------------|
| `get-issue` | read | Get an issue by ID |
| `list-issues` | read | List issues, optionally filtered by stage or source |
| `get-timeline` | read | Get timeline entries for an issue |
| `get-resources` | read | Get infrastructure resources for an issue |
| `get-related-issues` | read | Get related issues |
| `update-issue` | write | Update stage, priority, title, summary, needsYou |
| `add-timeline-entry` | write | Record a finding, action, or outcome |
| `add-resource` | write | Associate a resource (node, pod, etc.) with an issue |
| `request-approval` | write | Request human approval before a destructive action |
| `add-issue-link` | write | Link a commit or PR to an issue |
| `add-relation` | write | Relate two issues (caused-by, related-to, duplicate-of) |

### Infrastructure Tools

Execution tools for interacting with configured integrations (`agent.tools.infra.ts`). Created via `createInfraTools(services)`, which returns `{ tools, cleanup }`.

| Tool | Access | Description |
|------|--------|-------------|
| `list-integrations` | read | Discover all configured integrations (metadata, no secrets) |
| `kubectl` | write | Execute kubectl against a configured kube context |
| `ssh-exec` | write | Execute a command on a configured SSH connection |
| `git-clone` | write | Clone a configured git repo into the workspace |

All infra tools resolve credentials from `IntegrationService` at execution time. The agent never sees private keys or tokens directly — it passes integration IDs and the tools handle the rest.

#### SSH Isolation

All infra subprocesses run with `SSH_AUTH_SOCK=""` to prevent any interaction with the host's SSH agent (1Password, ssh-agent, etc.). SSH commands also use `-o IdentitiesOnly=yes` so only the platform-managed key is offered. This is a hard security boundary — the agent can only use keys explicitly configured as integrations.

#### Temp Key Cleanup

When `ssh-exec` or `git-clone` needs a private key, it writes the key to a temp file tracked by a `KeyFileTracker`. The `cleanup()` function deletes all temp files and is called in `#consume`'s `finally` block, so keys are cleaned up whether the loop succeeds, fails, or is stopped.

---

## System Prompt

The agent receives a system prompt composed of:

1. The caller-provided system prompt (if any)
2. An auto-generated infrastructure summary listing all configured integrations

The summary is built by `buildIntegrationSummary()` and looks like:

```
## Available Infrastructure

SSH Identities: deploy-readonly (ed25519), deploy-write (ed25519)
Git Repos: infra-gitops (git@github.com:acme/infra-gitops.git, branch: main)
Kubernetes: homelab-prod (context: homelab-prod)
SSH Connections: nas (admin@10.0.1.50:22, key: deploy-readonly)

Use list-integrations to get IDs. Use kubectl, ssh-exec, git-clone tools to interact.
```

This tells the agent what infrastructure exists without requiring it to call `list-integrations` first for every run.

---

## Agent Lifecycle

### Starting a Loop

`AgentService.run()`:

1. Creates an `AgentLoop` record in the database (status: running).
2. Adds a "pending" timeline entry of kind `"analysis"` to the issue.
3. Assembles all custom tools (faultline + infra).
4. Builds the system prompt with integration summary.
5. Creates an `AbortController` for cancellation and registers the loop.
6. Starts `#consume()` in the background — the caller gets the loop ID immediately.

### Consuming Events

`#consume()` iterates over the provider's event stream:

- **step** — Persisted as an `AgentStep` row (kind, title, detail, output, duration, status).
- **result** — Stored, then written as an "outcome" timeline entry on the issue.
- **error** — Persisted as a failed step; loop status set to "stopped".
- **done** — Cleanup runs, loop removed from the active map.

On successful completion the loop status is set to `"complete"`. On any exception it falls back to `"stopped"`.

### Stopping a Loop

`AgentService.stop()` aborts the controller, which signals the provider to stop iterating. The loop status is set to `"stopped"` in the database.

---

## Ad-Hoc Chat

The chat page (`routes/chat.tsx`) provides a conversational interface to the agent outside of the issue lifecycle:

1. On the first message, an ad-hoc issue is created (source: `"ad-hoc-chat"`, stage: `"investigation"`).
2. Each message triggers `agent.run()` with the issue ID and user prompt.
3. The UI polls steps and loop status at 600ms intervals, rendering them via `AgentStepsView`.
4. An inline `AgentActivity` bar shows working status and a stop button while the agent runs.

---

## Files

```
packages/server/src/agent/
├── agent.ts                    — barrel exports
├── agent.types.ts              — AgentTask, AgentEvent, AgentProvider
├── agent.tools.ts              — defineTool, access levels, resolution helpers
├── agent.tools.faultline.ts    — issue management tools
├── agent.tools.infra.ts        — kubectl, ssh-exec, git-clone, list-integrations
├── agent.provider.claude.ts    — Claude Agent SDK provider
└── agent.service.ts            — AgentService (run, consume, stop)
```
