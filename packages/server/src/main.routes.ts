import { protocol } from '@faultline/protocol';

import { IssueService } from './issues/issues.js';
import { AgentRunService } from './agent-runs/agent-runs.js';
import { IntegrationService } from './integrations/integrations.js';
import { StageConfigService } from './stage-configs/stage-configs.js';
import { OrchestratorService } from './orchestrator/orchestrator.js';
import { createRouter } from './router/router.js';
import type { CallContext, RouterHandlers } from './router/router.js';
import {
  toIssue,
  toTimelineEntry,
  toAgentLoop,
  toAgentStep,
  toResource,
  toRelation,
  toApproval,
  toLink,
  toSshIdentity,
  toGitRepo,
  toKubeContext,
  toArgocdInstance,
  toSshConnection,
  toStageConfig,
} from './main.mappers.js';

type Handlers = RouterHandlers<typeof protocol>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = (input: any, context: CallContext) => Promise<any>;
type HandlerMap = Record<string, AnyHandler>;

// ── Issue routes ────────────────────────────────────────────────────

const issueRoutes = (): HandlerMap => ({
  'issues.list': async (input, { services }) => {
    const issues = await services.get(IssueService).list(input);
    return { issues: issues.map(toIssue) };
  },

  'issues.get': async (input, { services }) => {
    const issue = await services.get(IssueService).getById(input.id);
    return { issue: issue ? toIssue(issue) : null };
  },

  'issues.create': async (input, { services }) => {
    const issue = await services.get(IssueService).create({
      fingerprint: input.fingerprint,
      source: input.source,
      title: input.title,
      summary: input.summary ?? null,
      description: input.description ?? null,
      stage: input.stage ?? 'triage',
      needsYou: input.needsYou ?? false,
      priority: input.priority ?? 'medium',
      sourcePayload: input.sourcePayload ?? null,
    });
    return { issue: toIssue(issue) };
  },

  'issues.update': async (input, { services }) => {
    const { id, ...updates } = input;
    const issue = await services.get(IssueService).update(id, updates);
    return { issue: issue ? toIssue(issue) : null };
  },

  'issues.addLink': async (input, { services }) => {
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
});

// ── Timeline routes ─────────────────────────────────────────────────

const timelineRoutes = (): HandlerMap => ({
  'timeline.list': async (input, { services }) => {
    const entries = await services.get(IssueService).getTimelineEntries(input.issueId);
    return { entries: entries.map(toTimelineEntry) };
  },

  'timeline.add': async (input, { services }) => {
    const entry = await services.get(IssueService).addTimelineEntry({
      issueId: input.issueId,
      agentLoopId: input.agentLoopId ?? null,
      kind: input.kind,
      status: input.status ?? 'info',
      title: input.title,
      body: input.body ?? null,
      commandRun: input.commandRun ?? null,
    });
    return { entry: toTimelineEntry(entry) };
  },
});

// ── Agent loop & step routes ────────────────────────────────────────

const agentRoutes = (): HandlerMap => ({
  'agentLoops.list': async (input, { services }) => {
    const loops = await services.get(AgentRunService).getAgentLoopsForIssue(input.issueId);
    return { loops: loops.map((l) => toAgentLoop(l, input.issueId)) };
  },

  'agentLoops.get': async (input, { services }) => {
    const loop = await services.get(AgentRunService).getAgentLoop(input.id);
    return { loop: loop ? toAgentLoop(loop) : null };
  },

  'agentLoops.create': async (input, { services }) => {
    const agentRunService = services.get(AgentRunService);
    const loop = await agentRunService.createAgentLoop({ title: input.title });
    await agentRunService.linkToIssue(input.issueId, loop.id);
    return { loop: toAgentLoop(loop, input.issueId) };
  },

  'agentLoops.updateStatus': async (input, { services }) => {
    const loop = await services.get(AgentRunService).updateAgentLoopStatus(input.id, input.status);
    return { loop: loop ? toAgentLoop(loop) : null };
  },

  'agentSteps.list': async (input, { services }) => {
    const steps = await services.get(AgentRunService).getAgentSteps(input.agentLoopId);
    return { steps: steps.map(toAgentStep) };
  },

  'agentSteps.add': async (input, { services }) => {
    const step = await services.get(AgentRunService).addAgentStep({
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

  'agent.run': async (input, { services }) => {
    const agentLoopId = await services.get(OrchestratorService).runForIssue({
      issueId: input.issueId,
      prompt: input.prompt,
      systemPrompt: input.systemPrompt,
      cwd: input.cwd,
    });
    return { agentLoopId };
  },

  'agent.stop': async (input, { services }) => {
    await services.get(OrchestratorService).stopByAgentLoopId(input.agentLoopId);
    return { stopped: true };
  },
});

// ── Resource & relation routes ──────────────────────────────────────

const resourceRelationRoutes = (): HandlerMap => ({
  'resources.list': async (input, { services }) => {
    const resources = await services.get(IssueService).getResources(input.issueId);
    return { resources: resources.map(toResource) };
  },

  'resources.add': async (input, { services }) => {
    const resource = await services.get(IssueService).addResource({
      issueId: input.issueId,
      kind: input.kind,
      name: input.name,
      health: input.health ?? 'healthy',
      detail: input.detail ?? null,
    });
    return { resource: toResource(resource) };
  },

  'relations.list': async (input, { services }) => {
    const relations = await services.get(IssueService).getRelations(input.issueId);
    return { relations: relations.map(toRelation) };
  },

  'relations.add': async (input, { services }) => {
    const relation = await services.get(IssueService).addRelation({
      sourceIssueId: input.sourceIssueId,
      targetIssueId: input.targetIssueId,
      relation: input.relation,
    });
    return { relation: toRelation(relation) };
  },
});

// ── Approval routes ─────────────────────────────────────────────────

const approvalRoutes = (): HandlerMap => ({
  'approvals.list': async (input, { services }) => {
    const approvals = await services.get(IssueService).getApprovals(input.issueId);
    return { approvals: approvals.map(toApproval) };
  },

  'approvals.create': async (input, { services }) => {
    const approval = await services.get(IssueService).createApproval({
      issueId: input.issueId,
      agentLoopId: input.agentLoopId ?? null,
      title: input.title,
      reason: input.reason,
    });
    return { approval: toApproval(approval) };
  },

  'approvals.resolve': async (input, { services }) => {
    const approval = await services.get(IssueService).resolveApproval(input.id, input.decision, input.reason);
    if (approval) {
      await services.get(OrchestratorService).handleApprovalResolution(approval);
    }
    return { approval: approval ? toApproval(approval) : null };
  },
});

// ── SSH identity routes ─────────────────────────────────────────────

const sshIdentityRoutes = (): HandlerMap => ({
  'sshIdentities.list': async (_input, { services }) => {
    const identities = await services.get(IntegrationService).listSshIdentities();
    return { identities: identities.map(toSshIdentity) };
  },

  'sshIdentities.get': async (input, { services }) => {
    const identity = await services.get(IntegrationService).getSshIdentity(input.id);
    return { identity: identity ? toSshIdentity(identity) : null };
  },

  'sshIdentities.create': async (input, { services }) => {
    const identity = await services.get(IntegrationService).createSshIdentity({
      name: input.name,
      source: input.source,
      privateKey: input.privateKey,
    });
    return { identity: toSshIdentity(identity) };
  },

  'sshIdentities.update': async (input, { services }) => {
    const { id, ...updates } = input;
    const identity = await services.get(IntegrationService).updateSshIdentity(id, updates);
    return { identity: identity ? toSshIdentity(identity) : null };
  },

  'sshIdentities.delete': async (input, { services }) => {
    const deleted = await services.get(IntegrationService).deleteSshIdentity(input.id);
    return { deleted };
  },
});

// ── Git repo routes ─────────────────────────────────────────────────

const gitRepoRoutes = (): HandlerMap => ({
  'gitRepos.list': async (_input, { services }) => {
    const repos = await services.get(IntegrationService).listGitRepos();
    return { repos: repos.map(toGitRepo) };
  },

  'gitRepos.get': async (input, { services }) => {
    const repo = await services.get(IntegrationService).getGitRepo(input.id);
    return { repo: repo ? toGitRepo(repo) : null };
  },

  'gitRepos.create': async (input, { services }) => {
    const repo = await services.get(IntegrationService).createGitRepo({
      name: input.name,
      cloneUrl: input.cloneUrl,
      description: input.description ?? null,
      sshIdentityId: input.sshIdentityId ?? null,
      defaultBranch: input.defaultBranch ?? 'main',
    });
    return { repo: toGitRepo(repo) };
  },

  'gitRepos.update': async (input, { services }) => {
    const { id, ...updates } = input;
    const repo = await services.get(IntegrationService).updateGitRepo(id, updates);
    return { repo: repo ? toGitRepo(repo) : null };
  },

  'gitRepos.delete': async (input, { services }) => {
    const deleted = await services.get(IntegrationService).deleteGitRepo(input.id);
    return { deleted };
  },
});

// ── Kube context routes ─────────────────────────────────────────────

const kubeContextRoutes = (): HandlerMap => ({
  'kubeContexts.list': async (_input, { services }) => {
    const contexts = await services.get(IntegrationService).listKubeContexts();
    return { contexts: contexts.map(toKubeContext) };
  },

  'kubeContexts.get': async (input, { services }) => {
    const ctx = await services.get(IntegrationService).getKubeContext(input.id);
    return { context: ctx ? toKubeContext(ctx) : null };
  },

  'kubeContexts.create': async (input, { services }) => {
    const ctx = await services.get(IntegrationService).createKubeContext({
      name: input.name,
      context: input.context,
      description: input.description ?? null,
    });
    return { context: toKubeContext(ctx) };
  },

  'kubeContexts.update': async (input, { services }) => {
    const { id, ...updates } = input;
    const ctx = await services.get(IntegrationService).updateKubeContext(id, updates);
    return { context: ctx ? toKubeContext(ctx) : null };
  },

  'kubeContexts.delete': async (input, { services }) => {
    const deleted = await services.get(IntegrationService).deleteKubeContext(input.id);
    return { deleted };
  },

  'kubeContexts.available': async (_input, { services }) => {
    const contexts = services.get(IntegrationService).listAvailableKubeContexts();
    return { contexts };
  },
});

// ── Argo instance routes ────────────────────────────────────────────

const argoInstanceRoutes = (): HandlerMap => ({
  'argoInstances.list': async (_input, { services }) => {
    const instances = await services.get(IntegrationService).listArgocdInstances();
    return { instances: instances.map(toArgocdInstance) };
  },

  'argoInstances.get': async (input, { services }) => {
    const instance = await services.get(IntegrationService).getArgocdInstance(input.id);
    return { instance: instance ? toArgocdInstance(instance) : null };
  },

  'argoInstances.create': async (input, { services }) => {
    const instance = await services.get(IntegrationService).createArgocdInstance({
      name: input.name,
      serverUrl: input.serverUrl,
      authToken: input.authToken,
      description: input.description ?? null,
    });
    return { instance: toArgocdInstance(instance) };
  },

  'argoInstances.update': async (input, { services }) => {
    const { id, ...updates } = input;
    const instance = await services.get(IntegrationService).updateArgocdInstance(id, updates);
    return { instance: instance ? toArgocdInstance(instance) : null };
  },

  'argoInstances.delete': async (input, { services }) => {
    const deleted = await services.get(IntegrationService).deleteArgocdInstance(input.id);
    return { deleted };
  },
});

// ── SSH connection routes ───────────────────────────────────────────

const sshConnectionRoutes = (): HandlerMap => ({
  'sshConnections.list': async (_input, { services }) => {
    const connections = await services.get(IntegrationService).listSshConnections();
    return { connections: connections.map(toSshConnection) };
  },

  'sshConnections.get': async (input, { services }) => {
    const conn = await services.get(IntegrationService).getSshConnection(input.id);
    return { connection: conn ? toSshConnection(conn) : null };
  },

  'sshConnections.create': async (input, { services }) => {
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

  'sshConnections.update': async (input, { services }) => {
    const { id, ...updates } = input;
    const conn = await services.get(IntegrationService).updateSshConnection(id, updates);
    return { connection: conn ? toSshConnection(conn) : null };
  },

  'sshConnections.delete': async (input, { services }) => {
    const deleted = await services.get(IntegrationService).deleteSshConnection(input.id);
    return { deleted };
  },
});

// ── Stage config routes ─────────────────────────────────────────────

const stageConfigRoutes = (): HandlerMap => ({
  'stageConfigs.list': async (_input, { services }) => {
    const configs = await services.get(StageConfigService).list();
    return { configs: configs.map(toStageConfig) };
  },

  'stageConfigs.get': async (input, { services }) => {
    const config = await services.get(StageConfigService).getByStage(input.stage);
    return { config: config ? toStageConfig(config) : null };
  },

  'stageConfigs.upsert': async (input, { services }) => {
    const config = await services.get(StageConfigService).upsert({
      stage: input.stage,
      allowedKubeContexts: input.allowedKubeContexts ?? null,
      allowedSshConnections: input.allowedSshConnections ?? null,
      allowedGitRepos: input.allowedGitRepos ?? null,
      allowedArgocdInstances: input.allowedArgocdInstances ?? null,
      sshIdentityId: input.sshIdentityId ?? null,
      additionalSystemPrompt: input.additionalSystemPrompt ?? null,
    });
    return { config: toStageConfig(config) };
  },

  'stageConfigs.delete': async (input, { services }) => {
    const deleted = await services.get(StageConfigService).delete(input.stage);
    return { deleted };
  },
});

// ── Build router ────────────────────────────────────────────────────

const buildRouter = () =>
  createRouter(protocol, {
    ping: async () => ({ pong: true as const }),
    ...issueRoutes(),
    ...timelineRoutes(),
    ...agentRoutes(),
    ...resourceRelationRoutes(),
    ...approvalRoutes(),
    ...sshIdentityRoutes(),
    ...gitRepoRoutes(),
    ...kubeContextRoutes(),
    ...argoInstanceRoutes(),
    ...sshConnectionRoutes(),
    ...stageConfigRoutes(),
  } as unknown as Handlers);

export { buildRouter };
