// Re-export from split modules — keeps all existing imports working.

export type { CallMessage, ResponseMessage, ErrorMessage, EventMessage, Message } from './protocol.schemas.wire.js';
export {
  callMessageSchema,
  responseMessageSchema,
  errorMessageSchema,
  eventMessageSchema,
  messageSchema,
} from './protocol.schemas.wire.js';

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
} from './protocol.schemas.enums.js';

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
} from './protocol.schemas.domain.js';
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
} from './protocol.schemas.domain.js';

export { protocol } from './protocol.schemas.calls.js';
