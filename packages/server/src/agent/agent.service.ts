import { IssueService } from "../issues/issues.js";
import { destroy } from "../services/services.js";
import { createClaudeAgentProvider } from "./agent.provider.claude.js";
import { createFaultlineTools } from "./agent.tools.faultline.js";
import { createInfraTools, buildIntegrationSummary } from "./agent.tools.infra.js";
import { builtinToolsByAccess } from "./agent.tools.js";

import type { Services } from "../services/services.js";
import type { AgentProvider, AgentTask } from "./agent.types.js";

type RunAgentInput = {
  issueId: string;
  prompt: string;
  systemPrompt?: string;
  allowedTools?: string[];
  cwd?: string;
};

type RunningLoop = {
  agentLoopId: string;
  controller: AbortController;
};

class AgentService {
  #services: Services;
  #provider: AgentProvider;
  #running: Map<string, RunningLoop>;

  constructor(services: Services) {
    this.#services = services;
    this.#provider = createClaudeAgentProvider();
    this.#running = new Map();
  }

  // Allow swapping the provider at runtime (e.g. for testing or config changes)
  setProvider = (provider: AgentProvider): void => {
    this.#provider = provider;
  };

  // ── Start an agent loop ──────────────────────────────────────────

  run = async (input: RunAgentInput): Promise<string> => {
    const issueService = this.#services.get(IssueService);

    // Create the agent loop record
    const loop = await issueService.createAgentLoop({
      issueId: input.issueId,
      title: input.prompt.length > 120
        ? input.prompt.slice(0, 117) + "..."
        : input.prompt,
    });

    // Add a timeline entry linking to this agent loop
    await issueService.addTimelineEntry({
      issueId: input.issueId,
      agentLoopId: loop.id,
      kind: "analysis",
      status: "pending",
      title: "Agent investigating",
      body: null,
      commandRun: null,
    });

    // Give the agent all tools — access-level filtering will be
    // introduced later when orchestration lands.
    const { tools: infraTools, cleanup } = createInfraTools(this.#services);
    const customTools = [...createFaultlineTools(this.#services), ...infraTools];
    const builtinTools = builtinToolsByAccess.write;

    // Build system prompt with integration summary
    const infraSummary = await buildIntegrationSummary(this.#services);
    const systemPrompt = input.systemPrompt
      ? `${input.systemPrompt}\n\n${infraSummary}`
      : infraSummary;

    const controller = new AbortController();
    this.#running.set(loop.id, { agentLoopId: loop.id, controller });

    const task: AgentTask = {
      issueId: input.issueId,
      agentLoopId: loop.id,
      prompt: input.prompt,
      systemPrompt,
      builtinTools,
      customTools,
      cwd: input.cwd,
    };

    // Run in background — don't await. The caller gets the loop ID immediately.
    this.#consume(task, loop.id, controller, cleanup).catch(() => {
      // Errors are recorded inside #consume; nothing to do here.
    });

    return loop.id;
  };

  // ── Stop a running agent loop ────────────────────────────────────

  stop = async (agentLoopId: string): Promise<void> => {
    const entry = this.#running.get(agentLoopId);
    if (!entry) return;

    entry.controller.abort();
    this.#running.delete(agentLoopId);

    const issueService = this.#services.get(IssueService);
    await issueService.updateAgentLoopStatus(agentLoopId, "stopped");
  };

  // ── Query running loops ──────────────────────────────────────────

  isRunning = (agentLoopId: string): boolean =>
    this.#running.has(agentLoopId);

  get runningCount(): number {
    return this.#running.size;
  }

  // ── Consume the event stream, recording everything to DB ─────────

  #consume = async (
    task: AgentTask,
    agentLoopId: string,
    controller: AbortController,
    cleanup?: () => void,
  ): Promise<void> => {
    const issueService = this.#services.get(IssueService);
    let resultText: string | undefined;

    try {
      for await (const event of this.#provider.run(task, controller.signal)) {
        switch (event.type) {
          case "step": {
            await issueService.addAgentStep({
              agentLoopId,
              kind: event.kind,
              title: event.title,
              detail: event.detail ?? null,
              output: event.output ?? null,
              durationMs: event.durationMs ?? null,
              status: event.status ?? null,
            });
            break;
          }

          case "result": {
            resultText = event.text;
            break;
          }

          case "error": {
            await issueService.addAgentStep({
              agentLoopId,
              kind: "error",
              title: event.message,
              detail: null,
              output: null,
              durationMs: null,
              status: "failed",
            });
            break;
          }
        }
      }

      // Mark loop complete
      await issueService.updateAgentLoopStatus(agentLoopId, "complete");

      // Update the timeline entry with the result
      if (resultText) {
        await issueService.addTimelineEntry({
          issueId: task.issueId,
          agentLoopId,
          kind: "outcome",
          status: "success",
          title: resultText.length > 120
            ? resultText.slice(0, 117) + "..."
            : resultText,
          body: resultText,
          commandRun: null,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      await issueService.addAgentStep({
        agentLoopId,
        kind: "error",
        title: message,
        detail: null,
        output: null,
        durationMs: null,
        status: "failed",
      }).catch(() => {});

      await issueService.updateAgentLoopStatus(agentLoopId, "stopped")
        .catch(() => {});
    } finally {
      cleanup?.();
      this.#running.delete(agentLoopId);
    }
  };

  // ── Cleanup on shutdown ──────────────────────────────────────────

  [destroy] = async (): Promise<void> => {
    for (const [, entry] of this.#running) {
      entry.controller.abort();
    }
    this.#running.clear();
  };
}

export type { RunAgentInput };
export { AgentService };
