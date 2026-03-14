import type { Tool } from "./agent.tools.js";

// ── Agent task — what the service receives to start a run ─────────

type AgentTask = {
  prompt: string;
  systemPrompt?: string;
  builtinTools?: readonly string[];
  customTools?: Tool[];
  cwd?: string;
  correlationId?: string;
};

// ── Agent events — what a provider streams back ────────────────────

type AgentStepEvent = {
  type: "step";
  kind: "thinking" | "tool-call" | "message" | "error";
  title: string;
  detail?: string;
  output?: string;
  durationMs?: number;
  status?: string;
};

type AgentResultEvent = {
  type: "result";
  text: string;
};

type AgentErrorEvent = {
  type: "error";
  message: string;
};

type AgentDoneEvent = {
  type: "done";
};

type AgentEvent =
  | AgentStepEvent
  | AgentResultEvent
  | AgentErrorEvent
  | AgentDoneEvent;

// ── Provider interface — the abstraction boundary ──────────────────
// Implement this for any LLM agent backend (Claude Agent SDK, OpenAI, local, etc.)

type AgentProvider = {
  run: (task: AgentTask, signal: AbortSignal) => AsyncIterable<AgentEvent>;
};

// ── Typed event maps ───────────────────────────────────────────────

type AgentRunEventMap = {
  step: (event: AgentStepEvent) => void;
  result: (event: AgentResultEvent) => void;
  error: (event: AgentErrorEvent) => void;
  done: () => void;
};

type AgentServiceEventMap = {
  step: (runId: string, correlationId: string | undefined, event: AgentStepEvent) => void;
  result: (runId: string, correlationId: string | undefined, event: AgentResultEvent) => void;
  error: (runId: string, correlationId: string | undefined, event: AgentErrorEvent) => void;
  done: (runId: string, correlationId: string | undefined) => void;
};

export type {
  AgentTask,
  AgentStepEvent,
  AgentResultEvent,
  AgentErrorEvent,
  AgentDoneEvent,
  AgentEvent,
  AgentProvider,
  AgentRunEventMap,
  AgentServiceEventMap,
};
