import { DatabaseService } from "../database/database.js";

import type { Selectable } from "kysely";
import type { Services } from "../services/services.js";
import type { AgentLoopsTable, AgentStepsTable } from "../database/database.js";
import type { CreateAgentLoopInput, CreateAgentStepInput } from "./agent-runs.schemas.js";

type AgentLoop = Selectable<AgentLoopsTable>;
type AgentStep = Selectable<AgentStepsTable>;

class AgentRunService {
  #services: Services;

  constructor(services: Services) {
    this.#services = services;
  }

  // ── Agent loops ───────────────────────────────────────────────────

  createAgentLoop = async (input: CreateAgentLoopInput): Promise<AgentLoop> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const loop: AgentLoop = {
      id: crypto.randomUUID(),
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

  getAgentLoopsForIssue = async (issueId: string): Promise<AgentLoop[]> => {
    const db = await this.#services.get(DatabaseService).instance;

    return db
      .selectFrom("agent_loops")
      .innerJoin("issue_agent_runs", "issue_agent_runs.agent_loop_id", "agent_loops.id")
      .selectAll("agent_loops")
      .where("issue_agent_runs.issue_id", "=", issueId)
      .orderBy("agent_loops.started_at", "desc")
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

  hasRunningAgentLoopForIssue = async (issueId: string): Promise<boolean> => {
    const db = await this.#services.get(DatabaseService).instance;

    const running = await db
      .selectFrom("agent_loops")
      .innerJoin("issue_agent_runs", "issue_agent_runs.agent_loop_id", "agent_loops.id")
      .select("agent_loops.id")
      .where("issue_agent_runs.issue_id", "=", issueId)
      .where("agent_loops.status", "=", "running")
      .executeTakeFirst();

    return running !== undefined;
  };

  // ── Issue association ─────────────────────────────────────────────

  linkToIssue = async (issueId: string, agentLoopId: string): Promise<void> => {
    const db = await this.#services.get(DatabaseService).instance;

    await db
      .insertInto("issue_agent_runs")
      .values({ issue_id: issueId, agent_loop_id: agentLoopId })
      .execute();
  };

  // ── Agent steps ───────────────────────────────────────────────────

  addAgentStep = async (input: CreateAgentStepInput): Promise<AgentStep> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

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
}

export type { AgentLoop, AgentStep };
export { AgentRunService };
