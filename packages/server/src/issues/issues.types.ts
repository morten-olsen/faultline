const issueStatuses = [
  "triage",
  "ready",
  "in_progress",
  "under_observation",
  "resolved",
  "regressed",
  "cancelled",
] as const;

type IssueStatus = (typeof issueStatuses)[number];

const issuePriorities = ["critical", "high", "medium", "low"] as const;

type IssuePriority = (typeof issuePriorities)[number];

const issueEventTypes = [
  "status_change",
  "comment",
  "priority_change",
  "label_added",
  "label_removed",
  "commit_linked",
  "pr_linked",
] as const;

type IssueEventType = (typeof issueEventTypes)[number];

const issueLinkTypes = ["commit", "pr"] as const;

type IssueLinkType = (typeof issueLinkTypes)[number];

export type { IssueStatus, IssuePriority, IssueEventType, IssueLinkType };
export {
  issueStatuses,
  issuePriorities,
  issueEventTypes,
  issueLinkTypes,
};
