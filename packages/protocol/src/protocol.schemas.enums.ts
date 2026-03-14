// --- Shared domain enums ---

const issueStages = [
  'triage',
  'investigation',
  'proposed-plan',
  'implementation',
  'monitoring',
  'resolved',
  'ignored',
] as const;

const issuePriorities = ['critical', 'high', 'medium', 'low'] as const;

const timelineEntryKinds = [
  'detected',
  'analysis',
  'action',
  'outcome',
  'regression',
  'needs-you',
  'user-action',
  'resolved',
] as const;

const timelineEntryStatuses = ['pending', 'info', 'success', 'failed'] as const;

const agentLoopStatuses = ['running', 'complete', 'waiting', 'stopped'] as const;

const agentStepKinds = ['thinking', 'tool-call', 'message', 'error'] as const;

const resourceKinds = [
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
] as const;

const healthStatuses = ['healthy', 'degraded', 'critical'] as const;

const issueRelationTypes = ['caused-by', 'related-to', 'duplicate-of'] as const;

const approvalStatuses = ['pending', 'approved', 'denied'] as const;

const issueLinkTypes = ['commit', 'pr'] as const;

const sshIdentitySources = ['generate', 'import'] as const;

export {
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
};
