import { Kysely, Migrator, SqliteDialect } from "kysely";
import BetterSqlite3 from "better-sqlite3";

import { destroy } from "../services/services.js";
import * as m001 from "./migrations/001-create-issues.js";
import * as m002 from "./migrations/002-create-integrations.js";

import type { Generated } from "kysely";
import type { MigrationProvider } from "kysely";
import type { Services } from "../services/services.js";

type IssuesTable = {
  id: string;
  fingerprint: string;
  source: string;
  title: string;
  summary: string | null;
  description: string | null;
  stage: Generated<string>;
  needs_you: Generated<number>;
  priority: Generated<string>;
  source_payload: string | null;
  resolved_at: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
};

type LabelsTable = {
  id: string;
  name: string;
};

type IssueLabelsTable = {
  issue_id: string;
  label_id: string;
};

type TimelineEntriesTable = {
  id: string;
  issue_id: string;
  agent_loop_id: string | null;
  kind: string;
  status: Generated<string>;
  title: string;
  body: string | null;
  command_run: string | null;
  created_at: Generated<string>;
};

type AgentLoopsTable = {
  id: string;
  issue_id: string;
  title: string;
  status: Generated<string>;
  started_at: Generated<string>;
  finished_at: string | null;
};

type AgentStepsTable = {
  id: string;
  agent_loop_id: string;
  kind: string;
  title: string;
  status: string | null;
  detail: string | null;
  output: string | null;
  duration_ms: number | null;
  sequence: number;
  created_at: Generated<string>;
};

type IssueResourcesTable = {
  id: string;
  issue_id: string;
  kind: string;
  name: string;
  health: Generated<string>;
  detail: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
};

type IssueRelationsTable = {
  id: string;
  source_issue_id: string;
  target_issue_id: string;
  relation: string;
  created_at: Generated<string>;
};

type ApprovalsTable = {
  id: string;
  issue_id: string;
  agent_loop_id: string | null;
  title: string;
  reason: string;
  status: Generated<string>;
  decided_at: string | null;
  created_at: Generated<string>;
};

type IssueLinksTable = {
  id: string;
  issue_id: string;
  url: string;
  link_type: string;
  title: string | null;
  description: string | null;
  repo: string;
  created_at: Generated<string>;
};

type SshIdentitiesTable = {
  id: string;
  name: string;
  key_type: Generated<string>;
  public_key: string;
  private_key: string;
  created_at: Generated<string>;
  updated_at: Generated<string>;
};

type GitReposTable = {
  id: string;
  name: string;
  clone_url: string;
  description: string | null;
  ssh_identity_id: string | null;
  default_branch: Generated<string>;
  created_at: Generated<string>;
  updated_at: Generated<string>;
};

type KubeContextsTable = {
  id: string;
  name: string;
  context: string;
  description: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
};

type ArgocdInstancesTable = {
  id: string;
  name: string;
  server_url: string;
  auth_token: string;
  description: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
};

type SshConnectionsTable = {
  id: string;
  name: string;
  host: string;
  port: Generated<number>;
  username: string;
  ssh_identity_id: string | null;
  description: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
};

type DatabaseSchema = {
  issues: IssuesTable;
  labels: LabelsTable;
  issue_labels: IssueLabelsTable;
  timeline_entries: TimelineEntriesTable;
  agent_loops: AgentLoopsTable;
  agent_steps: AgentStepsTable;
  issue_resources: IssueResourcesTable;
  issue_relations: IssueRelationsTable;
  approvals: ApprovalsTable;
  issue_links: IssueLinksTable;
  ssh_identities: SshIdentitiesTable;
  git_repos: GitReposTable;
  kube_contexts: KubeContextsTable;
  argocd_instances: ArgocdInstancesTable;
  ssh_connections: SshConnectionsTable;
};

const migrationProvider: MigrationProvider = {
  getMigrations: async () => ({
    "001-create-issues": m001,
    "002-create-integrations": m002,
  }),
};

class DatabaseService {
  #instance: Promise<Kysely<DatabaseSchema>> | undefined;

  constructor(_services: Services) {}

  #setup = async (): Promise<Kysely<DatabaseSchema>> => {
    const dialect = new SqliteDialect({
      database: new BetterSqlite3("faultline.db"),
    });

    const db = new Kysely<DatabaseSchema>({ dialect });

    const migrator = new Migrator({ db, provider: migrationProvider });
    const { error } = await migrator.migrateToLatest();

    if (error) {
      throw error;
    }

    return db;
  };

  get instance(): Promise<Kysely<DatabaseSchema>> {
    if (!this.#instance) {
      this.#instance = this.#setup();
    }
    return this.#instance;
  }

  [destroy] = async (): Promise<void> => {
    if (this.#instance) {
      const db = await this.#instance;
      await db.destroy();
    }
  };
}

export type {
  DatabaseSchema,
  IssuesTable,
  LabelsTable,
  IssueLabelsTable,
  TimelineEntriesTable,
  AgentLoopsTable,
  AgentStepsTable,
  IssueResourcesTable,
  IssueRelationsTable,
  ApprovalsTable,
  IssueLinksTable,
  SshIdentitiesTable,
  GitReposTable,
  KubeContextsTable,
  ArgocdInstancesTable,
  SshConnectionsTable,
};
export { DatabaseService };
