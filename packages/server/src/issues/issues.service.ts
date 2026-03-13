import { DatabaseService } from "../database/database.js";

import type { Selectable } from "kysely";
import type { Services } from "../services/services.js";
import type {
  IssuesTable,
  TimelineEntriesTable,
  AgentLoopsTable,
  AgentStepsTable,
  IssueResourcesTable,
  IssueRelationsTable,
  ApprovalsTable,
  IssueLinksTable,
} from "../database/database.js";
import type {
  CreateIssueInput,
  UpdateIssueInput,
  CreateTimelineEntryInput,
  CreateAgentLoopInput,
  CreateAgentStepInput,
  CreateIssueResourceInput,
  CreateIssueRelationInput,
  CreateApprovalInput,
  CreateIssueLinkInput,
} from "./issues.schemas.js";

type Issue = Selectable<IssuesTable>;
type TimelineEntry = Selectable<TimelineEntriesTable>;
type AgentLoop = Selectable<AgentLoopsTable>;
type AgentStep = Selectable<AgentStepsTable>;
type IssueResource = Selectable<IssueResourcesTable>;
type IssueRelation = Selectable<IssueRelationsTable>;
type Approval = Selectable<ApprovalsTable>;
type IssueLink = Selectable<IssueLinksTable>;

class IssueService {
  #services: Services;

  constructor(services: Services) {
    this.#services = services;
  }

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
      resolved_at: null,
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
    if (input.stage !== undefined) {
      values.stage = input.stage;
      if (input.stage === "resolved") values.resolved_at = now;
    }
    if (input.needsYou !== undefined) values.needs_you = input.needsYou ? 1 : 0;
    if (input.priority !== undefined) values.priority = input.priority;
    if (input.sourcePayload !== undefined) values.source_payload = input.sourcePayload;

    await db.updateTable("issues").set(values).where("id", "=", id).execute();

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

  // ── Agent loops ───────────────────────────────────────────────────

  createAgentLoop = async (input: CreateAgentLoopInput): Promise<AgentLoop> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const loop: AgentLoop = {
      id: crypto.randomUUID(),
      issue_id: input.issueId,
      title: input.title,
      status: "running",
      started_at: now,
      finished_at: null,
    };

    await db.insertInto("agent_loops").values(loop).execute();

    return loop;
  };

  getAgentLoop = async (id: string): Promise<AgentLoop | undefined> => {
    const db = await this.#services.get(DatabaseService).instance;

    return db
      .selectFrom("agent_loops")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  };

  getAgentLoops = async (issueId: string): Promise<AgentLoop[]> => {
    const db = await this.#services.get(DatabaseService).instance;

    return db
      .selectFrom("agent_loops")
      .selectAll()
      .where("issue_id", "=", issueId)
      .orderBy("started_at", "desc")
      .execute();
  };

  updateAgentLoopStatus = async (
    id: string,
    status: string,
  ): Promise<AgentLoop | undefined> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();
    const finished = status === "complete" || status === "stopped" ? now : null;

    await db
      .updateTable("agent_loops")
      .set({ status, finished_at: finished })
      .where("id", "=", id)
      .execute();

    return this.getAgentLoop(id);
  };

  // ── Agent steps ───────────────────────────────────────────────────

  addAgentStep = async (input: CreateAgentStepInput): Promise<AgentStep> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    // Auto-assign sequence based on existing steps
    const lastStep = await db
      .selectFrom("agent_steps")
      .select("sequence")
      .where("agent_loop_id", "=", input.agentLoopId)
      .orderBy("sequence", "desc")
      .executeTakeFirst();

    const sequence = (lastStep?.sequence ?? -1) + 1;

    const step: AgentStep = {
      id: crypto.randomUUID(),
      agent_loop_id: input.agentLoopId,
      kind: input.kind,
      title: input.title,
      status: input.status,
      detail: input.detail,
      output: input.output,
      duration_ms: input.durationMs,
      sequence,
      created_at: now,
    };

    await db.insertInto("agent_steps").values(step).execute();

    return step;
  };

  getAgentSteps = async (agentLoopId: string): Promise<AgentStep[]> => {
    const db = await this.#services.get(DatabaseService).instance;

    return db
      .selectFrom("agent_steps")
      .selectAll()
      .where("agent_loop_id", "=", agentLoopId)
      .orderBy("sequence", "asc")
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
  ): Promise<Approval | undefined> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    await db
      .updateTable("approvals")
      .set({ status: decision, decided_at: now })
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
}

export type {
  Issue,
  TimelineEntry,
  AgentLoop,
  AgentStep,
  IssueResource,
  IssueRelation,
  Approval,
  IssueLink,
};
export { IssueService };
