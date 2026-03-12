import { DatabaseService } from "../database/database.js";

import type { Selectable } from "kysely";
import type { Services } from "../services/services.js";
import type { IssuesTable, IssueEventsTable, IssueLinksTable } from "../database/database.js";
import type {
  CreateIssueInput,
  UpdateIssueInput,
  CreateIssueEventInput,
  CreateIssueLinkInput,
} from "./issues.schemas.js";

type Issue = Selectable<IssuesTable>;
type IssueEvent = Selectable<IssueEventsTable>;
type IssueLink = Selectable<IssueLinksTable>;

class IssueService {
  #services: Services;

  constructor(services: Services) {
    this.#services = services;
  }

  create = async (input: CreateIssueInput): Promise<Issue> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const issue: Issue = {
      id: crypto.randomUUID(),
      fingerprint: input.fingerprint,
      source: input.source,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      source_payload: input.sourcePayload,
      created_at: now,
      updated_at: now,
    };

    await db.insertInto("issues").values(issue).execute();

    return issue;
  };

  getById = async (id: string): Promise<Issue | undefined> => {
    const db = await this.#services.get(DatabaseService).instance;

    return db
      .selectFrom("issues")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  };

  getByFingerprint = async (
    fingerprint: string,
    source: string,
  ): Promise<Issue | undefined> => {
    const db = await this.#services.get(DatabaseService).instance;

    return db
      .selectFrom("issues")
      .selectAll()
      .where("fingerprint", "=", fingerprint)
      .where("source", "=", source)
      .executeTakeFirst();
  };

  list = async (filters?: {
    status?: string;
    source?: string;
  }): Promise<Issue[]> => {
    const db = await this.#services.get(DatabaseService).instance;

    let query = db.selectFrom("issues").selectAll().orderBy("created_at", "desc");

    if (filters?.status) {
      query = query.where("status", "=", filters.status);
    }

    if (filters?.source) {
      query = query.where("source", "=", filters.source);
    }

    return query.execute();
  };

  update = async (id: string, input: UpdateIssueInput): Promise<Issue | undefined> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const values: Record<string, unknown> = { updated_at: now };

    if (input.title !== undefined) values.title = input.title;
    if (input.description !== undefined) values.description = input.description;
    if (input.status !== undefined) values.status = input.status;
    if (input.priority !== undefined) values.priority = input.priority;
    if (input.sourcePayload !== undefined) values.source_payload = input.sourcePayload;

    await db.updateTable("issues").set(values).where("id", "=", id).execute();

    return this.getById(id);
  };

  addEvent = async (input: CreateIssueEventInput): Promise<IssueEvent> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const event: IssueEvent = {
      id: crypto.randomUUID(),
      issue_id: input.issueId,
      actor: input.actor,
      event_type: input.eventType,
      data: input.data,
      created_at: now,
    };

    await db.insertInto("issue_events").values(event).execute();

    return event;
  };

  getEvents = async (issueId: string): Promise<IssueEvent[]> => {
    const db = await this.#services.get(DatabaseService).instance;

    return db
      .selectFrom("issue_events")
      .selectAll()
      .where("issue_id", "=", issueId)
      .orderBy("created_at", "asc")
      .execute();
  };

  addLink = async (input: CreateIssueLinkInput): Promise<IssueLink> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const link: IssueLink = {
      id: crypto.randomUUID(),
      issue_id: input.issueId,
      url: input.url,
      link_type: input.linkType,
      title: input.title,
      description: input.description,
      repo: input.repo,
      created_at: now,
    };

    await db.insertInto("issue_links").values(link).execute();

    return link;
  };

  addLabel = async (issueId: string, labelId: string): Promise<void> => {
    const db = await this.#services.get(DatabaseService).instance;

    await db
      .insertInto("issue_labels")
      .values({ issue_id: issueId, label_id: labelId })
      .execute();
  };

  removeLabel = async (issueId: string, labelId: string): Promise<void> => {
    const db = await this.#services.get(DatabaseService).instance;

    await db
      .deleteFrom("issue_labels")
      .where("issue_id", "=", issueId)
      .where("label_id", "=", labelId)
      .execute();
  };
}

export type { Issue, IssueEvent, IssueLink };
export { IssueService };
