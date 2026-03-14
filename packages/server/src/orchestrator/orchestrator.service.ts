import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { IssueService } from "../issues/issues.js";
import { AgentRunService } from "../agent-runs/agent-runs.js";
import { AgentService } from "../agent/agent.service.js";
import { ConfigService } from "../config/config.js";
import { buildAgentTaskConfig } from "./orchestrator.task-builder.js";
import { destroy } from "../services/services.js";
import {
  triagePrompt,
  investigationPrompt,
  implementationPrompt,
  monitorPrompt,
} from "./orchestrator.prompts.js";

import type { Services } from "../services/services.js";
import type { Approval } from "../issues/issues.js";

const SWEEP_INTERVAL_MS = 60_000;
const DISPATCH_DELAY_MS = 500;

type RunMapping = {
  issueId: string;
  agentLoopId: string;
  cleanup?: () => void;
};

type RunForIssueInput = {
  issueId: string;
  prompt: string;
  systemPrompt?: string;
  cwd?: string;
};

class OrchestratorService {
  #services: Services;
  #sweepTimer: ReturnType<typeof setInterval> | undefined;
  #unsubscribeIssue: (() => void) | undefined;
  #unsubscribeAgentStep: (() => void) | undefined;
  #unsubscribeAgentResult: (() => void) | undefined;
  #unsubscribeAgentError: (() => void) | undefined;
  #unsubscribeAgentDone: (() => void) | undefined;
  #stageChangeListener: ((issueId: string, from: string, to: string) => void) | undefined;
  #runMappings: Map<string, RunMapping>;

  constructor(services: Services) {
    this.#services = services;
    this.#runMappings = new Map();
  }

  // Allow external code to listen for stage changes (e.g. for WebSocket broadcasting)
  onStageChange = (fn: (issueId: string, from: string, to: string) => void): void => {
    this.#stageChangeListener = fn;
  };

  start = (): void => {
    const issueService = this.#services.get(IssueService);
    const agentService = this.#services.get(AgentService);

    this.#unsubscribeIssue = issueService.onEvent((kind, issueId, meta) => {
      this.#onIssueEvent(kind, issueId, meta);
    });

    // Subscribe to agent service events for DB persistence
    this.#unsubscribeAgentStep = agentService.on("step", (runId, _correlationId, event) => {
      const mapping = this.#runMappings.get(runId);
      if (!mapping) return;

      const agentRunService = this.#services.get(AgentRunService);
      agentRunService.addAgentStep({
        agentLoopId: mapping.agentLoopId,
        kind: event.kind,
        title: event.title,
        detail: event.detail ?? null,
        output: event.output ?? null,
        durationMs: event.durationMs ?? null,
        status: event.status ?? null,
      }).catch(() => {});
    });

    this.#unsubscribeAgentResult = agentService.on("result", (runId, _correlationId, event) => {
      const mapping = this.#runMappings.get(runId);
      if (!mapping) return;

      this.#services.get(IssueService).addTimelineEntry({
        issueId: mapping.issueId,
        agentLoopId: mapping.agentLoopId,
        kind: "outcome",
        status: "success",
        title: event.text.length > 120
          ? event.text.slice(0, 117) + "..."
          : event.text,
        body: event.text,
        commandRun: null,
      }).catch(() => {});
    });

    this.#unsubscribeAgentError = agentService.on("error", (runId, _correlationId, event) => {
      const mapping = this.#runMappings.get(runId);
      if (!mapping) return;

      const agentRunService = this.#services.get(AgentRunService);
      agentRunService.addAgentStep({
        agentLoopId: mapping.agentLoopId,
        kind: "error",
        title: event.message,
        detail: null,
        output: null,
        durationMs: null,
        status: "failed",
      }).catch(() => {});
    });

    this.#unsubscribeAgentDone = agentService.on("done", (runId, _correlationId) => {
      const mapping = this.#runMappings.get(runId);
      if (!mapping) return;

      this.#services.get(AgentRunService).updateAgentLoopStatus(mapping.agentLoopId, "complete").catch(() => {});

      // Run cleanup (e.g. temp SSH key files)
      mapping.cleanup?.();

      // Trigger post-completion logic
      this.#onAgentComplete(mapping.issueId, mapping.agentLoopId);

      this.#runMappings.delete(runId);
    });

    this.#sweepTimer = setInterval(() => {
      this.#sweep().catch(() => {});
    }, SWEEP_INTERVAL_MS);
  };

  stop = (): void => {
    if (this.#sweepTimer) {
      clearInterval(this.#sweepTimer);
      this.#sweepTimer = undefined;
    }
    this.#unsubscribeIssue?.();
    this.#unsubscribeAgentStep?.();
    this.#unsubscribeAgentResult?.();
    this.#unsubscribeAgentError?.();
    this.#unsubscribeAgentDone?.();
  };

  [destroy] = (): void => {
    this.stop();
  };

  // ── Public: run agent for an issue ──────────────────────────────

  runForIssue = async (input: RunForIssueInput): Promise<string> => {
    return this.#assembleAndRun(input);
  };

  // ── Public: stop by agent loop ID ───────────────────────────────

  stopByAgentLoopId = async (agentLoopId: string): Promise<void> => {
    // Find the run ID for this agent loop
    for (const [runId, mapping] of this.#runMappings) {
      if (mapping.agentLoopId === agentLoopId) {
        this.#services.get(AgentService).stop(runId);
        await this.#services.get(AgentRunService).updateAgentLoopStatus(agentLoopId, "stopped");
        mapping.cleanup?.();
        this.#runMappings.delete(runId);
        return;
      }
    }
  };

  // ── Public: check if agent is running for issue ─────────────────

  isRunningForIssue = (issueId: string): boolean => {
    for (const [, mapping] of this.#runMappings) {
      if (mapping.issueId === issueId) return true;
    }
    return false;
  };

  // ── Approval resolution ─────────────────────────────────────────

  handleApprovalResolution = async (approval: Approval): Promise<void> => {
    const issueService = this.#services.get(IssueService);
    const issue = await issueService.getById(approval.issue_id);
    if (!issue) return;

    if (approval.status === "approved") {
      await issueService.transition(approval.issue_id, { type: "PLAN_APPROVED" });
    } else if (approval.status === "denied") {
      // Transition back to investigation — the stage-changed event
      // will trigger #onIssueEvent which dispatches the agent.
      // The rejection reason is recorded in the timeline by the machine effect,
      // so the investigation agent discovers it via get-timeline.
      await issueService.transition(approval.issue_id, {
        type: "PLAN_DENIED",
        reason: approval.decision_reason ?? undefined,
      });
    }
  };

  // ── Private: assemble task and run agent ─────────────────────────

  #assembleAndRun = async (input: RunForIssueInput): Promise<string> => {
    const issueService = this.#services.get(IssueService);

    const issue = await issueService.getById(input.issueId);
    if (!issue) {
      throw new Error(`Issue ${input.issueId} not found`);
    }

    if (issue.stage === "ignored") {
      throw new Error(`Cannot run agent on ignored issue ${input.issueId}`);
    }

    const agentRunService = this.#services.get(AgentRunService);
    const loop = await agentRunService.createAgentLoop({
      title: input.prompt.length > 120
        ? input.prompt.slice(0, 117) + "..."
        : input.prompt,
    });
    await agentRunService.linkToIssue(input.issueId, loop.id);

    await issueService.addTimelineEntry({
      issueId: input.issueId,
      agentLoopId: loop.id,
      kind: "analysis",
      status: "pending",
      title: "Agent investigating",
      body: null,
      commandRun: null,
    });

    const taskConfig = await buildAgentTaskConfig(
      this.#services,
      issue.stage,
      input.systemPrompt,
    );

    // Create an isolated workspace for this agent run
    const cwd = input.cwd ?? this.#workspacePath(input.issueId, loop.id);
    mkdirSync(cwd, { recursive: true });

    const agentService = this.#services.get(AgentService);
    const run = agentService.run({
      correlationId: input.issueId,
      prompt: input.prompt,
      systemPrompt: taskConfig.systemPrompt,
      builtinTools: taskConfig.builtinTools,
      customTools: taskConfig.customTools,
      cwd,
    });

    this.#runMappings.set(run.id, {
      issueId: input.issueId,
      agentLoopId: loop.id,
      cleanup: taskConfig.cleanup,
    });

    return loop.id;
  };

  // ── Issue event handler ─────────────────────────────────────────

  #onIssueEvent = (kind: string, issueId: string, meta?: Record<string, string>): void => {
    if (kind === "created") {
      // New issue at triage — dispatch triage agent after a short delay
      setTimeout(() => {
        this.#dispatchForStage(issueId, "triage").catch(() => {});
      }, DISPATCH_DELAY_MS);
    }

    if (kind === "stage-changed" && meta?.from && meta?.to) {
      const from = meta.from;
      const to = meta.to;

      // Notify external listeners (WebSocket broadcasting)
      this.#stageChangeListener?.(issueId, from, to);

      if (to === "investigation") {
        setTimeout(() => {
          this.#dispatchForStage(issueId, "investigation").catch(() => {});
        }, DISPATCH_DELAY_MS);
      }

      if (to === "implementation") {
        setTimeout(() => {
          this.#dispatchForStage(issueId, "implementation").catch(() => {});
        }, DISPATCH_DELAY_MS);
      }

      // monitoring, resolved, ignored — no immediate dispatch needed
    }
  };

  // ── Agent completion handler ────────────────────────────────────

  #onAgentComplete = (issueId: string, _agentLoopId: string): void => {
    const issueService = this.#services.get(IssueService);
    issueService.getById(issueId).then((issue) => {
      if (!issue) return;

      if (issue.stage === "monitoring" && issue.monitor_until) {
        const until = new Date(issue.monitor_until);
        if (new Date() >= until) {
          issueService.transition(issueId, {
            type: "MONITORING_DONE",
            checksCompleted: issue.monitor_checks_completed ?? 0,
          }).catch(() => {});
        }
      }
    }).catch(() => {});
  };

  // ── Sweep — periodic check ──────────────────────────────────────

  #sweep = async (): Promise<void> => {
    const issueService = this.#services.get(IssueService);

    const dueIssues = await issueService.getIssuesDueForMonitoring();

    for (const issue of dueIssues) {
      // Don't dispatch if an agent is already running for this issue
      if (this.isRunningForIssue(issue.id)) continue;

      await this.#assembleAndRun({
        issueId: issue.id,
        prompt: `Run monitoring check for issue ${issue.id}`,
        systemPrompt: monitorPrompt({ issueId: issue.id }),
      });

      // Advance the check counter
      await issueService.advanceMonitorCheck(issue.id);
    }
  };

  // ── Workspace path ─────────────────────────────────────────────

  #workspacePath = (issueId: string, loopId: string): string => {
    const workspacesDir = this.#services.get(ConfigService).workspacesDir;
    return join(workspacesDir, issueId, loopId);
  };

  // ── Dispatch for stage ──────────────────────────────────────────

  #dispatchForStage = async (issueId: string, stage: string): Promise<void> => {
    // Guard: don't dispatch if an agent is already running for this issue
    if (this.isRunningForIssue(issueId)) return;

    const promptCtx = { issueId };

    switch (stage) {
      case "triage":
        await this.#assembleAndRun({
          issueId,
          prompt: `Triage issue ${issueId}`,
          systemPrompt: triagePrompt(promptCtx),
        });
        break;

      case "investigation":
        await this.#assembleAndRun({
          issueId,
          prompt: `Investigate issue ${issueId}`,
          systemPrompt: investigationPrompt(promptCtx),
        });
        break;

      case "implementation":
        await this.#assembleAndRun({
          issueId,
          prompt: `Execute remediation plan for issue ${issueId}`,
          systemPrompt: implementationPrompt(promptCtx),
        });
        break;
    }
  };
}

export type { RunForIssueInput };
export { OrchestratorService };
