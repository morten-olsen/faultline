import { IssueService } from "../issues/issues.js";
import { AgentService } from "../agent/agent.js";
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

class OrchestratorService {
  #services: Services;
  #sweepTimer: ReturnType<typeof setInterval> | undefined;
  #unsubscribeIssue: (() => void) | undefined;
  #unsubscribeAgent: (() => void) | undefined;
  #stageChangeListener: ((issueId: string, from: string, to: string) => void) | undefined;

  constructor(services: Services) {
    this.#services = services;
  }

  // Allow external code to listen for stage changes (e.g. for WebSocket broadcasting)
  onStageChange = (fn: (issueId: string, from: string, to: string) => void): void => {
    this.#stageChangeListener = fn;
  };

  start = (): void => {
    const issueService = this.#services.get(IssueService);

    this.#unsubscribeIssue = issueService.onEvent((kind, issueId, meta) => {
      this.#onIssueEvent(kind, issueId, meta);
    });

    this.#unsubscribeAgent = this.#services.get(AgentService).onComplete((issueId, agentLoopId) => {
      this.#onAgentComplete(issueId, agentLoopId);
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
    this.#unsubscribeAgent?.();
  };

  [destroy] = (): void => {
    this.stop();
  };

  // ── Issue event handler ────────────────────────────────────────────

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

  // ── Agent completion handler ───────────────────────────────────────

  #onAgentComplete = (issueId: string, _agentLoopId: string): void => {
    // Check if monitoring is done
    const issueService = this.#services.get(IssueService);
    issueService.getById(issueId).then((issue) => {
      if (!issue) return;

      if (issue.stage === "monitoring" && issue.monitor_until) {
        const until = new Date(issue.monitor_until);
        if (new Date() >= until) {
          // Monitoring period is over — auto-resolve
          issueService.update(issueId, { stage: "resolved" }).catch(() => {});
          issueService.addTimelineEntry({
            issueId,
            agentLoopId: null,
            kind: "resolved",
            status: "success",
            title: "Monitoring complete — issue resolved",
            body: `All ${issue.monitor_checks_completed ?? 0} checks passed. Closing.`,
            commandRun: null,
          }).catch(() => {});
        }
      }
    }).catch(() => {});
  };

  // ── Sweep — periodic check ─────────────────────────────────────────

  #sweep = async (): Promise<void> => {
    const issueService = this.#services.get(IssueService);
    const agentService = this.#services.get(AgentService);

    const dueIssues = await issueService.getIssuesDueForMonitoring();

    for (const issue of dueIssues) {
      // Don't dispatch if an agent is already running for this issue
      if (agentService.isRunningForIssue(issue.id)) continue;

      await agentService.run({
        issueId: issue.id,
        prompt: `Run monitoring check for issue ${issue.id}`,
        systemPrompt: monitorPrompt({ issueId: issue.id }),
      });

      // Advance the check counter
      await issueService.advanceMonitorCheck(issue.id);
    }
  };

  // ── Dispatch for stage ─────────────────────────────────────────────

  #dispatchForStage = async (issueId: string, stage: string, context?: { rejectionReason?: string }): Promise<void> => {
    const agentService = this.#services.get(AgentService);

    // Guard: don't dispatch if an agent is already running for this issue
    if (agentService.isRunningForIssue(issueId)) return;

    const promptCtx = { issueId, rejectionReason: context?.rejectionReason };

    switch (stage) {
      case "triage":
        await agentService.run({
          issueId,
          prompt: `Triage issue ${issueId}`,
          systemPrompt: triagePrompt(promptCtx),
        });
        break;

      case "investigation":
        await agentService.run({
          issueId,
          prompt: `Investigate issue ${issueId}`,
          systemPrompt: investigationPrompt(promptCtx),
        });
        break;

      case "implementation":
        await agentService.run({
          issueId,
          prompt: `Execute remediation plan for issue ${issueId}`,
          systemPrompt: implementationPrompt(promptCtx),
        });
        break;
    }
  };

  // ── Approval resolution ────────────────────────────────────────────

  handleApprovalResolution = async (approval: Approval): Promise<void> => {
    const issueService = this.#services.get(IssueService);
    const issue = await issueService.getById(approval.issue_id);
    if (!issue) return;

    if (approval.status === "approved") {
      // Advance to implementation
      await issueService.update(approval.issue_id, {
        stage: "implementation",
        needsYou: false,
      });
      await issueService.addTimelineEntry({
        issueId: approval.issue_id,
        agentLoopId: null,
        kind: "user-action",
        status: "success",
        title: "Plan approved",
        body: null,
        commandRun: null,
      });
    } else if (approval.status === "denied") {
      // Send back to investigation with the rejection reason
      await issueService.update(approval.issue_id, {
        stage: "investigation",
        needsYou: false,
      });
      await issueService.addTimelineEntry({
        issueId: approval.issue_id,
        agentLoopId: null,
        kind: "user-action",
        status: "info",
        title: `Plan rejected${approval.decision_reason ? `: ${approval.decision_reason}` : ""}`,
        body: approval.decision_reason,
        commandRun: null,
      });

      // Dispatch re-investigation with the rejection reason
      setTimeout(() => {
        this.#dispatchForStage(approval.issue_id, "investigation", {
          rejectionReason: approval.decision_reason ?? undefined,
        }).catch(() => {});
      }, DISPATCH_DELAY_MS);
    }
  };
}

export { OrchestratorService };
