import { z } from "zod";

import {
  issueStatuses,
  issuePriorities,
  issueEventTypes,
  issueLinkTypes,
} from "./issues.types.js";

const createIssueSchema = z.object({
  fingerprint: z.string().min(1),
  source: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable().default(null),
  status: z.enum(issueStatuses).default("triage"),
  priority: z.enum(issuePriorities).default("medium"),
  sourcePayload: z.string().nullable().default(null),
});

type CreateIssueInput = z.infer<typeof createIssueSchema>;

const updateIssueSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(issueStatuses).optional(),
  priority: z.enum(issuePriorities).optional(),
  sourcePayload: z.string().nullable().optional(),
});

type UpdateIssueInput = z.infer<typeof updateIssueSchema>;

const createIssueEventSchema = z.object({
  issueId: z.string().uuid(),
  actor: z.string().min(1),
  eventType: z.enum(issueEventTypes),
  data: z.string().nullable().default(null),
});

type CreateIssueEventInput = z.infer<typeof createIssueEventSchema>;

const createIssueLinkSchema = z.object({
  issueId: z.string().uuid(),
  url: z.string().url(),
  linkType: z.enum(issueLinkTypes),
  title: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  repo: z.string().min(1),
});

type CreateIssueLinkInput = z.infer<typeof createIssueLinkSchema>;

export type {
  CreateIssueInput,
  UpdateIssueInput,
  CreateIssueEventInput,
  CreateIssueLinkInput,
};
export {
  createIssueSchema,
  updateIssueSchema,
  createIssueEventSchema,
  createIssueLinkSchema,
};
