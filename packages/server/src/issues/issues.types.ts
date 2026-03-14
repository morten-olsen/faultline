const issueStages = [
  'triage',
  'investigation',
  'proposed-plan',
  'implementation',
  'monitoring',
  'resolved',
  'ignored',
] as const;

type IssueStage = (typeof issueStages)[number];

const issuePriorities = ['critical', 'high', 'medium', 'low'] as const;

type IssuePriority = (typeof issuePriorities)[number];

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

type TimelineEntryKind = (typeof timelineEntryKinds)[number];

const timelineEntryStatuses = ['pending', 'info', 'success', 'failed'] as const;

type TimelineEntryStatus = (typeof timelineEntryStatuses)[number];

const agentLoopStatuses = ['running', 'complete', 'waiting', 'stopped'] as const;

type AgentLoopStatus = (typeof agentLoopStatuses)[number];

const agentStepKinds = ['thinking', 'tool-call', 'message', 'error'] as const;

type AgentStepKind = (typeof agentStepKinds)[number];

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

type ResourceKind = (typeof resourceKinds)[number];

const healthStatuses = ['healthy', 'degraded', 'critical'] as const;

type HealthStatus = (typeof healthStatuses)[number];

const issueRelations = ['caused-by', 'related-to', 'duplicate-of'] as const;

type IssueRelation = (typeof issueRelations)[number];

const approvalStatuses = ['pending', 'approved', 'denied'] as const;

type ApprovalStatus = (typeof approvalStatuses)[number];

const issueLinkTypes = ['commit', 'pr'] as const;

type IssueLinkType = (typeof issueLinkTypes)[number];

export type {
  IssueStage,
  IssuePriority,
  TimelineEntryKind,
  TimelineEntryStatus,
  AgentLoopStatus,
  AgentStepKind,
  ResourceKind,
  HealthStatus,
  IssueRelation,
  ApprovalStatus,
  IssueLinkType,
};
export {
  issueStages,
  issuePriorities,
  timelineEntryKinds,
  timelineEntryStatuses,
  agentLoopStatuses,
  agentStepKinds,
  resourceKinds,
  healthStatuses,
  issueRelations,
  approvalStatuses,
  issueLinkTypes,
};
