import { EventEmitter } from "../utils/utils.event-emitter.js";
import { destroy } from "../services/services.js";
import { createClaudeAgentProvider } from "./agent.provider.claude.js";
import { AgentRun } from "./agent.run.js";

import type { Services } from "../services/services.js";
import type { AgentTask, AgentProvider, AgentServiceEventMap } from "./agent.types.js";

class AgentService {
  #provider: AgentProvider;
  #running: Map<string, AgentRun>;
  #emitter: EventEmitter<AgentServiceEventMap>;

  constructor(_services: Services) {
    this.#provider = createClaudeAgentProvider();
    this.#running = new Map();
    this.#emitter = new EventEmitter();
  }

  // ── Event subscription ──────────────────────────────────────────

  on: EventEmitter<AgentServiceEventMap>["on"] = (event, callback, options) =>
    this.#emitter.on(event, callback, options);

  // ── Provider ────────────────────────────────────────────────────

  setProvider = (provider: AgentProvider): void => {
    this.#provider = provider;
  };

  // ── Start an agent run ──────────────────────────────────────────

  run = (task: AgentTask): AgentRun => {
    const run = new AgentRun(task, this.#provider);

    this.#running.set(run.id, run);

    // Forward run-level events to the service-level emitter
    const { id, correlationId } = run;

    run.events.on("step", (event) => {
      this.#emitter.emit("step", id, correlationId, event);
    }, { abortSignal: run.signal });

    run.events.on("result", (event) => {
      this.#emitter.emit("result", id, correlationId, event);
    }, { abortSignal: run.signal });

    run.events.on("error", (event) => {
      this.#emitter.emit("error", id, correlationId, event);
    }, { abortSignal: run.signal });

    run.events.on("done", () => {
      this.#running.delete(id);
      this.#emitter.emit("done", id, correlationId);
    });

    run.start();

    return run;
  };

  // ── Stop a running agent ────────────────────────────────────────

  stop = (runId: string): void => {
    const run = this.#running.get(runId);
    if (!run) return;
    run.stop();
  };

  // ── Query running state ─────────────────────────────────────────

  isRunning = (runId: string): boolean =>
    this.#running.has(runId);

  get runningCount(): number {
    return this.#running.size;
  }

  // ── Cleanup on shutdown ─────────────────────────────────────────

  [destroy] = (): void => {
    for (const [, run] of this.#running) {
      run.stop();
    }
    this.#running.clear();
  };
}

export { AgentService };
