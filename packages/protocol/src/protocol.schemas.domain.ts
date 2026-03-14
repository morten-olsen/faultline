import { z } from 'zod';

import {
  issueStages,
  issuePriorities,
  timelineEntryKinds,
  timelineEntryStatuses,
  agentLoopStatuses,
  agentStepKinds,
  resourceKinds,
  healthStatuses,
  issueRelationTypes,
  approvalStatuses,
  issueLinkTypes,
} from './protocol.schemas.enums.js';

// --- Domain schemas ---

const issueSchema = z.object({
  id: z.string().uuid(),
  fingerprint: z.string(),
  source: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  description: z.string().nullable(),
  stage: z.enum(issueStages),
  needsYou: z.boolean(),
  priority: z.enum(issuePriorities),
  sourcePayload: z.string().nullable(),
  monitorPlan: z.string().nullable(),
  monitorIntervalMinutes: z.number().nullable(),
  monitorNextCheckAt: z.string().nullable(),
  monitorUntil: z.string().nullable(),
  monitorChecksCompleted: z.number().nullable(),
  resolvedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type Issue = z.infer<typeof issueSchema>;

const timelineEntrySchema = z.object({
  id: z.string().uuid(),
  issueId: z.string().uuid(),
  agentLoopId: z.string().uuid().nullable(),
  kind: z.enum(timelineEntryKinds),
  status: z.enum(timelineEntryStatuses),
  title: z.string(),
  body: z.string().nullable(),
  commandRun: z.string().nullable(),
  createdAt: z.string(),
});

type TimelineEntry = z.infer<typeof timelineEntrySchema>;

const agentLoopSchema = z.object({
  id: z.string().uuid(),
  issueId: z.string().uuid(),
  title: z.string(),
  status: z.enum(agentLoopStatuses),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
});

type AgentLoop = z.infer<typeof agentLoopSchema>;

const agentStepSchema = z.object({
  id: z.string().uuid(),
  agentLoopId: z.string().uuid(),
  kind: z.enum(agentStepKinds),
  title: z.string(),
  status: z.string().nullable(),
  detail: z.string().nullable(),
  output: z.string().nullable(),
  durationMs: z.number().nullable(),
  sequence: z.number(),
  createdAt: z.string(),
});

type AgentStep = z.infer<typeof agentStepSchema>;

const issueResourceSchema = z.object({
  id: z.string().uuid(),
  issueId: z.string().uuid(),
  kind: z.enum(resourceKinds),
  name: z.string(),
  health: z.enum(healthStatuses),
  detail: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type IssueResource = z.infer<typeof issueResourceSchema>;

const issueRelationSchema = z.object({
  id: z.string().uuid(),
  sourceIssueId: z.string().uuid(),
  targetIssueId: z.string().uuid(),
  relation: z.enum(issueRelationTypes),
  createdAt: z.string(),
});

type IssueRelation = z.infer<typeof issueRelationSchema>;

const approvalSchema = z.object({
  id: z.string().uuid(),
  issueId: z.string().uuid(),
  agentLoopId: z.string().uuid().nullable(),
  title: z.string(),
  reason: z.string(),
  status: z.enum(approvalStatuses),
  decisionReason: z.string().nullable(),
  decidedAt: z.string().nullable(),
  createdAt: z.string(),
});

type Approval = z.infer<typeof approvalSchema>;

const issueLinkSchema = z.object({
  id: z.string().uuid(),
  issueId: z.string().uuid(),
  url: z.string(),
  linkType: z.enum(issueLinkTypes),
  title: z.string().nullable(),
  description: z.string().nullable(),
  repo: z.string(),
  createdAt: z.string(),
});

type IssueLink = z.infer<typeof issueLinkSchema>;

// Note: SshIdentity intentionally omits private_key — it never leaves the server.
const sshIdentitySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  keyType: z.string(),
  publicKey: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type SshIdentity = z.infer<typeof sshIdentitySchema>;

const gitRepoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  cloneUrl: z.string(),
  description: z.string().nullable(),
  sshIdentityId: z.string().uuid().nullable(),
  defaultBranch: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type GitRepo = z.infer<typeof gitRepoSchema>;

const kubeContextSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  context: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type KubeContext = z.infer<typeof kubeContextSchema>;

const argocdInstanceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  serverUrl: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type ArgocdInstance = z.infer<typeof argocdInstanceSchema>;

const sshConnectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  host: z.string(),
  port: z.number(),
  username: z.string(),
  sshIdentityId: z.string().uuid().nullable(),
  description: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type SshConnection = z.infer<typeof sshConnectionSchema>;

const stageConfigSchema = z.object({
  id: z.string().uuid(),
  stage: z.string(),
  allowedKubeContexts: z.array(z.string()).nullable(),
  allowedSshConnections: z.array(z.string()).nullable(),
  allowedGitRepos: z.array(z.string()).nullable(),
  allowedArgocdInstances: z.array(z.string()).nullable(),
  sshIdentityId: z.string().uuid().nullable(),
  additionalSystemPrompt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type StageConfig = z.infer<typeof stageConfigSchema>;

export type {
  Issue,
  TimelineEntry,
  AgentLoop,
  AgentStep,
  IssueResource,
  IssueRelation,
  Approval,
  IssueLink,
  SshIdentity,
  GitRepo,
  KubeContext,
  ArgocdInstance,
  SshConnection,
  StageConfig,
};
export {
  issueSchema,
  timelineEntrySchema,
  agentLoopSchema,
  agentStepSchema,
  issueResourceSchema,
  issueRelationSchema,
  approvalSchema,
  issueLinkSchema,
  sshIdentitySchema,
  gitRepoSchema,
  kubeContextSchema,
  argocdInstanceSchema,
  sshConnectionSchema,
  stageConfigSchema,
};
