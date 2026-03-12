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

// --- Shared domain schemas ---

const issueStatuses = [
  "triage",
  "ready",
  "in_progress",
  "under_observation",
  "resolved",
  "regressed",
  "cancelled",
] as const;

const issuePriorities = ["critical", "high", "medium", "low"] as const;

const issueEventTypes = [
  "status_change",
  "comment",
  "priority_change",
  "label_added",
  "label_removed",
  "commit_linked",
  "pr_linked",
] as const;

const issueLinkTypes = ["commit", "pr"] as const;

const issueSchema = z.object({
  id: z.string().uuid(),
  fingerprint: z.string(),
  source: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(issueStatuses),
  priority: z.enum(issuePriorities),
  sourcePayload: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type Issue = z.infer<typeof issueSchema>;

const issueEventSchema = z.object({
  id: z.string().uuid(),
  issueId: z.string().uuid(),
  actor: z.string(),
  eventType: z.enum(issueEventTypes),
  data: z.string().nullable(),
  createdAt: z.string(),
});

type IssueEvent = z.infer<typeof issueEventSchema>;

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

// --- Protocol definition ---

const protocol = {
  calls: {
    ping: {
      input: z.object({}),
      output: z.object({ pong: z.literal(true) }),
    },
    "issues.list": {
      input: z.object({
        status: z.enum(issueStatuses).optional(),
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
        description: z.string().nullable().optional(),
        status: z.enum(issueStatuses).optional(),
        priority: z.enum(issuePriorities).optional(),
        sourcePayload: z.string().nullable().optional(),
      }),
      output: z.object({ issue: issueSchema }),
    },
    "issues.update": {
      input: z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        status: z.enum(issueStatuses).optional(),
        priority: z.enum(issuePriorities).optional(),
        sourcePayload: z.string().nullable().optional(),
      }),
      output: z.object({ issue: issueSchema.nullable() }),
    },
    "issues.addEvent": {
      input: z.object({
        issueId: z.string().uuid(),
        actor: z.string().min(1),
        eventType: z.enum(issueEventTypes),
        data: z.string().nullable().optional(),
      }),
      output: z.object({ event: issueEventSchema }),
    },
    "issues.getEvents": {
      input: z.object({ issueId: z.string().uuid() }),
      output: z.object({ events: z.array(issueEventSchema) }),
    },
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
  },
  events: {
    connected: {
      payload: z.object({ clientId: z.string().uuid() }),
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
  IssueEvent,
  IssueLink,
};
export {
  callMessageSchema,
  responseMessageSchema,
  errorMessageSchema,
  eventMessageSchema,
  messageSchema,
  issueSchema,
  issueEventSchema,
  issueLinkSchema,
  issueStatuses,
  issuePriorities,
  issueEventTypes,
  issueLinkTypes,
  protocol,
};
