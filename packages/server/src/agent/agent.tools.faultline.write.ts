import { z } from 'zod';

import { IssueService, issueEventTypes, issueEventSchema, InvalidTransitionError } from '../issues/issues.js';

import { defineTool } from './agent.tools.js';
import type { Tool } from './agent.tools.js';

// ── Write-level Faultline tool definitions ───────────────────────────

const defineUpdateIssueTool = (issues: () => IssueService): Tool =>
  defineTool({
    name: 'update-issue',
    description: "Update an issue's priority, title, summary, or needsYou flag. Use transition-issue to change stage.",
    access: 'write',
    input: {
      issueId: z.string().uuid().describe('The issue ID'),
      title: z.string().optional().describe('New title'),
      summary: z.string().nullable().optional().describe('New summary'),
      description: z.string().nullable().optional().describe('New description'),
      priority: z.enum(['critical', 'high', 'medium', 'low']).optional().describe('New priority'),
      needsYou: z.boolean().optional().describe('Whether this issue needs human attention'),
    },
    output: z.object({
      updated: z.boolean(),
    }),
    execute: async (args) => {
      const { issueId, ...updates } = args;
      const result = await issues().update(issueId, updates);
      return { updated: result !== undefined };
    },
  });

const defineTransitionIssueTool = (issues: () => IssueService): Tool =>
  defineTool({
    name: 'transition-issue',
    description: [
      'Transition an issue to a new stage via a lifecycle event.',
      'Events and their required fields:',
      '  TRIAGE_COMPLETE — summary (string): the triage summary',
      '  PROPOSE_PLAN — plan (string): the remediation plan',
      '  PLAN_APPROVED — (no extra fields)',
      '  PLAN_DENIED — reason (optional string)',
      '  ENTER_MONITORING — monitorPlan (string), intervalMinutes (int), durationMinutes (int)',
      '  MONITORING_DONE — checksCompleted (optional int)',
      '  REGRESSION, SOURCE_RESOLVED, REOPEN, IGNORE — (no extra fields)',
    ].join('\n'),
    access: 'write',
    input: {
      issueId: z.string().uuid().describe('The issue ID'),
      event: z.enum(issueEventTypes).describe('The lifecycle event to apply'),
      summary: z.string().optional().describe('Triage summary (required for TRIAGE_COMPLETE)'),
      plan: z.string().optional().describe('Remediation plan (required for PROPOSE_PLAN)'),
      reason: z.string().optional().describe('Reason (used for PLAN_DENIED)'),
      monitorPlan: z.string().optional().describe('What to monitor (required for ENTER_MONITORING)'),
      intervalMinutes: z
        .number()
        .int()
        .optional()
        .describe('Check interval in minutes (required for ENTER_MONITORING)'),
      durationMinutes: z
        .number()
        .int()
        .optional()
        .describe('Total monitoring duration in minutes (required for ENTER_MONITORING)'),
      checksCompleted: z.number().int().optional().describe('Number of checks completed (used for MONITORING_DONE)'),
    },
    output: z.object({
      transitioned: z.boolean(),
      stage: z.string().optional(),
      error: z.string().optional(),
    }),
    execute: async (args) => {
      try {
        const { issueId, event: eventType, ...payload } = args;
        const parsed = issueEventSchema.parse({ type: eventType, ...payload });
        const result = await issues().transition(issueId, parsed);
        return { transitioned: true, stage: result?.stage };
      } catch (err) {
        if (err instanceof InvalidTransitionError) {
          return { transitioned: false, error: err.message };
        }
        if (err instanceof z.ZodError) {
          const messages = err.issues.map((i) => i.message).join('; ');
          return { transitioned: false, error: `Invalid event data: ${messages}` };
        }
        throw err;
      }
    },
  });

const defineAddTimelineEntryTool = (issues: () => IssueService): Tool =>
  defineTool({
    name: 'add-timeline-entry',
    description: 'Add a timeline entry to an issue to record an analysis finding, action taken, or outcome.',
    access: 'write',
    input: {
      issueId: z.string().uuid().describe('The issue ID'),
      kind: z
        .enum(['detected', 'analysis', 'action', 'outcome', 'regression', 'needs-you', 'user-action', 'resolved'])
        .describe('The type of timeline entry'),
      title: z.string().describe('Short summary of the entry'),
      body: z.string().nullable().optional().describe('Detailed body text'),
      status: z
        .enum(['pending', 'info', 'success', 'failed'])
        .optional()
        .describe("Status indicator (defaults to 'info')"),
      commandRun: z.string().nullable().optional().describe('Command that was run, if applicable'),
    },
    output: z.object({
      entryId: z.string(),
    }),
    execute: async (args) => {
      const entry = await issues().addTimelineEntry({
        issueId: args.issueId,
        agentLoopId: null,
        kind: args.kind,
        status: args.status ?? 'info',
        title: args.title,
        body: args.body ?? null,
        commandRun: args.commandRun ?? null,
      });
      return { entryId: entry.id };
    },
  });

const defineAddResourceTool = (issues: () => IssueService): Tool =>
  defineTool({
    name: 'add-resource',
    description: 'Associate an infrastructure resource (node, pod, deployment, etc.) with an issue.',
    access: 'write',
    input: {
      issueId: z.string().uuid().describe('The issue ID'),
      kind: z
        .enum([
          'node',
          'pod',
          'deployment',
          'ingress',
          'daemonset',
          'access-point',
          'switch',
          'nas',
          'volume',
          'service',
          'endpoint',
        ])
        .describe('Resource type'),
      name: z.string().describe("Resource name (e.g. 'worker-3', 'nginx-abc123')"),
      health: z.enum(['healthy', 'degraded', 'critical']).optional().describe("Health status (defaults to 'healthy')"),
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
        health: args.health ?? 'healthy',
        detail: args.detail ?? null,
      });
      return { resourceId: resource.id };
    },
  });

const defineRequestApprovalTool = (issues: () => IssueService): Tool =>
  defineTool({
    name: 'request-approval',
    description:
      'Request human approval before taking a potentially destructive action. The agent loop will be paused until the approval is resolved.',
    access: 'write',
    input: {
      issueId: z.string().uuid().describe('The issue ID'),
      agentLoopId: z.string().uuid().nullable().optional().describe('The agent loop requesting approval'),
      title: z.string().describe('What you want to do'),
      reason: z.string().describe('Why you need approval for this action'),
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
  });

const defineAddIssueLinkTool = (issues: () => IssueService): Tool =>
  defineTool({
    name: 'add-issue-link',
    description: 'Link a commit or pull request to an issue.',
    access: 'write',
    input: {
      issueId: z.string().uuid().describe('The issue ID'),
      url: z.string().url().describe('The URL of the commit or PR'),
      linkType: z.enum(['commit', 'pr']).describe('Whether this is a commit or PR link'),
      title: z.string().nullable().optional().describe('Link title'),
      description: z.string().nullable().optional().describe('Link description'),
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
  });

const defineSetMonitoringPlanTool = (issues: () => IssueService): Tool =>
  defineTool({
    name: 'set-monitoring-plan',
    description: 'Set a structured monitoring plan for an issue. Defines what to check, how often, and for how long.',
    access: 'write',
    input: {
      issueId: z.string().uuid().describe('The issue ID'),
      plan: z.string().describe("What to check (e.g. 'Memory on node-02 stays below 80%')"),
      intervalMinutes: z.number().int().min(1).describe('How often to check, in minutes'),
      durationMinutes: z.number().int().min(1).describe('Total monitoring duration, in minutes'),
    },
    output: z.object({
      set: z.boolean(),
    }),
    execute: async (args) => {
      await issues().setMonitoringPlan(args.issueId, {
        plan: args.plan,
        intervalMinutes: args.intervalMinutes,
        durationMinutes: args.durationMinutes,
      });
      return { set: true };
    },
  });

const defineAddRelationTool = (issues: () => IssueService): Tool =>
  defineTool({
    name: 'add-relation',
    description: 'Create a relation between two issues (caused-by, related-to, duplicate-of).',
    access: 'write',
    input: {
      sourceIssueId: z.string().uuid().describe('The source issue ID'),
      targetIssueId: z.string().uuid().describe('The target issue ID'),
      relation: z.enum(['caused-by', 'related-to', 'duplicate-of']).describe('Relation type'),
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
  });

const createWriteTools = (issues: () => IssueService): Tool[] => [
  defineUpdateIssueTool(issues),
  defineTransitionIssueTool(issues),
  defineAddTimelineEntryTool(issues),
  defineAddResourceTool(issues),
  defineRequestApprovalTool(issues),
  defineAddIssueLinkTool(issues),
  defineSetMonitoringPlanTool(issues),
  defineAddRelationTool(issues),
];

export { createWriteTools };
