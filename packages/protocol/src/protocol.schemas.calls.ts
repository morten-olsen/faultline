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
  issueLinkTypes,
  sshIdentitySources,
} from './protocol.schemas.enums.js';
import {
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
} from './protocol.schemas.domain.js';

const protocol = {
  calls: {
    ping: {
      input: z.object({}),
      output: z.object({ pong: z.literal(true) }),
    },
    'issues.list': {
      input: z.object({
        stage: z.enum(issueStages).optional(),
        source: z.string().optional(),
      }),
      output: z.object({ issues: z.array(issueSchema) }),
    },
    'issues.get': {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ issue: issueSchema.nullable() }),
    },
    'issues.create': {
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
    'issues.update': {
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
    'timeline.list': {
      input: z.object({ issueId: z.string().uuid() }),
      output: z.object({ entries: z.array(timelineEntrySchema) }),
    },
    'timeline.add': {
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
    'agentLoops.list': {
      input: z.object({ issueId: z.string().uuid() }),
      output: z.object({ loops: z.array(agentLoopSchema) }),
    },
    'agentLoops.get': {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ loop: agentLoopSchema.nullable() }),
    },
    'agentLoops.create': {
      input: z.object({
        issueId: z.string().uuid(),
        title: z.string().min(1),
      }),
      output: z.object({ loop: agentLoopSchema }),
    },
    'agentLoops.updateStatus': {
      input: z.object({
        id: z.string().uuid(),
        status: z.enum(agentLoopStatuses),
      }),
      output: z.object({ loop: agentLoopSchema.nullable() }),
    },
    'agentSteps.list': {
      input: z.object({ agentLoopId: z.string().uuid() }),
      output: z.object({ steps: z.array(agentStepSchema) }),
    },
    'agentSteps.add': {
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
    'resources.list': {
      input: z.object({ issueId: z.string().uuid() }),
      output: z.object({ resources: z.array(issueResourceSchema) }),
    },
    'resources.add': {
      input: z.object({
        issueId: z.string().uuid(),
        kind: z.enum(resourceKinds),
        name: z.string().min(1),
        health: z.enum(healthStatuses).optional(),
        detail: z.string().nullable().optional(),
      }),
      output: z.object({ resource: issueResourceSchema }),
    },
    'relations.list': {
      input: z.object({ issueId: z.string().uuid() }),
      output: z.object({ relations: z.array(issueRelationSchema) }),
    },
    'relations.add': {
      input: z.object({
        sourceIssueId: z.string().uuid(),
        targetIssueId: z.string().uuid(),
        relation: z.enum(issueRelationTypes),
      }),
      output: z.object({ relation: issueRelationSchema }),
    },
    'approvals.list': {
      input: z.object({ issueId: z.string().uuid() }),
      output: z.object({ approvals: z.array(approvalSchema) }),
    },
    'approvals.create': {
      input: z.object({
        issueId: z.string().uuid(),
        agentLoopId: z.string().uuid().nullable().optional(),
        title: z.string().min(1),
        reason: z.string().min(1),
      }),
      output: z.object({ approval: approvalSchema }),
    },
    'approvals.resolve': {
      input: z.object({
        id: z.string().uuid(),
        decision: z.enum(['approved', 'denied']),
        reason: z.string().optional(),
      }),
      output: z.object({ approval: approvalSchema.nullable() }),
    },
    'agent.run': {
      input: z.object({
        issueId: z.string().uuid(),
        prompt: z.string().min(1),
        systemPrompt: z.string().optional(),
        allowedTools: z.array(z.string()).optional(),
        cwd: z.string().optional(),
      }),
      output: z.object({ agentLoopId: z.string().uuid() }),
    },
    'agent.stop': {
      input: z.object({ agentLoopId: z.string().uuid() }),
      output: z.object({ stopped: z.boolean() }),
    },
    'issues.addLink': {
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
    'sshIdentities.list': {
      input: z.object({}),
      output: z.object({ identities: z.array(sshIdentitySchema) }),
    },
    'sshIdentities.get': {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ identity: sshIdentitySchema.nullable() }),
    },
    'sshIdentities.create': {
      input: z.object({
        name: z.string().min(1),
        source: z.enum(sshIdentitySources),
        privateKey: z.string().optional(),
      }),
      output: z.object({ identity: sshIdentitySchema }),
    },
    'sshIdentities.update': {
      input: z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
      }),
      output: z.object({ identity: sshIdentitySchema.nullable() }),
    },
    'sshIdentities.delete': {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ deleted: z.boolean() }),
    },
    'gitRepos.list': {
      input: z.object({}),
      output: z.object({ repos: z.array(gitRepoSchema) }),
    },
    'gitRepos.get': {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ repo: gitRepoSchema.nullable() }),
    },
    'gitRepos.create': {
      input: z.object({
        name: z.string().min(1),
        cloneUrl: z.string().min(1),
        description: z.string().nullable().optional(),
        sshIdentityId: z.string().uuid().nullable().optional(),
        defaultBranch: z.string().optional(),
      }),
      output: z.object({ repo: gitRepoSchema }),
    },
    'gitRepos.update': {
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
    'gitRepos.delete': {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ deleted: z.boolean() }),
    },
    'kubeContexts.list': {
      input: z.object({}),
      output: z.object({ contexts: z.array(kubeContextSchema) }),
    },
    'kubeContexts.get': {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ context: kubeContextSchema.nullable() }),
    },
    'kubeContexts.create': {
      input: z.object({
        name: z.string().min(1),
        context: z.string().min(1),
        description: z.string().nullable().optional(),
      }),
      output: z.object({ context: kubeContextSchema }),
    },
    'kubeContexts.update': {
      input: z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        context: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
      }),
      output: z.object({ context: kubeContextSchema.nullable() }),
    },
    'kubeContexts.delete': {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ deleted: z.boolean() }),
    },
    'kubeContexts.available': {
      input: z.object({}),
      output: z.object({ contexts: z.array(z.string()) }),
    },
    'argoInstances.list': {
      input: z.object({}),
      output: z.object({ instances: z.array(argocdInstanceSchema) }),
    },
    'argoInstances.get': {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ instance: argocdInstanceSchema.nullable() }),
    },
    'argoInstances.create': {
      input: z.object({
        name: z.string().min(1),
        serverUrl: z.string().min(1),
        authToken: z.string().min(1),
        description: z.string().nullable().optional(),
      }),
      output: z.object({ instance: argocdInstanceSchema }),
    },
    'argoInstances.update': {
      input: z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        serverUrl: z.string().min(1).optional(),
        authToken: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
      }),
      output: z.object({ instance: argocdInstanceSchema.nullable() }),
    },
    'argoInstances.delete': {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ deleted: z.boolean() }),
    },
    'sshConnections.list': {
      input: z.object({}),
      output: z.object({ connections: z.array(sshConnectionSchema) }),
    },
    'sshConnections.get': {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ connection: sshConnectionSchema.nullable() }),
    },
    'sshConnections.create': {
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
    'sshConnections.update': {
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
    'sshConnections.delete': {
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ deleted: z.boolean() }),
    },
    'stageConfigs.list': {
      input: z.object({}),
      output: z.object({ configs: z.array(stageConfigSchema) }),
    },
    'stageConfigs.get': {
      input: z.object({ stage: z.string().min(1) }),
      output: z.object({ config: stageConfigSchema.nullable() }),
    },
    'stageConfigs.upsert': {
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
    'stageConfigs.delete': {
      input: z.object({ stage: z.string().min(1) }),
      output: z.object({ deleted: z.boolean() }),
    },
  },
  events: {
    connected: {
      payload: z.object({ clientId: z.string().uuid() }),
    },
    'issue.stageChanged': {
      payload: z.object({
        issueId: z.string().uuid(),
        from: z.string(),
        to: z.string(),
      }),
    },
  },
};
export { protocol };
