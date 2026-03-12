import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import { protocol } from "@faultline/protocol";

import type { EventMessage } from "@faultline/protocol";

import { Services } from "./services/services.js";
import { DatabaseService } from "./database/database.js";
import { IssueService } from "./issues/issues.js";
import { createRouter } from "./router/router.js";
import { registerAlertmanagerWebhook } from "./webhooks/webhooks.js";

import type { Issue as IssueRow, IssueEvent as IssueEventRow, IssueLink as IssueLinkRow } from "./issues/issues.js";
import type { CallContext } from "./router/router.js";

const toIssue = (row: IssueRow) => ({
  id: row.id,
  fingerprint: row.fingerprint,
  source: row.source,
  title: row.title,
  description: row.description,
  status: row.status as "triage",
  priority: row.priority as "medium",
  sourcePayload: row.source_payload,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toEvent = (row: IssueEventRow) => ({
  id: row.id,
  issueId: row.issue_id,
  actor: row.actor,
  eventType: row.event_type as "comment",
  data: row.data,
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

const services = new Services();

const router = createRouter(protocol, {
  ping: async () => ({ pong: true as const }),

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
      description: input.description ?? null,
      status: input.status ?? "triage",
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

  "issues.addEvent": async (input, { services }) => {
    const event = await services.get(IssueService).addEvent({
      issueId: input.issueId,
      actor: input.actor,
      eventType: input.eventType,
      data: input.data ?? null,
    });
    return { event: toEvent(event) };
  },

  "issues.getEvents": async (input, { services }) => {
    const events = await services.get(IssueService).getEvents(input.issueId);
    return { events: events.map(toEvent) };
  },

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
});

const start = async (): Promise<void> => {
  const app = Fastify();
  await app.register(fastifyWebsocket);

  app.get("/ws", { websocket: true }, (socket) => {
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
