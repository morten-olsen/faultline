import { z } from "zod";

// --- Wire message envelopes ---

const callMessageSchema = z.object({
  type: z.literal("call"),
  id: z.string(),
  method: z.string(),
  params: z.unknown(),
});

type CallMessage = z.infer<typeof callMessageSchema>;

const responseMessageSchema = z.object({
  type: z.literal("response"),
  id: z.string(),
  result: z.unknown(),
});

type ResponseMessage = z.infer<typeof responseMessageSchema>;

const errorMessageSchema = z.object({
  type: z.literal("error"),
  id: z.string(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

type ErrorMessage = z.infer<typeof errorMessageSchema>;

const eventMessageSchema = z.object({
  type: z.literal("event"),
  event: z.string(),
  payload: z.unknown(),
});

type EventMessage = z.infer<typeof eventMessageSchema>;

const messageSchema = z.discriminatedUnion("type", [
  callMessageSchema,
  responseMessageSchema,
  errorMessageSchema,
  eventMessageSchema,
]);

type Message = z.infer<typeof messageSchema>;

// --- Shared domain enums ---

const issueStages = [
  "triage",
  "investigation",
  "proposed-plan",
  "implementation",
  "monitoring",
  "resolved",
  "ignored",
] as const;

const issuePriorities = ["critical", "high", "medium", "low"] as const;

const timelineEntryKinds = [
  "detected",
  "analysis",
  "action",
  "outcome",
  "regression",
  "needs-you",
  "user-action",
  "resolved",
] as const;

const timelineEntryStatuses = ["pending", "info", "success", "failed"] as const;

const agentLoopStatuses = ["running", "complete", "waiting", "stopped"] as const;

const agentStepKinds = ["thinking", "tool-call", "message", "error"] as const;

const resourceKinds = [
  "node",
  "pod",
  "deployment",
  "ingress",
  "daemonset",
  "access-point",
  "switch",
  "nas",
  "volume",
  "service",
  "endpoint",
] as const;

const healthStatuses = ["healthy", "degraded", "critical"] as const;

const issueRelationTypes = ["caused-by", "related-to", "duplicate-of"] as const;

const approvalStatuses = ["pending", "approved", "denied"] as const;

const issueLinkTypes = ["commit", "pr"] as const;

const sshIdentitySources = ["generate", "import"] as const;

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

// --- Protocol definition ---

const protocol = {
  calls: {
    ping: {
      input: z.object({}),
      output: z.object({ pong: z.literal(true) }),
    },

    // Issues
    "issues.list": {
      input: z.object({
        stage: z.enum(issueStages).optional(),
        source: z.string().optional(),
      }),
      output: z.object({ issues: z.array(issueSchema) }),
    },
    "issues.get": {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ issue: issueSchema.nullable() }),
    },
    "issues.create": {
      input: z.object({
        fingerprint: z.string().min(1),
        source: z.string().min(1),
        title: z.string().min(1),
        summary: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        stage: z.enum(issueStages).optional(),
        needsYou: z.boolean().optional(),
        priority: z.enum(issuePriorities).optional(),
        sourcePayload: z.string().nullable().optional(),
      }),
      output: z.object({ issue: issueSchema }),
    },
    "issues.update": {
      input: z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        summary: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        stage: z.enum(issueStages).optional(),
        needsYou: z.boolean().optional(),
        priority: z.enum(issuePriorities).optional(),
        sourcePayload: z.string().nullable().optional(),
      }),
      output: z.object({ issue: issueSchema.nullable() }),
    },

    // Timeline
    "timeline.list": {
      input: z.object({ issueId: z.string().uuid() }),
      output: z.object({ entries: z.array(timelineEntrySchema) }),
    },
    "timeline.add": {
      input: z.object({
        issueId: z.string().uuid(),
        agentLoopId: z.string().uuid().nullable().optional(),
        kind: z.enum(timelineEntryKinds),
        status: z.enum(timelineEntryStatuses).optional(),
        title: z.string().min(1),
        body: z.string().nullable().optional(),
        commandRun: z.string().nullable().optional(),
      }),
      output: z.object({ entry: timelineEntrySchema }),
    },

    // Agent loops
    "agentLoops.list": {
      input: z.object({ issueId: z.string().uuid() }),
      output: z.object({ loops: z.array(agentLoopSchema) }),
    },
    "agentLoops.get": {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ loop: agentLoopSchema.nullable() }),
    },
    "agentLoops.create": {
      input: z.object({
        issueId: z.string().uuid(),
        title: z.string().min(1),
      }),
      output: z.object({ loop: agentLoopSchema }),
    },
    "agentLoops.updateStatus": {
      input: z.object({
        id: z.string().uuid(),
        status: z.enum(agentLoopStatuses),
      }),
      output: z.object({ loop: agentLoopSchema.nullable() }),
    },

    // Agent steps
    "agentSteps.list": {
      input: z.object({ agentLoopId: z.string().uuid() }),
      output: z.object({ steps: z.array(agentStepSchema) }),
    },
    "agentSteps.add": {
      input: z.object({
        agentLoopId: z.string().uuid(),
        kind: z.enum(agentStepKinds),
        title: z.string().min(1),
        status: z.string().nullable().optional(),
        detail: z.string().nullable().optional(),
        output: z.string().nullable().optional(),
        durationMs: z.number().int().nullable().optional(),
      }),
      output: z.object({ step: agentStepSchema }),
    },

    // Resources
    "resources.list": {
      input: z.object({ issueId: z.string().uuid() }),
      output: z.object({ resources: z.array(issueResourceSchema) }),
    },
    "resources.add": {
      input: z.object({
        issueId: z.string().uuid(),
        kind: z.enum(resourceKinds),
        name: z.string().min(1),
        health: z.enum(healthStatuses).optional(),
        detail: z.string().nullable().optional(),
      }),
      output: z.object({ resource: issueResourceSchema }),
    },

    // Relations
    "relations.list": {
      input: z.object({ issueId: z.string().uuid() }),
      output: z.object({ relations: z.array(issueRelationSchema) }),
    },
    "relations.add": {
      input: z.object({
        sourceIssueId: z.string().uuid(),
        targetIssueId: z.string().uuid(),
        relation: z.enum(issueRelationTypes),
      }),
      output: z.object({ relation: issueRelationSchema }),
    },

    // Approvals
    "approvals.list": {
      input: z.object({ issueId: z.string().uuid() }),
      output: z.object({ approvals: z.array(approvalSchema) }),
    },
    "approvals.create": {
      input: z.object({
        issueId: z.string().uuid(),
        agentLoopId: z.string().uuid().nullable().optional(),
        title: z.string().min(1),
        reason: z.string().min(1),
      }),
      output: z.object({ approval: approvalSchema }),
    },
    "approvals.resolve": {
      input: z.object({
        id: z.string().uuid(),
        decision: z.enum(["approved", "denied"]),
        reason: z.string().optional(),
      }),
      output: z.object({ approval: approvalSchema.nullable() }),
    },

    // Agent
    "agent.run": {
      input: z.object({
        issueId: z.string().uuid(),
        prompt: z.string().min(1),
        systemPrompt: z.string().optional(),
        allowedTools: z.array(z.string()).optional(),
        cwd: z.string().optional(),
      }),
      output: z.object({ agentLoopId: z.string().uuid() }),
    },
    "agent.stop": {
      input: z.object({ agentLoopId: z.string().uuid() }),
      output: z.object({ stopped: z.boolean() }),
    },

    // Links
    "issues.addLink": {
      input: z.object({
        issueId: z.string().uuid(),
        url: z.string().url(),
        linkType: z.enum(issueLinkTypes),
        title: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        repo: z.string().min(1),
      }),
      output: z.object({ link: issueLinkSchema }),
    },

    // SSH Identities
    "sshIdentities.list": {
      input: z.object({}),
      output: z.object({ identities: z.array(sshIdentitySchema) }),
    },
    "sshIdentities.get": {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ identity: sshIdentitySchema.nullable() }),
    },
    "sshIdentities.create": {
      input: z.object({
        name: z.string().min(1),
        source: z.enum(sshIdentitySources),
        privateKey: z.string().optional(),
      }),
      output: z.object({ identity: sshIdentitySchema }),
    },
    "sshIdentities.update": {
      input: z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
      }),
      output: z.object({ identity: sshIdentitySchema.nullable() }),
    },
    "sshIdentities.delete": {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ deleted: z.boolean() }),
    },

    // Git Repositories
    "gitRepos.list": {
      input: z.object({}),
      output: z.object({ repos: z.array(gitRepoSchema) }),
    },
    "gitRepos.get": {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ repo: gitRepoSchema.nullable() }),
    },
    "gitRepos.create": {
      input: z.object({
        name: z.string().min(1),
        cloneUrl: z.string().min(1),
        description: z.string().nullable().optional(),
        sshIdentityId: z.string().uuid().nullable().optional(),
        defaultBranch: z.string().optional(),
      }),
      output: z.object({ repo: gitRepoSchema }),
    },
    "gitRepos.update": {
      input: z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        cloneUrl: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        sshIdentityId: z.string().uuid().nullable().optional(),
        defaultBranch: z.string().optional(),
      }),
      output: z.object({ repo: gitRepoSchema.nullable() }),
    },
    "gitRepos.delete": {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ deleted: z.boolean() }),
    },

    // Kubernetes Contexts
    "kubeContexts.list": {
      input: z.object({}),
      output: z.object({ contexts: z.array(kubeContextSchema) }),
    },
    "kubeContexts.get": {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ context: kubeContextSchema.nullable() }),
    },
    "kubeContexts.create": {
      input: z.object({
        name: z.string().min(1),
        context: z.string().min(1),
        description: z.string().nullable().optional(),
      }),
      output: z.object({ context: kubeContextSchema }),
    },
    "kubeContexts.update": {
      input: z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        context: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
      }),
      output: z.object({ context: kubeContextSchema.nullable() }),
    },
    "kubeContexts.delete": {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ deleted: z.boolean() }),
    },
    "kubeContexts.available": {
      input: z.object({}),
      output: z.object({ contexts: z.array(z.string()) }),
    },

    // ArgoCD Instances
    "argoInstances.list": {
      input: z.object({}),
      output: z.object({ instances: z.array(argocdInstanceSchema) }),
    },
    "argoInstances.get": {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ instance: argocdInstanceSchema.nullable() }),
    },
    "argoInstances.create": {
      input: z.object({
        name: z.string().min(1),
        serverUrl: z.string().min(1),
        authToken: z.string().min(1),
        description: z.string().nullable().optional(),
      }),
      output: z.object({ instance: argocdInstanceSchema }),
    },
    "argoInstances.update": {
      input: z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        serverUrl: z.string().min(1).optional(),
        authToken: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
      }),
      output: z.object({ instance: argocdInstanceSchema.nullable() }),
    },
    "argoInstances.delete": {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ deleted: z.boolean() }),
    },

    // SSH Connections
    "sshConnections.list": {
      input: z.object({}),
      output: z.object({ connections: z.array(sshConnectionSchema) }),
    },
    "sshConnections.get": {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ connection: sshConnectionSchema.nullable() }),
    },
    "sshConnections.create": {
      input: z.object({
        name: z.string().min(1),
        host: z.string().min(1),
        port: z.number().int().optional(),
        username: z.string().min(1),
        sshIdentityId: z.string().uuid().nullable().optional(),
        description: z.string().nullable().optional(),
      }),
      output: z.object({ connection: sshConnectionSchema }),
    },
    "sshConnections.update": {
      input: z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        host: z.string().min(1).optional(),
        port: z.number().int().optional(),
        username: z.string().min(1).optional(),
        sshIdentityId: z.string().uuid().nullable().optional(),
        description: z.string().nullable().optional(),
      }),
      output: z.object({ connection: sshConnectionSchema.nullable() }),
    },
    "sshConnections.delete": {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ deleted: z.boolean() }),
    },

    // Stage Configs
    "stageConfigs.list": {
      input: z.object({}),
      output: z.object({ configs: z.array(stageConfigSchema) }),
    },
    "stageConfigs.get": {
      input: z.object({ stage: z.string().min(1) }),
      output: z.object({ config: stageConfigSchema.nullable() }),
    },
    "stageConfigs.upsert": {
      input: z.object({
        stage: z.string().min(1),
        allowedKubeContexts: z.array(z.string()).nullable().optional(),
        allowedSshConnections: z.array(z.string()).nullable().optional(),
        allowedGitRepos: z.array(z.string()).nullable().optional(),
        allowedArgocdInstances: z.array(z.string()).nullable().optional(),
        sshIdentityId: z.string().uuid().nullable().optional(),
        additionalSystemPrompt: z.string().nullable().optional(),
      }),
      output: z.object({ config: stageConfigSchema }),
    },
    "stageConfigs.delete": {
      input: z.object({ stage: z.string().min(1) }),
      output: z.object({ deleted: z.boolean() }),
    },
  },
  events: {
    connected: {
      payload: z.object({ clientId: z.string().uuid() }),
    },
    "issue.stageChanged": {
      payload: z.object({
        issueId: z.string().uuid(),
        from: z.string(),
        to: z.string(),
      }),
    },
  },
};

export type {
  CallMessage,
  ResponseMessage,
  ErrorMessage,
  EventMessage,
  Message,
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
  callMessageSchema,
  responseMessageSchema,
  errorMessageSchema,
  eventMessageSchema,
  messageSchema,
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
  sshIdentitySources,
  protocol,
};
