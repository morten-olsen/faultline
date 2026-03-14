import { z } from 'zod';

import type { IssueService } from '../issues/issues.js';

import { defineTool } from './agent.tools.js';
import type { Tool } from './agent.tools.js';

// ── Read-level Faultline tool definitions ────────────────────────────

const defineGetIssueTool = (issues: () => IssueService): Tool =>
  defineTool({
    name: 'get-issue',
    description: 'Get an issue by ID, including its current stage, priority, and summary.',
    access: 'read',
    input: {
      issueId: z.string().uuid().describe('The issue ID'),
    },
    output: z.object({
      issue: z
        .object({
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
        })
        .nullable(),
    }),
    execute: async (args) => {
      const row = await issues().getById(args.issueId);
      if (!row) {
        return { issue: null };
      }
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
  });

const defineListIssuesTool = (issues: () => IssueService): Tool =>
  defineTool({
    name: 'list-issues',
    description: 'List issues, optionally filtered by stage or source.',
    access: 'read',
    input: {
      stage: z.string().optional().describe('Filter by issue stage'),
      source: z.string().optional().describe("Filter by source (e.g. 'alertmanager')"),
    },
    output: z.object({
      issues: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          stage: z.string(),
          priority: z.string(),
          needsYou: z.boolean(),
          createdAt: z.string(),
        }),
      ),
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
  });

const defineGetTimelineTool = (issues: () => IssueService): Tool =>
  defineTool({
    name: 'get-timeline',
    description: 'Get the timeline entries for an issue, ordered newest-first.',
    access: 'read',
    input: {
      issueId: z.string().uuid().describe('The issue ID'),
    },
    output: z.object({
      entries: z.array(
        z.object({
          id: z.string(),
          kind: z.string(),
          status: z.string(),
          title: z.string(),
          body: z.string().nullable(),
          commandRun: z.string().nullable(),
          createdAt: z.string(),
        }),
      ),
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
  });

const defineGetResourcesTool = (issues: () => IssueService): Tool =>
  defineTool({
    name: 'get-resources',
    description: 'Get infrastructure resources associated with an issue.',
    access: 'read',
    input: {
      issueId: z.string().uuid().describe('The issue ID'),
    },
    output: z.object({
      resources: z.array(
        z.object({
          id: z.string(),
          kind: z.string(),
          name: z.string(),
          health: z.string(),
          detail: z.string().nullable(),
        }),
      ),
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
  });

const defineGetRelatedIssuesTool = (issues: () => IssueService): Tool =>
  defineTool({
    name: 'get-related-issues',
    description: 'Get issues related to this one (caused-by, related-to, duplicate-of).',
    access: 'read',
    input: {
      issueId: z.string().uuid().describe('The issue ID'),
    },
    output: z.object({
      relations: z.array(
        z.object({
          id: z.string(),
          sourceIssueId: z.string(),
          targetIssueId: z.string(),
          relation: z.string(),
        }),
      ),
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
  });

const createReadTools = (issues: () => IssueService): Tool[] => [
  defineGetIssueTool(issues),
  defineListIssuesTool(issues),
  defineGetTimelineTool(issues),
  defineGetResourcesTool(issues),
  defineGetRelatedIssuesTool(issues),
];

export { createReadTools };
