import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import { protocol } from "@faultline/protocol";

import type { EventMessage } from "@faultline/protocol";

import { Services } from "./services/services.js";
import { DatabaseService } from "./database/database.js";
import { IssueService } from "./issues/issues.js";
import { AgentService } from "./agent/agent.js";
import { IntegrationService } from "./integrations/integrations.js";
import { createRouter } from "./router/router.js";
import { registerAlertmanagerWebhook } from "./webhooks/webhooks.js";

import type {
  Issue as IssueRow,
  TimelineEntry as TimelineEntryRow,
  AgentLoop as AgentLoopRow,
  AgentStep as AgentStepRow,
  IssueResource as IssueResourceRow,
  IssueRelationRow,
  Approval as ApprovalRow,
  IssueLink as IssueLinkRow,
} from "./issues/issues.js";
import type {
  SshIdentity as SshIdentityRow,
  GitRepo as GitRepoRow,
  KubeContext as KubeContextRow,
  ArgocdInstance as ArgocdInstanceRow,
  SshConnection as SshConnectionRow,
} from "./integrations/integrations.js";
import type { CallContext } from "./router/router.js";

const toIssue = (row: IssueRow) => ({
  id: row.id,
  fingerprint: row.fingerprint,
  source: row.source,
  title: row.title,
  summary: row.summary,
  description: row.description,
  stage: row.stage as "triage",
  needsYou: row.needs_you === 1,
  priority: row.priority as "medium",
  sourcePayload: row.source_payload,
  resolvedAt: row.resolved_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toTimelineEntry = (row: TimelineEntryRow) => ({
  id: row.id,
  issueId: row.issue_id,
  agentLoopId: row.agent_loop_id,
  kind: row.kind as "detected",
  status: row.status as "info",
  title: row.title,
  body: row.body,
  commandRun: row.command_run,
  createdAt: row.created_at,
});

const toAgentLoop = (row: AgentLoopRow) => ({
  id: row.id,
  issueId: row.issue_id,
  title: row.title,
  status: row.status as "running",
  startedAt: row.started_at,
  finishedAt: row.finished_at,
});

const toAgentStep = (row: AgentStepRow) => ({
  id: row.id,
  agentLoopId: row.agent_loop_id,
  kind: row.kind as "thinking",
  title: row.title,
  status: row.status,
  detail: row.detail,
  output: row.output,
  durationMs: row.duration_ms,
  sequence: row.sequence,
  createdAt: row.created_at,
});

const toResource = (row: IssueResourceRow) => ({
  id: row.id,
  issueId: row.issue_id,
  kind: row.kind as "node",
  name: row.name,
  health: row.health as "healthy",
  detail: row.detail,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toRelation = (row: IssueRelationRow) => ({
  id: row.id,
  sourceIssueId: row.source_issue_id,
  targetIssueId: row.target_issue_id,
  relation: row.relation as "caused-by",
  createdAt: row.created_at,
});

const toApproval = (row: ApprovalRow) => ({
  id: row.id,
  issueId: row.issue_id,
  agentLoopId: row.agent_loop_id,
  title: row.title,
  reason: row.reason,
  status: row.status as "pending",
  decidedAt: row.decided_at,
  createdAt: row.created_at,
});

const toLink = (row: IssueLinkRow) => ({
  id: row.id,
  issueId: row.issue_id,
  url: row.url,
  linkType: row.link_type as "commit",
  title: row.title,
  description: row.description,
  repo: row.repo,
  createdAt: row.created_at,
});

// Note: private_key is intentionally omitted — it never leaves the server.
const toSshIdentity = (row: SshIdentityRow) => ({
  id: row.id,
  name: row.name,
  keyType: row.key_type,
  publicKey: row.public_key,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toGitRepo = (row: GitRepoRow) => ({
  id: row.id,
  name: row.name,
  cloneUrl: row.clone_url,
  description: row.description,
  sshIdentityId: row.ssh_identity_id,
  defaultBranch: row.default_branch,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toKubeContext = (row: KubeContextRow) => ({
  id: row.id,
  name: row.name,
  context: row.context,
  description: row.description,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Note: auth_token is intentionally omitted — it never leaves the server.
const toArgocdInstance = (row: ArgocdInstanceRow) => ({
  id: row.id,
  name: row.name,
  serverUrl: row.server_url,
  description: row.description,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toSshConnection = (row: SshConnectionRow) => ({
  id: row.id,
  name: row.name,
  host: row.host,
  port: row.port,
  username: row.username,
  sshIdentityId: row.ssh_identity_id,
  description: row.description,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const services = new Services();

const router = createRouter(protocol, {
  ping: async () => ({ pong: true as const }),

  // Issues
  "issues.list": async (input, { services }) => {
    const issues = await services.get(IssueService).list(input);
    return { issues: issues.map(toIssue) };
  },

  "issues.get": async (input, { services }) => {
    const issue = await services.get(IssueService).getById(input.id);
    return { issue: issue ? toIssue(issue) : null };
  },

  "issues.create": async (input, { services }) => {
    const issue = await services.get(IssueService).create({
      fingerprint: input.fingerprint,
      source: input.source,
      title: input.title,
      summary: input.summary ?? null,
      description: input.description ?? null,
      stage: input.stage ?? "triage",
      needsYou: input.needsYou ?? false,
      priority: input.priority ?? "medium",
      sourcePayload: input.sourcePayload ?? null,
    });
    return { issue: toIssue(issue) };
  },

  "issues.update": async (input, { services }) => {
    const { id, ...updates } = input;
    const issue = await services.get(IssueService).update(id, updates);
    return { issue: issue ? toIssue(issue) : null };
  },

  // Timeline
  "timeline.list": async (input, { services }) => {
    const entries = await services.get(IssueService).getTimelineEntries(input.issueId);
    return { entries: entries.map(toTimelineEntry) };
  },

  "timeline.add": async (input, { services }) => {
    const entry = await services.get(IssueService).addTimelineEntry({
      issueId: input.issueId,
      agentLoopId: input.agentLoopId ?? null,
      kind: input.kind,
      status: input.status ?? "info",
      title: input.title,
      body: input.body ?? null,
      commandRun: input.commandRun ?? null,
    });
    return { entry: toTimelineEntry(entry) };
  },

  // Agent loops
  "agentLoops.list": async (input, { services }) => {
    const loops = await services.get(IssueService).getAgentLoops(input.issueId);
    return { loops: loops.map(toAgentLoop) };
  },

  "agentLoops.get": async (input, { services }) => {
    const loop = await services.get(IssueService).getAgentLoop(input.id);
    return { loop: loop ? toAgentLoop(loop) : null };
  },

  "agentLoops.create": async (input, { services }) => {
    const loop = await services.get(IssueService).createAgentLoop({
      issueId: input.issueId,
      title: input.title,
    });
    return { loop: toAgentLoop(loop) };
  },

  "agentLoops.updateStatus": async (input, { services }) => {
    const loop = await services.get(IssueService).updateAgentLoopStatus(input.id, input.status);
    return { loop: loop ? toAgentLoop(loop) : null };
  },

  // Agent steps
  "agentSteps.list": async (input, { services }) => {
    const steps = await services.get(IssueService).getAgentSteps(input.agentLoopId);
    return { steps: steps.map(toAgentStep) };
  },

  "agentSteps.add": async (input, { services }) => {
    const step = await services.get(IssueService).addAgentStep({
      agentLoopId: input.agentLoopId,
      kind: input.kind,
      title: input.title,
      status: input.status ?? null,
      detail: input.detail ?? null,
      output: input.output ?? null,
      durationMs: input.durationMs ?? null,
    });
    return { step: toAgentStep(step) };
  },

  // Resources
  "resources.list": async (input, { services }) => {
    const resources = await services.get(IssueService).getResources(input.issueId);
    return { resources: resources.map(toResource) };
  },

  "resources.add": async (input, { services }) => {
    const resource = await services.get(IssueService).addResource({
      issueId: input.issueId,
      kind: input.kind,
      name: input.name,
      health: input.health ?? "healthy",
      detail: input.detail ?? null,
    });
    return { resource: toResource(resource) };
  },

  // Relations
  "relations.list": async (input, { services }) => {
    const relations = await services.get(IssueService).getRelations(input.issueId);
    return { relations: relations.map(toRelation) };
  },

  "relations.add": async (input, { services }) => {
    const relation = await services.get(IssueService).addRelation({
      sourceIssueId: input.sourceIssueId,
      targetIssueId: input.targetIssueId,
      relation: input.relation,
    });
    return { relation: toRelation(relation) };
  },

  // Approvals
  "approvals.list": async (input, { services }) => {
    const approvals = await services.get(IssueService).getApprovals(input.issueId);
    return { approvals: approvals.map(toApproval) };
  },

  "approvals.create": async (input, { services }) => {
    const approval = await services.get(IssueService).createApproval({
      issueId: input.issueId,
      agentLoopId: input.agentLoopId ?? null,
      title: input.title,
      reason: input.reason,
    });
    return { approval: toApproval(approval) };
  },

  "approvals.resolve": async (input, { services }) => {
    const approval = await services.get(IssueService).resolveApproval(input.id, input.decision);
    return { approval: approval ? toApproval(approval) : null };
  },

  // Agent
  "agent.run": async (input, { services }) => {
    const agentLoopId = await services.get(AgentService).run({
      issueId: input.issueId,
      prompt: input.prompt,
      systemPrompt: input.systemPrompt,
      allowedTools: input.allowedTools,
      cwd: input.cwd,
    });
    return { agentLoopId };
  },

  "agent.stop": async (input, { services }) => {
    await services.get(AgentService).stop(input.agentLoopId);
    return { stopped: true };
  },

  // Links
  "issues.addLink": async (input, { services }) => {
    const link = await services.get(IssueService).addLink({
      issueId: input.issueId,
      url: input.url,
      linkType: input.linkType,
      title: input.title ?? null,
      description: input.description ?? null,
      repo: input.repo,
    });
    return { link: toLink(link) };
  },

  // SSH Identities
  "sshIdentities.list": async (_input, { services }) => {
    const identities = await services.get(IntegrationService).listSshIdentities();
    return { identities: identities.map(toSshIdentity) };
  },

  "sshIdentities.get": async (input, { services }) => {
    const identity = await services.get(IntegrationService).getSshIdentity(input.id);
    return { identity: identity ? toSshIdentity(identity) : null };
  },

  "sshIdentities.create": async (input, { services }) => {
    const identity = await services.get(IntegrationService).createSshIdentity({
      name: input.name,
      source: input.source,
      privateKey: input.privateKey,
    });
    return { identity: toSshIdentity(identity) };
  },

  "sshIdentities.update": async (input, { services }) => {
    const { id, ...updates } = input;
    const identity = await services.get(IntegrationService).updateSshIdentity(id, updates);
    return { identity: identity ? toSshIdentity(identity) : null };
  },

  "sshIdentities.delete": async (input, { services }) => {
    const deleted = await services.get(IntegrationService).deleteSshIdentity(input.id);
    return { deleted };
  },

  // Git Repositories
  "gitRepos.list": async (_input, { services }) => {
    const repos = await services.get(IntegrationService).listGitRepos();
    return { repos: repos.map(toGitRepo) };
  },

  "gitRepos.get": async (input, { services }) => {
    const repo = await services.get(IntegrationService).getGitRepo(input.id);
    return { repo: repo ? toGitRepo(repo) : null };
  },

  "gitRepos.create": async (input, { services }) => {
    const repo = await services.get(IntegrationService).createGitRepo({
      name: input.name,
      cloneUrl: input.cloneUrl,
      description: input.description ?? null,
      sshIdentityId: input.sshIdentityId ?? null,
      defaultBranch: input.defaultBranch ?? "main",
    });
    return { repo: toGitRepo(repo) };
  },

  "gitRepos.update": async (input, { services }) => {
    const { id, ...updates } = input;
    const repo = await services.get(IntegrationService).updateGitRepo(id, updates);
    return { repo: repo ? toGitRepo(repo) : null };
  },

  "gitRepos.delete": async (input, { services }) => {
    const deleted = await services.get(IntegrationService).deleteGitRepo(input.id);
    return { deleted };
  },

  // Kubernetes Contexts
  "kubeContexts.list": async (_input, { services }) => {
    const contexts = await services.get(IntegrationService).listKubeContexts();
    return { contexts: contexts.map(toKubeContext) };
  },

  "kubeContexts.get": async (input, { services }) => {
    const ctx = await services.get(IntegrationService).getKubeContext(input.id);
    return { context: ctx ? toKubeContext(ctx) : null };
  },

  "kubeContexts.create": async (input, { services }) => {
    const ctx = await services.get(IntegrationService).createKubeContext({
      name: input.name,
      context: input.context,
      description: input.description ?? null,
    });
    return { context: toKubeContext(ctx) };
  },

  "kubeContexts.update": async (input, { services }) => {
    const { id, ...updates } = input;
    const ctx = await services.get(IntegrationService).updateKubeContext(id, updates);
    return { context: ctx ? toKubeContext(ctx) : null };
  },

  "kubeContexts.delete": async (input, { services }) => {
    const deleted = await services.get(IntegrationService).deleteKubeContext(input.id);
    return { deleted };
  },

  "kubeContexts.available": async (_input, { services }) => {
    const contexts = services.get(IntegrationService).listAvailableKubeContexts();
    return { contexts };
  },

  // ArgoCD Instances
  "argoInstances.list": async (_input, { services }) => {
    const instances = await services.get(IntegrationService).listArgocdInstances();
    return { instances: instances.map(toArgocdInstance) };
  },

  "argoInstances.get": async (input, { services }) => {
    const instance = await services.get(IntegrationService).getArgocdInstance(input.id);
    return { instance: instance ? toArgocdInstance(instance) : null };
  },

  "argoInstances.create": async (input, { services }) => {
    const instance = await services.get(IntegrationService).createArgocdInstance({
      name: input.name,
      serverUrl: input.serverUrl,
      authToken: input.authToken,
      description: input.description ?? null,
    });
    return { instance: toArgocdInstance(instance) };
  },

  "argoInstances.update": async (input, { services }) => {
    const { id, ...updates } = input;
    const instance = await services.get(IntegrationService).updateArgocdInstance(id, updates);
    return { instance: instance ? toArgocdInstance(instance) : null };
  },

  "argoInstances.delete": async (input, { services }) => {
    const deleted = await services.get(IntegrationService).deleteArgocdInstance(input.id);
    return { deleted };
  },

  // SSH Connections
  "sshConnections.list": async (_input, { services }) => {
    const connections = await services.get(IntegrationService).listSshConnections();
    return { connections: connections.map(toSshConnection) };
  },

  "sshConnections.get": async (input, { services }) => {
    const conn = await services.get(IntegrationService).getSshConnection(input.id);
    return { connection: conn ? toSshConnection(conn) : null };
  },

  "sshConnections.create": async (input, { services }) => {
    const conn = await services.get(IntegrationService).createSshConnection({
      name: input.name,
      host: input.host,
      port: input.port ?? 22,
      username: input.username,
      sshIdentityId: input.sshIdentityId ?? null,
      description: input.description ?? null,
    });
    return { connection: toSshConnection(conn) };
  },

  "sshConnections.update": async (input, { services }) => {
    const { id, ...updates } = input;
    const conn = await services.get(IntegrationService).updateSshConnection(id, updates);
    return { connection: conn ? toSshConnection(conn) : null };
  },

  "sshConnections.delete": async (input, { services }) => {
    const deleted = await services.get(IntegrationService).deleteSshConnection(input.id);
    return { deleted };
  },
});

const start = async (): Promise<void> => {
  const app = Fastify();
  await app.register(fastifyWebsocket);

  app.get("/api/ws", { websocket: true }, (socket) => {
    const context: CallContext = {
      services,
      ws: socket,
    };

    const connectedEvent: EventMessage = {
      type: "event",
      event: "connected",
      payload: { clientId: crypto.randomUUID() },
    };
    socket.send(JSON.stringify(connectedEvent));

    socket.on("message", (data) => {
      router.handle(String(data), context);
    });
  });

  registerAlertmanagerWebhook(app, services);

  // Ensure database is initialized before accepting connections
  await services.get(DatabaseService).instance;

  const address = await app.listen({ port: 3007, host: "0.0.0.0" });
  console.log(`Faultline server listening on ${address}`);
};

const shutdown = async (): Promise<void> => {
  await services.destroy();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

start();
