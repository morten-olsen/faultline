import { z } from "zod";

import { IssueService } from "../issues/issues.js";
import { defineTool } from "./agent.tools.js";

import type { Services } from "../services/services.js";
import type { Tool } from "./agent.tools.js";

// ── Factory ─────────────────────────────────────────────────────────
// All Faultline tools need the service container, so we create them
// via a factory that closes over `services`.

const createFaultlineTools = (services: Services): Tool[] => {
  const issues = (): IssueService => services.get(IssueService);

  return [
    // ── Read-level tools ──────────────────────────────────────────

    defineTool({
      name: "get-issue",
      description: "Get an issue by ID, including its current stage, priority, and summary.",
      access: "read",
      input: {
        issueId: z.string().uuid().describe("The issue ID"),
      },
      output: z.object({
        issue: z.object({
          id: z.string(),
          title: z.string(),
          summary: z.string().nullable(),
          description: z.string().nullable(),
          stage: z.string(),
          priority: z.string(),
          needsYou: z.boolean(),
          source: z.string(),
          sourcePayload: z.string().nullable(),
          createdAt: z.string(),
          updatedAt: z.string(),
        }).nullable(),
      }),
      execute: async (args) => {
        const row = await issues().getById(args.issueId);
        if (!row) return { issue: null };
        return {
          issue: {
            id: row.id,
            title: row.title,
            summary: row.summary,
            description: row.description,
            stage: row.stage,
            priority: row.priority,
            needsYou: row.needs_you === 1,
            source: row.source,
            sourcePayload: row.source_payload,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          },
        };
      },
    }),

    defineTool({
      name: "list-issues",
      description: "List issues, optionally filtered by stage or source.",
      access: "read",
      input: {
        stage: z.string().optional().describe("Filter by issue stage"),
        source: z.string().optional().describe("Filter by source (e.g. 'alertmanager')"),
      },
      output: z.object({
        issues: z.array(z.object({
          id: z.string(),
          title: z.string(),
          stage: z.string(),
          priority: z.string(),
          needsYou: z.boolean(),
          createdAt: z.string(),
        })),
      }),
      execute: async (args) => {
        const rows = await issues().list({ stage: args.stage, source: args.source });
        return {
          issues: rows.map((r) => ({
            id: r.id,
            title: r.title,
            stage: r.stage,
            priority: r.priority,
            needsYou: r.needs_you === 1,
            createdAt: r.created_at,
          })),
        };
      },
    }),

    defineTool({
      name: "get-timeline",
      description: "Get the timeline entries for an issue, ordered newest-first.",
      access: "read",
      input: {
        issueId: z.string().uuid().describe("The issue ID"),
      },
      output: z.object({
        entries: z.array(z.object({
          id: z.string(),
          kind: z.string(),
          status: z.string(),
          title: z.string(),
          body: z.string().nullable(),
          commandRun: z.string().nullable(),
          createdAt: z.string(),
        })),
      }),
      execute: async (args) => {
        const rows = await issues().getTimelineEntries(args.issueId);
        return {
          entries: rows.map((r) => ({
            id: r.id,
            kind: r.kind,
            status: r.status,
            title: r.title,
            body: r.body,
            commandRun: r.command_run,
            createdAt: r.created_at,
          })),
        };
      },
    }),

    defineTool({
      name: "get-resources",
      description: "Get infrastructure resources associated with an issue.",
      access: "read",
      input: {
        issueId: z.string().uuid().describe("The issue ID"),
      },
      output: z.object({
        resources: z.array(z.object({
          id: z.string(),
          kind: z.string(),
          name: z.string(),
          health: z.string(),
          detail: z.string().nullable(),
        })),
      }),
      execute: async (args) => {
        const rows = await issues().getResources(args.issueId);
        return {
          resources: rows.map((r) => ({
            id: r.id,
            kind: r.kind,
            name: r.name,
            health: r.health,
            detail: r.detail,
          })),
        };
      },
    }),

    defineTool({
      name: "get-related-issues",
      description: "Get issues related to this one (caused-by, related-to, duplicate-of).",
      access: "read",
      input: {
        issueId: z.string().uuid().describe("The issue ID"),
      },
      output: z.object({
        relations: z.array(z.object({
          id: z.string(),
          sourceIssueId: z.string(),
          targetIssueId: z.string(),
          relation: z.string(),
        })),
      }),
      execute: async (args) => {
        const rows = await issues().getRelations(args.issueId);
        return {
          relations: rows.map((r) => ({
            id: r.id,
            sourceIssueId: r.source_issue_id,
            targetIssueId: r.target_issue_id,
            relation: r.relation,
          })),
        };
      },
    }),

    // ── Write-level tools ─────────────────────────────────────────

    defineTool({
      name: "update-issue",
      description: "Update an issue's stage, priority, title, summary, or needsYou flag.",
      access: "write",
      input: {
        issueId: z.string().uuid().describe("The issue ID"),
        title: z.string().optional().describe("New title"),
        summary: z.string().nullable().optional().describe("New summary"),
        description: z.string().nullable().optional().describe("New description"),
        stage: z.enum(["triage", "investigation", "proposed-plan", "implementation", "monitoring", "resolved"]).optional()
          .describe("New stage"),
        priority: z.enum(["critical", "high", "medium", "low"]).optional()
          .describe("New priority"),
        needsYou: z.boolean().optional().describe("Whether this issue needs human attention"),
      },
      output: z.object({
        updated: z.boolean(),
      }),
      execute: async (args) => {
        const { issueId, ...updates } = args;
        const result = await issues().update(issueId, updates);
        return { updated: result !== undefined };
      },
    }),

    defineTool({
      name: "add-timeline-entry",
      description: "Add a timeline entry to an issue to record an analysis finding, action taken, or outcome.",
      access: "write",
      input: {
        issueId: z.string().uuid().describe("The issue ID"),
        kind: z.enum(["detected", "analysis", "action", "outcome", "regression", "needs-you", "resolved"])
          .describe("The type of timeline entry"),
        title: z.string().describe("Short summary of the entry"),
        body: z.string().nullable().optional().describe("Detailed body text"),
        status: z.enum(["pending", "info", "success", "failed"]).optional()
          .describe("Status indicator (defaults to 'info')"),
        commandRun: z.string().nullable().optional().describe("Command that was run, if applicable"),
      },
      output: z.object({
        entryId: z.string(),
      }),
      execute: async (args) => {
        const entry = await issues().addTimelineEntry({
          issueId: args.issueId,
          agentLoopId: null,
          kind: args.kind,
          status: args.status ?? "info",
          title: args.title,
          body: args.body ?? null,
          commandRun: args.commandRun ?? null,
        });
        return { entryId: entry.id };
      },
    }),

    defineTool({
      name: "add-resource",
      description: "Associate an infrastructure resource (node, pod, deployment, etc.) with an issue.",
      access: "write",
      input: {
        issueId: z.string().uuid().describe("The issue ID"),
        kind: z.enum([
          "node", "pod", "deployment", "ingress", "daemonset",
          "access-point", "switch", "nas", "volume", "service", "endpoint",
        ]).describe("Resource type"),
        name: z.string().describe("Resource name (e.g. 'worker-3', 'nginx-abc123')"),
        health: z.enum(["healthy", "degraded", "critical"]).optional()
          .describe("Health status (defaults to 'healthy')"),
        detail: z.string().nullable().optional().describe("Extra detail about the resource's state"),
      },
      output: z.object({
        resourceId: z.string(),
      }),
      execute: async (args) => {
        const resource = await issues().addResource({
          issueId: args.issueId,
          kind: args.kind,
          name: args.name,
          health: args.health ?? "healthy",
          detail: args.detail ?? null,
        });
        return { resourceId: resource.id };
      },
    }),

    defineTool({
      name: "request-approval",
      description: "Request human approval before taking a potentially destructive action. The agent loop will be paused until the approval is resolved.",
      access: "write",
      input: {
        issueId: z.string().uuid().describe("The issue ID"),
        agentLoopId: z.string().uuid().nullable().optional().describe("The agent loop requesting approval"),
        title: z.string().describe("What you want to do"),
        reason: z.string().describe("Why you need approval for this action"),
      },
      output: z.object({
        approvalId: z.string(),
        status: z.string(),
      }),
      execute: async (args) => {
        const approval = await issues().createApproval({
          issueId: args.issueId,
          agentLoopId: args.agentLoopId ?? null,
          title: args.title,
          reason: args.reason,
        });
        return { approvalId: approval.id, status: approval.status };
      },
    }),

    defineTool({
      name: "add-issue-link",
      description: "Link a commit or pull request to an issue.",
      access: "write",
      input: {
        issueId: z.string().uuid().describe("The issue ID"),
        url: z.string().url().describe("The URL of the commit or PR"),
        linkType: z.enum(["commit", "pr"]).describe("Whether this is a commit or PR link"),
        title: z.string().nullable().optional().describe("Link title"),
        description: z.string().nullable().optional().describe("Link description"),
        repo: z.string().describe("Repository name (e.g. 'org/repo')"),
      },
      output: z.object({
        linkId: z.string(),
      }),
      execute: async (args) => {
        const link = await issues().addLink({
          issueId: args.issueId,
          url: args.url,
          linkType: args.linkType,
          title: args.title ?? null,
          description: args.description ?? null,
          repo: args.repo,
        });
        return { linkId: link.id };
      },
    }),

    defineTool({
      name: "add-relation",
      description: "Create a relation between two issues (caused-by, related-to, duplicate-of).",
      access: "write",
      input: {
        sourceIssueId: z.string().uuid().describe("The source issue ID"),
        targetIssueId: z.string().uuid().describe("The target issue ID"),
        relation: z.enum(["caused-by", "related-to", "duplicate-of"]).describe("Relation type"),
      },
      output: z.object({
        relationId: z.string(),
      }),
      execute: async (args) => {
        const relation = await issues().addRelation({
          sourceIssueId: args.sourceIssueId,
          targetIssueId: args.targetIssueId,
          relation: args.relation,
        });
        return { relationId: relation.id };
      },
    }),
  ];
};

export { createFaultlineTools };
