import type {
  Issue as IssueRow,
  TimelineEntry as TimelineEntryRow,
  IssueResource as IssueResourceRow,
  IssueRelationRow,
  Approval as ApprovalRow,
  IssueLink as IssueLinkRow,
} from './issues/issues.js';
import type { AgentLoop as AgentLoopRow, AgentStep as AgentStepRow } from './agent-runs/agent-runs.js';
import type {
  SshIdentity as SshIdentityRow,
  GitRepo as GitRepoRow,
  KubeContext as KubeContextRow,
  ArgocdInstance as ArgocdInstanceRow,
  SshConnection as SshConnectionRow,
} from './integrations/integrations.js';
import type { ParsedStageConfig } from './stage-configs/stage-configs.js';

const toIssue = (row: IssueRow) => ({
  id: row.id,
  fingerprint: row.fingerprint,
  source: row.source,
  title: row.title,
  summary: row.summary,
  description: row.description,
  stage: row.stage as 'triage',
  needsYou: row.needs_you === 1,
  priority: row.priority as 'medium',
  sourcePayload: row.source_payload,
  monitorPlan: row.monitor_plan,
  monitorIntervalMinutes: row.monitor_interval_minutes,
  monitorNextCheckAt: row.monitor_next_check_at,
  monitorUntil: row.monitor_until,
  monitorChecksCompleted: row.monitor_checks_completed,
  resolvedAt: row.resolved_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toTimelineEntry = (row: TimelineEntryRow) => ({
  id: row.id,
  issueId: row.issue_id,
  agentLoopId: row.agent_loop_id,
  kind: row.kind as 'detected',
  status: row.status as 'info',
  title: row.title,
  body: row.body,
  commandRun: row.command_run,
  createdAt: row.created_at,
});

const toAgentLoop = (row: AgentLoopRow, issueId?: string) => ({
  id: row.id,
  issueId: issueId ?? '',
  title: row.title,
  status: row.status as 'running',
  startedAt: row.started_at,
  finishedAt: row.finished_at,
});

const toAgentStep = (row: AgentStepRow) => ({
  id: row.id,
  agentLoopId: row.agent_loop_id,
  kind: row.kind as 'thinking',
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
  kind: row.kind as 'node',
  name: row.name,
  health: row.health as 'healthy',
  detail: row.detail,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toRelation = (row: IssueRelationRow) => ({
  id: row.id,
  sourceIssueId: row.source_issue_id,
  targetIssueId: row.target_issue_id,
  relation: row.relation as 'caused-by',
  createdAt: row.created_at,
});

const toApproval = (row: ApprovalRow) => ({
  id: row.id,
  issueId: row.issue_id,
  agentLoopId: row.agent_loop_id,
  title: row.title,
  reason: row.reason,
  status: row.status as 'pending',
  decisionReason: row.decision_reason,
  decidedAt: row.decided_at,
  createdAt: row.created_at,
});

const toLink = (row: IssueLinkRow) => ({
  id: row.id,
  issueId: row.issue_id,
  url: row.url,
  linkType: row.link_type as 'commit',
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

const toStageConfig = (row: ParsedStageConfig) => ({
  id: row.id,
  stage: row.stage,
  allowedKubeContexts: row.allowed_kube_contexts,
  allowedSshConnections: row.allowed_ssh_connections,
  allowedGitRepos: row.allowed_git_repos,
  allowedArgocdInstances: row.allowed_argocd_instances,
  sshIdentityId: row.ssh_identity_id,
  additionalSystemPrompt: row.additional_system_prompt,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export {
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
};
