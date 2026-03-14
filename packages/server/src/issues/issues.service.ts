import { DatabaseService } from "../database/database.js";

import type { Selectable } from "kysely";
import type { Services } from "../services/services.js";
import type {
  IssuesTable,
  TimelineEntriesTable,
  IssueResourcesTable,
  IssueRelationsTable,
  ApprovalsTable,
  IssueLinksTable,
} from "../database/database.js";
import { transition, InvalidTransitionError } from "./issues.machine.js";

import type { IssueStage } from "./issues.types.js";
import type {
  CreateIssueInput,
  UpdateIssueInput,
  CreateTimelineEntryInput,
  CreateIssueResourceInput,
  CreateIssueRelationInput,
  CreateApprovalInput,
  CreateIssueLinkInput,
} from "./issues.schemas.js";
import type { IssueEvent } from "./issues.machine.js";

type Issue = Selectable<IssuesTable>;
type TimelineEntry = Selectable<TimelineEntriesTable>;
type IssueResource = Selectable<IssueResourcesTable>;
type IssueRelation = Selectable<IssueRelationsTable>;
type Approval = Selectable<ApprovalsTable>;
type IssueLink = Selectable<IssueLinksTable>;

type IssueEventKind = "created" | "updated" | "stage-changed";
type IssueEventListener = (kind: IssueEventKind, issueId: string, meta?: Record<string, string>) => void;

type SetMonitoringPlanInput = {
  plan: string;
  intervalMinutes: number;
  durationMinutes: number;
};

class IssueService {
  #services: Services;
  #listeners: IssueEventListener[] = [];

  constructor(services: Services) {
    this.#services = services;
  }

  onEvent = (fn: IssueEventListener): (() => void) => {
    this.#listeners.push(fn);
    return () => {
      const idx = this.#listeners.indexOf(fn);
      if (idx >= 0) this.#listeners.splice(idx, 1);
    };
  };

  #emit = (kind: IssueEventKind, issueId: string, meta?: Record<string, string>): void => {
    for (const fn of this.#listeners) {
      try {
        fn(kind, issueId, meta);
      } catch {
        // listener errors don't propagate
      }
    }
  };

  // ── Issues ────────────────────────────────────────────────────────

  create = async (input: CreateIssueInput): Promise<Issue> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const issue: Issue = {
      id: crypto.randomUUID(),
      fingerprint: input.fingerprint,
      source: input.source,
      title: input.title,
      summary: input.summary,
      description: input.description,
      stage: input.stage,
      needs_you: input.needsYou ? 1 : 0,
      priority: input.priority,
      source_payload: input.sourcePayload,
      monitor_plan: null,
      monitor_interval_minutes: null,
      monitor_next_check_at: null,
      monitor_until: null,
      monitor_checks_completed: 0,
      resolved_at: null,
      created_at: now,
      updated_at: now,
    };

    await db.insertInto("issues").values(issue).execute();

    this.#emit("created", issue.id);

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
    stage?: string;
    source?: string;
  }): Promise<Issue[]> => {
    const db = await this.#services.get(DatabaseService).instance;

    let query = db.selectFrom("issues").selectAll().orderBy("created_at", "desc");

    if (filters?.stage) {
      query = query.where("stage", "=", filters.stage);
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
    if (input.summary !== undefined) values.summary = input.summary;
    if (input.description !== undefined) values.description = input.description;
    if (input.needsYou !== undefined) values.needs_you = input.needsYou ? 1 : 0;
    if (input.priority !== undefined) values.priority = input.priority;
    if (input.sourcePayload !== undefined) values.source_payload = input.sourcePayload;

    await db.updateTable("issues").set(values).where("id", "=", id).execute();

    this.#emit("updated", id);

    return this.getById(id);
  };

  // ── State machine transition ─────────────────────────────────────

  transition = async (id: string, event: IssueEvent): Promise<Issue | undefined> => {
    const issue = await this.getById(id);
    if (!issue) return undefined;

    const stage = issue.stage as IssueStage;
    const result = transition(stage, event);
    if (!result.ok) {
      throw new InvalidTransitionError(stage, event.type, result.reason);
    }

    const { effect } = result;
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const values: Record<string, unknown> = {
      stage: effect.stage,
      updated_at: now,
    };
    if (effect.needsYou !== undefined) values.needs_you = effect.needsYou ? 1 : 0;
    if (effect.resolvedAt) values.resolved_at = effect.resolvedAt;
    if (effect.issueUpdates) Object.assign(values, effect.issueUpdates);

    await db.updateTable("issues").set(values).where("id", "=", id).execute();

    if (effect.timeline) {
      await this.addTimelineEntry({
        issueId: id,
        agentLoopId: null,
        kind: effect.timeline.kind,
        status: effect.timeline.status,
        title: effect.timeline.title,
        body: effect.timeline.body ?? null,
        commandRun: null,
      });
    }

    this.#emit("updated", id);
    this.#emit("stage-changed", id, { from: issue.stage, to: effect.stage });

    return this.getById(id);
  };

  // ── Timeline entries ──────────────────────────────────────────────

  addTimelineEntry = async (input: CreateTimelineEntryInput): Promise<TimelineEntry> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const entry: TimelineEntry = {
      id: crypto.randomUUID(),
      issue_id: input.issueId,
      agent_loop_id: input.agentLoopId,
      kind: input.kind,
      status: input.status,
      title: input.title,
      body: input.body,
      command_run: input.commandRun,
      created_at: now,
    };

    await db.insertInto("timeline_entries").values(entry).execute();

    return entry;
  };

  getTimelineEntries = async (issueId: string): Promise<TimelineEntry[]> => {
    const db = await this.#services.get(DatabaseService).instance;

    return db
      .selectFrom("timeline_entries")
      .selectAll()
      .where("issue_id", "=", issueId)
      .orderBy("created_at", "desc")
      .execute();
  };

  // ── Issue resources ───────────────────────────────────────────────

  addResource = async (input: CreateIssueResourceInput): Promise<IssueResource> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const resource: IssueResource = {
      id: crypto.randomUUID(),
      issue_id: input.issueId,
      kind: input.kind,
      name: input.name,
      health: input.health,
      detail: input.detail,
      created_at: now,
      updated_at: now,
    };

    await db.insertInto("issue_resources").values(resource).execute();

    return resource;
  };

  getResources = async (issueId: string): Promise<IssueResource[]> => {
    const db = await this.#services.get(DatabaseService).instance;

    return db
      .selectFrom("issue_resources")
      .selectAll()
      .where("issue_id", "=", issueId)
      .execute();
  };

  // ── Issue relations ───────────────────────────────────────────────

  addRelation = async (input: CreateIssueRelationInput): Promise<IssueRelation> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const relation: IssueRelation = {
      id: crypto.randomUUID(),
      source_issue_id: input.sourceIssueId,
      target_issue_id: input.targetIssueId,
      relation: input.relation,
      created_at: now,
    };

    await db.insertInto("issue_relations").values(relation).execute();

    return relation;
  };

  getRelations = async (issueId: string): Promise<IssueRelation[]> => {
    const db = await this.#services.get(DatabaseService).instance;

    return db
      .selectFrom("issue_relations")
      .selectAll()
      .where((eb) =>
        eb.or([
          eb("source_issue_id", "=", issueId),
          eb("target_issue_id", "=", issueId),
        ]),
      )
      .execute();
  };

  // ── Approvals ─────────────────────────────────────────────────────

  createApproval = async (input: CreateApprovalInput): Promise<Approval> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const approval: Approval = {
      id: crypto.randomUUID(),
      issue_id: input.issueId,
      agent_loop_id: input.agentLoopId,
      title: input.title,
      reason: input.reason,
      status: "pending",
      decision_reason: null,
      decided_at: null,
      created_at: now,
    };

    await db.insertInto("approvals").values(approval).execute();

    return approval;
  };

  getApprovals = async (issueId: string): Promise<Approval[]> => {
    const db = await this.#services.get(DatabaseService).instance;

    return db
      .selectFrom("approvals")
      .selectAll()
      .where("issue_id", "=", issueId)
      .orderBy("created_at", "desc")
      .execute();
  };

  resolveApproval = async (
    id: string,
    decision: "approved" | "denied",
    reason?: string,
  ): Promise<Approval | undefined> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const values: Record<string, unknown> = { status: decision, decided_at: now };
    if (reason !== undefined) values.decision_reason = reason;

    await db
      .updateTable("approvals")
      .set(values)
      .where("id", "=", id)
      .execute();

    return db
      .selectFrom("approvals")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  };

  // ── Issue links ───────────────────────────────────────────────────

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

  // ── Labels ────────────────────────────────────────────────────────

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

  // ── Monitoring ──────────────────────────────────────────────────────

  setMonitoringPlan = async (
    issueId: string,
    input: SetMonitoringPlanInput,
  ): Promise<Issue | undefined> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date();
    const until = new Date(now.getTime() + input.durationMinutes * 60_000);
    const nextCheck = new Date(now.getTime() + input.intervalMinutes * 60_000);

    await db
      .updateTable("issues")
      .set({
        monitor_plan: input.plan,
        monitor_interval_minutes: input.intervalMinutes,
        monitor_next_check_at: nextCheck.toISOString(),
        monitor_until: until.toISOString(),
        monitor_checks_completed: 0,
        updated_at: now.toISOString(),
      })
      .where("id", "=", issueId)
      .execute();

    return this.getById(issueId);
  };

  getIssuesDueForMonitoring = async (): Promise<Issue[]> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    return db
      .selectFrom("issues")
      .selectAll()
      .where("stage", "=", "monitoring")
      .where("monitor_next_check_at", "<=", now)
      .where("monitor_next_check_at", "is not", null)
      .execute();
  };

  advanceMonitorCheck = async (issueId: string): Promise<Issue | undefined> => {
    const db = await this.#services.get(DatabaseService).instance;
    const issue = await this.getById(issueId);
    if (!issue || !issue.monitor_interval_minutes) return issue;

    const now = new Date();
    const nextCheck = new Date(now.getTime() + issue.monitor_interval_minutes * 60_000);
    const completed = (issue.monitor_checks_completed ?? 0) + 1;

    await db
      .updateTable("issues")
      .set({
        monitor_checks_completed: completed,
        monitor_next_check_at: nextCheck.toISOString(),
        updated_at: now.toISOString(),
      })
      .where("id", "=", issueId)
      .execute();

    return this.getById(issueId);
  };

}

export type {
  Issue,
  TimelineEntry,
  IssueResource,
  IssueRelation,
  Approval,
  IssueLink,
  IssueEventKind,
  IssueEventListener,
  SetMonitoringPlanInput,
};
export { IssueService };
