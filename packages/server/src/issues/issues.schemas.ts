import { z } from "zod";

import {
  issueStages,
  issuePriorities,
  timelineEntryKinds,
  timelineEntryStatuses,
  agentStepKinds,
  resourceKinds,
  healthStatuses,
  issueRelations,
  issueLinkTypes,
} from "./issues.types.js";

const createIssueSchema = z.object({
  fingerprint: z.string().min(1),
  source: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  stage: z.enum(issueStages).default("triage"),
  needsYou: z.boolean().default(false),
  priority: z.enum(issuePriorities).default("medium"),
  sourcePayload: z.string().nullable().default(null),
});

type CreateIssueInput = z.infer<typeof createIssueSchema>;

const updateIssueSchema = z.object({
  title: z.string().min(1).optional(),
  summary: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  stage: z.enum(issueStages).optional(),
  needsYou: z.boolean().optional(),
  priority: z.enum(issuePriorities).optional(),
  sourcePayload: z.string().nullable().optional(),
});

type UpdateIssueInput = z.infer<typeof updateIssueSchema>;

const createTimelineEntrySchema = z.object({
  issueId: z.string().uuid(),
  agentLoopId: z.string().uuid().nullable().default(null),
  kind: z.enum(timelineEntryKinds),
  status: z.enum(timelineEntryStatuses).default("info"),
  title: z.string().min(1),
  body: z.string().nullable().default(null),
  commandRun: z.string().nullable().default(null),
});

type CreateTimelineEntryInput = z.infer<typeof createTimelineEntrySchema>;

const createAgentLoopSchema = z.object({
  issueId: z.string().uuid(),
  title: z.string().min(1),
});

type CreateAgentLoopInput = z.infer<typeof createAgentLoopSchema>;

const createAgentStepSchema = z.object({
  agentLoopId: z.string().uuid(),
  kind: z.enum(agentStepKinds),
  title: z.string().min(1),
  status: z.string().nullable().default(null),
  detail: z.string().nullable().default(null),
  output: z.string().nullable().default(null),
  durationMs: z.number().int().nullable().default(null),
});

type CreateAgentStepInput = z.infer<typeof createAgentStepSchema>;

const createIssueResourceSchema = z.object({
  issueId: z.string().uuid(),
  kind: z.enum(resourceKinds),
  name: z.string().min(1),
  health: z.enum(healthStatuses).default("healthy"),
  detail: z.string().nullable().default(null),
});

type CreateIssueResourceInput = z.infer<typeof createIssueResourceSchema>;

const createIssueRelationSchema = z.object({
  sourceIssueId: z.string().uuid(),
  targetIssueId: z.string().uuid(),
  relation: z.enum(issueRelations),
});

type CreateIssueRelationInput = z.infer<typeof createIssueRelationSchema>;

const createApprovalSchema = z.object({
  issueId: z.string().uuid(),
  agentLoopId: z.string().uuid().nullable().default(null),
  title: z.string().min(1),
  reason: z.string().min(1),
});

type CreateApprovalInput = z.infer<typeof createApprovalSchema>;

const createIssueLinkSchema = z.object({
  issueId: z.string().uuid(),
  url: z.string().url(),
  linkType: z.enum(issueLinkTypes),
  title: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  repo: z.string().min(1),
});

type CreateIssueLinkInput = z.infer<typeof createIssueLinkSchema>;

export type {
  CreateIssueInput,
  UpdateIssueInput,
  CreateTimelineEntryInput,
  CreateAgentLoopInput,
  CreateAgentStepInput,
  CreateIssueResourceInput,
  CreateIssueRelationInput,
  CreateApprovalInput,
  CreateIssueLinkInput,
};
export {
  createIssueSchema,
  updateIssueSchema,
  createTimelineEntrySchema,
  createAgentLoopSchema,
  createAgentStepSchema,
  createIssueResourceSchema,
  createIssueRelationSchema,
  createApprovalSchema,
  createIssueLinkSchema,
};
