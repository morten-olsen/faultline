import type { Tool } from "./agent.tools.js";

// ── Agent task — what the service sends to a provider ──────────────

type AgentTask = {
  issueId: string;
  agentLoopId: string;
  prompt: string;
  systemPrompt?: string;
  builtinTools?: readonly string[];
  customTools?: Tool[];
  cwd?: string;
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

export type {
  AgentTask,
  AgentStepEvent,
  AgentResultEvent,
  AgentErrorEvent,
  AgentDoneEvent,
  AgentEvent,
  AgentProvider,
};
